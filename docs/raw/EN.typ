/* ==========================================
   DOCUMENT SETUP & STYLING
   ========================================== */

#set page(
  paper: "a4",
  margin: (x: 2.5cm, y: 2.5cm),
  numbering: "1 / 1",
  header: context {
    if counter(page).get().first() > 1 [
      #align(right, text(8pt, fill: rgb("#666666"))[
        GEOGIS Technical Documentation — January 2026
      ])
      #v(-8pt)
      #line(length: 100%, stroke: 0.5pt + rgb("#e0e0e0"))
    ]
  }
)

#set text(
  font: ("Arial"),
  size: 11pt,
  fill: rgb("#333333"),
  lang: "en"
)

#set par(justify: true, leading: 0.65em)

// --- Color Palette ---
#let color-primary = rgb("#0f4c81") // Classic Blue
#let color-accent  = rgb("#2c3e50")
#let color-code-bg = rgb("#f4f6f8")
#let color-border  = rgb("#e1e4e8")

// --- Headings ---
#show heading.where(level: 1): it => block(width: 100%, below: 1.2em, above: 2em)[
  #set text(fill: color-primary, size: 1.6em, weight: "bold")
  #it
  #v(0.3em)
  #line(length: 100%, stroke: 1pt + color-primary)
]

#show heading.where(level: 2): it => block(width: 100%, below: 0.8em, above: 1.5em)[
  #set text(fill: color-accent, size: 1.2em, weight: "semibold")
  #it
]

#show heading.where(level: 3): it => block(below: 0.6em, above: 1.2em)[
  #set text(fill: color-accent, size: 1.1em, weight: "medium")
  #it
]

// --- Code Blocks ---
#show raw.where(block: false): box.with(
  fill: color-code-bg,
  inset: (x: 3pt, y: 0pt),
  outset: (y: 3pt),
  radius: 2pt
)

#show raw.where(block: true): it => block(
  fill: rgb("#1e293b"), // Slate dark
  inset: 14pt,
  radius: 6pt,
  width: 100%,
  text(font: "Courier New", size: 9pt, fill: rgb("#e2e8f0"))[
    #it
  ]
)

// --- Utility: Info Box ---
#let info-box(title, body) = block(
  fill: rgb("#f0f9ff"),
  stroke: (left: 3pt + color-primary),
  inset: 12pt,
  width: 100%,
  radius: (top-right: 4pt, bottom-right: 4pt)
)[
  #text(weight: "bold", fill: color-primary)[#title] \
  #body
]

// ==========================================
// TITLE PAGE
// ==========================================

#align(center + horizon)[
  #rect(width: 120pt, height: 60pt, radius: 10pt, fill: color-primary)[
    #align(center + horizon, text(size: 24pt, fill: white, weight: "bold")[GEOGIS])
  ]
  #v(1em)

  #text(size: 32pt, weight: "bold", fill: color-primary)[Technical Documentation]
  #v(0.5em)
  #text(size: 16pt, fill: gray)[Architecture, Development, and Operations Manual]

  #v(4em)

  #grid(
    columns: (auto, auto),
    gutter: 2em,
    align: left,
    [
      *Version:* \
      *Date:* \
      *Status:*
    ],
    [
      1.0.0 \
      January 2026 \
      Approved
    ]
  )
]

#pagebreak()

// ==========================================
// TABLE OF CONTENTS
// ==========================================

#show outline.entry.where(level: 1): it => {
  v(12pt, weak: true)
  strong(it)
}

#outline(
  title: "Table of Contents",
  indent: auto,
  depth: 3
)

#pagebreak()

// ==========================================
// CONTENT
// ==========================================

= 1. Architecture Overview

This section outlines the high-level structure of the GIS application, detailing the interaction between the frontend visualization layer and the spatial data backend.

== 1.1 Technology Stack

