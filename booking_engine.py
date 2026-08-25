"""
booking_engine.py
Implements the "Booking Engine functionalities" section of the roadmap:
  - actions the renter object needs to perform
  - actions the system (engine) has to perform
  - actions the owner object needs to perform
  - Feed functionality (for renter)

Storage is SQLite via SQLAlchemy (see db.py / models.py). The engine is
a thin service layer over the database session; feed scoring stays in
Python since the datasets are prototype-sized.

Unit of work: engine methods only modify the session (flushing so ids are
assigned and constraint errors surface at the call site) — they never
commit. The caller owns the transaction: for HTTP requests app.py commits
on success / rolls back on error at the request boundary, and the seed
commits once at the end.
"""

from __future__ import annotations
import datetime
import math
from typing import Optional

from sqlalchemy import select

from db import db_session
from models import (
    new_id, PrivateBox, Stadium, Owner, Renter, Listing, BookingRecord,
    BoxRequest, RentRequest,
)


# Prototype geocoding: coordinates for the cities the app knows about.
# A real deployment would geocode the renter's address (or use device
# location) instead of a lookup table.
CITY_COORDS: dict[str, tuple[float, float]] = {
    "ciudad de méxico": (19.4326, -99.1332),
    "cdmx": (19.4326, -99.1332),
    "mexico city": (19.4326, -99.1332),
    "guadalajara": (20.6597, -103.3496),
    "monterrey": (25.6866, -100.3161),
    "puebla": (19.0414, -98.2063),
    "tijuana": (32.5149, -117.0382),
    "león": (21.1250, -101.6860),
    "leon": (21.1250, -101.6860),
}


RESPONSE_WINDOW = datetime.timedelta(days=3)
EVENT_DECISION_WINDOW = datetime.timedelta(days=7)


