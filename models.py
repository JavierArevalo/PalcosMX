"""
models.py
Core data classes for Palcos, matching the "Data Structure definitions"
section of the Technical Roadmap: PrivateBox, Stadium, and User
(Owner / Renter), plus the RentRequest lifecycle object.

Persisted to SQLite via SQLAlchemy (see db.py). Method names and
signatures are kept identical to the original in-memory prototype so
booking_engine.py and app.py stay stable.

Note on JSON columns (social_media, preferences, payment, survey, ...):
plain JSON columns are not change-tracked in place — always REASSIGN the
whole dict/list (e.g. `self.preferences = {**self.preferences, **prefs}`)
rather than mutating it, or the change silently won't persist.
"""

from __future__ import annotations
import uuid
import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import generate_password_hash, check_password_hash

from db import Base


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def utcnow_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Private Box (+ Listing / BoxRequest / BookingRecord)
# ---------------------------------------------------------------------------

class Listing(Base):
    """One entry in a box's 'array of available dates'. A listing is for
    ONE box on ONE specific date, per the roadmap note.

    Carries its own stadium_id / location_in_stadium (copied from the
    parent PrivateBox at creation time) so a Listing is self-describing
    — useful once listings get passed around independently of their box
    (e.g. in the renter feed, or if a box's location ever changes later
    but past listings should keep the location they were booked at)."""
    __tablename__ = "listings"

    listing_id: Mapped[str] = mapped_column(String(12), primary_key=True, default=new_id)
    box_id: Mapped[str] = mapped_column(ForeignKey("boxes.id"))
    stadium_id: Mapped[str] = mapped_column(String(12))
    date: Mapped[str] = mapped_column(String)  # ISO date string, e.g. "2026-09-14"
    price: Mapped[float] = mapped_column(Float)
    capacity: Mapped[int] = mapped_column(Integer)
    location_in_stadium: Mapped[str] = mapped_column(String, default="")
    description: Mapped[str] = mapped_column(String, default="")

    box: Mapped["PrivateBox"] = relationship(back_populates="available_dates")

    def to_dict(self) -> dict:
        return {
            "listing_id": self.listing_id,
            "box_id": self.box_id,
            "stadium_id": self.stadium_id,
            "date": self.date,
            "price": self.price,
            "capacity": self.capacity,
            "location_in_stadium": self.location_in_stadium,
            "description": self.description,
        }


class BoxRequest(Base):
    """One rent request submitted against a private box for a specific
    date. Kept directly on the PrivateBox (rather than only in the
    booking engine's request table) so an owner looking at a box can see
    who has asked for a date and with what context, without a separate
    lookup. Multiple renters can request the same date — the box keeps
    all of them until one is accepted (see PrivateBox.requested_dates)."""
    __tablename__ = "box_requests"

    request_id: Mapped[str] = mapped_column(String(12), primary_key=True)
    box_id: Mapped[str] = mapped_column(ForeignKey("boxes.id"))
    renter_id: Mapped[str] = mapped_column(String(12))
    renter_name: Mapped[str] = mapped_column(String)
    date: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(String, default="")           # optional note from renter to owner
    renter_history: Mapped[list] = mapped_column(JSON, default=list)   # summarized past bookings for this renter
    status: Mapped[str] = mapped_column(String, default="pending")     # pending | accepted | rejected
    reject_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    requested_at: Mapped[str] = mapped_column(String, default=utcnow_iso)

    box: Mapped["PrivateBox"] = relationship(back_populates="box_requests")

    def to_dict(self) -> dict:
        return {
            "request_id": self.request_id,
            "box_id": self.box_id,
            "renter_id": self.renter_id,
            "renter_name": self.renter_name,
            "date": self.date,
            "message": self.message,
            "renter_history": self.renter_history,
            "status": self.status,
            "reject_reason": self.reject_reason,
            "requested_at": self.requested_at,
        }


class BookingRecord(Base):
    """One entry in a box's booking history."""
    __tablename__ = "booking_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    box_id: Mapped[str] = mapped_column(ForeignKey("boxes.id"))
    stadium_id: Mapped[str] = mapped_column(String(12))
    date: Mapped[str] = mapped_column(String)
    price_rented: Mapped[float] = mapped_column(Float)
    price_owner_received: Mapped[float] = mapped_column(Float)
    renter_name: Mapped[str] = mapped_column(String)
    location_in_stadium: Mapped[str] = mapped_column(String, default="")
    event_description: Mapped[str] = mapped_column(String, default="")

    box: Mapped["PrivateBox"] = relationship(back_populates="booking_history")

    def to_dict(self) -> dict:
        return {
            "box_id": self.box_id,
            "stadium_id": self.stadium_id,
            "date": self.date,
            "price_rented": self.price_rented,
            "price_owner_received": self.price_owner_received,
            "renter_name": self.renter_name,
            "location_in_stadium": self.location_in_stadium,
            "event_description": self.event_description,
        }


