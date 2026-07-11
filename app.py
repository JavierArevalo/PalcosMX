"""
app.py
Flask REST API + website for Palcos, wired on top of booking_engine.py.

Run:
    pip install -r requirements.txt
    python app.py
Then open http://localhost:5000
"""

from flask import Flask, request, jsonify, render_template
from booking_engine import BookingEngine

app = Flask(__name__)
engine = BookingEngine()


# ---------------------------------------------------------------------------
# Demo seed data so the site isn't empty on first load
# ---------------------------------------------------------------------------

def seed():
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
    stadium = engine.stadiums.get(box.stadium_id)
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
    return jsonify([s.to_dict() for s in engine.stadiums.values()])


@app.post("/api/stadiums")
def api_create_stadium():
    d = request.json or {}
    try:
        s = engine.create_stadium(d["name"], d["city"], d.get("latitude", 0), d.get("longitude", 0))
        return jsonify(s.to_dict()), 201
    except KeyError as e:
        return err(f"Missing field: {e}")


# ---------------------------------------------------------------------------
# Owner account + boxes
# ---------------------------------------------------------------------------

@app.post("/api/owners")
def api_create_owner():
    d = request.json or {}
    try:
        o = engine.create_owner_account(d["name"], d["email"], d["password"],
                                         d.get("location", ""), d.get("social_media"))
        return jsonify({"id": o.id, "name": o.name, "email": o.email}), 201
    except KeyError as e:
        return err(f"Missing field: {e}")


@app.post("/api/owners/<owner_id>/boxes")
def api_create_box(owner_id):
    d = request.json or {}
    try:
        box = engine.create_private_box(owner_id, d["stadium_id"], int(d["capacity"]),
                                         d.get("location_in_stadium", ""), d.get("description", ""))
        return jsonify(box.to_dict()), 201
    except (KeyError, ValueError) as e:
        return err(e)


@app.get("/api/owners/<owner_id>/boxes")
def api_owner_boxes(owner_id):
    try:
        owner = engine._get_owner(owner_id)
    except ValueError as e:
        return err(e, 404)
    return jsonify([engine.boxes[bid].to_dict() for bid in owner.box_ids])


@app.post("/api/boxes/<box_id>/listings")
def api_add_listing(box_id):
    d = request.json or {}
    try:
        listing = engine.add_listing(box_id, d["date"], float(d["price"]),
                                      d.get("capacity"), d.get("description", ""))
        return jsonify(listing.__dict__), 201
    except (KeyError, ValueError) as e:
        return err(e)


@app.get("/api/boxes/<box_id>/requests")
def api_box_requests(box_id):
    """Detailed requests for a box (optionally filtered to one date),
    including who requested, their message, and their booking history —
    the BoxRequest view, as opposed to /api/owners/<id>/requests which
    returns the engine's lifecycle-level RentRequest objects."""
    date = request.args.get("date")
    try:
        box = engine._get_box(box_id)
    except ValueError as e:
        return err(e, 404)
    return jsonify([r.__dict__ for r in box.get_requests(date)])


@app.delete("/api/boxes/<box_id>/listings/<date>")
def api_remove_listing(box_id, date):
    try:
        removed = engine.remove_listing(box_id, date)
        return jsonify({"removed": removed})
    except ValueError as e:
        return err(e, 404)


@app.get("/api/owners/<owner_id>/requests")
def api_owner_requests(owner_id):
    status = request.args.get("status")
    try:
        reqs = engine.list_requests_for_owner(owner_id, status=status)
        return jsonify([request_to_json(r) for r in reqs])
    except ValueError as e:
        return err(e, 404)


# ---------------------------------------------------------------------------
# Renter account + preferences
# ---------------------------------------------------------------------------

@app.post("/api/renters")
def api_create_renter():
    d = request.json or {}
    try:
        r = engine.create_renter_account(d["name"], d["email"], d["password"],
                                          d.get("location", ""), d.get("social_media"))
        return jsonify(r.to_dict()), 201
    except KeyError as e:
        return err(f"Missing field: {e}")


@app.put("/api/renters/<renter_id>/preferences")
def api_save_preferences(renter_id):
    d = request.json or {}
    try:
        r = engine.save_preferences(renter_id, **d)
        return jsonify(r.to_dict())
    except ValueError as e:
        return err(e, 404)


# ---------------------------------------------------------------------------
# Feed / discovery
# ---------------------------------------------------------------------------

@app.get("/api/feed/available")
def api_feed_available():
    stadium_id = request.args.get("stadium_id")
    return jsonify([entry_to_json(e) for e in engine.available_boxes(stadium_id)])


@app.get("/api/feed/suggest/<renter_id>")
def api_feed_suggest(renter_id):
    try:
        return jsonify([entry_to_json(e) for e in engine.suggest_stadium(renter_id)])
    except ValueError as e:
        return err(e, 404)


@app.get("/api/feed/by-location/<renter_id>")
def api_feed_by_location(renter_id):
    try:
        return jsonify([entry_to_json(e) for e in engine.filter_by_location(renter_id)])
    except ValueError as e:
        return err(e, 404)


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

@app.post("/api/requests")
def api_create_request():
    d = request.json or {}
    try:
        r = engine.create_rent_request(d["renter_id"], d["box_id"], d["date"], d.get("message", ""))
        return jsonify(request_to_json(r)), 201
    except (KeyError, ValueError) as e:
        return err(e)


@app.post("/api/requests/<request_id>/accept")
def api_accept(request_id):
    try:
        r = engine.accept_booking(request_id)
        return jsonify(request_to_json(r))
    except ValueError as e:
        return err(e, 404)


@app.post("/api/requests/<request_id>/reject")
def api_reject(request_id):
    d = request.json or {}
    try:
        r = engine.reject_booking(request_id, d.get("reason", "The owner withdrew their listing."))
        return jsonify(request_to_json(r))
    except ValueError as e:
        return err(e, 404)


@app.post("/api/requests/<request_id>/payment")
def api_payment(request_id):
    d = request.json or {}
    try:
        r = engine.submit_payment(request_id, d.get("provider", "stripe"), d.get("token", "tok_demo"),
                                   float(d["amount"]), float(d["deposit"]))
        return jsonify(request_to_json(r))
    except (KeyError, ValueError) as e:
        return err(e)


@app.get("/api/requests/<request_id>/instructions")
def api_instructions(request_id):
    try:
        text = engine.get_instructions(request_id)
        return jsonify({"instructions": text})
    except ValueError as e:
        return err(e)


@app.post("/api/requests/<request_id>/survey")
def api_survey(request_id):
    d = request.json or {}
    try:
        survey = engine.post_visit_survey(request_id, int(d["box_experience"]),
                                           int(d["booking_experience"]), d.get("comments", ""))
        return jsonify(survey)
    except (KeyError, ValueError) as e:
        return err(e)


@app.get("/api/renters/<renter_id>/requests")
def api_renter_requests(renter_id):
    reqs = [r for r in engine.requests.values() if r.renter_id == renter_id]
    return jsonify([request_to_json(r) for r in reqs])


if __name__ == "__main__":
    app.run(debug=True, port=5050)