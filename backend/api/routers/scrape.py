from fastapi import APIRouter, BackgroundTasks, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from api.db.mongodb import get_db
from api.models.scrape import ScrapeRequest, ScrapeResponse, ScrapeStatusResponse
from datetime import datetime, UTC
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scrape", tags=["scrape"])

# In-memory job store (üretimde Redis kullanılabilir)
_jobs: dict[str, dict] = {}


async def _run_scraping(job_id: str, request: ScrapeRequest, db: AsyncIOMotorDatabase):
    """Arka planda çalışan scraping görevi."""
    from scraper.scraper_manager import ScraperManager

    _jobs[job_id]["status"] = "running"
    manager = ScraperManager(db)
    try:
        results = await manager.run(
            sites=request.sites,
            categories=request.categories,
        )
        _jobs[job_id].update({
            "status": "completed",
            "completed_at": datetime.now(UTC),
            "results": results,
            "total_products_scraped": sum(
                r.get("products_scraped", 0) for r in results.values()
            ),
            "error_count": sum(
                len(r.get("errors", [])) for r in results.values()
            ),
        })
    except Exception as e:
        logger.exception(f"Scraping hatası (job_id={job_id}): {e}")
        _jobs[job_id].update({
            "status": "failed",
            "completed_at": datetime.now(UTC),
            "error": str(e),
        })


@router.post("", response_model=ScrapeResponse)
async def trigger_scrape(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # 1 saatten eski tamamlanmış/başarısız job'ları temizle
    cutoff = datetime.now(UTC).timestamp() - 3600
    stale = [
        jid for jid, j in _jobs.items()
        if j["status"] in ("completed", "failed")
        and j.get("completed_at") is not None
        and j["completed_at"].timestamp() < cutoff
    ]
    for jid in stale:
        del _jobs[jid]

    job_id = str(uuid.uuid4())
    now = datetime.now(UTC)
    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "started_at": now,
        "sites": request.sites,
        "categories": request.categories,
    }
    background_tasks.add_task(_run_scraping, job_id, request, db)
    return ScrapeResponse(
        job_id=job_id,
        status="started",
        message="Scraping arka planda başlatıldı.",
        started_at=now,
    )


@router.get("/status/{job_id}", response_model=ScrapeStatusResponse)
async def get_scrape_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Job bulunamadı: {job_id}")

    completed_at = job.get("completed_at")
    started_at = job.get("started_at")
    duration = None
    if completed_at and started_at:
        duration = (completed_at - started_at).total_seconds()

    return ScrapeStatusResponse(
        job_id=job_id,
        status=job["status"],
        started_at=started_at,
        completed_at=completed_at,
        duration_seconds=duration,
        results=job.get("results"),
        total_products_scraped=job.get("total_products_scraped", 0),
        error_count=job.get("error_count", 0),
    )
