/**
 * Rent-request dialog: renter fills in event details (occasion, affiliated
 * company, guest counts, catering) plus an optional note, and submits
 * POST /api/requests for a specific listing (box + date).
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const requestSchema = z
  .object({
    event_type: z.string().min(1, "Indica el motivo del evento"),
    company: z.string().optional(),
    expected_guests: z
      .string()
      .min(1, "Ingresa el número esperado")
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, "Número inválido"),
    max_guests: z
      .string()
      .min(1, "Ingresa el máximo")
      .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, "Número inválido"),
    needs_catering: z.enum(["yes", "no"]),
    message: z.string().optional(),
  })
  .refine((data) => Number(data.max_guests) >= Number(data.expected_guests), {
    message: "El máximo debe ser mayor o igual al número esperado",
    path: ["max_guests"],
  });
type RequestValues = z.infer<typeof requestSchema>;

export default function RequestDialog({
  entry,
  onClose,
}: {
  entry: FeedEntry | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<RequestValues>({ resolver: zodResolver(requestSchema) });
  const err = form.formState.errors;

  const handleClose = () => {
    form.reset({ event_type: "", company: "", expected_guests: "", max_guests: "", message: "", needs_catering: undefined });
    onClose();
  };

  const onSubmit = async (values: RequestValues) => {
    if (!entry) return;
    try {
      await post<RentRequest>("/api/requests", {
        box_id: entry.box_id,
        date: entry.date,
        event_type: values.event_type.trim(),
        company: values.company?.trim() || "",
        expected_guests: Number(values.expected_guests),
        max_guests: Number(values.max_guests),
        needs_catering: values.needs_catering === "yes",
        message: values.message?.trim() || "",
      });
      handleClose();
      queryClient.invalidateQueries({ queryKey: ["myRequests"] });
      toast.success("Solicitud enviada al propietario", {
        description: "Sigue su estado en Mis Reservas.",
        action: { label: "Ver", onClick: () => navigate("/mis-reservas") },
      });
    } catch (e) {
      handleClose();
      // Confirmation-gated 403s already get the central toast.
      if (!(e instanceof Error && "needsConfirmation" in e && (e as { needsConfirmation: boolean }).needsConfirmation)) {
        toast.error(e instanceof Error ? e.message : "No se pudo enviar la solicitud");
      }
    }
  };

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-[oklch(0.13_0.007_260)] border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl">
            Solicitar esta suite
          </DialogTitle>
          <DialogDescription style={outfit}>
            {entry && (
              <>
                {entry.stadium_name} · {formatDate(entry.date)} ·{" "}
                <span className="text-[oklch(0.72_0.12_75)]">{formatMXN(entry.price)}</span>
                {" · "}Capacidad del palco: {entry.capacity}
                <br />
                El propietario verá esta información junto con tu historial de reservas.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>
              Evento — ¿cuál es la ocasión?
            </Label>
            <Input placeholder="p. ej. Cumpleaños, boda, evento corporativo" {...form.register("event_type")} />
            {err.event_type && <p className="text-xs text-red-400" style={outfit}>{err.event_type.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>
              Empresa afiliada (opcional)
            </Label>
            <Input placeholder="Si aplica" {...form.register("company")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>
                Invitados esperados
              </Label>
              <Input type="number" min="1" placeholder="p. ej. 10" {...form.register("expected_guests")} />
              {err.expected_guests && <p className="text-xs text-red-400" style={outfit}>{err.expected_guests.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>
                Máximo de invitados
              </Label>
              <Input type="number" min="1" placeholder="p. ej. 15" {...form.register("max_guests")} />
              {err.max_guests && <p className="text-xs text-red-400" style={outfit}>{err.max_guests.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>
              ¿Necesitas servicio de catering?
            </Label>
            <RadioGroup
              value={form.watch("needs_catering") ?? undefined}
              onValueChange={(v) => form.setValue("needs_catering", v as "yes" | "no", { shouldValidate: true })}
              className="flex gap-6"
            >
              <label className="flex items-center gap-2 text-sm text-white" style={outfit}>
                <RadioGroupItem value="yes" /> Sí, necesito catering
              </label>
              <label className="flex items-center gap-2 text-sm text-white" style={outfit}>
                <RadioGroupItem value="no" /> No, yo lo proveo
              </label>
            </RadioGroup>
            {err.needs_catering && <p className="text-xs text-red-400" style={outfit}>Selecciona una opción</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>
              Detalles adicionales (opcional)
            </Label>
            <Textarea
              placeholder="Agrega cualquier otra nota para el propietario"
              rows={3}
              style={outfit}
              {...form.register("message")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose} style={outfit}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="btn-gold rounded-sm">
              {form.formState.isSubmitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
