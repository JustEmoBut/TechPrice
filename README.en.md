<div align="right">
  <a href="README.md">TR</a> &nbsp;|&nbsp; <a href="README.en.md"><strong>EN</strong></a>
</div>

# TechPrice

A web application that scrapes computer hardware prices from Turkish tech retailers and displays them in one place for easy comparison. Currently supports İtopya and İnceHesap; Sinerji support is in progress.

---

## What It Does

Every Sunday, the app automatically scrapes CPU, GPU, RAM, SSD, motherboard, case, and PSU listings from İtopya and İnceHesap in the background. The collected data is saved to MongoDB, and price changes are tracked over time for each product. On the frontend, you can filter products by category or retailer, and view price history as a chart.

The scraper is built on Camoufox — it handles sites that would easily block standard Playwright or Selenium sessions.

---

## Stack

| Layer | Technology |
|-------|------------|
| Scraper | Python 3.14 + Camoufox |
| API | FastAPI 0.115, Uvicorn |
| Database | MongoDB Atlas (Motor async driver) |
| Scheduler | APScheduler 3.x |
| Frontend | Next.js 15 (App Router), React 19 |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| Data fetching | TanStack Query v5 |
| Charts | Recharts |

---

## Setup

### Requirements

- Python 3.14
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# pydantic-core requires a binary wheel on Python 3.14
pip install pydantic pydantic-settings --pre --only-binary :all:
```

Create a `.env` file inside the `backend/` directory:

```env
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/
MONGODB_DB_NAME=TechPriceDB
API_PORT=8300
CORS_ORIGINS=["http://localhost:3000"]

SCHEDULER_ENABLED=true
SCHEDULER_CRON_DAY=sun
SCHEDULER_CRON_HOUR=12
SCHEDULER_CRON_MINUTE=0
```

> If your MongoDB password contains special characters like `@` or `#`, URL-encode it first:
> ```python
> from urllib.parse import quote_plus
> print(quote_plus("your_password_here"))
> ```

Start the backend:

```bash
backend\start.bat
```

Or directly:

```bash
cd backend && uvicorn api.main:app --host 0.0.0.0 --port 8300 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

---

## Usage

### Health Check

```bash
curl http://localhost:8300/api/health
```

### Manual Scraping

You don't have to wait for the scheduler — run it on demand:

```bash
# Scrape everything
backend\scrape.bat

# Specific site and category
backend\scrape.bat --site itopya --cat GPU
backend\scrape.bat --cat CPU --cat RAM

# Directly via CLI
python backend/scrape_cli.py --site incehesap --cat SSD
```

Supported categories: `CPU`, `GPU`, `RAM`, `SSD`, `MOBO`, `CASE`, `PSU`

### Reset the Database

```bash
backend\reset_db.bat --yes
```

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System and database status |
| GET | `/api/products` | Product list — supports `category`, `site`, `sort`, `page` params |
| GET | `/api/products/search?q=` | Search by name |
| GET | `/api/products/{id}` | Single product detail |
| GET | `/api/categories` | Available categories |
| GET | `/api/prices/{id}/history` | Price history for a product |
| GET | `/api/prices/{id}/lowest` | All-time lowest price for a product |
| POST | `/api/scrape` | Trigger a scraping job |
| GET | `/api/scrape/status/{job_id}` | Check job status |

Swagger docs: `http://localhost:8300/docs`

---

## Project Structure

```
TechPriceRemake/
├── backend/
│   ├── api/
│   │   ├── core/config.py          # Settings (pydantic-settings)
│   │   ├── db/mongodb.py           # Motor connection, index definitions
│   │   ├── db/repositories/        # product_repo, price_repo
│   │   ├── routers/                # products, categories, prices, scrape
│   │   ├── models/                 # Pydantic response models
│   │   └── main.py
│   ├── scraper/
│   │   ├── base_scraper.py         # Abstract base, Camoufox management
│   │   ├── itopya_scraper.py
│   │   ├── incehesap_scraper.py
│   │   ├── scraper_manager.py      # Parallel coordination, DB upsert
│   │   ├── scheduler.py            # APScheduler — every Sunday at 12:00
│   │   └── models.py               # ScrapedProduct, price normalization
│   ├── scrape_cli.py
│   ├── reset_db.py
│   ├── requirements.txt
│   ├── start.bat
│   └── scrape.bat
└── frontend/
    └── src/
        ├── app/                    # Next.js App Router pages
        ├── components/             # Navbar, ProductCard, ProductFilter, PriceHistoryChart
        ├── hooks/                  # useProducts, usePriceHistory
        └── lib/api.ts              # Axios client
```

---

## Notes

**Port:** The backend runs on port 8300. Windows Hyper-V reserves the 7740–8139 range, so common ports like 8000, 8080, and 8200 don't work in this environment.

**Scraping frequency:** The scheduler runs once a week by default. If you need more frequent data, adjust the cron settings in `.env` or just trigger it manually via CLI whenever you need.

**Product matching:** Products from different retailers are matched using `normalized_name`. The normalization logic lives in `scraper/models.py` — it may need tuning once tested against real data.

**Don't run `npm audit fix --force`** — it downgrades ESLint. The open advisories are handled via `overrides` in `package.json` instead.
