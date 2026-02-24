from abc import ABC, abstractmethod
from camoufox.async_api import AsyncCamoufox
from playwright.async_api import Page, Browser
from scraper.models import ScrapedProduct
from api.core.config import settings
import asyncio
import sys
import random
import logging

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """
    Tüm scraper'ların türetileceği soyut temel sınıf.
    Camoufox (bot tespitini atlayan Firefox) ile çalışır.
    """

    SITE_NAME: str = ""
    SITE_DISPLAY_NAME: str = ""
    BASE_URL: str = ""

    def __init__(self):
        self._browser: Browser | None = None
        self._camoufox_ctx = None

    # ------------------------------------------------------------------ #
    # Abstract metodlar — alt sınıflar implement etmeli
    # ------------------------------------------------------------------ #

    @abstractmethod
    def get_categories(self) -> dict[str, str]:
        """
        Kategori slug → URL eşleştirmesi döndür.
        Örnek: {"CPU": "https://www.itopya.com/islemci_k8"}
        """
        ...

    @abstractmethod
    async def parse_product_list(self, page: Page, category: str, page_num: int = 1) -> list[dict]:
        """
        Tek bir listeleme sayfasını parse et.
        page_num: Hangi sayfa olduğu (kümülatif yükleyen siteler için gerekli).
        Döndürür: [{"name": ..., "url": ..., "price": ..., "image_url": ...}, ...]
        """
        ...

    @abstractmethod
    async def has_next_page(self, page: Page, current_page: int) -> bool:
        """Bir sonraki sayfa var mı?"""
        ...

    @abstractmethod
    def get_page_url(self, base_url: str, page_num: int) -> str:
        """Belirli sayfa numarası için URL döndür."""
        ...

    # ------------------------------------------------------------------ #
    # Somut metodlar — tüm scraper'lar kullanır
    # ------------------------------------------------------------------ #

    async def scrape_category(self, category: str) -> list[ScrapedProduct]:
        """Tek bir kategoriyi tüm sayfalarıyla scrape et."""
        # Playwright subprocess için ProactorEventLoop gerekli.
        # Zaten ProactorEventLoop'taysak (CLI default, Python 3.14+) direkt çalıştır.
        # Değilsek (uvicorn kendi loop'unu açar) thread içinde yeni ProactorEventLoop aç.
        if sys.platform == "win32":
            loop = asyncio.get_event_loop()
            if not isinstance(loop, asyncio.ProactorEventLoop):
                return await asyncio.to_thread(self._scrape_category_in_proactor, category)
        return await self._scrape_category_impl(category)

    def _scrape_category_in_proactor(self, category: str) -> list[ScrapedProduct]:
        """Windows'ta ProactorEventLoop ile çalıştır (subprocess desteği)."""
        loop = asyncio.ProactorEventLoop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self._scrape_category_impl(category))
        finally:
            try:
                # asyncio.run() gibi düzgün kapat — aksi halde Firefox subprocess kalıyor
                pending = asyncio.all_tasks(loop)
                for task in pending:
                    task.cancel()
                if pending:
                    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                loop.run_until_complete(loop.shutdown_asyncgens())
                loop.run_until_complete(loop.shutdown_default_executor())
            finally:
                asyncio.set_event_loop(None)
                loop.close()

    async def _scrape_category_impl(self, category: str) -> list[ScrapedProduct]:
        """Asıl scraping implementasyonu."""
        categories = self.get_categories()
        if category not in categories:
            logger.warning(f"{self.SITE_NAME}: Kategori bulunamadı: {category}")
            return []

        base_url = categories[category]
        all_products = []
        page_num = 1
        max_products = settings.scraper_max_products_per_category

        logger.info(f"{self.SITE_NAME}: {category} kategorisi scraping basliyor...")

        async with AsyncCamoufox(headless=True, geoip=True) as browser:
            page = await browser.new_page()
            try:
                while len(all_products) < max_products:
                    url = self.get_page_url(base_url, page_num)
                    logger.debug(f"{self.SITE_NAME}: Sayfa {page_num} yukleniyor: {url}")

                    success = await self._navigate_with_retry(page, url)
                    if not success:
                        logger.error(f"{self.SITE_NAME}: Sayfa yuklenemedi: {url}")
                        break

                    # Sayfadan ürünleri parse et
                    # page_num'ı lambda'ya bağla (loop variable capture sorununu önler)
                    _pn = page_num
                    products_raw = await self._retry(
                        lambda: self.parse_product_list(page, category, _pn)
                    )
                    if not products_raw:
                        logger.info(f"{self.SITE_NAME}: Sayfa {page_num}'de urun bulunamadi, durduruluyor.")
                        break

                    for raw in products_raw:
                        product = ScrapedProduct(
                            name=raw["name"],
                            brand=raw.get("brand", self._extract_brand(raw["name"])),
                            category=category,
                            price=raw["price"],
                            in_stock=raw.get("in_stock", True),
                            url=raw["url"],
                            site=self.SITE_NAME,
                            site_display_name=self.SITE_DISPLAY_NAME,
                            image_url=raw.get("image_url"),
                            specs=raw.get("specs", {}),
                        )
                        all_products.append(product)

                    logger.info(f"{self.SITE_NAME}: Sayfa {page_num} -> {len(products_raw)} urun (toplam: {len(all_products)})")

                    # Sonraki sayfa var mı?
                    next_exists = await self.has_next_page(page, page_num)
                    if not next_exists or len(all_products) >= max_products:
                        break

                    page_num += 1
                    # Rate limiting
                    await asyncio.sleep(random.uniform(
                        settings.scraper_delay_min,
                        settings.scraper_delay_max
                    ))
            finally:
                # Tarayıcı context kapanmadan önce sayfayı düzgün kapat
                try:
                    await page.close()
                except Exception:
                    pass

        logger.info(f"{self.SITE_NAME}: {category} tamamlandi -> toplam {len(all_products)} urun")
        return all_products

    async def scrape_all(self, categories: list[str] | None = None) -> list[ScrapedProduct]:
        """Tüm (veya belirtilen) kategorileri scrape et."""
        available = self.get_categories()
        target_categories = [c for c in (categories or list(available.keys())) if c in available]

        all_results = []
        for i, category in enumerate(target_categories):
            try:
                products = await self.scrape_category(category)
                all_results.extend(products)
            except Exception as e:
                logger.error(f"{self.SITE_NAME}: {category} scraping hatasi: {e}")
            # Son kategori değilse: Firefox subprocess'in tam kapanması için bekle
            if i < len(target_categories) - 1:
                await asyncio.sleep(3)
        return all_results

    # ------------------------------------------------------------------ #
    # Yardımcı metodlar
    # ------------------------------------------------------------------ #

    async def _navigate_with_retry(self, page: Page, url: str, max_attempts: int = 3) -> bool:
        for attempt in range(1, max_attempts + 1):
            try:
                await page.goto(
                    url,
                    timeout=settings.scraper_page_timeout * 1000,
                    wait_until="domcontentloaded"
                )
                return True
            except Exception as e:
                logger.warning(f"Gezinme hatası (deneme {attempt}/{max_attempts}): {e}")
                if attempt < max_attempts:
                    await asyncio.sleep(2 ** attempt)
        return False

    async def _retry(self, coro_fn, max_attempts: int = 3):
        for attempt in range(1, max_attempts + 1):
            try:
                return await coro_fn()
            except Exception as e:
                logger.warning(f"Hata (deneme {attempt}/{max_attempts}): {e}")
                if attempt < max_attempts:
                    await asyncio.sleep(2 ** attempt)
        return []

    def _extract_brand(self, name: str) -> str:
        """Ürün adından markayı tahmin et."""
        brands = ["AMD", "Intel", "NVIDIA", "ASUS", "MSI", "Gigabyte", "EVGA",
                  "Corsair", "Kingston", "G.Skill", "Samsung", "Western Digital",
                  "Seagate", "Crucial", "NZXT", "be quiet!", "Seasonic", "Thermaltake",
                  "Cooler Master", "DeepCool", "Fractal Design", "Lian Li"]
        name_upper = name.upper()
        for brand in brands:
            if brand.upper() in name_upper:
                return brand
        # İlk kelimeyi marka olarak al
        return name.split()[0] if name else ""
