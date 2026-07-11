"""
models.py
Core data classes for Palcos, matching the "Data Structure definitions"
section of the Technical Roadmap: PrivateBox, Stadium, and User
(Owner / Renter).

Everything here is in-memory (plain Python objects). app.py wires these
into a Flask API and booking_engine.py contains the cross-object
"Booking Engine" behavior described in the roadmap.
"""

from __future__ import annotations
import uuid
import datetime
from dataclasses import dataclass, field
from typing import Optional


def new_id() -> str:
    return uuid.uuid4().hex[:12]


# ---------------------------------------------------------------------------
# Private Box
# ---------------------------------------------------------------------------

@dataclass
class Listing:
    """One entry in a box's 'array of available dates'. A listing is for
    ONE box on ONE specific date, per the roadmap note.

    Carries its own box_id / stadium_id / location_in_stadium (copied from
    the parent PrivateBox at creation time) so a Listing is self-describing
    — useful once listings get passed around independently of their box
    (e.g. in the renter feed, or if a box's location ever changes later
    but past listings should keep the location they were booked at)."""
    date: str  # ISO date string, e.g. "2026-09-14"
    price: float
    capacity: int
    box_id: str
    stadium_id: str
    location_in_stadium: str = ""
    description: str = ""
    listing_id: str = field(default_factory=new_id)


@dataclass
class BoxRequest:
    """One rent request submitted against a private box for a specific
    date. Kept directly on the PrivateBox (rather than only in the
    booking engine's request table) so an owner looking at a box can see
    who has asked for a date and with what context, without a separate
    lookup. Multiple renters can request the same date — the box keeps
    all of them in a list until one is accepted (see
    PrivateBox.requested_dates)."""
    request_id: str
    renter_id: str
    renter_name: str
    date: str
    message: str = ""                              # optional note from renter to owner
    renter_history: list[dict] = field(default_factory=list)  # summarized past bookings for this renter
    status: str = "pending"                          # pending | accepted | rejected
    reject_reason: Optional[str] = None
    requested_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())


@dataclass
class BookingRecord:
    """One entry in a box's booking history dictionary."""
    date: str
    price_rented: float
    price_owner_received: float
    renter_name: str
    box_id: str
    stadium_id: str
    location_in_stadium: str = ""
    event_description: str = ""


class PrivateBox:
    """Class object of a private box (see roadmap: Data Structure
    definitions -> Class object of a private box)."""

    def __init__(self, owner_id: str, stadium_id: str, capacity: int,
                 location_in_stadium: str = "", description: str = ""):
        self.id: str = new_id()
        self.owner_id: str = owner_id
        self.stadium_id: str = stadium_id
        self.capacity: int = capacity
        self.location_in_stadium: str = location_in_stadium  # e.g. "North East, 5th floor"
        self.description: str = description

        self.available_dates: list[Listing] = []       # array of available dates to be rented
        self.requested_dates: dict[str, list[BoxRequest]] = {}  # date -> requests for that date (can be several)
        self.booking_history: list[BookingRecord] = []  # dict/history of past bookings

    # -- Add Listing() -----------------------------------------------------
    def add_listing(self, date: str, price: float, capacity: Optional[int] = None,
                     description: str = "") -> Listing:
        """Owner publishes their private box to be rented for a specific
        date. Modifies 'array of available dates'."""
        listing = Listing(
            date=date,
            price=price,
            capacity=capacity if capacity is not None else self.capacity,
            box_id=self.id,
            stadium_id=self.stadium_id,
            location_in_stadium=self.location_in_stadium,
            description=description,
        )
        self.available_dates.append(listing)
        return listing

    # -- Remove Listing() ----------------------------------------------------
    def remove_listing(self, date: str) -> bool:
        """Owner removes a listing for a specific date. Automatically
        removes it from the renters' feed (it simply won't show up in
        available_boxes() anymore)."""
        before = len(self.available_dates)
        self.available_dates = [l for l in self.available_dates if l.date != date]
        return len(self.available_dates) < before

    def find_listing(self, date: str) -> Optional[Listing]:
        for l in self.available_dates:
            if l.date == date:
                return l
        return None

    # -- request tracking (who has asked for which date) -------------------
    def add_request(self, box_request: "BoxRequest") -> None:
        """Record a new rent request against this box. Several requests
        can pile up for the same date; all are kept until one is accepted."""
        self.requested_dates.setdefault(box_request.date, []).append(box_request)

    def get_requests(self, date: Optional[str] = None) -> list["BoxRequest"]:
        """All requests for a specific date, or every request on this box
        if date is omitted."""
        if date is not None:
            return list(self.requested_dates.get(date, []))
        return [r for reqs in self.requested_dates.values() for r in reqs]

    def find_request(self, request_id: str) -> Optional["BoxRequest"]:
        for reqs in self.requested_dates.values():
            for r in reqs:
                if r.request_id == request_id:
                    return r
        return None

    def set_request_status(self, request_id: str, status: str,
                            reason: Optional[str] = None) -> Optional["BoxRequest"]:
        r = self.find_request(request_id)
        if r is not None:
            r.status = status
            if reason:
                r.reject_reason = reason
        return r

    def record_booking(self, record: BookingRecord) -> None:
        self.booking_history.append(record)
        # a completed booking is no longer available
        self.available_dates = [l for l in self.available_dates if l.date != record.date]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "owner_id": self.owner_id,
            "stadium_id": self.stadium_id,
            "capacity": self.capacity,
            "location_in_stadium": self.location_in_stadium,
            "description": self.description,
            "available_dates": [l.__dict__ for l in self.available_dates],
            "requested_dates": {
                date: [r.__dict__ for r in reqs] for date, reqs in self.requested_dates.items()
            },
            "booking_history": [b.__dict__ for b in self.booking_history],
        }


