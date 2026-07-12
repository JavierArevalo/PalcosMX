/**
 * Palcos HowItWorks — Cinematic Dark Luxury
 * 3-step process with animated step cards
 */
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Search, CalendarCheck, Star } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Explora los Venues",
    description: "Navega por nuestra selección curada de palcos y suites en los mejores estadios y arenas de México. Filtra por ciudad, tipo de evento y capacidad.",
    accent: "Descubre",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Reserva tu Suite",
    description: "Elige tu palco ideal, selecciona la fecha y confirma tu reserva en minutos. Proceso 100% digital, seguro y sin complicaciones.",
    accent: "Reserva",
  },
  {
    number: "03",
    icon: Star,
    title: "Vive la Experiencia",
    description: "Llega al evento y disfruta de una vista privilegiada, servicio personalizado y todas las comodidades de un palco premium. Así de fácil.",
    accent: "Disfruta",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
};

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 bg-[oklch(0.09_0.005_260)]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.72 0.12 75) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-16 lg:mb-20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="gold-divider" />
            <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Proceso Simple
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white max-w-xl leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Reservar un Palco
            <br />
            <span className="text-gold-gradient italic">Nunca Fue Tan Fácil</span>
          </h2>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className="relative group"
            >
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%_-_1rem)] w-8 h-px bg-gradient-to-r from-[oklch(0.72_0.12_75/40%)] to-transparent z-10" />
              )}

              <div className="card-gold-border bg-[oklch(0.13_0.007_260)] rounded-lg p-8 h-full border border-white/6 hover:border-[oklch(0.72_0.12_75/30%)] transition-all duration-400 group-hover:bg-[oklch(0.15_0.008_260)] group-hover:shadow-[0_20px_60px_oklch(0.72_0.12_75/8%)]">
                {/* Step number */}
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="text-6xl font-bold text-[oklch(0.72_0.12_75/15%)] leading-none select-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-md bg-[oklch(0.72_0.12_75/12%)] border border-[oklch(0.72_0.12_75/25%)] flex items-center justify-center group-hover:bg-[oklch(0.72_0.12_75/20%)] transition-colors">
                    <step.icon size={20} className="text-[oklch(0.72_0.12_75)]" />
                  </div>
                </div>

                {/* Accent label */}
                <span
                  className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium mb-3 block"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {step.accent}
                </span>

                <h3
                  className="text-2xl font-semibold text-white mb-4 leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {step.title}
                </h3>

                <p
                  className="text-[oklch(0.58_0.010_260)] leading-relaxed text-sm"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                >
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
