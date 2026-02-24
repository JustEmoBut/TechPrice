from pydantic import BaseModel
from datetime import datetime


class PricePoint(BaseModel):
    id: str
    product_id: str
    site: str
    site_display_name: str
    price: float
    in_stock: bool
    scraped_at: datetime
    price_change: float | None = None
    price_change_pct: float | None = None


class PriceHistoryResponse(BaseModel):
    product_id: str
    history: list[dict]
