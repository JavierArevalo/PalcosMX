"""
app.py
Flask REST API + website for Palcos, wired on top of booking_engine.py.

Run:
    uv sync
    uv run python app.py
Then open http://localhost:5050
"""

import os

from flask import Flask, request, jsonify, render_template
from db import db_session, init_db
from models import Stadium
from booking_engine import BookingEngine
import auth
from auth import current_user, login_required, role_required, confirmed_required

app = Flask(__name__)
# Signs the session cookie. Fine for local dev; set PALCOS_SECRET_KEY for
# anything shared.
app.secret_key = os.environ.get("PALCOS_SECRET_KEY", "dev-only-secret-change-me")
engine = BookingEngine()

auth.init_auth(engine)
app.register_blueprint(auth.bp)

init_db()


@app.after_request
def commit_on_success(response):
    """Unit of work: the request owns the transaction. Engine/auth code only
    flushes; nothing hits the database unless the request succeeds."""
    if response.status_code < 400:
        db_session.commit()
    else:
        db_session.rollback()
    return response


@app.teardown_appcontext
def shutdown_session(exception=None):
    # Also rolls back anything a crashed request left un-committed
    # (after_request is skipped on unhandled exceptions).
    db_session.remove()


# ---------------------------------------------------------------------------
# Demo seed data so the site isn't empty on first load (only when the
# database is empty — data persists in palcos.db across restarts).
# Runs as ONE transaction with a single commit at the end, so an interrupted
# startup leaves the database untouched instead of half-seeded.
# ---------------------------------------------------------------------------

def seed():
    if db_session.query(Stadium).count() > 0:
        return

    azteca = engine.create_stadium("Azteca Stadium", "Mexico City")
    monterrey = engine.create_stadium("Monterrey Stadium", "Monterrey")
    jalisco = engine.create_stadium("Jalisco Stadium", "Guadalajara")

    owner_azteca = engine.create_owner_account("Sofía Torres", "sofia@example.com", "pw", "Mexico City")
    owner_monterrey = engine.create_owner_account("Ricardo Elizondo", "ricardo@example.com", "pw", "Monterrey")
    owner_jalisco = engine.create_owner_account("Mariana Ochoa", "mariana@example.com", "pw", "Guadalajara")
    for o in (owner_azteca, owner_monterrey, owner_jalisco):
        o.confirm_account()

    # Each tuple: (owner, stadium, capacity, location_in_stadium, description, listing_date, price, event_description)
    box_specs = [
        # Azteca Stadium — 4 boxes, each a different location
        (owner_azteca, azteca, 12, "North Wing, Level 3", "Intimate glass-front suite",
         "2026-09-14", 6500, "Liga MX Clásico"),
        (owner_azteca, azteca, 20, "South Wing, Level 2", "Open-air terrace box",
         "2026-09-21", 9800, "Concacaf qualifier"),
        (owner_azteca, azteca, 35, "East Wing, Level 4", "Full hospitality suite with private bar",
         "2026-10-05", 15000, "El Tri international friendly"),
        (owner_azteca, azteca, 50, "West Wing, Level 5 — Presidential", "Top-tier suite, dedicated waitstaff",
         "2026-10-12", 19500, "World Cup warm-up match"),

        # Monterrey Stadium — 4 boxes, each a different location
        (owner_monterrey, monterrey, 10, "North Terrace, Level 1", "Cozy suite, great sightlines",
         "2026-09-18", 5200, "Rayados league match"),
        (owner_monterrey, monterrey, 18, "South Terrace, Level 2", "Family-friendly suite with lounge seating",
         "2026-09-25", 8700, "Clásico Regiomontano"),
        (owner_monterrey, monterrey, 28, "East Terrace, Level 3", "Suite with outdoor balcony",
         "2026-10-02", 12500, "Liguilla playoff match"),
        (owner_monterrey, monterrey, 45, "West Terrace, Level 4 — Skybox", "Premium skybox, full catering",
         "2026-10-09", 18000, "Champions Cup match"),

        # Jalisco Stadium — 4 boxes, each a different location
        (owner_jalisco, jalisco, 14, "North Stand, Level 1", "Classic suite, close to the pitch",
         "2026-09-16", 5900, "Chivas league match"),
        (owner_jalisco, jalisco, 22, "South Stand, Level 2", "Suite with dedicated bar service",
         "2026-09-23", 9500, "Clásico Tapatío"),
        (owner_jalisco, jalisco, 32, "East Stand, Level 3", "Wraparound suite with two TVs",
         "2026-09-30", 13800, "Copa MX quarterfinal"),
        (owner_jalisco, jalisco, 50, "West Stand, Level 4 — VIP Suite", "Top-of-venue VIP suite, red-carpet entry",
         "2026-10-07", 20000, "International friendly"),
    ]

    for owner, stadium, capacity, location, box_desc, date, price, event_desc in box_specs:
        box = engine.create_private_box(owner.id, stadium.id, capacity=capacity,
                                         location_in_stadium=location, description=box_desc)
        engine.add_listing(box.id, date, price, description=event_desc)

    db_session.commit()


