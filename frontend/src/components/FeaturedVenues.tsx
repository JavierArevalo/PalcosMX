/**
 * Palcos FeaturedVenues — Cinematic Dark Luxury
 * Grid of venue cards with photo, location, capacity, price, rating
 */
import { motion } from "framer-motion";
import { MapPin, Users, Star, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";

const VENUE_1 = "/images/venue-1.jpg";
const VENUE_2 = "/images/venue-2.jpg";
const VENUE_3 = "/images/venue-3.jpg";

const venues = [
  {
    id: 1,
    name: "Estadio Azteca — Palco Presidencial",
    location: "Ciudad de México",
    type: "Estadio de Fútbol",
    capacity: "20 personas",
    price: "$45,000",
    priceNote: "por evento",
    rating: 4.9,
    reviews: 128,
    image: VENUE_1,
    tags: ["Fútbol", "Conciertos"],
    featured: true,
    available: true,
  },
  {
    id: 2,
    name: "Arena VFG — Suite Diamante",
    location: "Guadalajara, Jalisco",
    type: "Arena / Auditorio",
    capacity: "14 personas",
    price: "$28,500",
    priceNote: "por evento",
    rating: 4.8,
    reviews: 94,
    image: VENUE_2,
    tags: ["Conciertos", "Deportes"],
    featured: false,
    available: true,
  },
  {
    id: 3,
    name: "Estadio BBVA — Palco Ejecutivo",
    location: "Monterrey, Nuevo León",
    type: "Estadio de Fútbol",
    capacity: "18 personas",
    price: "$38,000",
    priceNote: "por evento",
    rating: 4.9,
    reviews: 211,
    image: VENUE_3,
    tags: ["Fútbol", "Eventos"],
    featured: true,
    available: false,
  },
  {
    id: 4,
    name: "Foro Sol — Box VIP Nivel 3",
    location: "Ciudad de México",
    type: "Estadio Multiusos",
    capacity: "12 personas",
    price: "$22,000",
    priceNote: "por evento",
    rating: 4.7,
    reviews: 67,
    image: VENUE_1,
    tags: ["Conciertos", "Festivales"],
    featured: false,
    available: true,
  },
  {
    id: 5,
    name: "Estadio Chivas — Suite Platino",
    location: "Guadalajara, Jalisco",
    type: "Estadio de Fútbol",
    capacity: "16 personas",
    price: "$32,000",
    priceNote: "por evento",
    rating: 4.8,
    reviews: 155,
    image: VENUE_2,
    tags: ["Fútbol", "Deportes"],
    featured: false,
    available: true,
  },
  {
    id: 6,
    name: "Auditorio Nacional — Palco Oro",
    location: "Ciudad de México",
    type: "Auditorio",
    capacity: "10 personas",
    price: "$19,500",
    priceNote: "por evento",
    rating: 5.0,
    reviews: 43,
    image: VENUE_3,
    tags: ["Conciertos", "Shows"],
    featured: true,
    available: true,
  },
];

function VenueCard({ venue, index }: { venue: typeof venues[0]; index: number }) {
  const handleBook = () => {
    if (!venue.available) {
      toast.error("Este palco no está disponible en este momento.");
      return;
    }
    toast.success(`Reservando: ${venue.name}`, {
      description: "Redirigiendo al proceso de reserva...",
    });
  };

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
          src={venue.image}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.09_0.005_260/80%)] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {venue.featured && (
            <span className="px-2.5 py-1 bg-[oklch(0.72_0.12_75)] text-[oklch(0.09_0.005_260)] text-xs font-semibold rounded-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Destacado
            </span>
          )}
          {!venue.available && (
            <span className="px-2.5 py-1 bg-[oklch(0.09_0.005_260/80%)] text-[oklch(0.58_0.010_260)] text-xs font-medium rounded-sm border border-white/10" style={{ fontFamily: "'Outfit', sans-serif" }}>
              No Disponible
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.09_0.005_260/80%)] backdrop-blur-sm rounded-sm border border-white/10">
          <Star size={11} className="fill-[oklch(0.72_0.12_75)] text-[oklch(0.72_0.12_75)]" />
          <span className="text-xs font-semibold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{venue.rating}</span>
          <span className="text-xs text-[oklch(0.50_0.008_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>({venue.reviews})</span>
        </div>

        {/* Tags */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {venue.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs rounded-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Gold top border accent */}
        <div className="w-8 h-0.5 bg-gradient-to-r from-[oklch(0.72_0.12_75)] to-transparent mb-4" />

        <h3
          className="text-lg font-semibold text-white mb-1 leading-snug group-hover:text-[oklch(0.82_0.10_80)] transition-colors"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {venue.name}
        </h3>

        <div className="flex items-center gap-1.5 mb-4">
          <MapPin size={12} className="text-[oklch(0.72_0.12_75)] shrink-0" />
          <span className="text-xs text-[oklch(0.58_0.010_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {venue.location} · {venue.type}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-[oklch(0.50_0.008_260)]" />
              <span className="text-xs text-[oklch(0.58_0.010_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>{venue.capacity}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span
                className="text-xl font-bold text-gold-gradient"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {venue.price}
              </span>
              <span className="text-xs text-[oklch(0.50_0.008_260)] block" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {venue.priceNote}
              </span>
            </div>
            <button
              onClick={handleBook}
              disabled={!venue.available}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300 ${
                venue.available
                  ? "bg-[oklch(0.72_0.12_75/15%)] border border-[oklch(0.72_0.12_75/30%)] text-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.72_0.12_75)] hover:text-[oklch(0.09_0.005_260)]"
                  : "bg-white/5 border border-white/10 text-[oklch(0.40_0.008_260)] cursor-not-allowed"
              }`}
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
  const handleViewAll = () => toast.info("Próximamente: Explorar todos los palcos disponibles.");

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
              <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Selección Premium
              </span>
            </div>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Palcos
              <span className="text-gold-gradient italic"> Destacados</span>
            </h2>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={handleViewAll}
            className="flex items-center gap-2 text-sm font-medium text-[oklch(0.72_0.12_75)] hover:text-[oklch(0.82_0.10_80)] transition-colors group shrink-0"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <Zap size={14} />
            Ver todos los palcos
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue, i) => (
            <VenueCard key={venue.id} venue={venue} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
