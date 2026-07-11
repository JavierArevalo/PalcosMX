# Palcos

A working prototype of the private-box rental marketplace from the technical
roadmap: owners list a suite for a specific game date, renters request it,
the owner accepts or declines, payment (simulated) moves the booking to
confirmed, and both sides get instructions / a post-visit survey.

Accounts, boxes, listings and bookings persist to a local SQLite database,
and the site now has real login + onboarding (roadmap Screens 1–3).

## Run it

Python is managed with [uv](https://docs.astral.sh/uv/) — no system Python
needed (uv downloads the pinned interpreter on first sync):

```powershell
uv sync
uv run python app.py
```

Then open **http://localhost:5050**. Run from the repo root — the SQLite
file (`palcos.db`) is created relative to the working directory.

The frontend is intentionally **vanilla JS/CSS with no build step** — Flask
serves `templates/` and `static/` directly, so there's no npm/node toolchain
to install.

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
- `app.py` — the Flask REST API over the engine. Owner/renter identity is
  derived from the session (`/api/my/...` routes); ownership is enforced
  server-side (you can only manage your own boxes/requests).
- `templates/index.html`, `static/style.css`, `static/app.js` — the website
  UI: login/signup → confirm → preferences onboarding, then a Browse tab
  (renter feed), a List a Box tab (owners), and a My Reservations tab
  (renters).

## How it maps to the roadmap's screens

- Screen 1 (create account) → the signup card (role choice; renters must
  link at least one social account so owners can vet requests).
- Screen 2 (confirm account) → the confirmation-code step. The email is
  simulated: the code is shown on screen and printed to the server log.
  Unconfirmed users can browse but can't transact (create boxes/listings,
  request, pay) until confirmed.
- Screen 3 (preferences) → the renter onboarding step and the Preferences
  card: price range, capacity bucket, preferred stadiums, preferred teams,
  location.
- Screen 4 (main landing page / feed) → the "Browse Suites" tab, with
  filter-by-stadium, sort by price/capacity, "Suggest for me", "Filter by
  my location", and "Best deals".
- Screens 5–7 (submit payment, confirmation + instructions, survey) → the
  request lifecycle buttons under "My Reservations": Pay & confirm → Get
  instructions → Leave feedback.

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