#table(
  columns: (1fr, 3fr),
  stroke: 0.5pt + color-border,
  inset: 10pt,
  table.header(
    [*Layer*], [*Technologies*]
  ),
  [#text(weight: "bold")[Frontend]], [Vue 3, Leaflet, Geoman, Turf, tRPC (client), TypeScript],
  [#text(weight: "bold")[Backend]], [Node.js (Express), tRPC (server), Zod, SQL (pg, pgtyped)],
  [#text(weight: "bold")[Database]], [PostgreSQL 16, PostGIS 3.4],
  [#text(weight: "bold")[Infra]], [Docker Compose, GitHub Actions (CI/CD), Nginx]
)

== 1.2 Logical Data Flow

The application follows a standard three-tier architecture tailored for geospatial data.

#figure(
  caption: [System Interaction Diagram],
  block(
    fill: white,
    inset: 20pt,
    stroke: 0.5pt + color-border,
    radius: 4pt,
    grid(
      columns: (1fr, auto, 1fr, auto, 1fr),
      align: center + horizon,

      // Node 1
      rect(width: 100%, inset: 12pt, radius: 4pt, stroke: 1pt + color-primary)[
        *Client Browser* \
        #text(size: 8pt, gray)[Leaflet UI + tRPC (client)]
      ],

      text(size: 16pt, fill: color-primary)[$arrow.r.double$],

      // Node 2
      rect(width: 100%, inset: 12pt, radius: 4pt, stroke: 1pt + color-primary)[
        *API Gateway* \
        #text(size: 8pt, gray)[Express + tRPC (server)]
      ],

      text(size: 16pt, fill: color-primary)[$arrow.r.double$],

      // Node 3
      rect(width: 100%, inset: 12pt, radius: 4pt, stroke: 1pt + color-primary)[
        *Database* \
        #text(size: 8pt, gray)[PostgreSQL, PostGIS]
      ]
    )
  )
)

=== Core Workflows (detailed)

Below are the main runtime flows with direct references to the repository files that implement each step. These details will help you quickly locate the code to change or debug.

#figure(
  caption: [Architecture: Leaflet → tRPC → Express (pg) → PostGIS],
  block(
    width: 100%,
    inset: 12pt,
    stroke: 0.5pt + color-border,
    radius: 4pt,
    grid(
      // Используем 1fr для ВСЕХ блоков. Это гарантирует равную ширину.
      columns: (1fr, auto, 1fr, auto, 1fr, auto, 1fr),
      align: center + horizon,
      column-gutter: 3pt,

      // 1. Browser
      rect(width: 100%, inset: 8pt, stroke: 1pt + color-primary, radius: 4pt)[
        #set text(hyphenate: false)
        *Browser (UI)* \
        #text(size: 7.5pt, gray)[Leaflet Map \ `frontend/src/App.vue`]
      ],

      text(size: 12pt, fill: color-primary)[$arrow.r$],

      // 2. tRPC Client
      rect(width: 100%, inset: 8pt, stroke: 1pt + color-primary, radius: 4pt)[
        #set text(hyphenate: false)
        *Client (API)* \
        #text(size: 7.5pt, gray)[tRPC Client \ `frontend/src/trpc.ts`]
      ],

      text(size: 14pt, fill: color-primary)[$arrow.r.double$],

      // 3. Express
      rect(width: 100%, inset: 8pt, stroke: 1pt + color-primary, radius: 4pt)[
        #set text(hyphenate: false)
        *Server* \
        #text(size: 7.5pt, gray)[tRPC Router \ `backend/src/_router.ts`]
      ],

      text(size: 12pt, fill: color-primary)[$arrow.r$],

      // 4. Database — теперь он будет широким и красивым
      rect(width: 100%, inset: 8pt, stroke: 1pt + color-primary, radius: 4pt)[
        #set text(hyphenate: false)
        *Database* \
        #text(size: 7.5pt, gray)[PostgreSQL + PostGIS \ `backend/db/runner.ts`]
      ]
    )
  )
)

1.  Map initialization & data fetch (frontend → backend → database)
    - The frontend mounts Leaflet and triggers data fetches during setup (see `frontend/src/App.vue`).
    - Data requests use the typed tRPC client in `frontend/src/trpc.ts`:
      - Example calls in code: `trpc.cities.getCities.query()`, `trpc.regions.getRegions.query()`.
    - On the backend, routers are aggregated in `backend/src/_router.ts` and implemented in `backend/src/routers/*.router.ts` (e.g., `cities.router.ts`).
    - Routers use pgtyped-generated prepared queries (`backend/db/generated/*`) and run via `runQuery`/`runOne` in `backend/db/runner.ts`.
    - Geometries are converted to GeoJSON using SQL helpers such as `ST_AsGeoJSON(geom)` in the SQL files under `backend/db/sql/*.sql` and returned to the client.

2.  User drawing lifecycle (Geoman → frontend composables → persistence)

3.  Data import & seeding (GDAL/ogr2ogr → PostGIS)
    - Bulk data is imported by `gis/scripts/import-gis-data.cjs` using `ogr2ogr`. Seed fixtures live at `gis/database/__init__/*.geojson`.
    - Local workflow:
      - Ensure `DATABASE_URL` points to your Postgres + PostGIS instance.
      - Run: `pnpm run database:seed` (this invokes the script).
    - Troubleshooting tips:
      - If `ogr2ogr` is missing, install GDAL (`gdal-bin` on Debian/Ubuntu) or use a Docker image with GDAL installed.
      - Verify SRID (should be 4326) and geometry types (POINT vs MULTIPOLYGON) before import to avoid type mismatches.

4.  Error handling & telemetry
    - Backend errors surfaced to the client are produced by router handlers (throwing exceptions in `backend/src/routers/*`). Ensure Zod schemas validate payloads on both client and server.
5.  Quick code pointers & developer cheat-sheet

- Frontend: key entry points and runtime notes
  - `frontend/src/App.vue` — application bootstrap. Look for `useQuery` calls that fetch `cities`, `regions`, `countries`. The map initialization and readiness checks live here.
  - `frontend/src/trpc.ts` — typed tRPC client using `httpBatchLink`. The client points to `${import.meta.env.VITE_API_URL}/trpc`.
  - `frontend/src/composables/useGeomanEvents.ts` — Geoman event wiring: capture `pm:create`, `pm:edit`, `pm:drawend`, convert to layer logic and measurement helpers.
  - `frontend/src/composables/usePersistDrawn.ts` — persistence helpers:
    - `restoreDrawnFeatures(map)` rehydrates features on startup, marks user layers and re-applies IDs.

- Backend: key modules and database interaction
  - Router aggregation: `backend/src/_router.ts` (exports `appRouter` used by frontend types and OpenAPI generator).
  - API docs & REST generation: an OpenAPI/REST generator creates an OpenAPI spec from `appRouter`, and the backend exposes an interactive Swagger UI at `/docs` (e.g., `https://<host>/docs`).
  - Swagger setup is implemented in `backend/docs/swagger.ts` (uses `trpc-to-openapi` to generate the OpenAPI spec and `swagger-ui-express` to serve it; exports `openApiDocument` and `setupSwagger`); the server mounts it via `setupSwagger(app)` in `backend/src/server.ts`.

#pagebreak()

- Routers: `backend/src/routers/*.router.ts` (e.g., `cities.router.ts`) — each router:
    - uses pgtyped-generated prepared queries from `backend/db/generated/*`
    - runs queries through `runQuery` / `runOne` (`backend/db/runner.ts`)
    - validates outputs with Zod schemas from `packages/shared/schemas`
  - SQL sources & patterns: `backend/db/sql/*.sql` — prefer `ST_AsGeoJSON(geom)` for returning geometry as GeoJSON strings.

- Quick runtime checklist for debugging a map data issue:
  1. Reproduce the fetch in the browser console or via Playwright by calling the same tRPC route (see tests under `backend/tests/` for patterns to create callers).
  2. On the backend, add a temporary `console.log` in the router function (e.g., in `cities.router.ts`) to inspect the SQL result before Zod parsing.
  3. If GeoJSON is malformed, inspect `backend/db/sql/*.sql` for `ST_AsGeoJSON` usage; use `SELECT ST_AsGeoJSON(ST_ForceRHR(geom))` and validate SRID with `ST_SRID(geom)`.

- Small code examples (reference snippets)
  - How to call `getCities` from the frontend (pattern):
  ```
  const { data: cities } = await trpc.cities.getCities.query();
  // `cities` is an array conforming to `CitiesSchema`
  ```
  - Example SQL pattern for `GetAllCities` (see `backend/db/sql/cities.sql` for the canonical file):
  ```
  SELECT ogc_fid, city_name, region_id, ST_AsGeoJSON(geom) AS geom
  FROM cities
  ORDER BY city_name;
  ```

- Where to add a new server-side feature/save endpoint (if you want to persist user drawings):
  - Create `backend/src/routers/features.router.ts`
  - Add methods: `saveFeature` (input: Zod-validated GeoJSON string or parsed object), `getUserFeatures`
  - Wire the router into `backend/src/_router.ts` and add tests under `backend/tests/`


#pagebreak()

= 2. Development Guidelines

This section defines the standards for contributing to the repository, ensuring code quality and consistency.

== 2.1 Commit Convention (detailed)

We enforce a scoped commit header pattern with a `commit-msg` hook. The hook lives at `gis/scripts/commit-msg.js` and rewrites or rejects messages that don't follow the required format.

#info-box("Format Pattern", [
  `@<scope>/<type>: <short description> [optional flags like @e2e or @e2ef]`
])

