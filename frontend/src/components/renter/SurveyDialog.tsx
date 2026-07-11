/**
 * Post-visit survey: two 1–5 star ratings + optional comments.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { post } from "@/lib/api";
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

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[oklch(0.75_0.008_80)]" style={outfit}>
        {label}
      </span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} estrellas`}>
            <Star
              size={20}
              className={
                n <= value
                  ? "fill-[oklch(0.72_0.12_75)] text-[oklch(0.72_0.12_75)]"
                  : "text-white/20 hover:text-white/40"
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SurveyDialog({
  requestId,
  onClose,
}: {
  requestId: string | null;
  onClose: () => void;
}) {
  const [boxExp, setBoxExp] = useState(5);
  const [bookingExp, setBookingExp] = useState(5);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!requestId) return;
    setBusy(true);
    try {
      await post(`/api/requests/${requestId}/survey`, {
        box_experience: boxExp,
        booking_experience: bookingExp,
        comments: comments.trim(),
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ["myRequests"] });
      toast.success("¡Gracias por tus comentarios!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar la encuesta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={requestId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[oklch(0.13_0.007_260)] border-white/10">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl">
            ¿Cómo fue tu visita?
          </DialogTitle>
          <DialogDescription style={outfit}>Tu opinión mejora la experiencia para todos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <StarRow label="Experiencia en el palco" value={boxExp} onChange={setBoxExp} />
          <StarRow label="Proceso de reserva" value={bookingExp} onChange={setBookingExp} />
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Comentarios (opcional)"
            rows={2}
            style={outfit}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} style={outfit}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy} className="btn-gold rounded-sm">
            {busy ? "Enviando..." : "Enviar Encuesta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
