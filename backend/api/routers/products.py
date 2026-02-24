from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from api.db.mongodb import get_db
from api.db.repositories import product_repo
from api.core.exceptions import ProductNotFoundError

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
async def list_products(
    category: str | None = Query(None),
    site: str | None = Query(None),
    brand: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    in_stock: bool = Query(False),
    sort: str = Query("updated"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await product_repo.get_products(
        db, category=category, site=site, brand=brand,
        min_price=min_price, max_price=max_price,
        in_stock=in_stock, sort=sort, page=page, per_page=per_page,
    )


@router.get("/search")
async def search_products(
    q: str = Query(..., min_length=1),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    items = await product_repo.search_products(db, q)
    return {"items": items, "total": len(items)}


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    product = await product_repo.get_product_by_id(db, product_id)
    if not product:
        raise ProductNotFoundError(product_id)
    return product
