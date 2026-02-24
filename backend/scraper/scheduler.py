import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from api.core.config import settings

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def scheduled_scrape_job():
    """Zamanlanmis scraping job'u. Tum siteleri ve kategorileri scrape eder."""
    from api.db.mongodb import get_db
    from scraper.scraper_manager import ScraperManager

    logger.info("Zamanlanmis scraping basladi")
    try:
        db = get_db()
        manager = ScraperManager(db)
        results = await manager.run()
        total = sum(r.get("products_scraped", 0) for r in results.values())
        logger.info(f"Zamanlanmis scraping tamamlandi: {total} urun, sonuclar={results}")
    except Exception:
        logger.exception("Zamanlanmis scraping hatasi")


def setup_scheduler() -> AsyncIOScheduler | None:
    """APScheduler'i config'e gore olusturur ve dondurur (henuz baslatmaz)."""
    global _scheduler

    if not settings.scheduler_enabled:
        logger.info("Scheduler devre disi (SCHEDULER_ENABLED=false)")
        return None

    _scheduler = AsyncIOScheduler()

    trigger = CronTrigger(
        day_of_week=settings.scheduler_cron_day,
        hour=settings.scheduler_cron_hour,
        minute=settings.scheduler_cron_minute,
    )

    _scheduler.add_job(
        scheduled_scrape_job,
        trigger=trigger,
        id="weekly_scrape",
        name="Haftalik fiyat guncelleme",
        replace_existing=True,
    )

    return _scheduler


async def start_scheduler():
    """Scheduler'i baslatir."""
    scheduler = setup_scheduler()
    if scheduler is None:
        return

    scheduler.start()

    job = scheduler.get_job("weekly_scrape")
    if job and job.next_run_time:
        logger.info(f"Scheduler baslatildi, sonraki calisma: {job.next_run_time}")
    else:
        logger.info("Scheduler baslatildi")


async def stop_scheduler():
    """Scheduler'i durdurur."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler durduruldu")
        _scheduler = None
