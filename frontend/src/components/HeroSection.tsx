/**
 * Palcos HeroSection — Cinematic Dark Luxury
 * Full-viewport hero with parallax background, tagline, and search bar
 * Dark text on light areas, light text on dark areas
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Building2, Calendar } from "lucide-react";
import { useLocation } from "wouter";

const HERO_BG = "/images/hero.webp";

const cities = ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León"];
const venueTypes = ["Estadio de Fútbol", "Arena / Auditorio", "Estadio de Béisbol", "Centro de Convenciones", "Hipódromo"];

const stats = [
  { value: "120+", label: "Palcos Disponibles" },
  { value: "18", label: "Ciudades en México" },
  { value: "4.9★", label: "Calificación Promedio" },
];

// Floating gold particles rising through the hero (subtle, decorative).
function GoldParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[oklch(0.72_0.12_75/45%)]"
          style={{ left: `${(i * 7.3 + 4) % 100}%` }}
          initial={{ y: "105vh", opacity: 0 }}
          animate={{ y: "-5vh", opacity: [0, 1, 0] }}
          transition={{
            duration: 12 + (i % 5) * 3,
            repeat: Infinity,
            delay: i * 0.9,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export default function HeroSection() {
  const [city, setCity] = useState("");
  const [venueType, setVenueType] = useState("");
  const [date, setDate] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/explorar");
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.09_0.005_260/0.75)] via-[oklch(0.09_0.005_260/0.55)] to-[oklch(0.09_0.005_260/0.90)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.09_0.005_260/0.60)] via-transparent to-transparent" />

      <GoldParticles />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[oklch(0.72_0.12_75/40%)] bg-[oklch(0.72_0.12_75/10%)] mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.12_75)] animate-pulse" />
            <span className="text-xs font-medium tracking-widest uppercase text-[oklch(0.82_0.10_80)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              El Marketplace VIP de México
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] text-white mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Tu Palco,
            <br />
            <span className="text-gold-gradient italic">Tu Experiencia</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg sm:text-xl text-[oklch(0.80_0.008_80)] max-w-xl mb-10 leading-relaxed"
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
          >
            Reserva suites y palcos premium en los mejores estadios y arenas de México. Vive cada evento como nunca antes.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            <form
              onSubmit={handleSearch}
              className="bg-[oklch(0.09_0.005_260/0.85)] backdrop-blur-xl border border-white/10 rounded-lg p-2 shadow-2xl"
            >
              <div className="flex flex-col lg:flex-row gap-2">
                {/* City */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-md border border-white/8 hover:border-[oklch(0.72_0.12_75/40%)] transition-colors">
                  <MapPin size={16} className="text-[oklch(0.72_0.12_75)] shrink-0" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    <option value="" className="bg-[oklch(0.13_0.007_260)] text-white">Ciudad</option>
                    {cities.map((c) => (
                      <option key={c} value={c} className="bg-[oklch(0.13_0.007_260)] text-white">{c}</option>
                    ))}
                  </select>
                </div>

                {/* Venue Type */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-md border border-white/8 hover:border-[oklch(0.72_0.12_75/40%)] transition-colors">
                  <Building2 size={16} className="text-[oklch(0.72_0.12_75)] shrink-0" />
                  <select
                    value={venueType}
                    onChange={(e) => setVenueType(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    <option value="" className="bg-[oklch(0.13_0.007_260)] text-white">Tipo de Venue</option>
                    {venueTypes.map((v) => (
                      <option key={v} value={v} className="bg-[oklch(0.13_0.007_260)] text-white">{v}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-md border border-white/8 hover:border-[oklch(0.72_0.12_75/40%)] transition-colors">
                  <Calendar size={16} className="text-[oklch(0.72_0.12_75)] shrink-0" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                    placeholder="Fecha del evento"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="btn-gold px-8 py-3 rounded-md flex items-center gap-2 shrink-0 justify-center"
                >
                  <Search size={16} />
                  <span className="text-sm">Buscar</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="flex flex-wrap gap-8 mt-14"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span
                className="text-3xl font-bold text-gold-gradient"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {stat.value}
              </span>
              <span
                className="text-xs tracking-widest uppercase text-[oklch(0.58_0.010_260)] mt-0.5"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs tracking-widest uppercase text-[oklch(0.50_0.008_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Explorar
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-[oklch(0.72_0.12_75)] to-transparent"
        />
      </motion.div>
    </section>
  );
}