class PrivateBox(Base):
    """Class object of a private box (see roadmap: Data Structure
    definitions -> Class object of a private box)."""
    __tablename__ = "boxes"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=new_id)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    stadium_id: Mapped[str] = mapped_column(ForeignKey("stadiums.id"))
    capacity: Mapped[int] = mapped_column(Integer)
    location_in_stadium: Mapped[str] = mapped_column(String, default="")  # e.g. "North East, 5th floor"
    description: Mapped[str] = mapped_column(String, default="")

    # array of available dates to be rented
    available_dates: Mapped[list[Listing]] = relationship(
        back_populates="box", cascade="all, delete-orphan", order_by=Listing.date)
    # requests against this box (see requested_dates property for the
    # roadmap's date -> [requests] dictionary view)
    box_requests: Mapped[list[BoxRequest]] = relationship(
        back_populates="box", cascade="all, delete-orphan", order_by=BoxRequest.requested_at)
    # dict/history of past bookings
    booking_history: Mapped[list[BookingRecord]] = relationship(
        back_populates="box", cascade="all, delete-orphan")

    def __init__(self, owner_id: str, stadium_id: str, capacity: int,
                 location_in_stadium: str = "", description: str = "", **kw):
        super().__init__(owner_id=owner_id, stadium_id=stadium_id, capacity=capacity,
                         location_in_stadium=location_in_stadium, description=description, **kw)

    # -- Add Listing() -----------------------------------------------------
    def add_listing(self, date: str, price: float, capacity: Optional[int] = None,
                     description: str = "") -> Listing:
        """Owner publishes their private box to be rented for a specific
        date. Modifies 'array of available dates'."""
        listing = Listing(
            date=date,
            price=price,
            capacity=capacity if capacity is not None else self.capacity,
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
        for l in [l for l in self.available_dates if l.date == date]:
            self.available_dates.remove(l)  # delete-orphan cascade deletes the row
        return len(self.available_dates) < before

    def find_listing(self, date: str) -> Optional[Listing]:
        for l in self.available_dates:
            if l.date == date:
                return l
        return None

    # -- request tracking (who has asked for which date) -------------------
    @property
    def requested_dates(self) -> dict[str, list[BoxRequest]]:
        """The roadmap's 'date -> requests for that date' dictionary,
        derived from the box_requests relationship."""
        out: dict[str, list[BoxRequest]] = {}
        for r in self.box_requests:
            out.setdefault(r.date, []).append(r)
        return out

    def add_request(self, box_request: BoxRequest) -> None:
        """Record a new rent request against this box. Several requests
        can pile up for the same date; all are kept until one is accepted."""
        self.box_requests.append(box_request)

    def get_requests(self, date: Optional[str] = None) -> list[BoxRequest]:
        """All requests for a specific date, or every request on this box
        if date is omitted."""
        if date is not None:
            return [r for r in self.box_requests if r.date == date]
        return list(self.box_requests)

    def find_request(self, request_id: str) -> Optional[BoxRequest]:
        for r in self.box_requests:
            if r.request_id == request_id:
                return r
        return None

    def set_request_status(self, request_id: str, status: str,
                            reason: Optional[str] = None) -> Optional[BoxRequest]:
        r = self.find_request(request_id)
        if r is not None:
            r.status = status
            if reason:
                r.reject_reason = reason
        return r

    def record_booking(self, record: BookingRecord) -> None:
        self.booking_history.append(record)
        # a completed booking is no longer available
        self.remove_listing(record.date)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "owner_id": self.owner_id,
            "stadium_id": self.stadium_id,
            "capacity": self.capacity,
            "location_in_stadium": self.location_in_stadium,
            "description": self.description,
            "available_dates": [l.to_dict() for l in self.available_dates],
            "requested_dates": {
                date: [r.to_dict() for r in reqs] for date, reqs in self.requested_dates.items()
            },
            "booking_history": [b.to_dict() for b in self.booking_history],
        }


# ---------------------------------------------------------------------------
# Stadium
# ---------------------------------------------------------------------------

