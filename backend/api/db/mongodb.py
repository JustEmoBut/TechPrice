from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from api.core.config import settings
import logging

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global _client, _db
    logger.info("MongoDB'ye bağlanılıyor...")
    _client = AsyncIOMotorClient(settings.mongodb_url)
    _db = _client[settings.mongodb_db_name]
    # Bağlantıyı doğrula
    await _client.admin.command("ping")
    logger.info(f"MongoDB bağlantısı başarılı: {settings.mongodb_db_name}")
    # İndeksleri oluştur
    await _create_indexes()


async def disconnect_db() -> None:
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB bağlantısı kapatıldı.")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Veritabanı bağlantısı henüz kurulmadı.")
    return _db


async def _create_indexes() -> None:
    db = get_db()
    # products collection indeksleri
    await db.products.create_index("normalized_name", unique=True)
    await db.products.create_index("category")
    await db.products.create_index("min_price")
    await db.products.create_index("brand")
    await db.products.create_index([("brand", 1), ("category", 1)])
    await db.products.create_index("site_prices.site")

    # price_history collection indeksleri
    await db.price_history.create_index(
        [("product_id", 1), ("site", 1), ("scraped_at", -1)]
    )
    await db.price_history.create_index([("scraped_at", -1)])
    await db.price_history.create_index([("site", 1), ("scraped_at", -1)])

    logger.info("MongoDB indeksleri oluşturuldu/kontrol edildi.")