seed()


# ---------------------------------------------------------------------------
# Website
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def entry_to_json(entry):
    box, listing = entry["box"], entry["listing"]
    stadium = engine.get_stadium(box.stadium_id)
    return {
        "listing_id": listing.listing_id,
        "date": listing.date,
        "price": listing.price,
        "capacity": listing.capacity,
        "description": listing.description,
        "box_id": box.id,
        "box_description": box.description,
        "box_location": box.location_in_stadium,
        "stadium_id": box.stadium_id,
        "stadium_name": stadium.name if stadium else "",
        "stadium_city": stadium.city if stadium else "",
    }


def request_to_json(r):
    return {
        "id": r.id, "box_id": r.box_id, "renter_id": r.renter_id, "date": r.date,
        "price": r.price, "status": r.status, "reject_reason": r.reject_reason,
        "message": r.message, "payment": r.payment, "instructions": r.instructions,
        "survey": r.survey,
    }


def err(e, code=400):
    return jsonify({"error": str(e)}), code


# ---------------------------------------------------------------------------
# Stadiums
# ---------------------------------------------------------------------------

@app.get("/api/stadiums")
def api_list_stadiums():
    return jsonify([s.to_dict() for s in engine.list_stadiums()])


@app.post("/api/stadiums")
def api_create_stadium():
    d = request.json or {}
    try:
        s = engine.create_stadium(d["name"], d["city"], d.get("latitude", 0), d.get("longitude", 0))
        return jsonify(s.to_dict()), 201
    except KeyError as e:
        return err(f"Missing field: {e}")


# ---------------------------------------------------------------------------
# Owner boxes (identity from session — account creation lives in /api/auth)
# ---------------------------------------------------------------------------

def _owned_box_or_error(box_id):
    """Load a box and verify it belongs to the session owner.
    Returns (box, None) or (None, error response)."""
    try:
        box = engine._get_box(box_id)
    except ValueError as e:
        return None, err(e, 404)
    if box.owner_id != current_user().id:
        return None, (jsonify({"error": "That box belongs to another owner"}), 403)
    return box, None


@app.post("/api/my/boxes")
@role_required("owner")
@confirmed_required
def api_create_box():
    d = request.json or {}
    try:
        box = engine.create_private_box(current_user().id, d["stadium_id"], int(d["capacity"]),
                                         d.get("location_in_stadium", ""), d.get("description", ""))
        return jsonify(box.to_dict()), 201
    except (KeyError, ValueError) as e:
        return err(e)


@app.get("/api/my/boxes")
@role_required("owner")
def api_my_boxes():
    return jsonify([box.to_dict() for box in current_user().boxes])


@app.post("/api/boxes/<box_id>/listings")
@role_required("owner")
@confirmed_required
def api_add_listing(box_id):
    box, error = _owned_box_or_error(box_id)
    if error:
        return error
    d = request.json or {}
    try:
        listing = engine.add_listing(box.id, d["date"], float(d["price"]),
                                      d.get("capacity"), d.get("description", ""))
        return jsonify(listing.to_dict()), 201
    except (KeyError, ValueError) as e:
        return err(e)


@app.get("/api/boxes/<box_id>/requests")
@role_required("owner")
def api_box_requests(box_id):
    """Detailed requests for a box (optionally filtered to one date),
    including who requested, their message, and their booking history —
    the BoxRequest view, as opposed to /api/my/requests which returns the
    engine's lifecycle-level RentRequest objects."""
    box, error = _owned_box_or_error(box_id)
    if error:
        return error
    date = request.args.get("date")
    return jsonify([r.to_dict() for r in box.get_requests(date)])


@app.delete("/api/boxes/<box_id>/listings/<date>")
@role_required("owner")
@confirmed_required
def api_remove_listing(box_id, date):
    box, error = _owned_box_or_error(box_id)
    if error:
        return error
    removed = engine.remove_listing(box.id, date)
    return jsonify({"removed": removed})


# ---------------------------------------------------------------------------
# My requests / preferences (role-aware, identity from session)
# ---------------------------------------------------------------------------

@app.get("/api/my/requests")
@login_required
def api_my_requests():
    user = current_user()
    if user.role == "owner":
        status = request.args.get("status")
        reqs = engine.list_requests_for_owner(user.id, status=status)
    else:
        reqs = engine.list_requests_for_renter(user.id)
    return jsonify([request_to_json(r) for r in reqs])