*Where to look:*
- Hook implementation: `gis/scripts/commit-msg.js` — it parses the original message, extracts `@scope` and `type`, validates the allowed types, removes E2E flags from the body and appends a canonical `[E2E]` or `[E2EF]` suffix when present.

*Examples (valid):*
- `@backend/feat: Add bounding-box filter`
- `@frontend/fix: Fix map tooltip alignment @e2e`
- `@shared/refactor: Improve geo helpers`

*Examples (hook output):*
- Input: `@backend feat add bounding box` → Hook rewrites to: `@backend/feat: Add bounding-box filter`
- Input with flag: `@frontend/fix: layout fix @e2ef` → Hook rewrites to: `@frontend/fix: Layout fix [E2EF]`

#text(weight: "bold")[Allowed types (as implemented in `commit-msg.js`):]
- `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `build`, `ci`, `revert`

#text(weight: "bold")[Allowed scopes (convention used in repository):]
- `@backend`, `@frontend`, `@shared`, `@e2e`, `@global`

*Why this matters:*
- The hook's normalization enables conditional CI steps (for example, only running the heavier E2E stage when commits indicate UI changes with `@e2e`). It also keeps changelogs and release notes machine-friendly.

*If the hook rejects your commit:*
- Fix the message locally or run `git commit --no-verify` temporarily (not recommended) and correct the message before pushing.

#pagebreak()

== 2.2 Local Development Checklist

Before pushing code, ensure the following steps are completed:

1.  #text(weight: "bold")[Dependencies:] Ensure strict consistency using `pnpm install`.
2.  #text(weight: "bold")[Linting:] Run `pnpm format:fix` and `pnpm lint`.
3.  #text(weight: "bold")[Type Safety:]
    - Frontend: `pnpm frontend:typecheck`
    - Backend: `pnpm backend:typecheck`
4.  #text(weight: "bold")[Testing:]
    - Unit: `pnpm test`
    - E2E: `pnpm e2e:headless` (if UI logic was changed)

== 2.3 Database Management

When modifying the schema, updated SQL definitions must be placed in `backend/db/sql`.

*Rebuilding the local database:*
```bash
# Drops the current database, recreates schemas, and runs the seed script
pnpm run database:recreate && pnpm run database:seed
```

#pagebreak()

= 3. CI/CD & Testing

This project uses a staged GitHub Actions pipeline with conditional runs, artifact collection and an optional E2E stage that is triggered by commit flags or path filters. The diagram and the detailed description below map the workflow implementation to the repository workflows (`.github/workflows/development.yaml` and `production.yaml`).

== 3.1 Pipeline Overview

Main stages:
- *pre-check*: detect changed paths, compute build id, and detect E2E flags in the commit message.
- *test-backend*: bring up a PostGIS container, seed data and run backend tests (runs when backend-related paths changed or E2E-forced).
- *test-frontend*: run frontend unit tests (runs when frontend-related paths changed).
- *e2e-tests*: run Playwright E2E when pre-check signals E2E and prior jobs succeeded (or when forced).
- *allure-report*: download test artifacts and produce an aggregated Allure report.
- *build*: build and push frontend/backend Docker images.
- *deploy-app*: update remote host APP_TAG and restart docker-compose services.
- *deploy-report*: copy Allure report archive to the remote reports directory and rotate old reports.

These jobs are wired with `needs:` and conditional `if:` expressions that ensure:
- jobs only run when relevant files changed (dorny/paths-filter);
- E2E runs are controlled by commit flags `[E2E]` and `[E2EF]` (the latter forces E2E even if no paths changed);
- artifacts are uploaded on both success and failure for diagnostics.


== 3.2 CI Diagram (Visual)

#figure(
  caption: [CI Job Graph — conditional flows, artifacts, secrets],
  block(
    inset: 10pt,
    stroke: 0.5pt + color-border,
    radius: 6pt,
    grid(
      columns: (2fr, 20pt, 2fr, 20pt, 2fr, 20pt, 2fr),
      align: center + horizon,

      // Column 1: pre-check
      rect(inset: 8pt, stroke: 1pt + color-primary, radius: 4pt)[
        #text(weight: "bold")[pre-check] \
        #text(size: 9pt, gray)[path-filter, build_id, e2e flags]
      ],

      text(size: 18pt, gray)[#sym.arrow.r],

      // Column 2: test jobs
      rect(inset: 8pt, stroke: 1pt + color-primary, radius: 4pt)[
        #text(weight: "bold")[test-backend] \
        #text(size: 9pt, gray)[docker db, gdal, seed, backend:test] \
        #text(size: 8pt, fill: blue)[uploads: allure-backend]
      ],

      text(size: 18pt, gray)[#sym.arrow.r],

      rect(inset: 8pt, stroke: 1pt + color-primary, radius: 4pt)[
        #text(weight: "bold")[test-frontend] \
        #text(size: 9pt, gray)[pnpm frontend:test] \
        #text(size: 8pt, fill: blue)[uploads: allure-frontend]
      ],

      text(size: 18pt, gray)[#sym.arrow.r],

      rect(inset: 8pt, stroke: 1pt + color-primary, radius: 4pt)[
        #text(weight: "bold")[e2e-tests] \
        #text(size: 9pt, gray)[install-browsers, pnpm e2e:headless] \
        #text(size: 8pt, fill: blue)[uploads: allure-e2e]
      ],
    )
  )
)

== 3.3 Job Dependencies & Conditions

*pre-check*
- Checks out code and runs `dorny/paths-filter` to detect whether `frontend` or `backend` paths changed.
- Produces outputs used by downstream jobs:
  - `backend_changed`, `frontend_changed`
  - `run_e2e` (true when commit message contains `[E2E]`)
  - `run_e2e_forced` (true when commit message contains `[E2EF]`)
  - `build_id` (a human-readable tag used for images and reports)

*test-backend*
- Trigger condition: `backend_changed == 'true' || run_e2e_forced == 'true'`
- Key steps:
  - Install pnpm/node, build shared packages
  - Start a PostGIS container via `docker compose up -d database`
  - Wait for database readiness (`pg_isready`)
  - Install GDAL (`gdal-bin`) (required by `scripts/import-gis-data.cjs`)
  - Seed database: `pnpm run database:seed` with `DATABASE_URL` pointing to local container
  - Run backend tests `pnpm backend:test` using the seeded database
- Artifacts:
  - uploads `backend/allure-results` via `actions/upload-artifact` under name `allure-backend`


*test-frontend*
- Trigger condition: `frontend_changed == 'true'`
- Runs `pnpm frontend:test` and uploads `frontend/allure-results` as `allure-frontend`

*e2e-tests*
- Trigger condition (development.yaml):
  - Run when `run_e2e_forced == 'true'`, or when `run_e2e == 'true'` and both `test-backend` and `test-frontend` passed (not failed)
- Key steps:
  - Install Playwright browsers: `pnpm e2e:install-browsers`
  - Run `pnpm e2e:headless`
- Artifacts:
  - uploads `e2e/allure-results` as `allure-e2e`
- Notes:
  - The job is gated to ensure unit tests have passed to avoid running expensive E2E on broken code.
  - The flag `[E2EF]` forces E2E even when path filters would otherwise skip them.

*allure-report*
- Always runs (depends on test jobs) to aggregate artifacts
- Steps:
  - Download artifacts (`allure-backend`, `allure-frontend`, `allure-e2e`) via `actions/download-artifact`
  - Run `pnpm run allure:report` producing `allure-report`
  - Archive the report and upload `final-report-archive`
*build*
- Runs when prior test stages succeed or are skipped in accordance with `if:` condition
- Uses Docker Buildx to build and push:
  - frontend image tags: `*:frontend-${build_id}` and `*:frontend_development|production`
  - backend image tags: `*:backend-${build_id}` and `*:backend_development|production`
- Uses GitHub Actions cache for build layers (`cache-from`, `cache-to`) for faster rebuilds
- Build args include: `VITE_API_URL VITE_FOOTER_LABEL VITE_INTERNAL_EXPOSE`
_`VITE_INTERNAL_EXPOSE - expose internal objects to the browser.window `_

*deploy-app / deploy-report*
- deploy-report copies the Allure report archive to a remote server using SCP and SSH (uses `appleboy/scp-action` and `appleboy/ssh-action`)
- deploy-app updates the `.env` on the remote host to set `APP_TAG`, pulls the needed images and restarts the docker-compose services
- Both jobs require secrets:
  - `secrets.SERVER_HOST`, `secrets.DEPLOYER_USERNAME`, `secrets.DEPLOYER_SSH`
  - `secrets.DOCKERHUB_USERNAME`, `secrets.DOCKERHUB_TOKEN` (for build/push)
  - CI also reads repo-level variables (`vars.ENV_TAG`, `vars.DEPLOYER_PATH`, `vars.DEPLOY_TARGETS`) for paths and targets

== 3.4 Artifacts, Caching & Secrets

Artifacts
- Each test job uploads Allure result folders. The `allure-report` job downloads them and builds the final report.
- The final report archive (`report.tar.gz`) is uploaded and then copied to the report server.

Caching
- Docker build uses GitHub Actions cache to speed up image rebuilds (`cache-from` and `cache-to` with `type=gha`).
- `pnpm` caching is configured via `actions/setup-node` with `cache: 'pnpm'` and underlying runner caches node modules.

Secrets & secure variables
- Docker hub credentials: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (used by docker/login-action)
- Remote deploy SSH key and host: `DEPLOYER_SSH`, `DEPLOYER_USERNAME`, `SERVER_HOST`
- Database access in CI uses an internal local Postgres (no external database credentials required in the job), but production deploys must ensure secure database credentials are provided on the host.
- Repo-level env vars are used for build naming and runtime configuration (e.g., `VITE_API_URL`, `ENV_TAG`).

#pagebreak();

== 3.5 Continuous Deployment
The pipeline builds and pushes application images to Docker Hub and then deploys those images on the target host using Docker Compose. The flow implemented in the workflows is:

1. Build & Push
   - After tests pass, the `build` job uses `docker/build-push-action` to build frontend and backend images.
   - Images are tagged with:
     - a unique build tag: `<repo>:frontend-${{ needs.pre-check.outputs.build_id }}` and `<repo>:backend-${{ needs.pre-check.outputs.build_id }}`
     - a channel tag: `<repo>:frontend_development` or `<repo>:frontend_production` / `<repo>:backend_development` or `<repo>:backend_production`
   - Build args (for frontend) include `VITE_API_URL`, `VITE_FOOTER_LABEL` (which includes the build id) and `VITE_INTERNAL_EXPOSE`.
   - The build uses GitHub Actions cache to speed up repeated builds (`cache-from` and `cache-to` with `type=gha`).

2. Push to Docker Hub
   - The workflow logs in to Docker Hub using credentials stored in secrets:
     - `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
   - Images are pushed to the configured Docker Hub repository with the tags listed above.
   - Security note: access tokens must be fine-grained and rotated periodically. Prefer robot accounts with minimal permissions for CI pushes.

