from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from bson import ObjectId
from datetime import datetime, UTC
from typing import Any
import logging

logger = logging.getLogger(__name__)


def _serialize(doc: dict) -> dict:
    """ObjectId ve datetime'ı JSON uyumlu formata çevir."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


async def get_products(
    db: AsyncIOMotorDatabase,
    category: str | None = None,
    site: str | None = None,
    brand: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock: bool = False,
    sort: str = "updated",
    page: int = 1,
    per_page: int = 20,
) -> dict[str, Any]:
    query: dict = {}
    if category:
        query["category"] = category.upper()
    if brand:
        query["brand"] = {"$regex": brand, "$options": "i"}
    if site:
        query["site_prices.site"] = site
    if min_price is not None:
        query.setdefault("min_price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("min_price", {})["$lte"] = max_price
    if in_stock:
        query["site_prices"] = {"$elemMatch": {"in_stock": True}}

    sort_map = {
        "price_asc": [("min_price", 1)],
        "price_desc": [("min_price", -1)],
        "name": [("name", 1)],
        "updated": [("updated_at", -1)],
    }
    sort_order = sort_map.get(sort, [("updated_at", -1)])

    total = await db.products.count_documents(query)
    skip = (page - 1) * per_page
    cursor = db.products.find(query).sort(sort_order).skip(skip).limit(per_page)
    items = [_serialize(doc) async for doc in cursor]

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + per_page - 1) // per_page),
    }


async def get_product_by_id(db: AsyncIOMotorDatabase, product_id: str) -> dict | None:
    try:
        doc = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        doc = await db.products.find_one({"normalized_name": product_id})
    return _serialize(doc) if doc else None


async def search_products(db: AsyncIOMotorDatabase, q: str, limit: int = 20) -> list[dict]:
    query = {"$or": [
        {"name": {"$regex": q, "$options": "i"}},
        {"brand": {"$regex": q, "$options": "i"}},
        {"normalized_name": {"$regex": q, "$options": "i"}},
    ]}
    cursor = db.products.find(query).limit(limit)
    return [_serialize(doc) async for doc in cursor]


async def upsert_product(db: AsyncIOMotorDatabase, product_data: dict) -> tuple[str, bool]:
    """
    Ürünü normalized_name ile upsert et.
    site_prices array'indeki ilgili siteyi güncelle veya ekle.

    Döndürür: (product_id, is_new)

    Optimizasyon (eski: 4 çağrı, yeni: 2-3 çağrı):
    - Durum 1 (tekrar scraping, en yaygın): find_one_and_update + update_one = 2 çağrı
    - Durum 2a (mevcut ürüne yeni site):    update_one(upsert) + find_one + update_one = 3 çağrı
    - Durum 2b (yeni ürün):                 update_one(upsert) = 1 çağrı
    """
    normalized_name = product_data["normalized_name"]
    site = product_data["site"]
    now = datetime.now(UTC)

    site_price_entry = {
        "site": site,
        "site_display_name": product_data.get("site_display_name", site),
        "url": product_data["url"],
        "price": product_data["price"],
        "currency": "TRY",
        "in_stock": product_data.get("in_stock", True),
        "last_updated": now,
    }

    extra_set: dict = {"updated_at": now, "last_scraped": now}
    new_image = product_data.get("image_url")
    if new_image:
        extra_set["image_url"] = new_image

    # --- Durum 1: Ürün ve site zaten var → tek find_one_and_update ile güncelle ---
    # return_document=AFTER sayesinde güncel dökümanı alıyoruz,
    # ekstra find_one'a gerek kalmadan min_price hesaplanıyor.
    updated = await db.products.find_one_and_update(
        {"normalized_name": normalized_name, "site_prices.site": site},
        {"$set": {"site_prices.$": site_price_entry, **extra_set}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is not None:
        site_prices = updated.get("site_prices", [])
        stocked = [sp for sp in site_prices if sp.get("in_stock", True)]
        if stocked:
            min_entry = min(stocked, key=lambda x: x["price"])
            await db.products.update_one(
                {"_id": updated["_id"]},
                {"$set": {"min_price": min_entry["price"], "min_price_site": min_entry["site"]}},
            )
        return str(updated["_id"]), False

    # --- Durum 2: Yeni ürün veya mevcut ürüne yeni site ekleniyor ---
    # upsert=True: eşleşme yoksa insert, varsa sadece push+set çalışır.
    # $setOnInsert yalnızca insert sırasında çalışır; güncellemeyi bozmaz.
    result = await db.products.update_one(
        {"normalized_name": normalized_name},
        {
            "$setOnInsert": {
                "name": product_data["name"],
                "normalized_name": normalized_name,
                "brand": product_data.get("brand", ""),
                "category": product_data.get("category", "OTHER"),
                "specs": product_data.get("specs", {}),
                "min_price": product_data["price"],
                "min_price_site": site,
                "first_seen": now,
                "created_at": now,
                # image_url burada YOK — extra_set üzerinden $set'e giriyor,
                # yoksa aynı path'i hem $setOnInsert hem $set güncellemeye çalışır → conflict.
            },
            "$push": {"site_prices": site_price_entry},
            "$set": extra_set,
        },
        upsert=True,
    )

    if result.upserted_id is not None:
        # Yeni ürün oluşturuldu; min_price $setOnInsert'te zaten doğru ayarlandı.
        return str(result.upserted_id), True

    # Mevcut ürüne yeni site eklendi → min_price'ı güncel veriden yeniden hesapla.
    updated = await db.products.find_one({"normalized_name": normalized_name})
    site_prices = updated.get("site_prices", [])

    # Aynı siteden birden fazla entry olabilir (concurrent push race condition).
    # Son gelen kazanır → dedup.
    seen: dict = {}
    for sp in site_prices:
        seen[sp["site"]] = sp
    deduped = list(seen.values())

    stocked = [sp for sp in deduped if sp.get("in_stock", True)]
    update_fields: dict = {}
    if len(deduped) < len(site_prices):
        update_fields["site_prices"] = deduped
    if stocked:
        min_entry = min(stocked, key=lambda x: x["price"])
        update_fields["min_price"] = min_entry["price"]
        update_fields["min_price_site"] = min_entry["site"]
    if update_fields:
        await db.products.update_one(
            {"_id": updated["_id"]},
            {"$set": update_fields},
        )
    return str(updated["_id"]), False


async def get_categories(db: AsyncIOMotorDatabase) -> list[dict]:
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    cursor = db.products.aggregate(pipeline)
    results = []
    async for doc in cursor:
        slug = doc["_id"].lower() if doc["_id"] else "other"
        results.append({
            "slug": slug,
            "name": doc["_id"] or "Diğer",
            "product_count": doc["count"],
        })
    return results
