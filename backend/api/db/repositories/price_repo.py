from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, UTC, timedelta
import logging

logger = logging.getLogger(__name__)


async def add_price_history(
    db: AsyncIOMotorDatabase,
    product_id: str,
    product_normalized_name: str,
    category: str,
    site: str,
    site_display_name: str,
    url: str,
    price: float,
    in_stock: bool,
) -> None:
    now = datetime.now(UTC)

    # Önceki fiyatı bul (bu product + site için en son kayıt)
    prev = await db.price_history.find_one(
        {"product_id": ObjectId(product_id), "site": site},
        sort=[("scraped_at", -1)],
    )

    price_change = None
    price_change_pct = None
    if prev and prev.get("price") is not None:
        price_change = round(price - prev["price"], 2)
        if prev["price"] > 0:
            price_change_pct = round((price_change / prev["price"]) * 100, 2)

    doc = {
        "product_id": ObjectId(product_id),
        "product_normalized_name": product_normalized_name,
        "category": category,
        "site": site,
        "site_display_name": site_display_name,
        "url": url,
        "price": price,
        "currency": "TRY",
        "in_stock": in_stock,
        "scraped_at": now,
        "price_change": price_change,
        "price_change_pct": price_change_pct,
    }
    await db.price_history.insert_one(doc)


async def get_price_history(
    db: AsyncIOMotorDatabase,
    product_id: str,
    site: str | None = None,
    days: int = 30,
) -> list[dict]:
    since = datetime.now(UTC) - timedelta(days=days)
    query: dict = {
        "product_id": ObjectId(product_id),
        "scraped_at": {"$gte": since},
    }
    if site:
        query["site"] = site

    cursor = db.price_history.find(query).sort("scraped_at", 1)
    results = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["product_id"] = str(doc["product_id"])
        results.append(doc)
    return results


async def get_lowest_price(db: AsyncIOMotorDatabase, product_id: str) -> dict | None:
    """Ürün için stokta olan en düşük güncel fiyatı döndür."""
    # Son 24 saatteki kayıtlardan en düşüğünü bul
    since = datetime.now(UTC) - timedelta(hours=24)
    pipeline = [
        {"$match": {
            "product_id": ObjectId(product_id),
            "in_stock": True,
            "scraped_at": {"$gte": since},
        }},
        {"$sort": {"price": 1}},
        {"$limit": 1},
    ]
    cursor = db.price_history.aggregate(pipeline)
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["product_id"] = str(doc["product_id"])
        return doc
    return None
