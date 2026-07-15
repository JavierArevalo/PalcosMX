/**
 * Onboarding step 3: publish available date(s) for the box created in
 * step 2. Each "Agregar fecha" posts immediately (same endpoint as the
 * dashboard's listing creation) so the owner sees instant confirmation,
 * and can add several dates before finishing.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, Check } from "lucide-react";
import { post, type Box } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDate, formatMXN } from "@/lib/format";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const listingSchema = z.object({
  date: z.string().min(1, "Elige una fecha"),
  price: z
    .string()
    .min(1, "Ingresa el precio")
    .refine((v) => Number(v) > 0, "Precio inválido"),
  description: z.string().optional(),
});
type ListingValues = z.infer<typeof listingSchema>;

type AddedListing = { listing_id: string; date: string; price: number };

export default function OnboardingAvailabilityStep({ box, onFinish }: { box: Box; onFinish: () => void }) {
  const queryClient = useQueryClient();
  const [added, setAdded] = useState<AddedListing[]>([]);

  const form = useForm<ListingValues>({
    resolver: zodResolver(listingSchema),
  });

  const onSubmit = async (values: ListingValues) => {
    try {
      const listing = await post<AddedListing>(`/api/boxes/${box.id}/listings`, {
        date: values.date,
        price: Number(values.price),
        description: values.description || "",
      });
      setAdded((prev) => [...prev, listing]);
      toast.success("Fecha publicada.");
      form.reset({ date: "", price: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["myBoxes"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo publicar la fecha");
    }
  };

  const err = form.formState.errors;

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Fecha disponible</Label>
          <Input type="date" {...form.register("date")} />
          {err.date && <p className="text-xs text-red-400" style={outfit}>{err.date.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Precio (MXN)</Label>
          <Input type="number" min="1" step="0.01" placeholder="p. ej. 8500" {...form.register("price")} />
          {err.price && <p className="text-xs text-red-400" style={outfit}>{err.price.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Evento (opcional)</Label>
          <Input placeholder="p. ej. Clásico de Liga MX" {...form.register("description")} />
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          variant="outline"
          className="w-full py-5 rounded-sm text-sm gap-2"
        >
          <CalendarPlus size={16} />
          {form.formState.isSubmitting ? "Publicando..." : "Agregar fecha"}
        </Button>
      </form>

      {added.length > 0 && (
        <div className="space-y-2">
          {added.map((l) => (
            <div
              key={l.listing_id}
              className="flex items-center justify-between rounded-md border border-white/6 px-3 py-2 text-xs"
              style={outfit}
            >
              <span className="flex items-center gap-2 text-white">
                <Check size={14} className="text-[oklch(0.72_0.12_75)]" />
                {formatDate(l.date)}
              </span>
              <span className="text-[oklch(0.58_0.010_260)]">{formatMXN(l.price)}</span>
            </div>
          ))}
        </div>
      )}

      <Button onClick={onFinish} className="btn-gold w-full py-5 rounded-sm text-sm">
        {added.length > 0 ? "Terminar" : "Terminar sin publicar fechas"}
      </Button>
    </div>
  );
}
