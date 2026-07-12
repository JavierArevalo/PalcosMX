# Palcos — Project Handoff (for Javier + his AI assistant)

> Audience: a developer (or AI coding assistant) picking this project up cold.
> Everything you need to run it, understand it, and continue the work is here.
> Last updated: 2026-07-12, on branch `feature/react-frontend`.

---

## 1. What Palcos is

"Airbnb for stadium private boxes" — a marketplace where **owners** list
their stadium suites for specific event dates and **renters** request, pay
for (simulated), and attend them. Built from the spec in
`docs/Palcos Technical Roadmap.pdf`.

Core loop: owner publishes a listing (box + date + price) → renter sends a
request with a note → owner accepts (competing requests for that date are
auto-rejected) → renter pays (deposit ≥ price; platform keeps 15%) → renter
gets access instructions → post-visit survey.

## 2. Architecture

| Layer | Tech | Where |
|---|---|---|
| Backend API | Flask + SQLAlchemy, session-cookie auth | `app.py`, `auth.py`, `booking_engine.py`, `models.py`, `db.py` |
| Database | SQLite (`palcos.db`, auto-created + demo-seeded; **no migrations** — delete the file to reset) | repo root |
| Frontend | React 19 + TypeScript + Tailwind 4 + Vite SPA, Spanish UI, "Cinematic Dark Luxury" theme (gold on near-black, Cormorant Garamond + Outfit) | `frontend/` |
| Python deps | [uv](https://docs.astral.sh/uv/) (`uv sync`) | `pyproject.toml` |
| JS deps | npm | `frontend/package.json` |

**Key backend invariant — unit of work:** engine/auth methods only
`flush()`, never commit. The HTTP layer commits on success and rolls back on
error (`after_request` in `app.py`). The demo seed runs as ONE transaction.
Keep it this way: if you add an engine method, do not call
`db_session.commit()` inside it.

**Frontend/backend contract:** the SPA talks to `/api/*` with same-origin
session cookies. In dev, Vite (port 3000) proxies `/api` to Flask (5050).
In prod, Flask serves the built SPA from `frontend/dist` via a catch-all
route (Flask's built-in static handling is disabled on purpose — it
shadowed deep links like `/explorar`).

## 3. How to run it

Prereqs: [uv](https://docs.astral.sh/uv/) and Node.js 20+ with npm.

**Option A — production-style (one server):**
```powershell
cd frontend; npm install; npm run build; cd ..
uv sync
uv run python app.py
# open http://localhost:5050
```

**Option B — frontend development (hot reload, two terminals):**
```powershell
# terminal 1
uv run python app.py

# terminal 2
cd frontend
npm run dev
# open http://localhost:3000
```

**Demo accounts** (pre-confirmed owners, seeded on first run):
`sofia@example.com` / `ricardo@example.com` / `mariana@example.com`,
password `pw`. Renter accounts: sign up in the UI — the email confirmation
is simulated and the 6-digit code is shown on screen (and in the server
log).

**Reset the database:** stop the server, delete `palcos.db`, start again.
⚠️ Windows gotcha: Flask's debug reloader spawns a child process that can
survive killing the parent and keeps `palcos.db` locked — kill all
`python.exe` processes running `app.py` before deleting the file.

**Type-check the frontend:** `cd frontend && npx tsc --noEmit` (run it from
`frontend/`, not the repo root).

## 4. Repo state (as of this handoff)

- `main` on GitHub (`JavierArevalo/PalcosMX`) has: uv migration, SQLite
  persistence, auth/onboarding (roadmap Screens 1–3) on the OLD vanilla
  frontend, unit-of-work transactions, in-page dialogs. PRs #1 and #2 are
  merged.
- Branch **`feature/react-frontend`** (local on Mauricio's machine at the
  time of writing; 8 commits) contains the FULL frontend rewrite: the old
  `templates/` + `static/` vanilla UI is deleted and replaced by the React
  SPA. It needs to be pushed and PR'd into `main`.
- The design source demos live in Mauricio's
  `Downloads\palcos_manus_version` (foundation: typography, OKLch tokens,
  landing sections) and `Downloads\palcos_base44_version` (stolen touches:
  testimonial carousel, gold scrollbar, hero particles, owner money-stats
  copy). They are reference-only; nothing imports from them.

### Frontend map (`frontend/src/`)

- `App.tsx` — wouter routes: `/` landing · `/explorar` catalog ·
  `/acceso` login/signup · `/confirmar` OTP · `/preferencias` renter
  onboarding · `/mis-reservas` renter dashboard · `/mis-palcos` owner
  dashboard. Role guards via `components/auth/RequireAuth.tsx`.
- `contexts/AuthContext.tsx` — mirrors `GET /api/auth/me` via TanStack
  Query; exposes login/signup/confirm/resend/logout; holds the demo
  confirmation code.
- `lib/api.ts` — fetch wrapper + all API types. 403s with
  `needs_confirmation` trigger a central toast with a "Confirmar" action.
- `components/listings/` — shared `ListingCard` (used by landing +
  explore), filters, request dialog. `components/owner/`,
  `components/renter/` — dashboard pieces. `components/ui/` — 19 shadcn
  components (don't add more unless used).
- The owner dashboard reads incoming requests from the
  `requested_dates`/`booking_history` embedded in `GET /api/my/boxes` —
  no separate requests endpoint needed.

### API quick reference

Auth: `POST /api/auth/signup|confirm|resend-code|login|logout`,
`GET /api/auth/me`. Feeds: `GET /api/feed/available|best-deals|suggest|
by-location|by-stadium/<id>?sort_by=price|capacity`. Owner:
`GET|POST /api/my/boxes`, `POST /api/boxes/<id>/listings`,
`DELETE /api/boxes/<id>/listings/<date>`. Lifecycle:
`POST /api/requests` → `POST /api/requests/<id>/accept|reject|payment` →
`GET /api/requests/<id>/instructions` → `POST /api/requests/<id>/survey`.
`GET /api/my/requests`, `PUT /api/my/preferences`. Errors are
`{"error": "..."}`; confirmation-gated 403s add `"needs_confirmation": true`.

## 5. Project conventions (please keep)

1. **Branch before the first edit** — never work directly on `main`
   (`git checkout -b feature/...`).
2. **No AI attribution in commits or PRs** — no `Co-Authored-By: Claude`
   trailers, no "Generated with…" footers. This is an explicit owner rule.
3. **Spanish UI copy** throughout the frontend.
4. **Unit of work** — engine/auth methods flush, never commit (see §2).
5. **No native `prompt()`/`alert()`** — they're unsupported in IDE preview
   webviews and blockable in browsers. Use the shadcn `<Dialog>` and
   sonner toasts already in place.
6. Match the existing visual language: OKLch gold/black tokens, Cormorant
   Garamond for display text, Outfit for UI text (see
   `frontend/src/index.css`).

## 6. How to verify changes (manual E2E script)

With a fresh DB: (1) guest sees real listings on `/` and `/explorar`;
(2) owner signup → OTP confirm → register box → publish a future date →
appears in `/explorar` → delete works; (3) renter signup (social handle
required) → confirm → preferences → request a suite with a note;
(4) owner sees it under Solicitudes with the renter's name/history →
Aceptar; (5) renter pays (Pagada) → Ver instrucciones (Completada) →
survey; (6) also test Rechazar with a reason, duplicate-email signup
(409), and an unconfirmed account hitting the request gate (toast +
banner). Prod-mode: after `npm run build`, hard-refresh deep links on
:5050 and confirm `/api/stadiums` still returns JSON.

## 7. Recommended next steps (in priority order)

1. **Push `feature/react-frontend` and PR it into `main`** — everything
   else builds on it.
2. **Compress the images** in `frontend/public/images/` — they came from
   the demo CDN at 5–7 MB each; the hero alone kills first paint. Target
   ≤300 KB each (WebP). Biggest single win available.
3. **Code-split the bundle** — 485 kB minified. Lazy-load the dashboard
   routes (`React.lazy`) and consider `manualChunks` for framer-motion.
4. **Translate the seed data** (`seed()` in `app.py`) — stadium/event
   descriptions are English inside a Spanish UI.
5. **Use `preferred_teams` in suggest scoring** — collected in
   onboarding, ignored by `booking_engine.suggest_stadium()`.
6. **Secure `POST /api/stadiums`** — currently unauthenticated (needs an
   admin concept, or restrict to owners).
7. **Map view + real geo distance** — stadiums have lat/lng columns
   (all 0.0); `filter_by_location()` is a city-string placeholder.
   Roadmap Screen 4 wants a map tab.
8. **Alembic migrations** — replace the delete-`palcos.db` workflow
   before the schema matters (then Postgres for production).
9. **Real payments** — `process_payment()` is the Stripe integration
   point; escrow is currently held forever (never released on
   completion).

## 8. Known quirks

- `npx tsc --noEmit` must run from `frontend/` — from the repo root, npx
  downloads a broken `tsc` package.
- Git warns `LF will be replaced by CRLF` on Windows commits — harmless.
- `frontend/dist/` and `frontend/node_modules/` are gitignored; a fresh
  clone must `npm install && npm run build` before Flask can serve the UI
  (Flask returns a friendly 503 telling you this).
- The seeded demo data can be mutated by manual testing (accepted
  requests auto-reject competitors; owners can delete listings). Deleting
  `palcos.db` restores the pristine seed.