3. Remote deploy via SSH + Docker Compose
   - The `deploy-app` job SSHes to the target host and updates an `.env` file with the new `APP_TAG` (the `build_id`) so the host's `docker-compose.yml` references the correct image tags.
   - Typical server-side steps performed by the workflow (see `deploy-app` script):
     - Update `.env`: remove any existing `APP_TAG=` line and append `APP_TAG=${{ needs.pre-check.outputs.build_id }}`.
     - Pull images: `docker compose pull $DEPLOY_TARGETS`
     - Restart services: `docker compose up -d $DEPLOY_TARGETS`
     - Cleanup: `docker image prune -f`
   - The workflow uses secrets for SSH access:
     - `SERVER_HOST`, `DEPLOYER_USERNAME`, `DEPLOYER_SSH`
   - The `deploy-report` job (separate) copies the Allure report archive to the report server using SCP/SSH.

4. Rollback procedure
   - Rollback is implemented by setting the previous `APP_TAG` in `.env` and running the same pull + up flow:
     - On the host: edit `.env` to set `APP_TAG=<previous_build_id>`
     - `docker compose pull $DEPLOY_TARGETS`
     - `docker compose up -d $DEPLOY_TARGETS`
     - Optionally: `docker image prune -f`
   - Recommend keeping at least one prior image/golden tag available to ensure immediate rollback.

