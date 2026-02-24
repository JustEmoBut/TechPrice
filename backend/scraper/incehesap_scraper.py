from playwright.async_api import Page
from scraper.base_scraper import BaseScraper
import asyncio
import logging

logger = logging.getLogger(__name__)


class InceHesapScraper(BaseScraper):
    """
    incehesap.com scraper'i.

    Site yapisi (2026-02 analizi):
    - Urun karti: a.product
    - Veri kaynagi: data-product JSON ozelligi
      {id, name, brand, price (int TL), category, ...}
    - Fiyat: dogrudan integer, parse gerekmez
    - Sayfalama: /kategori/sayfa-N/ URL pattern
    - Sonraki sayfa: a[rel="next"] varsa devam
    - Stok: listeleme sayfasinda goruntulenen urunler stokta kabul edilir
    - Resim: img[src] gorecel URL -> BASE_URL prefix
    """

    SITE_NAME = "incehesap"
    SITE_DISPLAY_NAME = "InceHesap"
    BASE_URL = "https://www.incehesap.com"

    CATEGORIES = {
        "CPU":  "https://www.incehesap.com/islemci-fiyatlari/",
        "GPU":  "https://www.incehesap.com/ekran-karti-fiyatlari/",
        "MOBO": "https://www.incehesap.com/anakart-fiyatlari/",
        "RAM":  "https://www.incehesap.com/ram-fiyatlari/",
        "SSD":  "https://www.incehesap.com/ssd-harddisk-fiyatlari/",
        "CASE": "https://www.incehesap.com/bilgisayar-kasasi-fiyatlari/",
        "PSU":  "https://www.incehesap.com/power-supply-fiyatlari/",
    }

    def get_categories(self) -> dict[str, str]:
        return self.CATEGORIES

    def get_page_url(self, base_url: str, page_num: int) -> str:
        """
        Sayfa 1: base_url (trailing slash ile)
        Sayfa N: base_url + sayfa-N/
        Ornek: /ekran-karti-fiyatlari/sayfa-3/
        """
        if page_num == 1:
            return base_url
        # base_url trailing slash icerir: /kategori/  -> /kategori/sayfa-N/
        return f"{base_url}sayfa-{page_num}/"

    async def has_next_page(self, page: Page, current_page: int) -> bool:
        """
        Pagination nav'daki chevron-right (Next) butonunu kontrol et.
        Nav'in son linki sr-only 'Next' iceriyor:
          - Sonraki sayfa varsa: href = '/kategori/sayfa-N/'
          - Son sayfadaysa:      href = 'javascript:;'
        """
        try:
            next_href = await page.evaluate("""
                () => {
                    const nav = document.querySelector('nav[aria-label="Pagination"]');
                    if (!nav) return null;
                    const links = Array.from(nav.querySelectorAll('a'));
                    // Son link her zaman Next chevron butonu
                    const lastLink = links[links.length - 1];
                    if (!lastLink) return null;
                    const sr = lastLink.querySelector('.sr-only');
                    if (sr && sr.textContent.includes('Next')) {
                        return lastLink.getAttribute('href');
                    }
                    return null;
                }
            """)
            return (
                next_href is not None
                and next_href != "javascript:;"
                and next_href.strip() not in ("", "#")
            )
        except Exception:
            return False

    async def parse_product_list(self, page: Page, category: str, page_num: int = 1) -> list[dict]:
        """
        Listeleme sayfasindan tum urunleri cek.
        #product-grid ile yalnizca ana listeleme alınır;
        swiper carousel ve "en cok satılan" gibi ekstra bolumler dahil edilmez.
        data-product JSON ozelligi sayesinde tek JS evaluate cagrisiyla
        tum veriyi aliyoruz — cok sayida Playwright sorgusu gerekmiyor.
        """
        # Ana grid'in yuklenmesini bekle
        try:
            await page.wait_for_selector("#product-grid a.product", timeout=20000)
        except Exception:
            logger.warning("InceHesap: #product-grid a.product elementleri bulunamadi")
            return []

        # Tum uruleri tek seferde JS ile cek
        try:
            raw_products = await page.evaluate("""
                () => {
                    const cards = document.querySelectorAll('#product-grid a.product');
                    return Array.from(cards).map(card => {
                        let data = {};
                        try {
                            data = JSON.parse(card.getAttribute('data-product') || '{}');
                        } catch(e) {}

                        const img = card.querySelector('img');
                        const imgSrc = img ? (img.getAttribute('src') || '') : '';

                        return {
                            name:   data.name   || card.getAttribute('title') || '',
                            brand:  data.brand  || '',
                            price:  data.price  || 0,
                            href:   card.getAttribute('href') || '',
                            imgSrc: imgSrc,
                        };
                    });
                }
            """)
        except Exception as e:
            logger.error(f"InceHesap: JS evaluate hatasi: {e}")
            return []

        products = []
        for raw in raw_products:
            try:
                name = raw.get("name", "").strip()
                brand = raw.get("brand", "").strip()
                price = raw.get("price", 0)
                href = raw.get("href", "").strip()
                img_src = raw.get("imgSrc", "").strip()

                if not name or not href or not price:
                    continue

                # Goreli URL -> tam URL
                url = f"{self.BASE_URL}{href}" if href.startswith("/") else href

                # Resim URL: goreli -> tam, placeholder filtrele
                image_url = None
                if img_src and not img_src.startswith("data:") and len(img_src) > 10:
                    image_url = (
                        f"{self.BASE_URL}{img_src}"
                        if img_src.startswith("/")
                        else img_src
                    )

                products.append({
                    "name":       name,
                    "brand":      brand or self._extract_brand(name),
                    "price":      float(price),
                    "url":        url,
                    "image_url":  image_url,
                    "in_stock":   True,  # Listeleme sayfasindaki tum urunler stokta
                    "specs":      {},
                })
            except Exception as e:
                logger.debug(f"InceHesap: Urun parse hatasi: {e}")
                continue

        logger.debug(f"InceHesap: {len(products)} urun parse edildi")
        return products
