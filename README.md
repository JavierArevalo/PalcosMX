# Palcos

A working prototype of the private-box rental marketplace from the technical
roadmap: owners list a suite for a specific game date, renters request it,
the owner accepts or declines, payment (simulated) moves the booking to
confirmed, and both sides get instructions / a post-visit survey.

## Run it

```bash
cd palcos
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000**.

## What's in here

- `models.py` — the core classes from the roadmap's "Data Structure
  definitions": `PrivateBox` (with `add_listing()` / `remove_listing()`),
  `Stadium`, and `User` → `Owner` / `Renter`.
- `booking_engine.py` — every method from "Booking Engine functionalities":
  renter actions (`create_rent_request`, `submit_payment`,
  `get_instructions`, `post_visit_survey`), system actions
  (`process_rent_request`, `accept_booking`, `reject_booking`,
  `process_payment`, `available_boxes`), owner actions
  (`create_owner_account`, `create_private_box`, `add_listing`,
  `remove_listing`), and the renter feed (`suggest_stadium`,
  `filter_by_location`, `filter_by_stadium`, `show_best_deals`).
- `app.py` — a Flask REST API over the engine, plus some demo seed data
  (2 stadiums, 3 boxes, 4 listings) so the site isn't empty on first load.
- `templates/index.html`, `static/style.css`, `static/app.js` — the website
  UI: a Browse tab (renter feed), a List a Box tab (owner flow), and a My
  Reservations tab (renter request tracking, payment, instructions, survey).

## How it maps to the roadmap's screens

- Screens 1–3 (create account, confirm, preferences) → the owner/renter
  forms on the "List a Box" and "My Reservations" tabs.
- Screen 4 (main landing page / feed) → the "Browse Suites" tab, with
  filter-by-stadium, sort by price/capacity, "Suggest for me", "Filter by
  my location", and "Best deals".
- Screens 5–7 (submit payment, confirmation + instructions, survey) → the
  request lifecycle buttons under "My Reservations": Pay & confirm → Get
  instructions → Leave feedback.

## Notes on what's simplified for the prototype

- Storage is in-memory (Python dicts), not a real database — restart and
  it resets to the seed data. Swap in Postgres/SQLAlchemy for production.
- Payments are simulated (no real Stripe calls); `process_payment()` is the
  place to wire in a real payment provider.
- Password handling is a placeholder (not a real hash) — use `bcrypt` or
  similar, and real session/auth tokens, before this goes anywhere near
  production.
- `filter_by_location()` and the fair-value model in `show_best_deals()`
  are simple placeholders (city string match / linear formula) — swap in
  real geo-distance and a proper market-comps model when you have data.
