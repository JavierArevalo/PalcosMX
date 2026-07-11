/**
 * Shown to logged-in, unconfirmed users on every app page. Placeholder in
 * Phase 1 — the inline code entry arrives with the auth flows (Phase 2).
 */
import { useAuth } from "@/contexts/AuthContext";

export default function ConfirmBanner() {
  const { user } = useAuth();
  if (!user || user.confirmed) return null;

  return (
    <div
      className="mb-8 flex flex-wrap items-center gap-3 rounded-md border border-[oklch(0.72_0.12_75/40%)] bg-[oklch(0.72_0.12_75/10%)] px-4 py-3 text-sm text-[oklch(0.82_0.10_80)]"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      Tu cuenta aún no está confirmada — ingresa el código de tu correo (simulado) para desbloquear las reservas.
    </div>
  );
}
