from playwright.async_api import Page
from scraper.base_scraper import BaseScraper
import re
import logging

logger = logging.getLogger(__name__)


class SinerjiScraper(BaseScraper):
    """
    sinerji.gen.tr scraper'ı.

    Site yapısı (2026-02 analizi):
    - Ürün kartı  : article
    - İsim        : .title a (ilk link — rating/SKU gürültüsü içermiyor)
    - URL         : article'ın ilk <a> href'i (göreli, /slug-p-ID formatında)
    - Resim       : article img[src] — tam URL, lazy-load yok
    - Fiyat       : .price textContent, "₺ 18.599" (nokta = binlik ayracı)
    - Stok        : .alert elementi varsa "Çok yakında stoklarımızda." → fiyat yok → atla
    - Sayfalama   : ?px=N; nav içinde <a>Sonraki</a> varsa sonraki sayfa mevcut,
                    span.disabled olursa son sayfadayız
    """

    SITE_NAME = "sinerji"
    SITE_DISPLAY_NAME = "Sinerji"
    BASE_URL = "https://www.sinerji.gen.tr"

    CATEGORIES = {
        "CPU":  "https://www.sinerji.gen.tr/islemci-c-1",
        "MOBO": "https://www.sinerji.gen.tr/anakart-c-2009",
        "RAM":  "https://www.sinerji.gen.tr/bellek-ram-c-2010",
        "SSD":  "https://www.sinerji.gen.tr/depolama-c-2146",
        "GPU":  "https://www.sinerji.gen.tr/ekran-karti-c-2023",
        "CASE": "https://www.sinerji.gen.tr/bilgisayar-kasasi-c-2027",
        "PSU":  "https://www.sinerji.gen.tr/guc-kaynagi-c-2030",
    }

    def get_categories(self) -> dict[str, str]:
        return self.CATEGORIES

    def get_page_url(self, base_url: str, page_num: int) -> str:
        """Sayfa 1 base URL, sonrası ?px=N."""
        if page_num == 1:
            return base_url
        return f"{base_url}?px={page_num}"

    async def has_next_page(self, page: Page, current_page: int) -> bool:
        """
        nav[aria-label="Page navigation"] içinde <a> olarak "Sonraki" var mı?
        Son sayfada <span class="disabled">Sonraki</span> görünür.
        """
        try:
            result = await page.evaluate("""
                () => {
                    const nav = document.querySelector('nav[aria-label="Page navigation"]');
                    if (!nav) return false;
                    const links = Array.from(nav.querySelectorAll('a'));
                    return links.some(a => a.textContent.trim() === 'Sonraki');
                }
            """)
            return bool(result)
        except Exception:
            return False

    async def parse_product_list(self, page: Page, category: str, page_num: int = 1) -> list[dict]:
        """
        Listeleme sayfasındaki article elementlerini parse et.
        Stokta olmayan ürünler (.alert varsa, fiyatı da yok) atlanır.
        """
        try:
            await page.wait_for_selector("article", timeout=15000)
        except Exception:
            logger.warning("Sinerji: article elementleri bulunamadi")
            return []

        try:
            raw_products = await page.evaluate("""
                () => {
                    return Array.from(document.querySelectorAll('article')).map(article => {
                        // Stok: .alert elementi yoksa stokta
                        const inStock = !article.querySelector('.alert');

                        // URL: article'ın ilk <a> href'i (/slug-p-ID formatı)
                        const mainLink = article.querySelector('a');
                        const href = mainLink ? mainLink.getAttribute('href') : '';

                        // Resim: doğrudan src (tam URL, lazy-load yok)
                        const img = article.querySelector('img');
                        const imgSrc = img ? (img.getAttribute('src') || '') : '';

                        // İsim: .title içindeki ilk <a> — sadece isim metni
                        const titleContainer = article.querySelector('.title');
                        const nameLink = titleContainer ? titleContainer.querySelector('a') : null;
                        const name = nameLink ? nameLink.textContent.trim() : '';

                        // Fiyat: .price textContent, ₺ işareti çıkarılır
                        const priceEl = article.querySelector('.price');
                        const priceRaw = priceEl ? priceEl.textContent.replace('₺', '').trim() : '';

                        return { name, href, imgSrc, priceRaw, inStock };
                    });
                }
            """)
        except Exception as e:
            logger.error(f"Sinerji: JS evaluate hatasi: {e}")
            return []

        products = []
        for raw in raw_products:
            try:
                name = raw.get("name", "").strip()
                href = raw.get("href", "").strip()
                img_src = raw.get("imgSrc", "").strip()
                price_raw = raw.get("priceRaw", "").strip()
                in_stock = raw.get("inStock", False)

                if not name or not href:
                    continue

                # Stokta olmayan ürünlerin fiyatı da yok — atla
                if not in_stock or not price_raw:
                    continue

                url = f"{self.BASE_URL}{href}" if href.startswith("/") else href

                price = self._parse_sinerji_price(price_raw)
                if price is None:
                    logger.warning(f"Sinerji: Fiyat parse edilemedi: '{price_raw}' — {url}")
                    continue

                # Resim: çok kısa veya boş ise None
                image_url = img_src if img_src and len(img_src) > 10 else None

                products.append({
                    "name":      name,
                    "url":       url,
                    "price":     price,
                    "image_url": image_url,
                    "in_stock":  True,
                    "specs":     {},
                })
            except Exception as e:
                logger.debug(f"Sinerji: Urun parse hatasi: {e}")
                continue

        logger.debug(f"Sinerji: {len(products)} urun parse edildi")
        return products

    def _parse_sinerji_price(self, text: str) -> float | None:
        """
        Sinerji'ye özgü Türkçe fiyat formatı:
          nokta = binlik ayracı, virgül = ondalık ayracı
          '18.599'   → 18599.0
          '1.234,56' → 1234.56
        """
        if not text:
            return None
        cleaned = re.sub(r"[^\d.,]", "", text.strip())
        if not cleaned:
            return None
        # Tüm noktaları kaldır (binlik), virgülü noktaya çevir (ondalık)
        cleaned = cleaned.replace(".", "").replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return None
