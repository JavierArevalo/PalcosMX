"""
booking_engine.py
Implements the "Booking Engine functionalities" section of the roadmap:
  - actions the renter object needs to perform
  - actions the system (engine) has to perform
  - actions the owner object needs to perform
  - Feed functionality (for renter)

This is an in-memory reference implementation. Swap the dict-based
storage for a real database in production.
"""

from __future__ import annotations
import datetime
from dataclasses import dataclass, field
from typing import Optional

from models import (
    new_id, PrivateBox, Stadium, Owner, Renter, Listing, BookingRecord, BoxRequest
)


# ---------------------------------------------------------------------------
# Rent Request object
# ---------------------------------------------------------------------------

@dataclass
class RentRequest:
    """Created by Renter.create_rent_request(). Carries renter info so the
    owner has enough context to evaluate the request."""
    id: str
    box_id: str
    listing_id: str
    renter_id: str
    date: str
    price: float
    status: str = "pending"          # pending | accepted | rejected | paid | completed
    reject_reason: Optional[str] = None
    message: str = ""                 # optional note from renter to owner
    renter_snapshot: dict = field(default_factory=dict)  # history/email/age/income/social, etc.
    payment: Optional[dict] = None
    instructions: Optional[str] = None
    survey: Optional[dict] = None
    created_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())


