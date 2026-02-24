<div align="right">
  <a href="README.md"><strong>TR</strong></a> &nbsp;|&nbsp; <a href="README.en.md">EN</a>
</div>

# TechPrice

Türk teknoloji satıcılarından bilgisayar parçası fiyatlarını çekip tek bir yerde karşılaştırmalı olarak gösteren bir web uygulaması. Şu an İtopya ve İnceHesap destekleniyor; Sinerji desteği üzerinde çalışılıyor.

---

## Ne Yapıyor?

Her hafta Pazar günü arka planda otomatik olarak İtopya ve İnceHesap'taki CPU, GPU, RAM, SSD, anakart, kasa ve güç kaynağı listelerini tarar. Toplanan veriler MongoDB'ye kaydedilir; her ürün için zaman içindeki fiyat değişimi takip edilir. Frontend'de ürünleri kategoriye, siteye göre filtreleyebilir, fiyat geçmişini grafik üzerinde görebilirsiniz.

Scraper tarafı Camoufox üzerine kurulu — normal Playwright ya da Selenium ile kolayca engellenebilen sitelerde daha sağlıklı çalışıyor.

---

## Teknik Yığın

| Katman | Teknoloji |
|--------|-----------|
| Scraper | Python 3.14 + Camoufox |
| API | FastAPI 0.115, Uvicorn |
| Veritabanı | MongoDB Atlas (Motor async driver) |
| Zamanlayıcı | APScheduler 3.x |
| Frontend | Next.js 15 (App Router), React 19 |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| Veri Yönetimi | TanStack Query v5 |
| Grafikler | Recharts |

---

## Kurulum

### Gereksinimler

- Python 3.14
- Node.js 20+
- MongoDB Atlas hesabı (veya yerel MongoDB)

### Backend

```bash
# Bağımlılıkları kur
pip install -r backend/requirements.txt

# pydantic-core için binary wheel gerekli (Python 3.14)
pip install pydantic pydantic-settings --pre --only-binary :all:
```

`backend/` klasöründe bir `.env` dosyası oluştur:

```env
MONGODB_URL=mongodb+srv://kullanici:sifre@cluster.mongodb.net/
MONGODB_DB_NAME=TechPriceDB
API_PORT=8300
CORS_ORIGINS=["http://localhost:3000"]

SCHEDULER_ENABLED=true
SCHEDULER_CRON_DAY=sun
SCHEDULER_CRON_HOUR=12
SCHEDULER_CRON_MINUTE=0
```

> MongoDB bağlantı şifresinde `@`, `#` gibi özel karakter varsa URL encode etmen gerekiyor:
> ```python
> from urllib.parse import quote_plus
> print(quote_plus("şifreni_buraya_yaz"))
> ```

Backend'i başlatmak için:

```bash
backend\start.bat
```

Ya da doğrudan:

```bash
cd backend && uvicorn api.main:app --host 0.0.0.0 --port 8300 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

---

## Kullanım

### Sağlık Kontrolü

```bash
curl http://localhost:8300/api/health
```

### Manuel Scraping

Zamanlayıcıyı beklemeden elle çalıştırabilirsin:

```bash
# Tümünü çek
backend\scrape.bat

# Sadece belirli site ve kategori
backend\scrape.bat --site itopya --cat GPU
backend\scrape.bat --cat CPU --cat RAM

# CLI üzerinden doğrudan
python backend/scrape_cli.py --site incehesap --cat SSD
```

Desteklenen kategoriler: `CPU`, `GPU`, `RAM`, `SSD`, `MOBO`, `CASE`, `PSU`

### Veritabanını Sıfırlama

```bash
backend\reset_db.bat --yes
```

---

## API

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/health` | Sistem ve veritabanı durumu |
| GET | `/api/products` | Ürün listesi — `category`, `site`, `sort`, `page` parametreleri |
| GET | `/api/products/search?q=` | İsme göre arama |
| GET | `/api/products/{id}` | Tek ürün detayı |
| GET | `/api/categories` | Mevcut kategoriler |
| GET | `/api/prices/{id}/history` | Ürünün fiyat geçmişi |
| GET | `/api/prices/{id}/lowest` | Ürünün şimdiye kadarki en düşük fiyatı |
| POST | `/api/scrape` | Scraping jobı başlat |
| GET | `/api/scrape/status/{job_id}` | Job durumu sorgula |

Swagger dokümantasyonu: `http://localhost:8300/docs`

---

## Proje Yapısı

```
TechPriceRemake/
├── backend/
│   ├── api/
│   │   ├── core/config.py          # Ayarlar (pydantic-settings)
│   │   ├── db/mongodb.py           # Motor bağlantısı, index tanımları
│   │   ├── db/repositories/        # product_repo, price_repo
│   │   ├── routers/                # products, categories, prices, scrape
│   │   ├── models/                 # Pydantic response modelleri
│   │   └── main.py
│   ├── scraper/
│   │   ├── base_scraper.py         # Abstract base, Camoufox yönetimi
│   │   ├── itopya_scraper.py
│   │   ├── incehesap_scraper.py
│   │   ├── scraper_manager.py      # Paralel koordinasyon, DB upsert
│   │   ├── scheduler.py            # APScheduler — her Pazar 12:00
│   │   └── models.py               # ScrapedProduct, fiyat normalizasyonu
│   ├── scrape_cli.py
│   ├── reset_db.py
│   ├── requirements.txt
│   ├── start.bat
│   └── scrape.bat
└── frontend/
    └── src/
        ├── app/                    # Next.js App Router sayfaları
        ├── components/             # Navbar, ProductCard, ProductFilter, PriceHistoryChart
        ├── hooks/                  # useProducts, usePriceHistory
        └── lib/api.ts              # Axios client
```

---

## Notlar

**Port:** Backend 8300 portunda çalışıyor. Windows Hyper-V 7740–8139 aralığını rezerve ettiğinden 8000/8080/8200 gibi yaygın portlar bu ortamda kullanılamıyor.

**Scraping sıklığı:** Scheduler varsayılan olarak haftada bir çalışır. Daha sık veri istiyorsan `.env`'de cron ayarlarını değiştirebilir ya da CLI ile istediğin zaman tetikleyebilirsin.

**Ürün eşleştirme:** Farklı sitelerden gelen aynı ürünler `normalized_name` üzerinden eşleştiriliyor. İsim normalizasyonu `scraper/models.py` içinde yapılıyor — gerçek veriyle test edilmesi gerekebilir.

**`npm audit fix --force` çalıştırma** — ESLint'i downgrade eder, bilerek kaçınıldı.
