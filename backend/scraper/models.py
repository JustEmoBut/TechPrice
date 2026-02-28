from pydantic import BaseModel, field_validator
from datetime import datetime, UTC
from typing import Any
import re
import unicodedata


_NOISE_PATTERNS = [
    # Türkçe kategori ekleri (Türkçe→ASCII sonrası)
    r"\bEkran\s+Karti\b",
    r"\bIslemci\b",
    r"\bAnakart\b",
    r"\bBellek\b",
    r"\bDepolama\b",
    r"\bGuc\s+Kaynagi\b",
    r"\bKasa\b",
    # GPU alt-marka
    r"\bGeForce\b",
    r"\bRadeon\b",
    # CPU alt-marka
    r"\bCore\b",
    # Paketleme
    r"\b(?:BOX|OEM|Tray|Retail|Bulk)\b",
    # CPU soket
    r"\bSoket\s+\w+\b",
    r"\b(?:AM[345]|LGA\d{3,4})\b",
    # CPU saat hızı
    r"\b\d+(?:\.\d+)?\s*GHz\b",
    # CPU çekirdek/iş sayısı
    r"\b\d+C/\d+T\b",
    r"\b\d+-Core\b",
    r"\b\d+\s*Cekirdek\b",
    # CPU önbellek (Türkçe→ASCII sonrası Önbellek→Onbellek)
    r"\b\d+MB\s*Onbellek\b",
    r"\bOnbellek\b",
    # CPU üretim süreci
    r"\b\d+nm\b",
    # AMD paketleme (MPK = Multi-Pack Kit, OPN = vb.)
    r"\bMPK\b",
    r"\bOPN\b",
    # "(Max X.XGHz)" kalıntısı — GHz kaldırılınca "(Max )" kalır
    r"\(\s*Max\s*\)",
    r"\bMax\b",
]


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
    'AMD RYZEN 7 8700G 4.2GHz 8C/16T AM4' → 'amd-ryzen-7-8700g'
    'NVIDIA GeForce RTX 4090 Ekran Kartı' → 'nvidia-rtx-4090'
    """
    # 1. Türkçe karakterleri ASCII'ye çevir
    tr_map = str.maketrans("çğışöüÇĞİŞÖÜ", "cgisouCGISOu")
    text = name.translate(tr_map)
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    # 2. Site-spesifik gürültü kelimelerini sil
    for pattern in _NOISE_PATTERNS:
        text = re.sub(pattern, " ", text, flags=re.IGNORECASE)
    # 3. Küçük harf
    text = text.lower()
    # 4. Alfanümerik olmayan karakterleri tire ile değiştir
    text = re.sub(r"[^a-z0-9]+", "-", text)
    # 5. Baş/son tireleri ve çoklu tireleri temizle
    text = text.strip("-")
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
