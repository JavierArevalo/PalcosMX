/**
 * Shared venue/listing card — the FeaturedVenues visual language, reused by
 * the landing grid (chevron action) and /explorar (Solicitar button).
 */
import { motion } from "framer-motion";
import { MapPin, Users, Calendar, ChevronRight, Star } from "lucide-react";
import type { FeedEntry } from "@/lib/api";
import { formatMXN, formatDate } from "@/lib/format";
import { stadiumImage } from "@/lib/images";

const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;
const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

export default function ListingCard({
  entry,
  index,
  actionLabel,
  onAction,
}: {
  entry: FeedEntry;
  index: number;
  /** With a label renders a gold text button; without, a chevron icon button. */
  actionLabel?: string;
  onAction: () => void;
}) {
  const isDeal = (entry.discount ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 6) * 0.08 }}
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

        <div className="absolute top-3 left-3 flex gap-2">
          {isDeal && (
            <span className="px-2.5 py-1 bg-[oklch(0.72_0.12_75)] text-[oklch(0.09_0.005_260)] text-xs font-semibold rounded-sm" style={outfit}>
              Ahorra {formatMXN(entry.discount!)}
            </span>
          )}
          {entry.rating != null && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.09_0.005_260/80%)] backdrop-blur-sm rounded-sm border border-white/10" style={outfit}>
              <Star size={11} className="fill-[oklch(0.72_0.12_75)] text-[oklch(0.72_0.12_75)]" />
              <span className="text-xs font-semibold text-white">{entry.rating}</span>
              <span className="text-xs text-[oklch(0.50_0.008_260)]">({entry.review_count})</span>
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.09_0.005_260/80%)] backdrop-blur-sm rounded-sm border border-white/10">
          <Calendar size={11} className="text-[oklch(0.72_0.12_75)]" />
          <span className="text-xs font-semibold text-white" style={outfit}>{formatDate(entry.date)}</span>
        </div>

        {entry.description && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs rounded-sm" style={outfit}>
              {entry.description}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
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
            {actionLabel ? (
              <button onClick={onAction} className="btn-gold px-4 py-2 rounded-sm text-xs shrink-0">
                {actionLabel}
              </button>
            ) : (
              <button
                onClick={onAction}
                aria-label="Ver en Explorar"
                className="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300 bg-[oklch(0.72_0.12_75/15%)] border border-[oklch(0.72_0.12_75/30%)] text-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.72_0.12_75)] hover:text-[oklch(0.09_0.005_260)]"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
