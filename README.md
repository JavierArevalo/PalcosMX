# Palcos

A working prototype of the private-box rental marketplace from the technical
roadmap: owners list a suite for a specific game date, renters request it,
the owner accepts or declines, payment (simulated) moves the booking to
confirmed, and both sides get instructions / a post-visit survey.

Accounts, boxes, listings and bookings persist to a local SQLite database,
the site has real login + onboarding (roadmap Screens 1–3), and the UI is a
React + Tailwind single-page app in Spanish ("Cinematic Dark Luxury" design,
adopted from the Manus demo with Base44 touches).

## Run it

The backend's Python is managed with [uv](https://docs.astral.sh/uv/); the
frontend is a Vite + React app under `frontend/` (needs Node.js + npm).

**Production-style (one server):** build the frontend once, then Flask
serves both the API and the built SPA:

```powershell
cd frontend; npm install; npm run build; cd ..
uv sync
uv run python app.py
```

Then open **http://localhost:5050**. Run from the repo root — the SQLite
file (`palcos.db`) is created relative to the working directory.

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

## Demo accounts / seed data

On first run (empty database) the app seeds 3 stadiums (Azteca, Monterrey,
Jalisco), 12 boxes with one listing each, and 3 pre-confirmed owner
accounts you can log in with:

- `sofia@example.com`, `ricardo@example.com`, `mariana@example.com` — password `pw`

Delete `palcos.db` to reset to the seed data.

## What's in here

- `models.py` — the core classes from the roadmap's "Data Structure
  definitions" (`PrivateBox` with `add_listing()` / `remove_listing()`,
  `Stadium`, `User` → `Owner` / `Renter`), now persisted as SQLAlchemy
  models. Passwords are hashed with werkzeug.
- `db.py` — SQLite/SQLAlchemy plumbing (`palcos.db`; no migrations — delete
  the file if the schema changes).
- `booking_engine.py` — every method from "Booking Engine functionalities":
  renter actions (`create_rent_request`, `submit_payment`,
  `get_instructions`, `post_visit_survey`), system actions
  (`process_rent_request`, `accept_booking`, `reject_booking`,
  `process_payment`, `available_boxes`), owner actions
  (`create_owner_account`, `create_private_box`, `add_listing`,
  `remove_listing`), and the renter feed (`suggest_stadium`,
  `filter_by_location`, `filter_by_stadium`, `show_best_deals`).
- `auth.py` — session-based auth + onboarding: signup (Screen 1), simulated
  email confirmation (Screen 2), login/logout/me. Identity lives in a
  server-signed session cookie; set `PALCOS_SECRET_KEY` in the environment
  for anything beyond local dev.
- `app.py` — the Flask REST API over the engine, plus the SPA catch-all
  that serves `frontend/dist`. Owner/renter identity is derived from the
  session (`/api/my/...` routes); ownership is enforced server-side (you
  can only manage your own boxes/requests).
- `frontend/` — the React + Tailwind SPA (TypeScript, Vite, wouter,
  TanStack Query, shadcn/Radix components). Routes: `/` landing (live
  best-deals grid), `/explorar` catalog + request dialog, `/acceso`
  login/signup, `/confirmar` OTP confirmation, `/preferencias` renter
  onboarding, `/mis-reservas` renter lifecycle, `/mis-palcos` owner
  dashboard.

## How it maps to the roadmap's screens

- Screen 1 (create account) → `/acceso` (role choice; renters must link at
  least one social account so owners can vet requests).
- Screen 2 (confirm account) → `/confirmar` (OTP input). The email is
  simulated: the code is shown on screen and printed to the server log.
  Unconfirmed users can browse but can't transact (create boxes/listings,
  request, pay) until confirmed.
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
- Email confirmation is simulated — the code is returned in the signup
  response instead of being emailed.
- `POST /api/stadiums` is unauthenticated (there's no admin role yet).
- `preferred_teams` is collected and stored but not yet used in
  `suggest_stadium()` scoring.
- `filter_by_location()` and the fair-value model in `show_best_deals()`
  are simple placeholders (city string match / linear formula) — swap in
  real geo-distance and a proper market-comps model when you have data.
- SQLite with `create_all` (no migrations) — swap in Postgres + Alembic
  for production.
