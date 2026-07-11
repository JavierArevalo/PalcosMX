/**
 * Palcos Testimonials — Cinematic Dark Luxury
 * Customer testimonials with star ratings and avatar initials
 */
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Mendoza",
    role: "Director Comercial",
    company: "Grupo Empresarial Monterrey",
    initials: "CM",
    color: "from-amber-600 to-amber-800",
    rating: 5,
    text: "Reservamos un palco en el Estadio BBVA para el clásico regiomontano. La experiencia fue absolutamente increíble — el servicio, la vista, la comodidad. Nuestros clientes quedaron impresionados. Sin duda lo haremos de nuevo.",
    venue: "Estadio BBVA, Monterrey",
  },
  {
    name: "Sofía Ramírez",
    role: "Gerente de Eventos",
    company: "Corporativo Azteca",
    initials: "SR",
    color: "from-rose-700 to-rose-900",
    rating: 5,
    text: "Palcos hizo todo tan sencillo. En menos de 10 minutos teníamos confirmada nuestra suite para el concierto de Bad Bunny en el Foro Sol. El proceso de reserva es impecable y el soporte al cliente es excelente.",
    venue: "Foro Sol, Ciudad de México",
  },
  {
    name: "Alejandro Torres",
    role: "Emprendedor",
    company: "Fundador de StartupMX",
    initials: "AT",
    color: "from-blue-700 to-blue-900",
    rating: 5,
    text: "Usé Palcos para sorprender a mi equipo en el cumpleaños de la empresa. Reservé un palco en el Estadio Azteca y fue la mejor inversión del año. El equipo no podía creer la experiencia. ¡100% recomendado!",
    venue: "Estadio Azteca, CDMX",
  },
  {
    name: "Valentina Cruz",
    role: "Propietaria de Palco",
    company: "Inversiones VCG",
    initials: "VC",
    color: "from-emerald-700 to-emerald-900",
    rating: 5,
    text: "Como propietaria, Palcos ha transformado mi palco en una fuente de ingresos constante. En los primeros 3 meses recuperé la inversión del año. El proceso de publicación fue muy fácil y el equipo siempre está disponible.",
    venue: "Arena VFG, Guadalajara",
  },
  {
    name: "Ricardo Flores",
    role: "CEO",
    company: "Grupo Flores & Asociados",
    initials: "RF",
    color: "from-purple-700 to-purple-900",
    rating: 5,
    text: "La plataforma es extraordinariamente intuitiva. Encontré el palco perfecto para nuestra reunión de directivos en menos de 5 minutos. La experiencia en el Auditorio Nacional fue de primer nivel. Volveremos pronto.",
    venue: "Auditorio Nacional, CDMX",
  },
  {
    name: "Mariana López",
    role: "Directora de Marketing",
    company: "Agencia Creativa MX",
    initials: "ML",
    color: "from-teal-700 to-teal-900",
    rating: 5,
    text: "Organizamos el lanzamiento de producto de nuestro cliente más importante en un palco VIP. El impacto fue brutal — todos los asistentes hablaron de ello. Palcos nos dio exactamente lo que necesitábamos.",
    venue: "Estadio Chivas, Guadalajara",
  },
];

function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="bg-[oklch(0.13_0.007_260)] rounded-lg p-7 border border-white/6 hover:border-[oklch(0.72_0.12_75/20%)] transition-all duration-400 hover:shadow-[0_16px_48px_oklch(0.72_0.12_75/6%)] flex flex-col"
    >
      {/* Quote icon */}
      <Quote size={24} className="text-[oklch(0.72_0.12_75/30%)] mb-4" />

      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} size={13} className="fill-[oklch(0.72_0.12_75)] text-[oklch(0.72_0.12_75)]" />
        ))}
      </div>

      {/* Text */}
      <p
        className="text-[oklch(0.72_0.010_260)] leading-relaxed text-sm flex-1 mb-6"
        style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
      >
        "{testimonial.text}"
      </p>

      {/* Venue tag */}
      <div className="mb-5">
        <span className="text-xs text-[oklch(0.72_0.12_75)] border border-[oklch(0.72_0.12_75/25%)] px-2.5 py-1 rounded-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {testimonial.venue}
        </span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/6">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center shrink-0`}>
          <span className="text-white text-xs font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>{testimonial.initials}</span>
        </div>
        <div>
          <div
            className="text-sm font-semibold text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {testimonial.name}
          </div>
          <div className="text-xs text-[oklch(0.50_0.008_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {testimonial.role} · {testimonial.company}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-24 lg:py-32 bg-[oklch(0.11_0.006_260)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="gold-divider" />
            <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Testimonios
            </span>
            <div className="gold-divider rotate-180" />
          </div>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Lo Que Dicen
            <br />
            <span className="text-gold-gradient italic">Nuestros Clientes</span>
          </h2>
          <p
            className="text-[oklch(0.58_0.010_260)] mt-4 max-w-xl mx-auto text-base"
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
          >
            Más de 2,400 experiencias premium reservadas. Esto es lo que dicen quienes ya vivieron la diferencia.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} index={i} />
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex flex-wrap justify-center gap-8"
        >
          {[
            { value: "2,400+", label: "Reservas Completadas" },
            { value: "4.9/5", label: "Calificación Promedio" },
            { value: "98%", label: "Clientes Satisfechos" },
            { value: "18", label: "Ciudades en México" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div
                className="text-3xl font-bold text-gold-gradient"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {stat.value}
              </div>
              <div className="text-xs tracking-widest uppercase text-[oklch(0.50_0.008_260)] mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
