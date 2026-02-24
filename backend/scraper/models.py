from pydantic import BaseModel, field_validator
from datetime import datetime, UTC
from typing import Any
import re
import unicodedata


class ScrapedProduct(BaseModel):
    name: str
    brand: str = ""
    category: str           # GPU | CPU | RAM | SSD | HDD | PSU | CASE | MOBO | COOLER | MONITOR
    price: float
    currency: str = "TRY"
    in_stock: bool = True
    url: str
    site: str               # itopya | incehesap | sinerji
    site_display_name: str
    image_url: str | None = None
    specs: dict[str, Any] = {}
    scraped_at: datetime = None

    def model_post_init(self, __context: Any) -> None:
        if self.scraped_at is None:
            object.__setattr__(self, 'scraped_at', datetime.now(UTC))

    @property
    def normalized_name(self) -> str:
        return normalize_name(self.name)


def normalize_name(name: str) -> str:
    """
    Ürün adını MongoDB eşleştirme için normalize et.
    'AMD RYZEN 7 8700G 4.2GHz ...' → 'amd-ryzen-7-8700g-4-2ghz'
    """
    # Türkçe karakterleri ASCII'ye çevir
    tr_map = str.maketrans("çğışöüÇĞİŞÖÜ", "cgisouCGISOu")
    text = name.translate(tr_map)
    # Unicode normalize
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    # Küçük harf
    text = text.lower()
    # Alfanümerik olmayan karakterleri tire ile değiştir
    text = re.sub(r"[^a-z0-9]+", "-", text)
    # Baş ve son tireleri sil
    text = text.strip("-")
    # Çoklu tireleri tekleştir
    text = re.sub(r"-{2,}", "-", text)
    return text


def parse_price(text: str) -> float | None:
    """'14.560,78 TL' veya '14,560.78' → 14560.78"""
    if not text:
        return None
    # Sadece rakam, nokta ve virgül bırak
    cleaned = re.sub(r"[^\d.,]", "", text.strip())
    if not cleaned:
        return None
    # Türkçe format: binlik=nokta, ondalık=virgül → "14.560,78"
    if "," in cleaned and "." in cleaned:
        if cleaned.rindex(",") > cleaned.rindex("."):
            # Virgül ondalık ayracı
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            # Nokta ondalık ayracı
            cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        # Sadece virgül var — ondalık ayracı olarak kabul et
        parts = cleaned.split(",")
        if len(parts) == 2 and len(parts[1]) <= 2:
            cleaned = cleaned.replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None
