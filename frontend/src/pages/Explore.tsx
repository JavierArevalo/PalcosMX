/**
 * /explorar — the full marketplace catalog with filters and the
 * rent-request flow.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { List, Map as MapIcon, X } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";
import ListingCard from "@/components/listings/ListingCard";
import ListingFilters, { type FilterState } from "@/components/listings/ListingFilters";
import RequestDialog from "@/components/listings/RequestDialog";
import StadiumMap from "@/components/listings/StadiumMap";
import { ListingGridSkeleton } from "@/components/FeaturedVenues";
import { api, type FeedEntry, type Stadium } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

function feedPath(filters: FilterState): string {
  if (filters.stadiumId) return `/api/feed/by-stadium/${filters.stadiumId}?sort_by=${filters.sortBy}`;
  switch (filters.mode) {
    case "deals":
      return "/api/feed/best-deals";
    case "suggest":
      return "/api/feed/suggest";
    case "near":
      return "/api/feed/by-location";
    default:
      return "/api/feed/available";
  }
}

export default function Explore() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const [filters, setFilters] = useState<FilterState>({ mode: "available", stadiumId: "", sortBy: "price" });
  const [requestTarget, setRequestTarget] = useState<FeedEntry | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  // Hero-search filters arrive via the URL (?ciudad=…&fecha=…) and apply
  // client-side on top of whatever feed mode is active.
  const [cityFilter, setCityFilter] = useState(() => new URLSearchParams(search).get("ciudad") ?? "");
  const [dateFilter, setDateFilter] = useState(() => new URLSearchParams(search).get("fecha") ?? "");

  const path = feedPath(filters);
  const { data: entries, isLoading } = useQuery({
    queryKey: ["feed", path],
    queryFn: () => api<FeedEntry[]>(path),
  });

  // The map always shows the full availability picture, independent of filters.
  const { data: allEntries } = useQuery({
    queryKey: ["feed", "/api/feed/available"],
    queryFn: () => api<FeedEntry[]>("/api/feed/available"),
    enabled: view === "map",
  });
  const { data: stadiums } = useQuery({
    queryKey: ["stadiums"],
    queryFn: () => api<Stadium[]>("/api/stadiums"),
    enabled: view === "map",
  });

  const viewBtn = (v: "list" | "map", icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setView(v)}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-sm text-xs font-medium transition-all border ${
        view === v
          ? "bg-[oklch(0.72_0.12_75)] text-[oklch(0.09_0.005_260)] border-transparent"
          : "border-white/10 text-[oklch(0.75_0.008_80)] hover:border-[oklch(0.72_0.12_75/40%)]"
      }`}
      style={outfit}
    >
      {icon}
      {label}
    </button>
  );

  const visibleEntries = (entries ?? []).filter(
    (e) =>
      (!cityFilter || e.stadium_city.toLowerCase() === cityFilter.toLowerCase()) &&
      (!dateFilter || e.date >= dateFilter),
  );

  const filterChip = (label: string, onClear: () => void) => (
    <span
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs bg-[oklch(0.72_0.12_75/12%)] border border-[oklch(0.72_0.12_75/35%)] text-[oklch(0.82_0.10_80)]"
      style={outfit}
    >
      {label}
      <button onClick={onClear} aria-label={`Quitar filtro ${label}`} className="hover:text-white transition-colors">
        <X size={12} />
      </button>
    </span>
  );

  const handleRequest = (entry: FeedEntry) => {
    if (!user) {
      toast.info("Inicia sesión como arrendatario para solicitar una suite.");
      navigate("/acceso");
      return;
    }
    if (user.role !== "renter") {
      toast.error("Las solicitudes son para cuentas de arrendatario — has iniciado sesión como propietario.");
      return;
    }
    setRequestTarget(entry);
  };

  return (
    <AppShell>
      <PageHeading
        eyebrow="Explorar"
        title="Palcos"
        accent="Disponibles"
        subtitle={
          user
            ? `Explorando como ${user.name.split(" ")[0]} (${user.role === "owner" ? "propietario" : "arrendatario"})`
            : "Explorando como invitado — inicia sesión para solicitar una suite."
        }
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <ListingFilters filters={filters} onChange={setFilters} />
        </div>
        <div className="flex gap-2 mb-10">
          {viewBtn("list", <List size={13} />, "Lista")}
          {viewBtn("map", <MapIcon size={13} />, "Mapa")}
        </div>
      </div>

      {(cityFilter || dateFilter) && view === "list" && (
        <div className="flex flex-wrap gap-2 -mt-4 mb-8">
          {cityFilter && filterChip(`Ciudad: ${cityFilter}`, () => setCityFilter(""))}
          {dateFilter && filterChip(`Desde: ${dateFilter}`, () => setDateFilter(""))}
        </div>
      )}

      {view === "map" ? (
        <StadiumMap
          stadiums={stadiums ?? []}
          entries={allEntries ?? []}
          onSelectStadium={(stadiumId) => {
            setFilters({ ...filters, stadiumId });
            setView("list");
          }}
        />
      ) : isLoading ? (
        <ListingGridSkeleton />
      ) : visibleEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEntries.map((entry, i) => (
            <ListingCard
              key={entry.listing_id}
              entry={entry}
              index={i}
              actionLabel="Solicitar"
              onAction={() => handleRequest(entry)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-[oklch(0.58_0.010_260)] italic py-16" style={outfit}>
          No hay palcos que coincidan por ahora — intenta con otros filtros.
        </p>
      )}

      <RequestDialog entry={requestTarget} onClose={() => setRequestTarget(null)} />
    </AppShell>
  );
}
