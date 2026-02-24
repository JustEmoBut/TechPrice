"""
Veritabani sifirlama scripti.
TechPriceDB icindeki tum collection'lari temizler (siler degil, drop eder).
Indeksler scraper ilk calistiginda yeniden olusturulur.

Kullanim:
    python reset_db.py            # Onay ister
    python reset_db.py --yes      # Onaysiz calistir
"""

import asyncio
import argparse
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("reset_db")

COLLECTIONS = ["products", "price_history", "scrape_logs"]


async def reset(confirmed: bool) -> None:
    import os
    sys.path.insert(0, os.path.dirname(__file__))
    from api.db.mongodb import connect_db, disconnect_db, get_db

    await connect_db()
    try:
        db = get_db()

        # Her collection icin mevcut belge sayisini goster
        print()
        print("Mevcut durum:")
        print("-" * 40)
        totals = {}
        for col in COLLECTIONS:
            count = await db[col].count_documents({})
            totals[col] = count
            print(f"  {col:20s}: {count:>6} belge")
        print("-" * 40)
        total = sum(totals.values())
        print(f"  {'TOPLAM':20s}: {total:>6} belge")
        print()

        if total == 0:
            logger.info("Veritabani zaten bos, yapilacak islem yok.")
            return

        if not confirmed:
            ans = input("Tum veriler silinecek. Devam etmek istiyor musunuz? [y/N] ").strip().lower()
            if ans not in ("y", "yes", "e", "evet"):
                print("Iptal edildi.")
                return

        # Drop et (indeksler dahil silinir — connect_db tekrar cagrildiginda yeniden olusur)
        for col in COLLECTIONS:
            if totals[col] > 0:
                await db.drop_collection(col)
                logger.info(f"{col} collection silindi ({totals[col]} belge).")
            else:
                logger.info(f"{col} zaten bosti, atlandi.")

        print()
        print("Veritabani basariyla sifirlandi.")
        print("Indeksler bir sonraki 'backend\\start.bat' veya 'scrape_cli.py' calismasinda yeniden olusturulacak.")

    finally:
        await disconnect_db()


def _run(coro) -> int:
    loop = asyncio.ProactorEventLoop()
    asyncio.set_event_loop(loop)
    exit_code = 0
    try:
        loop.run_until_complete(coro)
    except KeyboardInterrupt:
        print("\nIptal edildi.")
        exit_code = 1
    except Exception as e:
        logger.error(f"Hata: {e}")
        exit_code = 2
    finally:
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
            loop.run_until_complete(
                asyncio.wait_for(loop.shutdown_default_executor(), timeout=5.0)
            )
        except Exception:
            pass
        loop.close()
        asyncio.set_event_loop(None)
    return exit_code


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TechPriceDB sifirlama araci")
    parser.add_argument("--yes", "-y", action="store_true", help="Onay sormadan calistir")
    args = parser.parse_args()

    code = _run(reset(confirmed=args.yes))
    sys.exit(code)