class BookingEngine:
    """Central engine tying together owners, renters, boxes, stadiums and
    rent requests. In a production system this would be a service layer
    over a real database; here it's an in-memory store for a working
    prototype."""

    def __init__(self):
        self.owners: dict[str, Owner] = {}
        self.renters: dict[str, Renter] = {}
        self.boxes: dict[str, PrivateBox] = {}
        self.stadiums: dict[str, Stadium] = {}
        self.requests: dict[str, RentRequest] = {}

    # =======================================================================
    # Owner actions
    # =======================================================================

    def create_owner_account(self, name: str, email: str, password: str,
                              location: str = "", social_media: Optional[dict] = None) -> Owner:
        owner = Owner(name, email, password, location, social_media)
        self.owners[owner.id] = owner
        return owner

    def create_private_box(self, owner_id: str, stadium_id: str, capacity: int,
                            location_in_stadium: str = "", description: str = "") -> PrivateBox:
        """Called once an owner provides box details; creates the instance,
        links it to the owner and to a stadium."""
        if owner_id not in self.owners:
            raise ValueError("Unknown owner")
        if stadium_id not in self.stadiums:
            raise ValueError("Unknown stadium")

        box = PrivateBox(owner_id, stadium_id, capacity, location_in_stadium, description)
        self.boxes[box.id] = box
        self.owners[owner_id].link_box(box.id)
        self.stadiums[stadium_id].add_box(box.id)
        return box

    def add_listing(self, box_id: str, date: str, price: float,
                     capacity: Optional[int] = None, description: str = "") -> Listing:
        """Add Listing(): owner posts a date for which they want to rent
        their private box."""
        box = self._get_box(box_id)
        return box.add_listing(date, price, capacity, description)

    def remove_listing(self, box_id: str, date: str) -> bool:
        """Remove Listing(): remove a listing for a specific date; it
        disappears from the renters feed automatically since the feed is
        computed from available_dates."""
        box = self._get_box(box_id)
        return box.remove_listing(date)

    # =======================================================================
    # Renter actions
    # =======================================================================

    def create_renter_account(self, name: str, email: str, password: str,
                               location: str = "", social_media: Optional[dict] = None) -> Renter:
        renter = Renter(name, email, password, location, social_media)
        self.renters[renter.id] = renter
        return renter

    def save_preferences(self, renter_id: str, **prefs) -> Renter:
        renter = self._get_renter(renter_id)
        renter.save_preferences(**prefs)
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

        request = RentRequest(
            id=new_id(),
            box_id=box_id,
            listing_id=listing.listing_id,
            renter_id=renter_id,
            date=date,
            price=listing.price,
            message=message,
            renter_snapshot={
                "email": renter.email,
                "renting_history_count": len(renter.booking_history_ids),
                "social_media": renter.social_media,
                "location": renter.location,
            },
        )
        self.requests[request.id] = request
        history_summary = self._renter_history_summary(renter)
        renter.booking_history_ids.append(request.id)

        box.add_request(BoxRequest(
            request_id=request.id,
            renter_id=renter.id,
            renter_name=renter.name,
            date=date,
            message=message,
            renter_history=history_summary,
        ))
        return self.process_rent_request(request)

    def _renter_history_summary(self, renter: Renter) -> list[dict]:
        """Summarized past requests for a renter (their own booking record,
        not the box's) — embedded onto each BoxRequest so an owner can
        gauge a renter's track record without a separate lookup."""
        summary = []
        for req_id in renter.booking_history_ids:
            past = self.requests.get(req_id)
            if past is None:
                continue
            summary.append({
                "request_id": past.id,
                "box_id": past.box_id,
                "date": past.date,
                "price": past.price,
                "status": past.status,
            })
        return summary

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
        stadium = self.stadiums.get(box.stadium_id)
        stadium_name = stadium.name if stadium else "the venue"
        instructions = (
            f"Your suite at {stadium_name} is confirmed for {request.date}. "
            f"Box location: {box.location_in_stadium or 'see venue map on arrival'}. "
            f"Show your confirmation code {request.id} at the private entrance. "
            f"Capacity: {box.capacity} guests."
        )
        request.instructions = instructions
        request.status = "completed"
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
        owner = self._get_owner(owner_id)
        owner_box_ids = set(owner.box_ids)
        results = [r for r in self.requests.values() if r.box_id in owner_box_ids]
        if box_id:
            results = [r for r in results if r.box_id == box_id]
        if status:
            results = [r for r in results if r.status == status]
        return results

    def accept_booking(self, request_id: str) -> RentRequest:
        """Owner accepts one of possibly several pending requests for the
        same box/date. Marks it 'accepted' and notifies the renter (next
        step: payment). All other pending requests for the same box/date
        are auto-rejected with a standard reason."""
        request = self._get_request(request_id)
        request.status = "accepted"
        self._get_box(request.box_id).set_request_status(request_id, "accepted")

        for other in self.requests.values():
            if (other.id != request.id and other.box_id == request.box_id
                    and other.date == request.date and other.status == "pending"):
                self.reject_booking(other.id, reason="Another earlier request was accepted for this box/date.")
        return request

    def reject_booking(self, request_id: str, reason: str = "The owner withdrew their listing.") -> RentRequest:
        """Owner declines a request. Renter is notified promptly with a
        standard reason and shown similar listings."""
        request = self._get_request(request_id)
        request.status = "rejected"
        request.reject_reason = reason
        self._get_box(request.box_id).set_request_status(request_id, "rejected", reason)
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
            "paid_at": datetime.datetime.utcnow().isoformat(),
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
            box_id=box.id,
            stadium_id=box.stadium_id,
            location_in_stadium=box.location_in_stadium,
            event_description=request.renter_snapshot.get("event_description", ""),
        ))
        return request

    def available_boxes(self, stadium_id: Optional[str] = None) -> list[dict]:
        """Available boxes(): queries all boxes to see which dates are
        available, sorted by date then stadium, for use in the renter feed."""
        results = []
        for box in self.boxes.values():
            if stadium_id and box.stadium_id != stadium_id:
                continue
            for listing in box.available_dates:
                results.append({"box": box, "listing": listing})
        results.sort(key=lambda r: (r["listing"].date, r["box"].stadium_id))
        return results

    # =======================================================================
    # Feed functionality (for renter)
    # =======================================================================

    def suggest_stadium(self, renter_id: str, price_tolerance: float = 0.2) -> list[dict]:
        """Suggest stadium(): show listings within +/-20% of the renter's
        price range that best align with preferred stadiums/teams/location.
        Uses a simple weighted-distance score (stand-in for a k-means-style
        multi-metric match: price proximity, location proximity, team match)."""
        renter = self._get_renter(renter_id)
        prefs = renter.preferences
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
        """Filter by location(): boxes sorted by proximity to the renter,
        then by price (lowest first) within the same stadium."""
        renter = self._get_renter(renter_id)
        candidates = self.available_boxes()

        def distance(entry):
            stadium = self.stadiums.get(entry["box"].stadium_id)
            if not stadium or not renter.location:
                return 0
            # Placeholder distance metric; swap for real geo distance
            # (haversine) once lat/lng are wired up on the User model.
            return 0 if stadium.city.lower() == renter.location.lower() else 1

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
        stadium = self.stadiums.get(box.stadium_id)
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
        self.stadiums[stadium.id] = stadium
        return stadium

    def _get_owner(self, owner_id: str) -> Owner:
        if owner_id not in self.owners:
            raise ValueError("Unknown owner")
        return self.owners[owner_id]

    def _get_renter(self, renter_id: str) -> Renter:
        if renter_id not in self.renters:
            raise ValueError("Unknown renter")
        return self.renters[renter_id]

    def _get_box(self, box_id: str) -> PrivateBox:
        if box_id not in self.boxes:
            raise ValueError("Unknown private box")
        return self.boxes[box_id]

    def _get_request(self, request_id: str) -> RentRequest:
        if request_id not in self.requests:
            raise ValueError("Unknown rent request")
        return self.requests[request_id]