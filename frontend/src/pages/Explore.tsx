/**
 * /explorar — the full marketplace catalog with filters and the
 * rent-request flow.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";
import ListingCard from "@/components/listings/ListingCard";
import ListingFilters, { type FilterState } from "@/components/listings/ListingFilters";
import RequestDialog from "@/components/listings/RequestDialog";
import { ListingGridSkeleton } from "@/components/FeaturedVenues";
import { api, type FeedEntry } from "@/lib/api";
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
  const [filters, setFilters] = useState<FilterState>({ mode: "available", stadiumId: "", sortBy: "price" });
  const [requestTarget, setRequestTarget] = useState<FeedEntry | null>(null);

  const path = feedPath(filters);
  const { data: entries, isLoading } = useQuery({
    queryKey: ["feed", path],
    queryFn: () => api<FeedEntry[]>(path),
  });

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

      <ListingFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <ListingGridSkeleton />
      ) : entries && entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry, i) => (
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
