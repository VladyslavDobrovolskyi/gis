<p align="center">
   <img src="https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js&logoColor=white" alt="Vue3"/>
   <img src="https://img.shields.io/badge/Leaflet-1.9.x-199900?logo=leaflet&logoColor=white" alt="Leaflet"/>
   <img src="https://img.shields.io/badge/Geoman-2.x-ffb300?logo=geoman&logoColor=white" alt="Geoman"/>
   <img src="https://img.shields.io/badge/Turf.js-6.x-06d6a0" alt="Turf.js"/>
   <img src="https://img.shields.io/badge/tRPC-10.x-2596be?logo=trpc&logoColor=white" alt="tRPC"/>
   <img src="https://img.shields.io/badge/Zod-3.x-8e44ad?logo=zod&logoColor=white" alt="Zod"/>
   <img src="https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white" alt="Node.js"/>
   <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white" alt="PostgreSQL"/>
   <img src="https://img.shields.io/badge/PostGIS-3.4-008bb9?logo=postgis&logoColor=white" alt="PostGIS"/>
   <img src="https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white" alt="Docker Compose"/>
   <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white" alt="TypeScript"/>
   <img src="https://img.shields.io/badge/Playwright-1.x-45ba63?logo=playwright&logoColor=white" alt="Playwright"/>
</p>

# 🗺️ GEOGIS

## 🏗️ Architecture Overview

- **Frontend**: Vue 3, Leaflet, Geoman, TypeScript
- **Backend**: Node.js (Express), tRPC, Zod
- **Database**: PostgreSQL + PostGIS
- **Infrastructure**: Docker Compose, GitHub Actions

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start development (all apps)
pnpm run dev

# 3. Run tests
pnpm run test
```

---

## 🚦 Core Workflows

1. **Map initialization & data fetch**
   - Leaflet is mounted, data is fetched via tRPC client.
   - Examples: `trpc.cities.getCities.query()`, `trpc.regions.getRegions.query()`
   - Server: routers in `backend/src/routers/`, SQL queries via pgtyped.

2. **User drawing lifecycle (Geoman → persistence)**
   - Geoman events handled in `frontend/src/composables/useGeomanEvents.ts`
   - User layer persistence: `frontend/src/composables/usePersistDrawn.ts`

3. **Data import & seeding**
   - Script: `scripts/import-gis-data.cjs` (uses ogr2ogr)
   - Seed files: `database/__init__/*.geojson`
   - Command: `pnpm run database:seed`

4. **Error handling**
   - Zod validation, error handling in routers.

---

## 🧑‍💻 Quick Developer Links

- **Frontend**: `frontend/src/App.vue`, `frontend/src/trpc.ts`, `frontend/src/composables/`
- **Backend**: `backend/src/_router.ts`, `backend/src/routers/`, `backend/db/`
- **Tests**: `pnpm test` (unit), `pnpm e2e:headless` (E2E)
- **CI/CD**: `.github/workflows/`

---

## 📝 Commit Convention

- Format: `@<scope>/<type>: <short description> [@e2e/@e2ef]`
- Example: `@backend/feat: Add bounding-box filter`
- Hook script: `scripts/commit-msg.js`
- **Scopes**: `@backend`, `@frontend`, `@shared`, `@e2e`, `@global`
- **Types**: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `build`, `ci`, `revert`

---

## 🛠️ Local Development Checklist

1. Install dependencies: `pnpm install`
2. Lint: `pnpm format:fix` and `pnpm lint`
3. Typecheck:
   - Frontend: `pnpm frontend:typecheck`
   - Backend: `pnpm backend:typecheck`
4. Tests:
   - Unit: `pnpm test`
   - E2E: `pnpm e2e:headless` (if UI logic changed)

---

## 🗄️ Database Management

- SQL definitions: `backend/db/sql/`
- Recreate and seed DB:
  ```bash
  pnpm run database:recreate && pnpm run database:seed
  ```

---

## 🚀 CI/CD & Deployment

- **CI**: GitHub Actions, conditional stages by path and commit flags (`[E2E]`, `[E2EF]`)
- **Tests**: backend, frontend, e2e (Playwright)
- **Allure reports**: aggregated and deployed to server
- **Docker**: build & push images, deploy via docker-compose on server
- **Secrets**: all keys and tokens stored in GitHub Secrets

---

## 🌍 Spatial Data Import

- Uses `ogr2ogr` (GDAL) via `scripts/import-gis-data.cjs`
- All geometries — WGS 84 (SRID 4326)
- Main tables: `countries`, `regions`, `cities`

---

## 🤝 Contributing

We welcome contributions! Please follow our commit convention and code style:

- Conventional commits: `@<scope>/<type>: <short description> [@e2e/@e2ef]`
- Example: `@frontend/feat: Add new map layer`
- Run lint, typecheck, and tests before submitting a PR.

---

## 📚 Documentation

See [docs/raw/EN.typ](docs/raw/EN.typ) for detailed technical documentation, architecture diagrams, and CI/CD instructions.

---

<p align="center">
   <b>Created by Vladyslav Dobrovolskyi · Geogis · 2026</b>
</p>

---
