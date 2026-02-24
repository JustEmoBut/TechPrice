from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from api.db.mongodb import get_db
from api.db.repositories import price_repo
from api.core.exceptions import ProductNotFoundError

router = APIRouter(prefix="/api/prices", tags=["prices"])


@router.get("/{product_id}/history")
async def get_price_history(
    product_id: str,
    site: str | None = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    history = await price_repo.get_price_history(db, product_id, site=site, days=days)
    return {"product_id": product_id, "history": history}


@router.get("/{product_id}/lowest")
async def get_lowest_price(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    lowest = await price_repo.get_lowest_price(db, product_id)
    if not lowest:
        raise ProductNotFoundError(product_id)
    return lowest
