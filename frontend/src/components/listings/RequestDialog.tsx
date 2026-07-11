/**
 * Rent-request dialog: renter adds an optional note and submits
 * POST /api/requests for a specific listing (box + date).
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { navigate } from "wouter/use-browser-location";
import { post, type FeedEntry, type RentRequest } from "@/lib/api";
import { formatMXN, formatDate } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

export default function RequestDialog({
  entry,
  onClose,
}: {
  entry: FeedEntry | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!entry) return;
    setBusy(true);
    try {
      await post<RentRequest>("/api/requests", {
        box_id: entry.box_id,
        date: entry.date,
        message: message.trim(),
      });
      onClose();
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["myRequests"] });
      toast.success("Solicitud enviada al propietario", {
        description: "Sigue su estado en Mis Reservas.",
        action: { label: "Ver", onClick: () => navigate("/mis-reservas") },
      });
    } catch (e) {
      onClose();
      // Confirmation-gated 403s already get the central toast.
      if (!(e instanceof Error && "needsConfirmation" in e && (e as { needsConfirmation: boolean }).needsConfirmation)) {
        toast.error(e instanceof Error ? e.message : "No se pudo enviar la solicitud");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[oklch(0.13_0.007_260)] border-white/10">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl">
            Solicitar esta suite
          </DialogTitle>
          <DialogDescription style={outfit}>
            {entry && (
              <>
                {entry.stadium_name} · {formatDate(entry.date)} ·{" "}
                <span className="text-[oklch(0.72_0.12_75)]">{formatMXN(entry.price)}</span>
                <br />
                El propietario verá tu nombre, tu nota y tu historial de reservas.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Agrega una nota para el propietario (opcional)"
          rows={3}
          style={outfit}
        />

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} style={outfit}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy} className="btn-gold rounded-sm">
            {busy ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
