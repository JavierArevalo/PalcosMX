"""
auth.py
Session-based authentication + onboarding (roadmap Screens 1-2) for Palcos.

- Passwords hashed with werkzeug (see models.User).
- Identity lives in Flask's server-signed session cookie: user_id + role.
- Email confirmation is SIMULATED: a 6-digit code is generated at signup,
  printed to the server log and returned in the response as
  `demo_confirmation_code` (a real product would email it instead).
- Unconfirmed users can log in and browse, but transactional writes
  (creating boxes/listings, accepting/rejecting, requesting, paying) are
  gated behind `confirmed_required`.
"""

from __future__ import annotations
import secrets
from functools import wraps

from flask import Blueprint, request, session, jsonify
from sqlalchemy.exc import IntegrityError

from db import db_session
from models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# set in init_auth() — the engine instance lives in app.py
engine = None


def init_auth(booking_engine):
    global engine
    engine = booking_engine


# ---------------------------------------------------------------------------
# Session helpers / decorators
# ---------------------------------------------------------------------------

def current_user() -> User | None:
    """The logged-in user, or None. A session pointing at a user that no
    longer exists (e.g. palcos.db was deleted) is treated as logged out."""
    user_id = session.get("user_id")
    if not user_id:
        return None
    user = db_session.get(User, user_id)
    if user is None:
        session.clear()
    return user


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if current_user() is None:
            return jsonify({"error": "Log in first"}), 401
        return fn(*args, **kwargs)
    return wrapper


def role_required(role: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if user is None:
                return jsonify({"error": "Log in first"}), 401
            if user.role != role:
                return jsonify({"error": f"This action requires a {role} account"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def confirmed_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if user is None:
            return jsonify({"error": "Log in first"}), 401
        if not user.confirmed:
            return jsonify({"error": "Confirm your account first (check the code from signup)",
                            "needs_confirmation": True}), 403
        return fn(*args, **kwargs)
    return wrapper


def _login(user: User) -> None:
    session["user_id"] = user.id
    session["role"] = user.role


def _me_json(user: User) -> dict:
    out = {
        "id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "location": user.location,
        "social_media": user.social_media,
        "confirmed": user.confirmed,
    }
    if user.role == "renter":
        out["preferences"] = user.preferences
    return out


def _new_confirmation_code(user: User) -> str:
    """Simulated Screen-2 email: generate + 'send' (log) a 6-digit code."""
    code = f"{secrets.randbelow(1_000_000):06d}"
    user.confirmation_code = code
    db_session.commit()
    print(f"[palcos] Simulated confirmation email to {user.email}: your code is {code}")
    return code


# ---------------------------------------------------------------------------
# Routes — Screen 1 (create account) + Screen 2 (confirm)
# ---------------------------------------------------------------------------

@bp.post("/signup")
def signup():
    d = request.json or {}
    role = d.get("role")
    if role not in ("owner", "renter"):
        return jsonify({"error": "role must be 'owner' or 'renter'"}), 400

    missing = [f for f in ("name", "email", "password") if not d.get(f)]
    if missing:
        return jsonify({"error": f"Missing field(s): {', '.join(missing)}"}), 400

    social = {k: v for k, v in (d.get("social_media") or {}).items() if v}
    # Roadmap: renters must link at least one social account so owners can
    # vet who they're renting to.
    if role == "renter" and not social:
        return jsonify({"error": "Renters must link at least one social media account"}), 400

    try:
        if role == "owner":
            user = engine.create_owner_account(d["name"], d["email"], d["password"],
                                               d.get("location", ""), social)
        else:
            user = engine.create_renter_account(d["name"], d["email"], d["password"],
                                                d.get("location", ""), social)
    except IntegrityError:
        db_session.rollback()
        return jsonify({"error": "An account with that email already exists"}), 409

    code = _new_confirmation_code(user)
    _login(user)
    return jsonify({**_me_json(user), "demo_confirmation_code": code}), 201


@bp.post("/confirm")
@login_required
def confirm():
    user = current_user()
    if user.confirmed:
        return jsonify(_me_json(user))
    code = (request.json or {}).get("code", "").strip()
    if not code or code != user.confirmation_code:
        return jsonify({"error": "Invalid confirmation code"}), 400
    user.confirm_account()
    db_session.commit()
    return jsonify(_me_json(user))


@bp.post("/resend-code")
@login_required
def resend_code():
    user = current_user()
    if user.confirmed:
        return jsonify({"error": "Account is already confirmed"}), 400
    code = _new_confirmation_code(user)
    return jsonify({"demo_confirmation_code": code})


# ---------------------------------------------------------------------------
# Routes — login / logout / me
# ---------------------------------------------------------------------------

@bp.post("/login")
def login():
    d = request.json or {}
    user = engine.get_user_by_email(d.get("email", ""))
    if user is None or not user.check_password(d.get("password", "")):
        return jsonify({"error": "Invalid email or password"}), 401
    _login(user)
    return jsonify(_me_json(user))


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"ok": True})


@bp.get("/me")
def me():
    user = current_user()
    if user is None:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify(_me_json(user))
