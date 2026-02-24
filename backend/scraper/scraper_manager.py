from motor.motor_asyncio import AsyncIOMotorDatabase
from scraper.itopya_scraper import ItopyaScraper
from scraper.incehesap_scraper import InceHesapScraper
from scraper.sinerji_scraper import SinerjiScraper
from scraper.models import ScrapedProduct
from api.db.repositories import product_repo, price_repo
from datetime import datetime, UTC
import asyncio
import logging

logger = logging.getLogger(__name__)

# Mevcut scraper'lar
SCRAPER_MAP = {
    "itopya":    ItopyaScraper,
    "incehesap": InceHesapScraper,
    "sinerji":   SinerjiScraper,
}

ALL_SITES = list(SCRAPER_MAP.keys())


class ScraperManager:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def run(
        self,
        sites: list[str] | None = None,
        categories: list[str] | None = None,
    ) -> dict[str, dict]:
        """
        Belirtilen site(ler)i paralel olarak scrape et ve MongoDB'ye yaz.
        Döndürür: site → sonuç istatistikleri
        """
        target_sites = sites if sites else ALL_SITES
        # Geçersiz site adlarını filtrele
        target_sites = [s for s in target_sites if s in SCRAPER_MAP]

        if not target_sites:
            return {}

        logger.info(f"Scraping başlıyor: sites={target_sites}, categories={categories}")

        # Her site için ayrı görev oluştur
        tasks = [
            self._scrape_site(site, categories)
            for site in target_sites
        ]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

        results = {}
        for site, result in zip(target_sites, results_list):
            if isinstance(result, Exception):
                logger.error(f"{site}: Beklenmedik hata: {result}")
                results[site] = {
                    "status": "failed",
                    "products_scraped": 0,
                    "products_updated": 0,
                    "products_new": 0,
                    "errors": [str(result)],
                }
            else:
                results[site] = result

        logger.info(f"Scraping tamamlandı: {results}")
        return results

    # MongoDB Atlas'a eşzamanlı yazma limiti
    _WRITE_CONCURRENCY = 20

    async def _scrape_site(self, site: str, categories: list[str] | None) -> dict:
        """Tek bir siteyi scrape et ve sonuçları DB'ye yaz."""
        scraper_cls = SCRAPER_MAP[site]
        scraper = scraper_cls()
        errors = []
        products_scraped = 0
        products_updated = 0
        products_new = 0

        try:
            products = await scraper.scrape_all(categories=categories)
            products_scraped = len(products)

            logger.info(
                f"{site}: {products_scraped} urun DB'ye yaziliyor "
                f"(concurrency={self._WRITE_CONCURRENCY})..."
            )

            # Sıralı döngü yerine eşzamanlı yazma — ~20x daha hızlı
            sem = asyncio.Semaphore(self._WRITE_CONCURRENCY)
            completed = 0

            async def save_one(product: ScrapedProduct):
                nonlocal completed
                async with sem:
                    result = await self._save_product(product)
                    completed += 1
                    if completed % 50 == 0:
                        logger.info(f"{site}: {completed}/{products_scraped} urun yazildi...")
                    return result

            results = await asyncio.gather(
                *[save_one(p) for p in products],
                return_exceptions=True,
            )

            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"{site}: Urun kaydedilemedi: {result}")
                    errors.append(str(result))
                elif result["is_new"]:
                    products_new += 1
                else:
                    products_updated += 1

        except Exception as e:
            logger.exception(f"{site}: Scraping hatası: {e}")
            errors.append(str(e))

        status = "success" if not errors else ("partial" if products_scraped > 0 else "failed")
        return {
            "status": status,
            "products_scraped": products_scraped,
            "products_updated": products_updated,
            "products_new": products_new,
            "errors": errors[:10],
        }

    async def _save_product(self, product: ScrapedProduct) -> dict:
        """Ürünü DB'ye upsert et ve fiyat geçmişine ekle."""
        product_data = {
            "name": product.name,
            "normalized_name": product.normalized_name,
            "brand": product.brand,
            "category": product.category,
            "specs": product.specs,
            "price": product.price,
            "in_stock": product.in_stock,
            "url": product.url,
            "site": product.site,
            "site_display_name": product.site_display_name,
            "image_url": product.image_url,
        }

        # upsert_product artık (product_id, is_new) döndürüyor
        # ve gereksiz find_one'ı içermiyor
        product_id, is_new = await product_repo.upsert_product(self.db, product_data)

        await price_repo.add_price_history(
            db=self.db,
            product_id=product_id,
            product_normalized_name=product.normalized_name,
            category=product.category,
            site=product.site,
            site_display_name=product.site_display_name,
            url=product.url,
            price=product.price,
            in_stock=product.in_stock,
        )

        return {"product_id": product_id, "is_new": is_new}
