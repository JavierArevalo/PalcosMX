"""
notifications.py
Outbound email — the rent-request lifecycle emails are sent by runner.py
(deliberately decoupled, see runner.py); the signup/resend confirmation
code is sent inline, synchronously, from auth.py, since it's needed right
away rather than on a polling schedule.

Uses Resend (https://resend.com). If RESEND_API_KEY isn't set, sends are
simulated (printed) instead of attempted, so local dev works without a
real account.
"""
import os

import resend

resend.api_key = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "Palcos <onboarding@resend.dev>")
APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:5050").rstrip("/")


def _send(to: str, subject: str, html: str) -> None:
    """Best-effort: never raises — a delivery failure shouldn't block the
    underlying booking action."""
    if not resend.api_key:
        print(f"[palcos] Simulated email to {to}: {subject}")
        return
    try:
        resend.Emails.send({"from": FROM_EMAIL, "to": to, "subject": subject, "html": html})
    except Exception as e:
        print(f"[palcos] Failed to send email to {to}: {e}")


def send_confirmation_code_email(user, code: str) -> None:
    """Signup (or resend): the 6-digit account confirmation code."""
    confirm_url = f"{APP_BASE_URL}/confirmar"
    _send(
        user.email,
        "Tu código de confirmación de Palcos",
        f"<p>Hola {user.name},</p>"
        f"<p>Tu código de confirmación es:</p>"
        f'<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">{code}</p>'
        f'<p>Ingrésalo en la <a href="{confirm_url}">página de confirmación</a> '
        f"para activar tu cuenta.</p>",
    )


def send_new_request_email(owner, box, rent_request) -> None:
    """A renter just requested one of the owner's dates."""
    details = []
    if rent_request.event_type:
        details.append(f"<strong>Evento:</strong> {rent_request.event_type}")
    if rent_request.company:
        details.append(f"<strong>Empresa:</strong> {rent_request.company}")
    if rent_request.expected_guests is not None:
        guests = f"{rent_request.expected_guests}"
        if rent_request.max_guests is not None and rent_request.max_guests != rent_request.expected_guests:
            guests += f" (máx. {rent_request.max_guests})"
        details.append(f"<strong>Invitados:</strong> {guests}")
    if rent_request.needs_catering is not None:
        catering = "Necesita catering" if rent_request.needs_catering else "Lo provee el arrendatario"
        details.append(f"<strong>Catering:</strong> {catering}")
    details_html = (
        "<ul>" + "".join(f"<li>{d}</li>" for d in details) + "</ul>" if details else ""
    )
    note = f"<p>Mensaje del arrendatario: &ldquo;{rent_request.message}&rdquo;</p>" if rent_request.message else ""
    solicitudes_url = f"{APP_BASE_URL}/solicitudes"
    _send(
        owner.email,
        f"Nueva solicitud para tu palco — {rent_request.date}",
        f"<p>Hola {owner.name},</p>"
        f"<p>Tienes una nueva solicitud de renta para tu palco "
        f"({box.location_in_stadium or box.id}) el <strong>{rent_request.date}</strong>, "
        f"por ${rent_request.price:,.0f} MXN.</p>"
        f"{details_html}"
        f"{note}"
        f'<p><a href="{solicitudes_url}">Ver la solicitud y responder</a> '
        f"(requiere iniciar sesión con tu cuenta de propietario).</p>",
    )


def send_response_reminder_email(owner, box, rent_request) -> None:
    """The owner's response window has passed and the request is still
    pending — one last nudge before it gets auto-rejected."""
    solicitudes_url = f"{APP_BASE_URL}/solicitudes"
    _send(
        owner.email,
        f"Acción requerida: solicitud pendiente — {rent_request.date}",
        f"<p>Hola {owner.name},</p>"
        f"<p>Sigue pendiente tu respuesta a la solicitud de renta de tu palco "
        f"({box.location_in_stadium or box.id}) para el <strong>{rent_request.date}</strong>.</p>"
        f"<p>Tienes <strong>12 horas</strong> para "
        f'<a href="{solicitudes_url}">aceptarla o rechazarla</a> '
        f"antes de que se rechace automáticamente y el arrendatario pueda buscar otras opciones.</p>",
    )


def send_request_accepted_email(renter, box, rent_request) -> None:
    """The owner accepted the request — next step is payment."""
    mis_reservas_url = f"{APP_BASE_URL}/mis-reservas"
    _send(
        renter.email,
        f"¡Tu solicitud fue aceptada! — {rent_request.date}",
        f"<p>Hola {renter.name},</p>"
        f"<p>El propietario aceptó tu solicitud para el palco "
        f"({box.location_in_stadium or box.id}) el <strong>{rent_request.date}</strong>, "
        f"por ${rent_request.price:,.0f} MXN.</p>"
        f'<p><a href="{mis_reservas_url}">Ve a Mis Reservas para pagar y confirmar</a>.</p>',
    )


def send_request_rejected_email(renter, box, rent_request) -> None:
    """The owner declined the request (or it lost out to another request
    for the same box/date) — let the renter know, with the reason if any."""
    explore_url = f"{APP_BASE_URL}/explorar"
    reason_html = f"<p>Motivo: {rent_request.reject_reason}</p>" if rent_request.reject_reason else ""
    _send(
        renter.email,
        f"Tu solicitud fue rechazada — {rent_request.date}",
        f"<p>Hola {renter.name},</p>"
        f"<p>El propietario rechazó tu solicitud para el palco "
        f"({box.location_in_stadium or box.id}) el <strong>{rent_request.date}</strong>.</p>"
        f"{reason_html}"
        f'<p><a href="{explore_url}">Explora otros palcos disponibles</a> para esa fecha.</p>',
    )


def send_auto_rejected_email(renter, box, rent_request) -> None:
    """The owner didn't respond in time and the request was auto-rejected —
    let the renter know so they can look at other boxes."""
    explore_url = f"{APP_BASE_URL}/explorar"
    _send(
        renter.email,
        f"Tu solicitud no fue respondida a tiempo — {rent_request.date}",
        f"<p>Hola {renter.name},</p>"
        f"<p>El propietario no respondió a tiempo tu solicitud de renta para el "
        f"<strong>{rent_request.date}</strong>, así que la cancelamos automáticamente.</p>"
        f'<p><a href="{explore_url}">Explora otros palcos disponibles</a> para esa fecha.</p>',
    )
