/**
 * Onboarding step 2: register a private box. Same fields and endpoint as
 * components/owner/BoxForm.tsx (kept as a separate component here since
 * this one advances the wizard on success instead of resetting in place).
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, post, type Stadium, type Box } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const boxSchema = z.object({
  stadium_id: z.string().min(1, "Elige un estadio"),
  capacity: z
    .string()
    .min(1, "Ingresa la capacidad")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, "Capacidad inválida"),
  location_in_stadium: z.string().optional(),
  description: z.string().optional(),
});
type BoxValues = z.infer<typeof boxSchema>;

export default function OnboardingBoxStep({ onCreated }: { onCreated: (box: Box) => void }) {
  const queryClient = useQueryClient();
  const { data: stadiums } = useQuery({
    queryKey: ["stadiums"],
    queryFn: () => api<Stadium[]>("/api/stadiums"),
  });

  const form = useForm<BoxValues>({
    resolver: zodResolver(boxSchema),
    defaultValues: { stadium_id: "" },
  });

  const onSubmit = async (values: BoxValues) => {
    try {
      const box = await post<Box>("/api/my/boxes", { ...values, capacity: Number(values.capacity) });
      toast.success("Palco registrado.");
      queryClient.invalidateQueries({ queryKey: ["myBoxes"] });
      onCreated(box);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar el palco");
    }
  };

  const err = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Estadio</Label>
        <select
          {...form.register("stadium_id")}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm text-white [&>option]:bg-[oklch(0.13_0.007_260)]"
          style={outfit}
        >
          <option value="">Elige un estadio…</option>
          {(stadiums ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
          ))}
        </select>
        {err.stadium_id && <p className="text-xs text-red-400" style={outfit}>{err.stadium_id.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Capacidad (invitados)</Label>
        <Input type="number" min="1" placeholder="p. ej. 16" {...form.register("capacity")} />
        {err.capacity && <p className="text-xs text-red-400" style={outfit}>{err.capacity.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Ubicación en el venue</Label>
        <Input placeholder="p. ej. Ala Norte, Nivel 5" {...form.register("location_in_stadium")} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Descripción corta</Label>
        <Input placeholder="p. ej. Suite con terraza al aire libre" {...form.register("description")} />
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting} className="btn-gold w-full py-5 rounded-sm text-sm">
        {form.formState.isSubmitting ? "Registrando..." : "Registrar y Continuar"}
      </Button>
    </form>
  );
}