# ---------------------------------------------------------------------------
# Stadium
# ---------------------------------------------------------------------------

class Stadium:
    """Class object of a stadium: a collection of private boxes."""

    def __init__(self, name: str, city: str, latitude: float = 0.0, longitude: float = 0.0):
        self.id: str = new_id()
        self.name: str = name
        self.city: str = city
        self.latitude: float = latitude
        self.longitude: float = longitude
        self.box_ids: list[str] = []

    def add_box(self, box_id: str) -> None:
        self.box_ids.append(box_id)

    def get_boxes(self, all_boxes: dict[str, PrivateBox], sort_by: Optional[str] = None) -> list[PrivateBox]:
        """Return all boxes within the stadium. sort_by can be 'price',
        'capacity', or None."""
        boxes = [all_boxes[bid] for bid in self.box_ids if bid in all_boxes]
        if sort_by == "capacity":
            boxes.sort(key=lambda b: b.capacity, reverse=True)
        elif sort_by == "price":
            def min_price(b: PrivateBox):
                prices = [l.price for l in b.available_dates]
                return min(prices) if prices else float("inf")
            boxes.sort(key=min_price)
        return boxes

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "box_ids": self.box_ids,
        }


# ---------------------------------------------------------------------------
# User (base) / Owner / Renter
# ---------------------------------------------------------------------------

class User:
    """Class object of a user: basic info, contains name, email, payment
    info (3rd party), location, preferences, social accounts, etc."""

    def __init__(self, name: str, email: str, password: str,
                 location: str = "", social_media: Optional[dict] = None):
        self.id: str = new_id()
        self.name: str = name
        self.email: str = email
        # NOTE: for a real product this must be a proper salted hash (e.g. bcrypt).
        # Kept simple here since this is a functional-prototype backend.
        self.password_hash: str = f"hash::{password}"
        self.location: str = location
        self.social_media: dict = social_media or {}   # e.g. {"instagram": "...", "linkedin": "..."}
        self.payment_method: Optional[dict] = None       # 3rd party token, e.g. Stripe customer id
        self.confirmed: bool = False
        self.created_at: str = datetime.datetime.utcnow().isoformat()

    def confirm_account(self) -> None:
        """Screen 2: confirm account."""
        self.confirmed = True

    def connect_payment_method(self, provider: str, token: str) -> None:
        self.payment_method = {"provider": provider, "token": token}

    def connect_social_media(self, platform: str, handle: str) -> None:
        self.social_media[platform] = handle


class Owner(User):
    """Owner-specific behavior: create/manage private boxes."""

    def __init__(self, name: str, email: str, password: str, location: str = "",
                 social_media: Optional[dict] = None):
        super().__init__(name, email, password, location, social_media)
        self.box_ids: list[str] = []  # one owner can own multiple boxes

    def link_box(self, box_id: str) -> None:
        self.box_ids.append(box_id)


class Renter(User):
    """Renter-specific behavior and preferences."""

    def __init__(self, name: str, email: str, password: str, location: str = "",
                 social_media: Optional[dict] = None):
        super().__init__(name, email, password, location, social_media)
        self.preferences: dict = {
            "price_min": None,
            "price_max": None,
            "preferred_stadiums": [],   # list of stadium ids
            "preferred_teams": [],
            "capacity_bucket": None,    # e.g. "0-20", "20-50"
        }
        self.booking_history_ids: list[str] = []  # request ids

    def save_preferences(self, **prefs) -> None:
        self.preferences.update({k: v for k, v in prefs.items() if v is not None})

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "location": self.location,
            "social_media": self.social_media,
            "preferences": self.preferences,
            "confirmed": self.confirmed,
        }