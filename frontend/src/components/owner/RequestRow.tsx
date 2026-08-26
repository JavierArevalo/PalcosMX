/**
 * Owner: one incoming rent request with renter context (name, note,
 * booking history) and accept/decline actions.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { post, type Box, type BoxRequest } from "@/lib/api";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

export default function RequestRow({ request, box }: { request: BoxRequest; box: Box }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["myBoxes"] });
    queryClient.invalidateQueries({ queryKey: ["myRequests"] });
  };

  const accept = async () => {
    setBusy(true);
    try {
      await post(`/api/requests/${request.request_id}/accept`);
      toast.success(`Solicitud de ${request.renter_name} aceptada — el arrendatario ya puede pagar.`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo aceptar");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await post(`/api/requests/${request.request_id}/reject`, reason.trim() ? { reason: reason.trim() } : {});
      toast.success("Solicitud rechazada.");
      setRejectOpen(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo rechazar");
    } finally {
      setBusy(false);
    }
  };

  const historyCount = request.renter_history?.length ?? 0;

  return (
    <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-4 flex flex-wrap items-center gap-4 justify-between">
      <div className="min-w-52">
        <div className="text-sm text-white font-semibold" style={outfit}>
          {request.renter_name}
          <span className="text-[oklch(0.50_0.008_260)] font-normal">
            {" "}· {historyCount === 0 ? "sin historial" : `${historyCount} solicitud${historyCount === 1 ? "" : "es"} previa${historyCount === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="text-xs text-[oklch(0.58_0.010_260)] mt-0.5" style={outfit}>
          {formatDate(request.date)} · {box.description || "Suite Privada"}
          {box.location_in_stadium ? ` (${box.location_in_stadium})` : ""}
        </div>

        {(request.event_type || request.company || request.expected_guests != null) && (
          <div className="text-xs text-[oklch(0.75_0.008_80)] mt-1.5 space-y-0.5" style={outfit}>
            {request.event_type && (
              <div>
                <span className="text-[oklch(0.50_0.008_260)]">Evento: </span>
                {request.event_type}
              </div>
            )}
            {request.company && (
              <div>
                <span className="text-[oklch(0.50_0.008_260)]">Empresa: </span>
                {request.company}
              </div>
            )}
            {request.expected_guests != null && (
              <div>
                <span className="text-[oklch(0.50_0.008_260)]">Invitados: </span>
                {request.expected_guests}
                {request.max_guests != null && request.max_guests !== request.expected_guests
                  ? ` (máx. ${request.max_guests})`
                  : ""}
              </div>
            )}
            {request.needs_catering != null && (
              <div>
                <span className="text-[oklch(0.50_0.008_260)]">Catering: </span>
                {request.needs_catering ? "Necesita catering" : "Lo provee el arrendatario"}
              </div>
            )}
          </div>
        )}

        {request.message && (
          <div className="text-xs text-[oklch(0.72_0.010_260)] italic mt-1" style={outfit}>
            "{request.message}"
          </div>
        )}
        {request.reject_reason && (
          <div className="text-xs text-red-300/80 mt-1" style={outfit}>
            {request.reject_reason}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={request.status} />
        {request.status === "pending" && (
          <div className="flex gap-2">
            <Button onClick={accept} disabled={busy} size="sm" className="btn-gold rounded-sm">
              <Check size={14} /> Aceptar
            </Button>
            <Button
              onClick={() => setRejectOpen(true)}
              disabled={busy}
              size="sm"
              variant="outline"
              className="rounded-sm border-white/15 hover:border-red-400/50 hover:text-red-300"
              style={outfit}
            >
              <X size={14} /> Rechazar
            </Button>
          </div>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-[oklch(0.13_0.007_260)] border-white/10">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl">
              Rechazar solicitud
            </DialogTitle>
            <DialogDescription style={outfit}>
              {request.renter_name} · {formatDate(request.date)} — el arrendatario verá el motivo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional — se usa uno estándar si lo dejas vacío)"
            rows={2}
            style={outfit}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)} style={outfit}>
              Cancelar
            </Button>
            <Button onClick={reject} disabled={busy} variant="destructive" className="rounded-sm">
              {busy ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
