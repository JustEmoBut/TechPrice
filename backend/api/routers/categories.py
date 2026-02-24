from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from api.db.mongodb import get_db
from api.db.repositories import product_repo

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
async def list_categories(db: AsyncIOMotorDatabase = Depends(get_db)):
    categories = await product_repo.get_categories(db)
    return {"categories": categories}
