/**
 * /explorar filter bar: feed modes (Disponibles / Ofertas / Sugeridos /
 * Cerca de mí), stadium filter and price/capacity sorting. The personalized
 * modes need a renter session.
 */
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPinned, Tag, LayoutGrid } from "lucide-react";
import { api, type Stadium } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

export type FeedMode = "available" | "deals" | "suggest" | "near";

export interface FilterState {
  mode: FeedMode;
  stadiumId: string;
  sortBy: "price" | "capacity";
}

const MODES: Array<{ value: FeedMode; label: string; icon: typeof Tag; renterOnly: boolean }> = [
  { value: "available", label: "Disponibles", icon: LayoutGrid, renterOnly: false },
  { value: "deals", label: "Mejores Ofertas", icon: Tag, renterOnly: false },
  { value: "suggest", label: "Sugeridos para mí", icon: Sparkles, renterOnly: true },
  { value: "near", label: "Cerca de mí", icon: MapPinned, renterOnly: true },
];

export default function ListingFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const { user } = useAuth();
  const isRenter = user?.role === "renter";

  const { data: stadiums } = useQuery({
    queryKey: ["stadiums"],
    queryFn: () => api<Stadium[]>("/api/stadiums"),
  });

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-10">
      {/* Feed modes */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((mode) => {
          const disabled = mode.renterOnly && !isRenter;
          const active = filters.mode === mode.value && !filters.stadiumId;
          const btn = (
            <button
              key={mode.value}
              disabled={disabled}
              onClick={() => onChange({ ...filters, mode: mode.value, stadiumId: "" })}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-sm text-xs font-medium transition-all border ${
                active
                  ? "bg-[oklch(0.72_0.12_75)] text-[oklch(0.09_0.005_260)] border-transparent"
                  : disabled
                    ? "border-white/8 text-[oklch(0.40_0.008_260)] cursor-not-allowed"
                    : "border-white/10 text-[oklch(0.75_0.008_80)] hover:border-[oklch(0.72_0.12_75/40%)]"
              }`}
              style={outfit}
            >
              <mode.icon size={13} />
              {mode.label}
            </button>
          );
          return disabled ? (
            <Tooltip key={mode.value}>
              <TooltipTrigger asChild>
                <span>{btn}</span>
              </TooltipTrigger>
              <TooltipContent style={outfit}>
                Inicia sesión como arrendatario para usar este filtro
              </TooltipContent>
            </Tooltip>
          ) : (
            btn
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 lg:ml-auto">
        {/* Stadium */}
        <select
          value={filters.stadiumId}
          onChange={(e) => onChange({ ...filters, stadiumId: e.target.value })}
          className="h-9 rounded-sm border border-white/10 bg-transparent px-3 text-xs text-white [&>option]:bg-[oklch(0.13_0.007_260)]"
          style={outfit}
        >
          <option value="">Todos los estadios</option>
          {(stadiums ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.city}
            </option>
          ))}
        </select>

        {/* Sort (backend sorts only within a stadium) */}
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as "price" | "capacity" })}
          disabled={!filters.stadiumId}
          className="h-9 rounded-sm border border-white/10 bg-transparent px-3 text-xs text-white disabled:opacity-40 [&>option]:bg-[oklch(0.13_0.007_260)]"
          style={outfit}
          title={filters.stadiumId ? undefined : "Elige un estadio para ordenar"}
        >
          <option value="price">Ordenar: precio</option>
          <option value="capacity">Ordenar: capacidad</option>
        </select>
      </div>
    </div>
  );
}