5. Security & best practices for CD
   - Use least-privilege CI secrets:
     - Docker hub token must only permit pushes to the specific repository.
     - SSH key should be an account with limited privileges on the host (or a specific deploy user).
   - Use image signing and scanning:
     - Integrate an image scanner (e.g., Trivy) in the `build` job to scan built images before pushing.
     - Consider signing images (Cosign) and verifying signature on the host before deploy.
   - Audit & rotation:
     - Rotate Docker and SSH credentials regularly.
     - Log and retain deployment events for auditing (deploy_id, build_id, who triggered).
   - Secret management:
     - Do not store secrets in the repo. Use GitHub Secrets or a secrets manager (Vault, Secrets Manager) and inject at runtime.

#pagebreak()

= 4. Database & Spatial Data

== 4.1 Schema Design

The database utilizes the PostGIS extension. All geometries are stored in WGS 84 (SRID 4326).

Core tables:
- `countries` (MULTIPOLYGON): Countries boundaries.
- `regions` (MULTIPOLYGON): Administrative regions boundaries.
- `cities` (POINT): Point locations for municipalities.

== 4.2 Data Import (GDAL)

We utilize *`ogr2ogr`* for high-performance spatial data imports. This tool is wrapped by the internal script `scripts/import-gis-data.cjs`.


#v(1fr)
#line(length: 100%, stroke: 0.5pt + gray)
#align(center, text(size: 8pt, gray)[End of Documentation · Created by Vladyslav Dobrovolskyi · Geogis · 2026])