class Stadium(Base):
    """Class object of a stadium: a collection of private boxes."""
    __tablename__ = "stadiums"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String)
    city: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)

    boxes: Mapped[list[PrivateBox]] = relationship()

    def __init__(self, name: str, city: str, latitude: float = 0.0, longitude: float = 0.0, **kw):
        super().__init__(name=name, city=city, latitude=latitude, longitude=longitude, **kw)

    @property
    def box_ids(self) -> list[str]:
        return [b.id for b in self.boxes]

    def add_box(self, box_id: str) -> None:
        # Membership is now derived from PrivateBox.stadium_id; kept as a
        # no-op for interface compatibility with the in-memory prototype.
        pass

    def get_boxes(self, all_boxes=None, sort_by: Optional[str] = None) -> list[PrivateBox]:
        """Return all boxes within the stadium. sort_by can be 'price',
        'capacity', or None. (all_boxes param kept for compatibility.)"""
        boxes = list(self.boxes)
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
# User (base) / Owner / Renter  — single-table inheritance on 'role'
# ---------------------------------------------------------------------------

class User(Base):
    """Class object of a user: basic info, contains name, email, payment
    info (3rd party), location, preferences, social accounts, etc.
    Passwords are hashed with werkzeug (pbkdf2)."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=new_id)
    role: Mapped[str] = mapped_column(String(10))  # 'owner' | 'renter' discriminator
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    location: Mapped[str] = mapped_column(String, default="")
    social_media: Mapped[dict] = mapped_column(JSON, default=dict)  # e.g. {"instagram": "...", "linkedin": "..."}
    payment_method: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # 3rd party token, e.g. Stripe customer id
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    confirmation_code: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)  # simulated-email code
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # renters only
    created_at: Mapped[str] = mapped_column(String, default=utcnow_iso)

    __mapper_args__ = {"polymorphic_on": role, "polymorphic_identity": "user"}

    def __init__(self, name: str, email: str, password: str,
                 location: str = "", social_media: Optional[dict] = None, **kw):
        super().__init__(name=name, email=email,
                         password_hash=generate_password_hash(password),
                         location=location, social_media=social_media or {}, **kw)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def confirm_account(self) -> None:
        """Screen 2: confirm account."""
        self.confirmed = True
        self.confirmation_code = None

    def connect_payment_method(self, provider: str, token: str) -> None:
        self.payment_method = {"provider": provider, "token": token}

    def connect_social_media(self, platform: str, handle: str) -> None:
        self.social_media = {**self.social_media, platform: handle}


class Owner(User):
    """Owner-specific behavior: create/manage private boxes."""
    __mapper_args__ = {"polymorphic_identity": "owner"}

    boxes: Mapped[list[PrivateBox]] = relationship(
        primaryjoin="Owner.id == foreign(PrivateBox.owner_id)")

    @property
    def box_ids(self) -> list[str]:
        return [b.id for b in self.boxes]  # one owner can own multiple boxes

    def link_box(self, box_id: str) -> None:
        # Ownership is now derived from PrivateBox.owner_id; kept as a
        # no-op for interface compatibility with the in-memory prototype.
        pass


DEFAULT_PREFERENCES = {
    "price_min": None,
    "price_max": None,
    "preferred_stadiums": [],   # list of stadium ids
    "preferred_teams": [],
    "capacity_bucket": None,    # e.g. "0-20", "20-50"
}


class Renter(User):
    """Renter-specific behavior and preferences."""
    __mapper_args__ = {"polymorphic_identity": "renter"}

    rent_requests: Mapped[list["RentRequest"]] = relationship(
        primaryjoin="Renter.id == foreign(RentRequest.renter_id)",
        order_by="RentRequest.created_at")

    def __init__(self, name: str, email: str, password: str, location: str = "",
                 social_media: Optional[dict] = None, **kw):
        super().__init__(name, email, password, location, social_media,
                         preferences=dict(DEFAULT_PREFERENCES), **kw)

    @property
    def booking_history_ids(self) -> list[str]:
        return [r.id for r in self.rent_requests]  # request ids

    def save_preferences(self, **prefs) -> None:
        # Reassign (don't mutate) so the JSON column change is persisted.
        self.preferences = {**(self.preferences or dict(DEFAULT_PREFERENCES)),
                            **{k: v for k, v in prefs.items() if v is not None}}

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


# ---------------------------------------------------------------------------
# Rent Request (booking-engine lifecycle object)
# ---------------------------------------------------------------------------

class RentRequest(Base):
    """Created by BookingEngine.create_rent_request(). Carries renter info
    so the owner has enough context to evaluate the request."""
    __tablename__ = "rent_requests"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=new_id)
    box_id: Mapped[str] = mapped_column(ForeignKey("boxes.id"))
    listing_id: Mapped[str] = mapped_column(String(12))
    renter_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    date: Mapped[str] = mapped_column(String)
    price: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | accepted | rejected | paid | completed
    reject_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    message: Mapped[str] = mapped_column(String, default="")        # optional note from renter to owner
    renter_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)  # history/email/social, etc.
    payment: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    survey: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[str] = mapped_column(String, default=utcnow_iso)
