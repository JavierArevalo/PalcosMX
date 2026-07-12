/**
 * Screen 3 / renter settings: price range, capacity, preferred stadiums
 * and teams — feeds the "Sugeridos" feed scoring.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, put, type Me, type Stadium } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const CAPACITY_BUCKETS = [
  { value: "", label: "Capacidad — cualquiera" },
  { value: "0-20", label: "Hasta 20 invitados" },
  { value: "20-50", label: "20–50 invitados" },
  { value: "50-100", label: "50–100 invitados" },
];

export default function PreferencesForm({ onSaved }: { onSaved?: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const prefs = user?.preferences ?? {};

  const [priceMin, setPriceMin] = useState(prefs.price_min?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(prefs.price_max?.toString() ?? "");
  const [bucket, setBucket] = useState(prefs.capacity_bucket ?? "");
  const [stadiumIds, setStadiumIds] = useState<string[]>(prefs.preferred_stadiums ?? []);
  const [teams, setTeams] = useState((prefs.preferred_teams ?? []).join(", "));
  const [location, setLocation] = useState(user?.location ?? "");
  const [busy, setBusy] = useState(false);

  const { data: stadiums } = useQuery({
    queryKey: ["stadiums"],
    queryFn: () => api<Stadium[]>("/api/stadiums"),
  });

  const toggleStadium = (id: string, checked: boolean) =>
    setStadiumIds((prev) => (checked ? [...prev, id] : prev.filter((s) => s !== id)));

  const handleSave = async () => {
    setBusy(true);
    try {
      await put("/api/my/preferences", {
        price_min: priceMin || null,
        price_max: priceMax || null,
        capacity_bucket: bucket || null,
        preferred_stadiums: stadiumIds,
        preferred_teams: teams
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        location: location || null,
      });
      // /api/auth/me is the source of truth for preferences on the client.
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Preferencias guardadas.");
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron guardar las preferencias");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Precio mínimo (MXN)</Label>
          <Input type="number" min="0" placeholder="p. ej. 5000" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Precio máximo (MXN)</Label>
          <Input type="number" min="0" placeholder="p. ej. 20000" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Capacidad preferida</Label>
        <select
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm text-white [&>option]:bg-[oklch(0.13_0.007_260)]"
          style={outfit}
        >
          {CAPACITY_BUCKETS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Estadios preferidos</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(stadiums ?? []).map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-[oklch(0.80_0.008_80)] cursor-pointer" style={outfit}>
              <Checkbox
                checked={stadiumIds.includes(s.id)}
                onCheckedChange={(checked) => toggleStadium(s.id, checked === true)}
              />
              {s.name} — {s.city}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Equipos preferidos (separados por coma)</Label>
        <Input placeholder="p. ej. Rayados, América" value={teams} onChange={(e) => setTeams(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>Tu ciudad (para sugerencias cercanas)</Label>
        <Input placeholder="p. ej. Guadalajara" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>

      <Button onClick={handleSave} disabled={busy} className="btn-gold w-full py-5 rounded-sm text-sm">
        {busy ? "Guardando..." : "Guardar Preferencias"}
      </Button>
    </div>
  );
}