def compute_respond_by(date_str: str) -> str:
    """The owner must act by whichever comes first: 3 days after the
    request was sent, or 7 days before the event date."""
    event_date = datetime.date.fromisoformat(date_str)
    event_cutoff = datetime.datetime.combine(
        event_date - EVENT_DECISION_WINDOW, datetime.time.min, tzinfo=datetime.timezone.utc)
    request_cutoff = datetime.datetime.now(datetime.timezone.utc) + RESPONSE_WINDOW
    return min(request_cutoff, event_cutoff).isoformat()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometers."""
    rlat1, rlon1, rlat2, rlon2 = map(math.radians, (lat1, lon1, lat2, lon2))
    a = (math.sin((rlat2 - rlat1) / 2) ** 2
         + math.cos(rlat1) * math.cos(rlat2) * math.sin((rlon2 - rlon1) / 2) ** 2)
    return 6371.0 * 2 * math.asin(math.sqrt(a))


class BookingEngine:
    """Central engine tying together owners, renters, boxes, stadiums and
    rent requests, backed by the SQLAlchemy session."""

    # =======================================================================
    # Owner actions
    # =======================================================================

    def create_owner_account(self, name: str, email: str, password: str,
                              location: str = "", social_media: Optional[dict] = None) -> Owner:
        owner = Owner(name, email, password, location, social_media)
        db_session.add(owner)
        db_session.flush()
        return owner

    def create_private_box(self, owner_id: str, stadium_id: str, capacity: int,
                            location_in_stadium: str = "", description: str = "") -> PrivateBox:
        """Called once an owner provides box details; creates the instance,
        linked to the owner and to a stadium via its foreign keys."""
        self._get_owner(owner_id)
        if db_session.get(Stadium, stadium_id) is None:
            raise ValueError("Unknown stadium")

        box = PrivateBox(owner_id, stadium_id, capacity, location_in_stadium, description)
        db_session.add(box)
        db_session.flush()
        return box

    def add_listing(self, box_id: str, date: str, price: float,
                     capacity: Optional[int] = None, description: str = "") -> Listing:
        """Add Listing(): owner posts a date for which they want to rent
        their private box."""
        box = self._get_box(box_id)
        listing = box.add_listing(date, price, capacity, description)
        db_session.flush()
        return listing

    def remove_listing(self, box_id: str, date: str) -> bool:
        """Remove Listing(): remove a listing for a specific date; it
        disappears from the renters feed automatically since the feed is
        computed from available_dates."""
        box = self._get_box(box_id)
        removed = box.remove_listing(date)
        db_session.flush()
        return removed

    # =======================================================================
    # Renter actions
    # =======================================================================

    def create_renter_account(self, name: str, email: str, password: str,
                               location: str = "", social_media: Optional[dict] = None) -> Renter:
        renter = Renter(name, email, password, location, social_media)
        db_session.add(renter)
        db_session.flush()
        return renter

    def save_preferences(self, renter_id: str, **prefs) -> Renter:
        renter = self._get_renter(renter_id)
        renter.save_preferences(**prefs)
        db_session.flush()
        return renter

    def create_rent_request(self, renter_id: str, box_id: str, date: str,
                             message: str = "") -> RentRequest:
        """Renter selects a box+date to rent. Builds a request object with
        renter's info and sends it to the booking engine (process_rent_request).
        Also records a BoxRequest directly on the box so the owner can see,
        for that specific date, who requested it and with what history —
        several renters can request the same date, so the box keeps all
        of them until one is accepted."""
        renter = self._get_renter(renter_id)
        box = self._get_box(box_id)
        listing = box.find_listing(date)
        if listing is None:
            raise ValueError("No listing available for that date")

        # Snapshot the renter's track record BEFORE adding this request.
        history_summary = self._renter_history_summary(renter)

        request = RentRequest(
            box_id=box_id,
            listing_id=listing.listing_id,
            renter_id=renter_id,
            date=date,
            price=listing.price,
            message=message,
            respond_by=compute_respond_by(date),
            renter_snapshot={
                "email": renter.email,
                "renting_history_count": len(renter.booking_history_ids),
                "social_media": renter.social_media,
                "location": renter.location,
            },
        )
        db_session.add(request)
        db_session.flush()  # assigns request.id before we mirror it on the box

        box.add_request(BoxRequest(
            request_id=request.id,
            renter_id=renter.id,
            renter_name=renter.name,
            date=date,
            message=message,
            renter_history=history_summary,
        ))
        db_session.flush()
        return self.process_rent_request(request)

    def _renter_history_summary(self, renter: Renter) -> list[dict]:
        """Summarized past requests for a renter (their own booking record,
        not the box's) — embedded onto each BoxRequest so an owner can
        gauge a renter's track record without a separate lookup."""
        return [{
            "request_id": past.id,
            "box_id": past.box_id,
            "date": past.date,
            "price": past.price,
            "status": past.status,
        } for past in renter.rent_requests]

    def submit_payment(self, request_id: str, provider: str, token: str,
                        amount: float, deposit: float) -> RentRequest:
        """Submit payment(): once a request is approved, renter is prompted
        to submit payment + deposit via a 3rd party payment app."""
        return self.process_payment(request_id, provider, token, amount, deposit)

    def get_instructions(self, request_id: str) -> str:
        """Get instructions(): once approved & paid, send instructions on
        what to expect and how to access the box."""
        request = self._get_request(request_id)
        if request.status != "paid":
            raise ValueError("Payment must be completed before instructions are released")
        box = self._get_box(request.box_id)
        stadium = self.get_stadium(box.stadium_id)
        stadium_name = stadium.name if stadium else "the venue"
        instructions = (
            f"Your suite at {stadium_name} is confirmed for {request.date}. "
            f"Box location: {box.location_in_stadium or 'see venue map on arrival'}. "
            f"Show your confirmation code {request.id} at the private entrance. "
            f"Capacity: {box.capacity} guests."
        )
        request.instructions = instructions
        request.status = "completed"
        db_session.flush()
        return instructions

    def post_visit_survey(self, request_id: str, box_experience: int,
                           booking_experience: int, comments: str = "") -> dict:
        """Post visit survey(): collect feedback after the reservation."""
        request = self._get_request(request_id)
        survey = {
            "box_experience": box_experience,       # e.g. 1-5
            "booking_experience": booking_experience,
            "comments": comments,
        }
        request.survey = survey
        db_session.flush()
        return survey

    # =======================================================================
    # System / engine actions
    # =======================================================================

    def process_rent_request(self, request: RentRequest) -> RentRequest:
        """Listener that receives booking requests and routes them to the
        owner. If multiple requests come in for the same box/date, they are
        all surfaced to the owner (solves the race-condition problem) and
        the owner picks which to accept."""
        # In a full system this would push a notification to the owner.
        # Here we simply leave the request 'pending' for the owner to see
        # via list_requests_for_owner().
        return request

    def list_requests_for_owner(self, owner_id: str, box_id: Optional[str] = None,
                                 status: Optional[str] = None) -> list[RentRequest]:
        self._get_owner(owner_id)
        stmt = (select(RentRequest)
                .join(PrivateBox, RentRequest.box_id == PrivateBox.id)
                .where(PrivateBox.owner_id == owner_id))
        if box_id:
            stmt = stmt.where(RentRequest.box_id == box_id)
        if status:
            stmt = stmt.where(RentRequest.status == status)
        return list(db_session.scalars(stmt))

    def list_requests_for_renter(self, renter_id: str) -> list[RentRequest]:
        stmt = select(RentRequest).where(RentRequest.renter_id == renter_id)
        return list(db_session.scalars(stmt))

    def accept_booking(self, request_id: str) -> RentRequest:
        """Owner accepts one of possibly several pending requests for the
        same box/date. Marks it 'accepted' and notifies the renter (next
        step: payment). All other pending requests for the same box/date
        are auto-rejected with a standard reason."""
        request = self._get_request(request_id)
        request.status = "accepted"
        self._get_box(request.box_id).set_request_status(request_id, "accepted")

        others = db_session.scalars(
            select(RentRequest).where(
                RentRequest.id != request.id,
                RentRequest.box_id == request.box_id,
                RentRequest.date == request.date,
                RentRequest.status == "pending",
            ))
        for other in others:
            self.reject_booking(other.id, reason="Another earlier request was accepted for this box/date.")
        db_session.flush()
        return request

    def reject_booking(self, request_id: str, reason: str = "The owner withdrew their listing.") -> RentRequest:
        """Owner declines a request. Renter is notified promptly with a
        standard reason and shown similar listings."""
        request = self._get_request(request_id)
        request.status = "rejected"
        request.reject_reason = reason
        self._get_box(request.box_id).set_request_status(request_id, "rejected", reason)
        db_session.flush()
        return request

    def process_payment(self, request_id: str, provider: str, token: str,
                         amount: float, deposit: float) -> RentRequest:
        """Once a request is accepted, the renter submits payment + deposit
        (deposit should be >= rent price, standard or owner-decided).
        Money is conceptually held in escrow until the visit completes."""
        request = self._get_request(request_id)
        if request.status != "accepted":
            raise ValueError("Request must be accepted before payment can be submitted")
        if deposit < amount:
            raise ValueError("Deposit should be at least the rental price")

        request.payment = {
            "provider": provider,
            "token": token,
            "amount": amount,
            "deposit": deposit,
            "status": "in_escrow",
            "paid_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        request.status = "paid"

        # Record on the box + release owner's share (platform could take a cut here).
        box = self._get_box(request.box_id)
        renter = self._get_renter(request.renter_id)
        owner_share = round(amount * 0.85, 2)  # example 15% platform fee
        box.record_booking(BookingRecord(
            date=request.date,
            price_rented=amount,
            price_owner_received=owner_share,
            renter_name=renter.name,
            stadium_id=box.stadium_id,
            location_in_stadium=box.location_in_stadium,
            event_description=request.renter_snapshot.get("event_description", ""),
        ))
        db_session.flush()
        return request

    def available_boxes(self, stadium_id: Optional[str] = None) -> list[dict]:
        """Available boxes(): queries all boxes to see which dates are
        available, sorted by date then stadium, for use in the renter feed."""
        stmt = (select(Listing, PrivateBox)
                .join(PrivateBox, Listing.box_id == PrivateBox.id)
                .order_by(Listing.date, PrivateBox.stadium_id))
        if stadium_id:
            stmt = stmt.where(PrivateBox.stadium_id == stadium_id)
        return [{"box": box, "listing": listing}
                for listing, box in db_session.execute(stmt)]

    # =======================================================================
    # Feed functionality (for renter)
    # =======================================================================

    def suggest_stadium(self, renter_id: str, price_tolerance: float = 0.2) -> list[dict]:
        """Suggest stadium(): show listings within +/-20% of the renter's
        price range that best align with preferred stadiums/teams/location.
        Uses a simple weighted-distance score (stand-in for a k-means-style
        multi-metric match: price proximity, location proximity, team match)."""
        renter = self._get_renter(renter_id)
        prefs = renter.preferences or {}
        candidates = self.available_boxes()

        scored = []
        for entry in candidates:
            listing = entry["listing"]
            box = entry["box"]

            score = 0.0

            # Price proximity
            if prefs.get("price_max") is not None:
                lo = (prefs.get("price_min") or 0) * (1 - price_tolerance)
                hi = prefs["price_max"] * (1 + price_tolerance)
                if not (lo <= listing.price <= hi):
                    continue
                mid = ((prefs.get("price_min") or 0) + prefs["price_max"]) / 2 or 1
                score += 1 - min(abs(listing.price - mid) / mid, 1)

            # Preferred stadium match
            if prefs.get("preferred_stadiums"):
                score += 1.0 if box.stadium_id in prefs["preferred_stadiums"] else 0.0

            # Capacity bucket match
            if prefs.get("capacity_bucket"):
                score += 0.5 if self._capacity_in_bucket(box.capacity, prefs["capacity_bucket"]) else 0.0

            scored.append((score, entry))

        scored.sort(key=lambda t: t[0], reverse=True)
        return [entry for _, entry in scored]

    def filter_by_location(self, renter_id: str) -> list[dict]:
        """Filter by location(): boxes sorted by real geo distance (haversine)
        from the renter's city to the stadium, then by price within the same
        distance. Falls back to a city-name match when the renter's city
        isn't in the lookup table or the stadium has no coordinates."""
        renter = self._get_renter(renter_id)
        candidates = self.available_boxes()
        renter_coords = CITY_COORDS.get((renter.location or "").strip().lower())

        def distance(entry) -> float:
            stadium = self.get_stadium(entry["box"].stadium_id)
            if not stadium or not renter.location:
                return 0.0
            if renter_coords and (stadium.latitude or stadium.longitude):
                return haversine_km(renter_coords[0], renter_coords[1],
                                    stadium.latitude, stadium.longitude)
            # Fallback: same city first, everything else after.
            return 0.0 if stadium.city.lower() == renter.location.lower() else 1e6

        candidates.sort(key=lambda e: (distance(e), e["listing"].price))
        return candidates

    def filter_by_stadium(self, stadium_id: str, sort_by: str = "price") -> list[dict]:
        """Filter by stadium(): all available boxes for a given stadium,
        rankable by capacity or price."""
        candidates = self.available_boxes(stadium_id=stadium_id)
        if sort_by == "capacity":
            candidates.sort(key=lambda e: e["box"].capacity, reverse=True)
        else:
            candidates.sort(key=lambda e: e["listing"].price)
        return candidates

    def box_ratings(self) -> dict[str, dict]:
        """Aggregate post-visit surveys into a per-box average rating.
        Returns {box_id: {"rating": 4.8, "review_count": 3}} for boxes that
        have at least one completed survey (box_experience, 1-5)."""
        rows = db_session.execute(
            select(RentRequest.box_id, RentRequest.survey)
            .where(RentRequest.survey.is_not(None)))
        scores: dict[str, list[float]] = {}
        for box_id, survey in rows:
            value = (survey or {}).get("box_experience")
            if isinstance(value, (int, float)):
                scores.setdefault(box_id, []).append(float(value))
        return {
            box_id: {"rating": round(sum(vals) / len(vals), 1), "review_count": len(vals)}
            for box_id, vals in scores.items()
        }

    def show_best_deals(self, top_n: int = 10) -> list[dict]:
        """Show best deals(): listings priced below their estimated fair
        value (fair value - listing price = discount)."""
        candidates = self.available_boxes()
        deals = []
        for entry in candidates:
            fair_value = self._estimate_fair_value(entry["box"])
            discount = fair_value - entry["listing"].price
            if discount > 0:
                deals.append({**entry, "fair_value": fair_value, "discount": discount})
        deals.sort(key=lambda e: e["discount"], reverse=True)
        return deals[:top_n]

    def _estimate_fair_value(self, box: PrivateBox) -> float:
        """Internal algorithm estimating fair value from capacity and
        stadium (placeholder linear model, calibrated to a luxury-suite
        price range of roughly $5k-$20k — replace with a trained model or
        real market comps in production)."""
        base = 3000 + box.capacity * 300
        stadium = self.get_stadium(box.stadium_id)
        premium = 1.05 if stadium else 1.0
        return round(base * premium, 2)

    @staticmethod
    def _capacity_in_bucket(capacity: int, bucket: str) -> bool:
        try:
            lo_str, hi_str = bucket.split("-")
            lo, hi = int(lo_str), int(hi_str)
            return lo <= capacity <= hi
        except (ValueError, AttributeError):
            return False

    # =======================================================================
    # Stadium management + lookups
    # =======================================================================

    def create_stadium(self, name: str, city: str, latitude: float = 0.0,
                        longitude: float = 0.0) -> Stadium:
        stadium = Stadium(name, city, latitude, longitude)
        db_session.add(stadium)
        db_session.flush()
        return stadium

    def list_stadiums(self) -> list[Stadium]:
        return list(db_session.scalars(select(Stadium)))

    def get_stadium(self, stadium_id: str) -> Optional[Stadium]:
        return db_session.get(Stadium, stadium_id)

    def get_user_by_email(self, email: str) -> Optional["Owner | Renter"]:
        from models import User
        return db_session.scalar(select(User).where(User.email == email))

    def _get_owner(self, owner_id: str) -> Owner:
        owner = db_session.get(Owner, owner_id)
        if owner is None:
            raise ValueError("Unknown owner")
        return owner

    def _get_renter(self, renter_id: str) -> Renter:
        renter = db_session.get(Renter, renter_id)
        if renter is None:
            raise ValueError("Unknown renter")
        return renter

    def _get_box(self, box_id: str) -> PrivateBox:
        box = db_session.get(PrivateBox, box_id)
        if box is None:
            raise ValueError("Unknown private box")
        return box

    def _get_request(self, request_id: str) -> RentRequest:
        request = db_session.get(RentRequest, request_id)
        if request is None:
            raise ValueError("Unknown rent request")
        return request
