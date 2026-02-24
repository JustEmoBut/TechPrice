"""
Manuel scraping CLI.

Kullanim:
    python scrape_cli.py                          # Tum siteler, tum kategoriler
    python scrape_cli.py --site itopya            # Sadece itopya, tum kategoriler
    python scrape_cli.py --site itopya --cat GPU  # Sadece itopya GPU
    python scrape_cli.py --cat GPU --cat CPU      # Tum siteler, GPU+CPU
"""

import argparse
import asyncio
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("scrape_cli")


async def main(sites: list[str] | None, categories: list[str] | None) -> None:
    from api.db.mongodb import connect_db, disconnect_db, get_db
    from scraper.scraper_manager import ScraperManager, ALL_SITES, SCRAPER_MAP

    # Gecerlilik kontrolleri
    if sites:
        invalid = [s for s in sites if s not in SCRAPER_MAP]
        if invalid:
            logger.error(f"Gecersiz site(ler): {invalid}. Mevcut: {ALL_SITES}")
            return

    await connect_db()
    try:
        db = get_db()
        manager = ScraperManager(db)

        logger.info(f"Scraping basliyor: sites={sites or 'TUMUNU'}, categories={categories or 'TUMUNU'}")
        results = await manager.run(sites=sites, categories=categories)

        # Sonuclari yazdir
        print("\n" + "=" * 60)
        print("SCRAPING SONUCLARI")
        print("=" * 60)
        for site, result in results.items():
            status = result.get("status", "?")
            scraped = result.get("products_scraped", 0)
            new = result.get("products_new", 0)
            updated = result.get("products_updated", 0)
            errors = result.get("errors", [])
            print(f"\n  {site.upper()}: [{status}]")
            print(f"    Cekilen: {scraped} | Yeni: {new} | Guncellenen: {updated}")
            if errors:
                print(f"    Hatalar: {len(errors)}")
                for err in errors[:3]:
                    print(f"      - {err}")

        total = sum(r.get("products_scraped", 0) for r in results.values())
        print(f"\n  TOPLAM: {total} urun")
        print("=" * 60)
    finally:
        await disconnect_db()


def _run_with_clean_exit(coro) -> int:
    """
    asyncio.run() yerine kullanılır.
    Motor (MongoDB) thread pool'u nedeniyle shutdown_default_executor() sonsuza
    asılmasını önlemek için 5 saniyelik timeout uygulanır.
    """
    loop = asyncio.ProactorEventLoop()
    asyncio.set_event_loop(loop)
    exit_code = 0
    try:
        loop.run_until_complete(coro)
    except KeyboardInterrupt:
        logger.warning("Kullanici tarafindan durduruldu (Ctrl+C).")
        exit_code = 1
    except Exception as e:
        logger.error(f"Beklenmeyen hata: {e}")
        exit_code = 2
    finally:
        # Kalan task'lari iptal et
        pending = asyncio.all_tasks(loop)
        if pending:
            for task in pending:
                task.cancel()
            try:
                loop.run_until_complete(
                    asyncio.gather(*pending, return_exceptions=True)
                )
            except Exception:
                pass
        # Async generator'lari kapat
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
        except Exception:
            pass
        # Thread pool executor'i MAX 5 saniye bekle (Motor hang'ini önler)
        try:
            loop.run_until_complete(
                asyncio.wait_for(loop.shutdown_default_executor(), timeout=5.0)
            )
        except (asyncio.TimeoutError, Exception):
            pass
        loop.close()
        asyncio.set_event_loop(None)
    return exit_code


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TechPrice manuel scraping araci")
    parser.add_argument("--site", action="append", help="Scrape edilecek site (tekrarlanabilir)")
    parser.add_argument("--cat", action="append", help="Scrape edilecek kategori (tekrarlanabilir)")
    args = parser.parse_args()

    code = _run_with_clean_exit(main(sites=args.site, categories=args.cat))
    sys.exit(code)
