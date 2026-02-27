# TechPriceRemake — CLAUDE.md

## Stack
Python 3.14 + Camoufox → FastAPI (port 8300) → MongoDB Atlas → Next.js 16
Türk teknoloji sitelerinden (İtopya, İnceHesap, Sinerji) bilgisayar parçası fiyatlarını scraping yapıp karşılaştırmalı gösteren fullstack uygulama.

---

## Ortam

**Python:** venv yok — sistem Python. `pip install -r backend/requirements.txt`
**Port:** 8300 (Windows Hyper-V 7740–8139 rezerve, 8000/8080/8200 çalışmıyor)
**MongoDB:** DB: `TechPriceDB` | `.env` dosyası `backend/` içinde, git'e ekleme
- Şifrede özel karakter: `from urllib.parse import quote_plus; print(quote_plus('şifre'))`

**Python 3.14 gotcha'lar:**
- `pydantic-core` binary wheel gerekli: `pip install pydantic pydantic-settings --pre --only-binary :all:`
- Türkçe `print()` Windows terminalinde hata verebilir — test kodunu ASCII yaz
- `ProactorEventLoop` Python 3.14'te default — `set_event_loop_policy()` çağırma
- `asyncio.run()` Motor thread pool yüzünden asılır → `shutdown_default_executor(timeout=5)` gerekli (`scrape_cli.py`)

