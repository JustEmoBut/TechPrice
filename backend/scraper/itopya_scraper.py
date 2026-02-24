from playwright.async_api import Page
from scraper.base_scraper import BaseScraper
from scraper.models import parse_price
import asyncio
import logging

logger = logging.getLogger(__name__)


class ItopyaScraper(BaseScraper):
    """
    itopya.com scraper'ı.

    Sayfalama: ?pg=N — KÜMÜLATİF yükleme!
      - ?pg=1 → 20 ürün
      - ?pg=2 → 40 ürün (ilk 20 tekrar + 20 yeni)
      - ?pg=3 → 60 ürün (ilk 40 tekrar + 20 yeni)
    Bu yüzden parse_product_list sadece (page_num-1)*20 sonrasını döndürür.
    Son sayfa: #loadMoreButton DOM'da yoksa.
    """

    SITE_NAME = "itopya"
    SITE_DISPLAY_NAME = "İtopya"
    BASE_URL = "https://www.itopya.com"
    PRODUCTS_PER_PAGE = 20

    CATEGORIES = {
        "CPU":  "https://www.itopya.com/islemci_k8",
        "MOBO": "https://www.itopya.com/anakart_k9",
        "GPU":  "https://www.itopya.com/ekran-karti_k11",
        "RAM":  "https://www.itopya.com/rambellek_k10",
        "CASE": "https://www.itopya.com/bilgisayar-kasalari_k16",
        "PSU":  "https://www.itopya.com/powersupply_k17",
        "SSD":  "https://www.itopya.com/ssd_k20",
    }

    def get_categories(self) -> dict[str, str]:
        return self.CATEGORIES

    def get_page_url(self, base_url: str, page_num: int) -> str:
        """Sayfa 1 için base URL, diğerleri için ?pg=N"""
        if page_num == 1:
            return base_url
        return f"{base_url}?pg={page_num}"

    async def has_next_page(self, page: Page, current_page: int) -> bool:
        """#loadMoreButton DOM'da varsa sonraki sayfa mevcuttur."""
        try:
            btn = await page.query_selector("#loadMoreButton")
            return btn is not None
        except Exception:
            return False

    async def parse_product_list(self, page: Page, category: str, page_num: int = 1) -> list[dict]:
        """
        Listeleme sayfasından ürün kartlarını parse et.
        Kümülatif yükleme: ?pg=2 → 40 blok, ama sadece son 20'si yeni.
        Dilim: blocks[(page_num-1)*PRODUCTS_PER_PAGE :]
        """
        products = []

        # Ürün kartlarının yüklenmesini bekle
        try:
            await page.wait_for_selector(".product-block", timeout=15000)
        except Exception:
            logger.warning("Itopya: .product-block elementleri bulunamadi")
            return []

        # Lazy image'ları tetiklemek için sayfayı aşağı-yukarı scroll et
        try:
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(0.5)
            await page.evaluate("window.scrollTo(0, 0)")
            await asyncio.sleep(0.3)
        except Exception:
            pass

        all_blocks = await page.query_selector_all(".product-block")
        # Kümülatif sayfalama: sadece bu sayfada yeni gelen blokları al
        start = (page_num - 1) * self.PRODUCTS_PER_PAGE
        blocks = all_blocks[start:]
        logger.debug(f"Itopya: Toplam {len(all_blocks)} blok, sayfa {page_num} icin {len(blocks)} yeni urun (offset={start})")

        for block in blocks:
            try:
                product = await self._parse_block(block)
                if product:
                    products.append(product)
            except Exception as e:
                logger.warning(f"Itopya: Kart parse hatasi: {e}")
                continue

        return products

    async def _parse_block(self, block) -> dict | None:
        """Tek bir .product-block elementini parse et."""
        # Ürün URL ve adı — a.title elementi hem link hem metin içeriyor
        title_el = await block.query_selector("a.title")
        if not title_el:
            return None

        name = (await title_el.inner_text()).strip()
        url = await title_el.get_attribute("href")
        if not name or not url:
            return None

        # URL'yi tam yap
        if url.startswith("/"):
            url = f"{self.BASE_URL}{url}"

        # Fiyat — .product-price
        # Normal ürün: tüm metin direkt fiyat
        # İndirimli ürün: <span.old-price> eski fiyat + <strong> güncel fiyat
        # → <strong> varsa onu kullan, yoksa tüm inner_text
        price_el = await block.query_selector(".product-price")
        if not price_el:
            logger.warning(f"Itopya: price_el bulunamadi — {url}")
            return None
        strong_el = await price_el.query_selector("strong")
        if strong_el:
            price_text = (await strong_el.inner_text()).strip()
        else:
            price_text = (await price_el.inner_text()).strip()
        price = parse_price(price_text)
        if price is None:
            logger.warning(f"Itopya: Fiyat parse edilemedi: '{price_text}' — {url}")
            return None

        # Resim — lozad lazy-load: gerçek URL her zaman data-src'de bulunur,
        # src henüz yüklenmemiş placeholder (blank.gif / base64) olabilir.
        img_el = await block.query_selector(".product-image img")
        image_url = None
        if img_el:
            # data-src önce dene (lozad'ın gerçek URL'si)
            image_url = await img_el.get_attribute("data-src")
            if not image_url:
                image_url = await img_el.get_attribute("src")
            # Base64, çok kısa veya "blank" içeren URL'leri ele geçirme
            if image_url and (
                image_url.startswith("data:")
                or len(image_url) < 15
                or "blank" in image_url
                or image_url.endswith(".gif")
            ):
                image_url = None
            # Göreceli URL'yi tam URL'ye çevir
            if image_url and image_url.startswith("/"):
                image_url = f"{self.BASE_URL}{image_url}"

        return {
            "name": name,
            "url": url,
            "price": price,
            "in_stock": True,   # Listeleme sayfasında fiyat varsa stokta kabul et
            "image_url": image_url,
            "specs": {},
        }
