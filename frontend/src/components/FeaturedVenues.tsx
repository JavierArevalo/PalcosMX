/**
 * Palcos FeaturedVenues — Cinematic Dark Luxury
 * Grid of venue cards fed by the live marketplace: best deals first,
 * falling back to all available listings.
 */
import { motion } from "framer-motion";
import { MapPin, Users, Calendar, ChevronRight, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { api, type FeedEntry } from "@/lib/api";
import { formatMXN, formatDate } from "@/lib/format";
import { stadiumImage } from "@/lib/images";
import { Skeleton } from "@/components/ui/skeleton";

const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;
const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

async function fetchFeatured(): Promise<FeedEntry[]> {
  const deals = await api<FeedEntry[]>("/api/feed/best-deals");
  if (deals.length > 0) return deals.slice(0, 6);
  const available = await api<FeedEntry[]>("/api/feed/available");
  return available.slice(0, 6);
}

function VenueCard({ entry, index }: { entry: FeedEntry; index: number }) {
  const [, navigate] = useLocation();
  const isDeal = (entry.discount ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative bg-[oklch(0.13_0.007_260)] rounded-lg overflow-hidden border border-white/6 hover:border-[oklch(0.72_0.12_75/30%)] transition-all duration-400 hover:shadow-[0_24px_64px_oklch(0.72_0.12_75/10%)] hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={stadiumImage(entry.stadium_name)}
          alt={entry.stadium_name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.09_0.005_260/80%)] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isDeal && (
            <span className="px-2.5 py-1 bg-[oklch(0.72_0.12_75)] text-[oklch(0.09_0.005_260)] text-xs font-semibold rounded-sm" style={outfit}>
              Ahorra {formatMXN(entry.discount!)}
            </span>
          )}
        </div>

        {/* Date */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.09_0.005_260/80%)] backdrop-blur-sm rounded-sm border border-white/10">
          <Calendar size={11} className="text-[oklch(0.72_0.12_75)]" />
          <span className="text-xs font-semibold text-white" style={outfit}>{formatDate(entry.date)}</span>
        </div>

        {/* Event tag */}
        {entry.description && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            <span className="px-2 py-0.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs rounded-sm" style={outfit}>
              {entry.description}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        <div className="w-8 h-0.5 bg-gradient-to-r from-[oklch(0.72_0.12_75)] to-transparent mb-4" />

        <h3
          className="text-lg font-semibold text-white mb-1 leading-snug group-hover:text-[oklch(0.82_0.10_80)] transition-colors"
          style={serif}
        >
          {entry.stadium_name} — {entry.box_description || "Suite Privada"}
        </h3>

        <div className="flex items-center gap-1.5 mb-4">
          <MapPin size={12} className="text-[oklch(0.72_0.12_75)] shrink-0" />
          <span className="text-xs text-[oklch(0.58_0.010_260)]" style={outfit}>
            {entry.stadium_city}
            {entry.box_location ? ` · ${entry.box_location}` : ""}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/6">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-[oklch(0.50_0.008_260)]" />
            <span className="text-xs text-[oklch(0.58_0.010_260)]" style={outfit}>
              {entry.capacity} personas
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-bold text-gold-gradient" style={serif}>
                {formatMXN(entry.price)}
              </span>
              <span className="text-xs text-[oklch(0.50_0.008_260)] block" style={outfit}>
                por evento
              </span>
            </div>
            <button
              onClick={() => navigate("/explorar")}
              aria-label="Ver en Explorar"
              className="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300 bg-[oklch(0.72_0.12_75/15%)] border border-[oklch(0.72_0.12_75/30%)] text-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.72_0.12_75)] hover:text-[oklch(0.09_0.005_260)]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturedVenues() {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
        ) : entries && entries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry, i) => (
              <VenueCard key={entry.listing_id} entry={entry} index={i} />
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
