# Repository Guidelines

## Project Structure & Module Organization
This repo is a two-part monorepo:
- `backend/`: FastAPI API + scraping engine.
  - `api/` contains routers, models, config, and MongoDB repositories.
  - `scraper/` contains site-specific scrapers, scheduler, and normalization logic.
  - Entry scripts: `start.bat`, `scrape.bat`, `reset_db.bat`.
- `frontend/`: Next.js App Router client.
  - `src/app/` for pages/layout/global styles.
  - `src/components/` split by domain: `layout/`, `products/`, `charts/`, `home/`.
  - `src/hooks/`, `src/lib/`, `src/types/` for data access and shared typing.

## Build, Test, and Development Commands
- Backend install: `pip install -r backend/requirements.txt`
- Run backend (port `8300`): `backend\start.bat`
- Trigger scraper manually: `backend\scrape.bat --site itopya --cat GPU`
- Reset database: `backend\reset_db.bat --yes`
- Frontend install: `cd frontend && npm install`
- Frontend dev: `cd frontend && npm run dev`
- Frontend lint: `cd frontend && npm run lint`
- Type check: `cd frontend && npx tsc --noEmit`
- Backend tests: `python -m pytest backend`

## Coding Style & Naming Conventions
- TypeScript is strict (`frontend/tsconfig.json`); use explicit types and `@/*` imports.
- ESLint uses Next.js core-web-vitals + TypeScript (`frontend/eslint.config.mjs`).
- Python follows PEP 8 (4 spaces, `snake_case`, `PascalCase` classes).
- Naming: components in `PascalCase.tsx`, hooks as `useX.ts`, repository files as `*_repo.py`.

## UI/UX Conventions (Frontend)
- Keep all user-facing text in Turkish and use proper Turkish diacritics.
- Preserve the current monochrome design language defined in `src/app/globals.css`.
- New sections should be responsive-first and match existing motion patterns (`animate-rise`, `animate-card-reveal`).

## Testing Guidelines
- Add backend tests under `backend/tests/` as `test_*.py`.
- For frontend work, run lint + type-check and include manual verification notes (desktop + mobile).

## Commit & Pull Request Guidelines
- Use short imperative commit subjects (`Add ...`, `Fix ...`, `Update ...`).
- Keep commits scoped to one concern.
- PRs should include summary, linked issue (if any), commands run, and screenshots for UI changes in `frontend/src/app/*` or `frontend/src/components/*`.
