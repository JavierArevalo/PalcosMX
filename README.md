# Palcos

A working prototype of the private-box rental marketplace from the technical
roadmap: owners list a suite for a specific game date, renters request it,
the owner accepts or declines, payment (simulated) moves the booking to
confirmed, and both sides get instructions / a post-visit survey.

Accounts, boxes, listings and bookings persist to Postgres (Neon), the site
has real login + onboarding (roadmap Screens 1–3) plus a live rent-request
notification pipeline (Resend), and the UI is a React + Tailwind single-page
app in Spanish ("Cinematic Dark Luxury" design, adopted from the Manus demo
with Base44 touches). **Live at [palcos.onrender.com](https://palcos.onrender.com).**

## Next steps

- [ ] Test and send real notification emails to actual renters/owners (not
  just the demo accounts) to confirm deliverability at small scale.
- [ ] Renter → owner account upgrade path — currently a renter can't become
  an owner without a separate signup; owners can already rent (see below).
- [ ] Real payment integration (`process_payment()` is the Stripe
  integration point) — low priority for now.

## Owner demo accounts

Three seeded owner accounts exist for testing (one per stadium). Passwords
aren't listed here since this repo is public — ask Javier for the shared
demo password.

| Owner | Stadium | Email |
|---|---|---|
| Sofía Torres | Estadio Azteca | `javiarevalo9@gmail.com` |
| Ricardo Elizondo | Estadio de Monterrey | `javiarevalo9+ricardo@gmail.com` |
| Mariana Ochoa | Estadio Jalisco | `javiarevalo9+mariana@gmail.com` |

These all land in the same inbox via Gmail's `+tag` addressing — useful for
testing since a real notification email actually arrives when a request
comes in against any of their boxes. Note: a **fresh** database seeded from
scratch (see `seed()` in `app.py`) creates these three accounts with their
original placeholder emails (`sofia@example.com`, etc.) instead — the real
addresses above were assigned manually on the shared Neon database used by
both local dev and the live deployment.

## What changed most recently

- **Signup confirmation codes are real email now**, not shown on screen —
  sent inline (synchronously, not via `runner.py`) so the code arrives
  immediately. Falls back to the old on-screen/console behavior only when
  `RESEND_API_KEY` isn't configured (local dev).
- **Connected to a real database** — Neon Postgres, via `PALCOS_DATABASE_URL`
  (falls back to local SQLite if unset). Schema managed by Alembic
  migrations, auto-upgraded on startup.
- **`is_seed_data` flag** on `Stadium`/`PrivateBox`/`User` so demo data stays
  distinguishable from real onboarded data in the same tables, rather than
  needing separate tables.
- **Rent-request notification pipeline** (`notifications.py` + `runner.py`):
  a new request emails the owner immediately; if unanswered by the response
  deadline (3 days after the request, or 7 days before the event date,
  whichever is sooner) the owner gets a reminder; still no response 12 hours
  after that and the request auto-rejects, with the renter notified so they
  can look elsewhere. `runner.py` is a standalone job, deliberately decoupled
  from the web process — see "Tech stack" below for how it's scheduled.
- **Real transactional email via Resend**, sending from a verified custom
  domain (`palcosmx.com`, SPF/DKIM/DMARC all configured) — can email any
  real recipient, not just a sandboxed test address.
- **Deployed to production on Render** — a web service (Docker + gunicorn)
  and a cron job (`runner.py` on a 5-minute schedule), both defined in
  `render.yaml` as a Blueprint.
- **Owner onboarding rebuilt**: register a box → publish availability → a
  choice screen (add another box / connect payment / go to dashboard).
  Reachable directly from the landing page / navbar ("Para Propietarios"),
  not just as a post-signup redirect.
- **`/solicitudes`** — a dedicated page for owners to review and
  accept/decline incoming requests, split out from a tab inside
  `/mis-palcos` specifically so notification emails can link straight to it.
- **Emails now contain real links** to the relevant page instead of just
  telling the recipient to go check the app.
- **Login redirect preservation** (`?next=...`) — clicking an email link
  while logged out redirects to login, then lands back on the original
  destination afterward instead of a generic page.
- **7-day persistent login sessions** — previously the session cookie
  expired as soon as the browser closed.
- **Owners can rent too** — an owner account can submit rent requests for
  any box they don't own, and go through the full renter lifecycle (pay,
  get instructions, leave a survey) at `/mis-reservas`, same as a plain
  renter. Requesting your own box is blocked with a clear error, both in
  the UI (`Explore.tsx`, before the dialog even opens) and server-side
  (`create_rent_request` — the authoritative check). A renter still can't
  become an owner without a separate account (see "Next steps").

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Flask + SQLAlchemy, served by Gunicorn in production |
| Database | Postgres via [Neon](https://neon.tech) (pooled connection in production), schema migrations via Alembic |
| Email | [Resend](https://resend.com) API, verified custom domain (`palcosmx.com`) for real deliverability |
| Background jobs | Standalone `runner.py`, scheduled as a Render Cron Job (not an in-process scheduler) |
| Hosting | [Render](https://render.com) — a Docker-based web service + cron job, both built from one multi-stage `Dockerfile` |
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4, [wouter](https://github.com/molefrog/wouter) (routing), TanStack Query, react-hook-form + zod, shadcn/Radix UI, Framer Motion, Sonner (toasts) |
| Auth | Server-signed Flask session cookies (7-day persistence), no third-party auth provider |
| Local env | `python-dotenv` loads `.env` (gitignored) automatically |

## Run it

The backend's Python is managed with [uv](https://docs.astral.sh/uv/); the
frontend is a Vite + React app under `frontend/` (needs Node.js + npm).

**Environment:** copy `.env.example` to `.env` and fill in `PALCOS_DATABASE_URL`
(a Postgres URL, e.g. from Neon — omit it to fall back to local SQLite),
`PALCOS_SECRET_KEY`, and optionally `RESEND_API_KEY`/`RESEND_FROM_EMAIL`/
`APP_BASE_URL` if you want real notification emails locally (without a key,
they're printed to the console instead of sent).

**Production-style (one server):** build the frontend once, then Flask
serves both the API and the built SPA:

```powershell
cd frontend; npm install; npm run build; cd ..
uv sync
uv run python app.py
```

Then open **http://localhost:5050**. Run from the repo root — the SQLite
file (`palcos.db`) is created relative to the working directory (only used
if `PALCOS_DATABASE_URL` is unset).

**Frontend development (two terminals):** hot reload via the Vite dev
server, which proxies `/api` to Flask:

```powershell
# terminal 1
uv run python app.py

# terminal 2
cd frontend
npm run dev
```

Then open **http://localhost:3000**.

**Notification runner:** `runner.py` is not started automatically by
`app.py` — it's a separate process, meant to run on a schedule (in
production, Render's Cron Job; locally, just invoke it manually whenever you
want to test the notification pipeline):

```powershell
uv run python runner.py
```

## Demo / seed data

On first run against an empty database, `seed()` in `app.py` creates 3
stadiums (Azteca, Monterrey, Jalisco), 12 boxes with one listing each, and
the 3 owner accounts described above. Every row it creates is tagged
`is_seed_data=True`, so demo data stays distinguishable from real owners /
boxes once onboarding brings in the real thing — filter on that column
rather than assuming everything in a table is real.

Delete `palcos.db` to reset to the seed data (SQLite only — on Postgres,
delete the seeded rows directly).

## What's in here

- `models.py` — the core classes from the roadmap's "Data Structure
  definitions" (`PrivateBox` with `add_listing()` / `remove_listing()`,
  `Stadium`, `User` → `Owner` / `Renter`), now persisted as SQLAlchemy
  models. Passwords are hashed with werkzeug.
- `db.py` — SQLAlchemy plumbing. Defaults to SQLite (`palcos.db`); set
  `PALCOS_DATABASE_URL` for Postgres in production. Schema is managed by
  Alembic (`migrations/`): on startup the app upgrades the database to the
  latest migration automatically. To change the schema: edit `models.py`,
  then `uv run alembic revision --autogenerate -m "describe change"` and
  restart (or `uv run alembic upgrade head`).
- `booking_engine.py` — every method from "Booking Engine functionalities":
  renter actions (`create_rent_request`, `submit_payment`,
  `get_instructions`, `post_visit_survey`), system actions
  (`process_rent_request`, `accept_booking`, `reject_booking`,
  `process_payment`, `available_boxes`), owner actions
  (`create_owner_account`, `create_private_box`, `add_listing`,
  `remove_listing`), and the renter feed (`suggest_stadium`,
  `filter_by_location`, `filter_by_stadium`, `show_best_deals`).
- `auth.py` — session-based auth + onboarding: signup (Screen 1), emailed
  OTP confirmation (Screen 2, via `notifications.py`, sent inline rather
  than through `runner.py` since it's needed right away), login/logout/me.
  Identity lives in a server-signed session cookie (7-day persistence);
  set `PALCOS_SECRET_KEY` in the environment for anything beyond local dev.
- `notifications.py` — outbound emails: the signup/resend confirmation
  code (sent inline from `auth.py`) and the rent-request lifecycle emails
  (sent by `runner.py`) via Resend; simulated (printed) without an API key.
- `runner.py` — standalone job that drives the notification/deadline
  pipeline; decoupled from the web process on purpose (see "Tech stack").
- `app.py` — the Flask REST API over the engine, plus the SPA catch-all
  that serves `frontend/dist`. Owner/renter identity is derived from the
  session (`/api/my/...` routes); ownership is enforced server-side (you
  can only manage your own boxes/requests).
- `Dockerfile` / `render.yaml` — production deployment: a multi-stage Docker
  build (Node builds the SPA, Python serves everything) shared by both the
  web service and the cron job.
- `frontend/` — the React + Tailwind SPA (TypeScript, Vite, wouter,
  TanStack Query, shadcn/Radix components). Routes: `/` landing (live
  best-deals grid), `/explorar` catalog + request dialog, `/acceso`
  login/signup, `/confirmar` OTP confirmation, `/preferencias` renter
  onboarding, `/mis-reservas` renter lifecycle, `/bienvenida` owner
  onboarding, `/mis-palcos` owner dashboard (boxes + earnings),
  `/solicitudes` owner's incoming requests.

## How it maps to the roadmap's screens

- Screen 1 (create account) → `/acceso` (role choice; renters must link at
  least one social account so owners can vet requests).
- Screen 2 (confirm account) → `/confirmar` (OTP input). The code is
  emailed via Resend; without `RESEND_API_KEY` configured it falls back to
  being shown on screen and printed to the server log instead. Unconfirmed
  users can browse but can't transact (create boxes/listings, request, pay)
  until confirmed.
- Screen 3 (preferences) → `/preferencias` (onboarding) and the
  Preferencias card in `/mis-reservas`: price range, capacity bucket,
  preferred stadiums, preferred teams, location.
- Screen 4 (main landing page / feed) → the `/` landing plus `/explorar`,
  with filter-by-stadium, sort by price/capacity, "Sugeridos para mí",
  "Cerca de mí", and "Mejores Ofertas".
- Screens 5–7 (submit payment, confirmation + instructions, survey) → the
  request lifecycle in `/mis-reservas`: Pagar y confirmar → Ver
  instrucciones → Dejar comentarios.

## Notes on what's simplified for the prototype

- Payments are simulated (no real Stripe calls); `process_payment()` is the
  place to wire in a real payment provider.
- `POST /api/stadiums` is unauthenticated (there's no admin role yet).
- `preferred_teams` is collected and stored but not yet used in
  `suggest_stadium()` scoring.
- The fair-value model in `show_best_deals()` is a simple linear formula —
  swap in a proper market-comps model when you have data.
  (`filter_by_location()` now uses real haversine distance with a
  city-coordinates lookup for the renter's side.)
- SQLite by default when `PALCOS_DATABASE_URL` is unset — production uses
  Postgres (Neon); the same Alembic migrations apply either way.
