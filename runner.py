"""
runner.py
Background job for the rent-request lifecycle. Decoupled from the web
process on purpose — app.py only writes requests; this is what notices
them and acts. Does ONE pass per invocation; run it on a schedule (cron,
a hosted scheduled job, or a simple loop) rather than embedding its own
sleep loop here.

Each pass, in order:
  1. Email the owner of any pending request they haven't been notified
     about yet (owner_notified_at IS NULL).
  2. Send a one-time reminder for any pending request past its
     respond_by deadline (3 days after it was sent, or 7 days before the
     event if that's sooner) that hasn't been reminded yet.
  3. Auto-reject any pending request whose reminder was sent 12+ hours
     ago with still no owner decision, and tell the renter so they can
     look at other boxes.

Run:
    uv run python runner.py
"""
import datetime

from db import db_session, init_db
from models import RentRequest
from booking_engine import BookingEngine
import notifications

AUTO_REJECT_GRACE = datetime.timedelta(hours=12)
AUTO_REJECT_REASON = "No response from the owner within the required window."

engine = BookingEngine()


def _now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def notify_new_requests() -> int:
    pending = db_session.query(RentRequest).filter(
        RentRequest.status == "pending",
        RentRequest.owner_notified_at.is_(None),
    ).all()
    for r in pending:
        box = engine._get_box(r.box_id)
        owner = engine._get_owner(box.owner_id)
        notifications.send_new_request_email(owner, box, r)
        r.owner_notified_at = _now_iso()
    if pending:
        db_session.commit()
    return len(pending)


def send_reminders() -> int:
    now = _now_iso()
    overdue = db_session.query(RentRequest).filter(
        RentRequest.status == "pending",
        RentRequest.reminder_sent_at.is_(None),
        RentRequest.respond_by.is_not(None),
        RentRequest.respond_by <= now,
    ).all()
    for r in overdue:
        box = engine._get_box(r.box_id)
        owner = engine._get_owner(box.owner_id)
        notifications.send_response_reminder_email(owner, box, r)
        r.reminder_sent_at = now
    if overdue:
        db_session.commit()
    return len(overdue)


def auto_reject_stale() -> int:
    cutoff = (datetime.datetime.now(datetime.timezone.utc) - AUTO_REJECT_GRACE).isoformat()
    stale = db_session.query(RentRequest).filter(
        RentRequest.status == "pending",
        RentRequest.reminder_sent_at.is_not(None),
        RentRequest.reminder_sent_at <= cutoff,
    ).all()
    for r in stale:
        box = engine._get_box(r.box_id)
        renter = engine._get_renter(r.renter_id)
        engine.reject_booking(r.id, reason=AUTO_REJECT_REASON)
        notifications.send_auto_rejected_email(renter, box, r)
    if stale:
        db_session.commit()
    return len(stale)


def run_once() -> dict:
    notified = notify_new_requests()
    reminded = send_reminders()
    auto_rejected = auto_reject_stale()
    return {"notified": notified, "reminded": reminded, "auto_rejected": auto_rejected}


if __name__ == "__main__":
    init_db()
    result = run_once()
    print(f"[palcos-runner] notified={result['notified']} "
          f"reminded={result['reminded']} auto_rejected={result['auto_rejected']}")
