/**
 * Palcos FeaturedVenues — Cinematic Dark Luxury
 * Grid of venue cards fed by the live marketplace: best deals first,
 * falling back to all available listings.
 */
import { motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { api, type FeedEntry } from "@/lib/api";
import ListingCard from "@/components/listings/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";

const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;
const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

async function fetchFeatured(): Promise<FeedEntry[]> {
  const deals = await api<FeedEntry[]>("/api/feed/best-deals");
  if (deals.length > 0) return deals.slice(0, 6);
  const available = await api<FeedEntry[]>("/api/feed/available");
  return available.slice(0, 6);
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[oklch(0.13_0.007_260)] rounded-lg overflow-hidden border border-white/6">
          <Skeleton className="h-52 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeaturedVenues() {
  const [, navigate] = useLocation();
  const { data: entries, isLoading } = useQuery({
    queryKey: ["feed", "featured"],
    queryFn: fetchFeatured,
  });

  return (
    <section id="venues" className="py-24 lg:py-32 bg-[oklch(0.11_0.006_260)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="gold-divider" />
              <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={outfit}>
                Selección Premium
              </span>
            </div>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
              style={serif}
            >
              Palcos
              <span className="text-gold-gradient italic"> Destacados</span>
            </h2>
          </motion.div>

          <Link
            href="/explorar"
            className="flex items-center gap-2 text-sm font-medium text-[oklch(0.72_0.12_75)] hover:text-[oklch(0.82_0.10_80)] transition-colors group shrink-0"
            style={outfit}
          >
            <Zap size={14} />
            Ver todos los palcos
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <ListingGridSkeleton />
        ) : entries && entries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry, i) => (
              <ListingCard
                key={entry.listing_id}
                entry={entry}
                index={i}
                onAction={() => navigate("/explorar")}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-[oklch(0.58_0.010_260)] italic py-12" style={outfit}>
            No hay palcos publicados por el momento — vuelve pronto.
          </p>
        )}
      </div>
    </section>
  );
}
