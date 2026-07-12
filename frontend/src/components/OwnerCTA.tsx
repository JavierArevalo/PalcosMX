/**
 * Palcos OwnerCTA — Cinematic Dark Luxury
 * Section for venue owners to list their spaces
 * Dark background with gold accents, split layout
 */
import { motion } from "framer-motion";
import { TrendingUp, Shield, Clock, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const OWNER_IMG = "/images/owner.jpg";

const benefits = [
  {
    icon: TrendingUp,
    title: "Maximiza tus Ingresos",
    description: "Convierte tu palco en una fuente de ingresos constante. Nuestros propietarios generan hasta $180,000 MXN al mes.",
  },
  {
    icon: Shield,
    title: "100% Seguro y Confiable",
    description: "Verificamos a cada reservante. Pagos garantizados y protección total para tu propiedad en cada evento.",
  },
  {
    icon: Clock,
    title: "Gestión Sin Esfuerzo",
    description: "Publica tu palco en minutos. Nosotros manejamos las reservas, pagos y comunicación con los huéspedes.",
  },
];

export default function OwnerCTA() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Owners land on their dashboard; everyone else starts at signup.
  const handlePublish = () => navigate(user?.role === "owner" ? "/mis-palcos" : "/acceso");

  return (
    <section id="owners" className="relative py-24 lg:py-32 overflow-hidden bg-[oklch(0.09_0.005_260)]">
      {/* Background gradient accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 80% 50%, oklch(0.72 0.12 75), transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative rounded-lg overflow-hidden aspect-[4/3]">
              <img
                src={OWNER_IMG}
                alt="Propietario de palco"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.09_0.005_260/60%)] via-transparent to-transparent" />
            </div>

            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute -bottom-6 -right-4 lg:-right-8 bg-[oklch(0.13_0.007_260)] border border-[oklch(0.72_0.12_75/30%)] rounded-lg p-5 shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-[oklch(0.72_0.12_75/15%)] border border-[oklch(0.72_0.12_75/25%)] flex items-center justify-center">
                  <TrendingUp size={20} className="text-[oklch(0.72_0.12_75)]" />
                </div>
                <div>
                  <div
                    className="text-2xl font-bold text-gold-gradient"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    +$2.5M MXN
                  </div>
                  <div className="text-xs text-[oklch(0.58_0.010_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Promedio anual por palco premium
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="gold-divider" />
              <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Para Propietarios
              </span>
            </div>

            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              ¿Tienes un Palco?
              <br />
              <span className="text-gold-gradient italic">Publícalo.</span>
            </h2>

            <p
              className="text-[oklch(0.65_0.010_260)] mb-10 leading-relaxed text-base"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
            >
              Únete a la red de propietarios de palcos más grande de México. Conectamos tu espacio con miles de aficionados que buscan vivir experiencias premium en cada evento.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-10">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-md bg-[oklch(0.72_0.12_75/12%)] border border-[oklch(0.72_0.12_75/20%)] flex items-center justify-center shrink-0 mt-0.5">
                    <benefit.icon size={16} className="text-[oklch(0.72_0.12_75)]" />
                  </div>
                  <div>
                    <h4
                      className="text-base font-semibold text-white mb-1"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {benefit.title}
                    </h4>
                    <p
                      className="text-sm text-[oklch(0.58_0.010_260)] leading-relaxed"
                      style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                    >
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Money stats */}
            <div className="grid grid-cols-2 gap-4 mb-10 max-w-sm">
              <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-4">
                <div className="text-2xl font-bold text-gold-gradient" style={{ fontFamily: "'Cormorant Garamond', serif" }}>95%</div>
                <p className="text-xs text-[oklch(0.58_0.010_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>Tasa de ocupación</p>
              </div>
              <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-4">
                <div className="text-2xl font-bold text-gold-gradient" style={{ fontFamily: "'Cormorant Garamond', serif" }}>48 hrs</div>
                <p className="text-xs text-[oklch(0.58_0.010_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>Tiempo de pago</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePublish}
                className="btn-gold px-8 py-4 rounded-sm text-sm flex items-center justify-center gap-2 group"
              >
                Publicar Mi Palco
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                href="/#how-it-works"
                className="px-8 py-4 rounded-sm text-sm font-medium border border-white/15 text-[oklch(0.75_0.008_80)] hover:border-[oklch(0.72_0.12_75/40%)] hover:text-white transition-all duration-300 text-center"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Saber Más
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
