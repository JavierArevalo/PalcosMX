/**
 * Palcos StatsBar — Cinematic Dark Luxury
 * Horizontal trust metrics bar between sections
 */
import { motion } from "framer-motion";

const stats = [
  { value: "120+", label: "Palcos Disponibles" },
  { value: "18", label: "Ciudades" },
  { value: "2,400+", label: "Reservas Exitosas" },
  { value: "4.9★", label: "Calificación" },
  { value: "98%", label: "Satisfacción" },
];

export default function StatsBar() {
  return (
    <div className="bg-[oklch(0.13_0.007_260)] border-y border-white/6 py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center lg:justify-between gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center gap-4"
            >
              {i > 0 && (
                <div className="hidden lg:block w-px h-8 bg-white/8" />
              )}
              <div className="text-center lg:text-left">
                <div
                  className="text-2xl font-bold text-gold-gradient"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs tracking-widest uppercase text-[oklch(0.50_0.008_260)] mt-0.5"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
