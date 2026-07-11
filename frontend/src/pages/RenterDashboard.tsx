/**
 * /mis-reservas — the renter's request lifecycle:
 * pending → accepted (pay) → paid (instructions) → completed (survey).
 * Includes the editable preferences card.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, ScrollText, MessageSquareHeart } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";
import StatusBadge from "@/components/StatusBadge";
import SurveyDialog from "@/components/renter/SurveyDialog";
import PreferencesForm from "@/components/renter/PreferencesForm";
import { api, post, type RentRequest } from "@/lib/api";
import { formatMXN, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;

function RequestCard({ request, onSurvey }: { request: RentRequest; onSurvey: (id: string) => void }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["myRequests"] });

  const run = async (fn: () => Promise<unknown>, successMsg?: string) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "La acción no se pudo completar");
    } finally {
      setBusy(false);
    }
  };

  const pay = () =>
    run(
      () =>
        post(`/api/requests/${request.id}/payment`, {
          amount: request.price,
          deposit: Math.round(request.price * 1.2 * 100) / 100,
          provider: "stripe",
          token: "tok_demo",
        }),
      "Pago confirmado — tu suite está reservada.",
    );

  const instructions = () => run(() => api(`/api/requests/${request.id}/instructions`));

  return (
    <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white" style={serif}>
            {formatDate(request.date)} · <span className="text-gold-gradient">{formatMXN(request.price)}</span>
          </div>
          {request.message && (
            <div className="text-xs text-[oklch(0.58_0.010_260)] italic mt-0.5" style={outfit}>
              "{request.message}"
            </div>
          )}
        </div>
        <StatusBadge status={request.status} />
      </div>

      {request.reject_reason && (
        <p className="text-xs text-red-300/80" style={outfit}>
          {request.reject_reason}
        </p>
      )}

      {request.instructions && (
        <p className="text-xs text-[oklch(0.75_0.008_80)] bg-white/5 border border-white/8 rounded-md p-3 leading-relaxed" style={outfit}>
          {request.instructions}
        </p>
      )}

      {/* Actions per status */}
      <div className="flex flex-wrap gap-2">
        {request.status === "accepted" && (
          <Button onClick={pay} disabled={busy} size="sm" className="btn-gold rounded-sm">
            <CreditCard size={14} /> Pagar y confirmar ({formatMXN(request.price)} + depósito)
          </Button>
        )}
        {request.status === "paid" && (
          <Button onClick={instructions} disabled={busy} size="sm" variant="outline" className="rounded-sm border-[oklch(0.72_0.12_75/40%)] text-[oklch(0.82_0.10_80)]" style={outfit}>
            <ScrollText size={14} /> Ver instrucciones de acceso
          </Button>
        )}
        {request.status === "completed" && !request.survey && (
          <Button onClick={() => onSurvey(request.id)} size="sm" variant="outline" className="rounded-sm border-white/15" style={outfit}>
            <MessageSquareHeart size={14} /> Dejar comentarios
          </Button>
        )}
        {request.status === "completed" && request.survey && (
          <span className="text-xs text-[oklch(0.58_0.010_260)]" style={outfit}>
            ¡Gracias por tus comentarios!
          </span>
        )}
      </div>
    </div>
  );
}

export default function RenterDashboard() {
  const [surveyTarget, setSurveyTarget] = useState<string | null>(null);
  const { data: requests, isLoading } = useQuery({
    queryKey: ["myRequests"],
    queryFn: () => api<RentRequest[]>("/api/my/requests"),
  });

  return (
    <AppShell>
      <PageHeading
        eyebrow="Mi Cuenta"
        title="Mis"
        accent="Reservas"
        subtitle="Sigue tus solicitudes: del envío al pago y las instrucciones de acceso."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Requests */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
          ) : requests && requests.length > 0 ? (
            requests.map((r) => <RequestCard key={r.id} request={r} onSurvey={setSurveyTarget} />)
          ) : (
            <p className="text-[oklch(0.58_0.010_260)] italic py-8" style={outfit}>
              Aún no tienes solicitudes — explora los palcos disponibles para enviar la primera.
            </p>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4" style={serif}>
            Mis <span className="text-gold-gradient italic">Preferencias</span>
          </h2>
          <PreferencesForm />
        </div>
      </div>

      <SurveyDialog requestId={surveyTarget} onClose={() => setSurveyTarget(null)} />
    </AppShell>
  );
}
