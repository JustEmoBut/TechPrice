from pydantic import BaseModel
from datetime import datetime
from typing import Any


class ScrapeRequest(BaseModel):
    sites: list[str] | None = None          # None = hepsi
    categories: list[str] | None = None     # None = hepsi


class ScrapeResponse(BaseModel):
    job_id: str
    status: str
    message: str
    started_at: datetime


class ScrapeStatusResponse(BaseModel):
    job_id: str
    status: str   # running | completed | partial | failed
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_seconds: float | None = None
    results: dict[str, Any] | None = None
    total_products_scraped: int = 0
    error_count: int = 0