@app.put("/api/my/preferences")
@role_required("renter")
def api_save_preferences():
    """Screen 3: renter preferences. Accepts price_min/price_max (numbers),
    capacity_bucket, preferred_stadiums (stadium-id list), preferred_teams
    (string list), and optionally location (updates the profile field that
    filter_by_location reads)."""
    user = current_user()
    d = request.json or {}
    prefs = {}
    try:
        for key in ("price_min", "price_max"):
            if d.get(key) not in (None, ""):
                prefs[key] = float(d[key])
        if d.get("capacity_bucket"):
            prefs["capacity_bucket"] = str(d["capacity_bucket"])
        for key in ("preferred_stadiums", "preferred_teams"):
            if d.get(key) is not None:
                if not isinstance(d[key], list):
                    return err(f"{key} must be a list")
                prefs[key] = [str(v) for v in d[key]]
    except ValueError as e:
        return err(e)

    if d.get("location"):
        user.location = str(d["location"])

    r = engine.save_preferences(user.id, **prefs)
    return jsonify(r.to_dict())


# ---------------------------------------------------------------------------
# Feed / discovery
# ---------------------------------------------------------------------------

@app.get("/api/feed/available")
def api_feed_available():
    stadium_id = request.args.get("stadium_id")
    return jsonify([entry_to_json(e) for e in engine.available_boxes(stadium_id)])


@app.get("/api/feed/suggest")
@role_required("renter")
def api_feed_suggest():
    return jsonify([entry_to_json(e) for e in engine.suggest_stadium(current_user().id)])


@app.get("/api/feed/by-location")
@role_required("renter")
def api_feed_by_location():
    return jsonify([entry_to_json(e) for e in engine.filter_by_location(current_user().id)])


@app.get("/api/feed/by-stadium/<stadium_id>")
def api_feed_by_stadium(stadium_id):
    sort_by = request.args.get("sort_by", "price")
    return jsonify([entry_to_json(e) for e in engine.filter_by_stadium(stadium_id, sort_by)])


@app.get("/api/feed/best-deals")
def api_feed_best_deals():
    deals = engine.show_best_deals()
    out = []
    for d in deals:
        j = entry_to_json(d)
        j["fair_value"] = d["fair_value"]
        j["discount"] = round(d["discount"], 2)
        out.append(j)
    return jsonify(out)


# ---------------------------------------------------------------------------
# Rent request lifecycle
# ---------------------------------------------------------------------------

def _owned_request_or_error(request_id):
    """Load a rent request and verify its box belongs to the session owner."""
    try:
        r = engine._get_request(request_id)
    except ValueError as e:
        return None, err(e, 404)
    if engine._get_box(r.box_id).owner_id != current_user().id:
        return None, (jsonify({"error": "That request is for another owner's box"}), 403)
    return r, None


def _renters_request_or_error(request_id):
    """Load a rent request and verify it belongs to the session renter."""
    try:
        r = engine._get_request(request_id)
    except ValueError as e:
        return None, err(e, 404)
    if r.renter_id != current_user().id:
        return None, (jsonify({"error": "That request belongs to another renter"}), 403)
    return r, None


@app.post("/api/requests")
@role_required("renter")
@confirmed_required
def api_create_request():
    d = request.json or {}
    try:
        r = engine.create_rent_request(current_user().id, d["box_id"], d["date"], d.get("message", ""))
        return jsonify(request_to_json(r)), 201
    except (KeyError, ValueError) as e:
        return err(e)


@app.post("/api/requests/<request_id>/accept")
@role_required("owner")
@confirmed_required
def api_accept(request_id):
    r, error = _owned_request_or_error(request_id)
    if error:
        return error
    return jsonify(request_to_json(engine.accept_booking(r.id)))


@app.post("/api/requests/<request_id>/reject")
@role_required("owner")
@confirmed_required
def api_reject(request_id):
    r, error = _owned_request_or_error(request_id)
    if error:
        return error
    d = request.json or {}
    return jsonify(request_to_json(
        engine.reject_booking(r.id, d.get("reason", "The owner withdrew their listing."))))


@app.post("/api/requests/<request_id>/payment")
@role_required("renter")
@confirmed_required
def api_payment(request_id):
    r, error = _renters_request_or_error(request_id)
    if error:
        return error
    d = request.json or {}
    try:
        r = engine.submit_payment(r.id, d.get("provider", "stripe"), d.get("token", "tok_demo"),
                                   float(d["amount"]), float(d["deposit"]))
        return jsonify(request_to_json(r))
    except (KeyError, ValueError) as e:
        return err(e)


@app.get("/api/requests/<request_id>/instructions")
@role_required("renter")
def api_instructions(request_id):
    r, error = _renters_request_or_error(request_id)
    if error:
        return error
    try:
        text = engine.get_instructions(r.id)
        return jsonify({"instructions": text})
    except ValueError as e:
        return err(e)


@app.post("/api/requests/<request_id>/survey")
@role_required("renter")
def api_survey(request_id):
    r, error = _renters_request_or_error(request_id)
    if error:
        return error
    d = request.json or {}
    try:
        survey = engine.post_visit_survey(r.id, int(d["box_experience"]),
                                           int(d["booking_experience"]), d.get("comments", ""))
        return jsonify(survey)
    except (KeyError, ValueError) as e:
        return err(e)


if __name__ == "__main__":
    app.run(debug=True, port=5050)