from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any


class SitePrice(BaseModel):
    site: str
    site_display_name: str
    url: str
    price: float
    currency: str = "TRY"
    in_stock: bool
    last_updated: datetime | None = None


class ProductResponse(BaseModel):
    id: str
    name: str
    normalized_name: str
    brand: str = ""
    category: str
    specs: dict[str, Any] = {}
    site_prices: list[SitePrice] = []
    min_price: float | None = None
    min_price_site: str | None = None
    image_url: str | None = None
    last_scraped: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProductListResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    pages: int