**Scraper gotcha'lar:**
- `SCRAPER_MAX_PRODUCTS_PER_CATEGORY=0` → sınırsız anlamına gelir (kod `float("inf")` kullanır); .env'de 0 bırakılabilir
- `parse_price()` yalnızca virgül+nokta karışık formatlarda çalışır; salt noktalı `"18.599"` → `18.599` (YANLIŞ). Site'a özgü parser gerekebilir
- CloudFlare: `_wait_for_cloudflare()` base_scraper'da mevcut — sayfa başlığı "Just a moment..." ise Camoufox geçene kadar bekler
- Hata ayıklama için `.env`'e `SCRAPER_HEADLESS=false` ekle — tarayıcı görünür açılır
- CF timeout: `SCRAPER_CF_TIMEOUT=60` (yavaş bağlantıda veya zor challenge'larda artır)

---

## Hızlı Başlangıç

```bash
backend\start.bat                                    # Backend (scheduler otomatik başlar)
cd frontend && npm run dev                           # Frontend
curl http://localhost:8300/api/health                # Sağlık kontrolü
backend\scrape.bat --site itopya --cat GPU           # Manuel scraping
backend\reset_db.bat --yes                           # DB sıfırlama
```

---

## Proje Yapısı

```
backend/
├── api/core/config.py         # pydantic-settings, .env
├── api/db/mongodb.py          # Motor client, index
├── api/db/repositories/       # product_repo.py, price_repo.py
├── api/routers/               # products, categories, prices, scrape
├── api/models/                # pydantic response modelleri
├── api/main.py
├── scraper/base_scraper.py    # Abstract base, Camoufox, ProactorEventLoop dallanması
├── scraper/itopya_scraper.py      # ✅
├── scraper/incehesap_scraper.py   # ✅
├── scraper/sinerji_scraper.py     # ✅
├── scraper/scraper_manager.py # Paralel koordinasyon + upsert
├── scraper/scheduler.py       # APScheduler haftalık
├── scraper/models.py          # ScrapedProduct, parse_price, normalize_name
├── scrape_cli.py / reset_db.py
└── .env                       # git'e ekleme

frontend/src/
├── app/                       # Next.js 15 App Router
├── components/                # Navbar, ProductCard, ProductFilter, PriceHistoryChart, MiniSparkline
├── hooks/                     # useProducts, usePriceHistory (TanStack Query v5)
└── lib/api.ts                 # axios client
```

---

## API Endpoint'leri

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/health` | Sistem + DB durumu |
| GET | `/api/products` | Ürün listesi (`category`, `site`, `sort`, `page`) |
| GET | `/api/products/search?q=` | Arama |
| GET | `/api/products/{id}` | Ürün detayı |
| POST | `/api/scrape` | Scraping başlat |
| GET | `/api/scrape/status/{job_id}` | Job durumu |
| GET | `/api/prices/{id}/history` | Fiyat geçmişi |
| GET | `/api/prices/{id}/lowest` | En düşük fiyat |
| GET | `/api/categories` | Kategori listesi |

Scraping sadece scheduler (her Pazar 12:00) veya CLI ile tetiklenir.

---

## MongoDB Şeması

- **products:** `normalized_name` (unique index) — ürün eşleştirme; `site_prices[]` embed; `min_price`, `min_price_site`
- **price_history:** `product_id + site + scraped_at` bileşik index; `price_change`, `price_change_pct`

---

## Scraper Referansı

### İtopya
Ürün: `.product-block` | İsim+URL: `a.title` | Fiyat: `.product-price`
Resim: `.product-image img` → önce `data-src`, sonra `src` (lozad lazy-load)
Sayfalama: `?pg=N` | Kategoriler: `_k8` CPU, `_k9` MOBO, `_k11` GPU, `_k10` RAM, `_k20` SSD, `_k16` CASE, `_k17` PSU

### InceHesap
Ürün: `#product-grid a.product` | Tüm veri: `data-product` JSON attr | Fiyat: integer TL
Sonraki sayfa: Nav son link (`.sr-only`="Next"), href `javascript:;` değilse
Sayfalama: `/kategori-adi/sayfa-N/` (~60/sayfa) | Kategoriler: `/islemci-fiyatlari/`, `/ekran-karti-fiyatlari/`, `/anakart-fiyatlari/`, `/ram-fiyatlari/`, `/ssd-harddisk-fiyatlari/`, `/bilgisayar-kasasi-fiyatlari/`, `/power-supply-fiyatlari/`

### Sinerji
Ürün: `article` | İsim: `.title a` | URL: `article a` (göreli) | Resim: `article img[src]` (tam URL, lazy-load yok)
Fiyat: `.price` → "18.599" (nokta=binlik ayracı → `_parse_sinerji_price()` kullan, `parse_price()` değil)
Stok yok: `.alert` elementi varsa, fiyat da yok → atla | Sayfalama: `?px=N`
Sonraki sayfa: `nav[aria-label="Page navigation"]` içinde `<a>Sonraki</a>` varsa devam (son sayfada `span.disabled`)
Kategoriler: `/islemci-c-1` CPU, `/anakart-c-2009` MOBO, `/bellek-ram-c-2010` RAM, `/depolama-c-2146` SSD, `/ekran-karti-c-2023` GPU, `/bilgisayar-kasasi-c-2027` CASE, `/guc-kaynagi-c-2030` PSU

### Gotcha'lar
- `page.close()` her zaman `finally` bloğunda çağır
- Kategoriler arası `asyncio.sleep(3)` gerekli (Firefox subprocess)
- Resim: `data-src` önce dene, `data:` / `.gif` / `blank` içerenleri filtrele

---

## Scraping Otomasyonu

APScheduler 3.x — her Pazar 12:00. `.env`:
`SCHEDULER_ENABLED=true` | `SCHEDULER_CRON_DAY=sun` | `SCHEDULER_CRON_HOUR=12` | `SCHEDULER_CRON_MINUTE=0`

```bash
python scrape_cli.py                          # Tümü
python scrape_cli.py --site itopya --cat GPU
python scrape_cli.py --cat GPU --cat CPU
```

---

## Frontend Notları

- TanStack Query v5: `cacheTime` → `gcTime`
- `useSearchParams()` Suspense ile sarılmalı (App Router build hatası)
- `/api/categories` sadece ürünü olanları döndürür — `KNOWN_CATEGORIES` ile merge et
- Native `<select>` koyu temada solid renk kullan, `bg-white/5` değil (Windows dropdown beyaz olur)
- `npm audit fix --force` **ÇALIŞTIRMA** — ESLint downgrade eder. Açıklar için `package.json` overrides: `{ "minimatch": "^10.2.1" }` (`ajv` nested resolution ile çözülüyor, override'a gerek yok)
- Fontlar: Google Fonts kaldırıldı; `globals.css`'te `--font-inter: "Segoe UI"`, `--font-jetbrains: "Consolas"` CSS vars ile tanımlı
- `npm run build` — TypeScript hatası kontrolü için en hızlı yol (~30s)
- MiniSparkline: aynı günde yapılan birden fazla scraping tek nokta sayılır; trend çizgisi için farklı günlerde en az 2 scraping gerekiyor
- Tema: Minimal Dark — `#09090b` arka plan, `#3b82f6` mavi accent

---

## Kalan Görevler

- [x] Sinerji scraper
- [ ] specs boş — detay sayfası scraping (opsiyonel)
- [ ] Ürün eşleştirme (`normalized_name`) gerçek verilerle doğrulama
- [x] Fiyat geçmişi grafiği gerçek verilerle test (PriceHistoryChart + MiniSparkline çalışıyor)
