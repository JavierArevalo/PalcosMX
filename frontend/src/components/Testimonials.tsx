/**
 * Palcos Testimonials — Cinematic Dark Luxury
 * Customer testimonials in a carousel with star ratings and avatar initials
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

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

function TestimonialSlide({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <div className="bg-[oklch(0.13_0.007_260)] rounded-lg p-8 sm:p-12 border border-white/6 relative overflow-hidden">
      <Quote size={64} className="absolute top-8 right-8 text-[oklch(0.72_0.12_75/10%)]" />

      <div className="flex flex-col md:flex-row gap-8 items-start relative">
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center shrink-0`}>
          <span className="text-white text-lg font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>{testimonial.initials}</span>
        </div>

        <div className="flex-1">
          {/* Stars */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} size={15} className="fill-[oklch(0.72_0.12_75)] text-[oklch(0.72_0.12_75)]" />
            ))}
          </div>

          {/* Text */}
          <blockquote
            className="text-lg sm:text-xl text-[oklch(0.80_0.008_80)] leading-relaxed mb-6"
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
          >
            "{testimonial.text}"
          </blockquote>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {testimonial.name}
              </div>
              <div className="text-xs text-[oklch(0.50_0.008_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {testimonial.role} · {testimonial.company}
              </div>
            </div>
            <span className="text-xs text-[oklch(0.72_0.12_75)] border border-[oklch(0.72_0.12_75/25%)] px-2.5 py-1 rounded-sm self-start sm:self-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {testimonial.venue}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Carousel() {
  const [current, setCurrent] = useState(0);
  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  const navBtn =
    "w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.72_0.12_75)] hover:text-[oklch(0.09_0.005_260)] hover:border-[oklch(0.72_0.12_75)] transition-all";

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
        >
          <TestimonialSlide testimonial={testimonials[current]} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button onClick={prev} className={navBtn} aria-label="Anterior">
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              aria-label={`Testimonio ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                index === current
                  ? "w-8 bg-[oklch(0.72_0.12_75)]"
                  : "w-2 bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>
        <button onClick={next} className={navBtn} aria-label="Siguiente">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
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

        {/* Carousel */}
        <Carousel />

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
