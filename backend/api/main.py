from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.core.config import settings
from api.db.mongodb import connect_db, disconnect_db, get_db
from api.routers import products, categories, prices, scrape
import logging

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    from scraper.scheduler import start_scheduler, stop_scheduler
    await start_scheduler()
    yield
    await stop_scheduler()
    await disconnect_db()


app = FastAPI(
    title="TechPrice API",
    description="Türk teknoloji sitelerinden bilgisayar parçası fiyatlarını karşılaştırma API'si",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları kaydet
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(prices.router)
app.include_router(scrape.router)


@app.get("/api/health")
async def health_check():
    from api.db.mongodb import get_db
    try:
        db = get_db()
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    return {"status": "ok", "db": db_status, "version": "1.0.0"}
