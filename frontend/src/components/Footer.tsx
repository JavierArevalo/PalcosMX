/**
 * Palcos Footer — Cinematic Dark Luxury
 * Contact info, links, early access signup form, social links
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { HashLink } from "@/components/HashLink";

const outfitFont = { fontFamily: "'Outfit', sans-serif" } as const;

/**
 * A footer link. Landing-section anchors ("/#how-it-works") route through
 * HashLink so they scroll correctly even from a non-landing page; "#"
 * placeholders show a "coming soon" toast; anything else (e.g. "#footer",
 * which exists on every page) is a plain in-page anchor.
 */
function FooterLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith("/#")) {
    return (
      <HashLink href={href} className={`${className} cursor-pointer`} style={outfitFont}>
        {children}
      </HashLink>
    );
  }
  return (
    <a
      href={href}
      onClick={(e) => {
        if (href === "#") {
          e.preventDefault();
          toast.info("Próximamente disponible.");
        }
      }}
      className={className}
      style={outfitFont}
    >
      {children}
    </a>
  );
}

const footerLinks = {
  platform: [
    { label: "Explorar Palcos", href: "/#venues" },
    { label: "Cómo Funciona", href: "/#how-it-works" },
    { label: "Publicar mi Palco", href: "/#owners" },
    { label: "Precios y Comisiones", href: "#" },
    { label: "Preguntas Frecuentes", href: "#" },
  ],
  company: [
    { label: "Sobre Palcos", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Prensa", href: "#" },
    { label: "Carreras", href: "#" },
    { label: "Contacto", href: "#footer" },
  ],
  legal: [
    { label: "Términos de Servicio", href: "#" },
    { label: "Política de Privacidad", href: "#" },
    { label: "Política de Cancelación", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

const cities = [
  "Ciudad de México", "Guadalajara", "Monterrey", "Puebla",
  "Tijuana", "León", "Querétaro", "Mérida",
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Por favor ingresa un correo electrónico válido.");
      return;
    }
    setSubmitted(true);
    toast.success("¡Te has registrado exitosamente!", {
      description: "Serás de los primeros en acceder a Palcos cuando lancemos.",
    });
    setEmail("");
  };

  return (
    <footer id="footer" className="bg-[oklch(0.07_0.004_260)] border-t border-white/6">
      {/* Early Access Banner */}
      <div className="border-b border-white/6 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="gold-divider" />
                <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Acceso Anticipado
                </span>
                <div className="gold-divider rotate-180" />
              </div>

              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Sé el Primero en
                <br />
                <span className="text-gold-gradient italic">Vivir la Experiencia</span>
              </h2>

              <p
                className="text-[oklch(0.58_0.010_260)] mb-8 text-base"
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
              >
                Regístrate ahora y obtén acceso anticipado, tarifas exclusivas de lanzamiento y notificaciones de nuevos palcos en tu ciudad.
              </p>

              {!submitted ? (
                <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-sm border border-white/10 hover:border-[oklch(0.72_0.12_75/40%)] transition-colors">
                    <Mail size={15} className="text-[oklch(0.72_0.12_75)] shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[oklch(0.40_0.008_260)]"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    />
                  </div>
                  <button type="submit" className="btn-gold px-6 py-3 rounded-sm text-sm flex items-center gap-2 justify-center shrink-0">
                    <Send size={14} />
                    Registrarme
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-3 py-3 px-6 bg-[oklch(0.72_0.12_75/10%)] border border-[oklch(0.72_0.12_75/30%)] rounded-sm max-w-md mx-auto">
                  <div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.12_75)] animate-pulse" />
                  <span className="text-sm text-[oklch(0.82_0.10_80)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    ¡Listo! Estás en la lista de acceso anticipado.
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-[oklch(0.82_0.10_80)] to-[oklch(0.62_0.11_70)] flex items-center justify-center">
                  <span className="text-[oklch(0.09_0.005_260)] font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', serif" }}>P</span>
                </div>
                <span
                  className="text-xl font-semibold tracking-wide text-gold-gradient"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Palcos
                </span>
              </div>

              <p
                className="text-[oklch(0.50_0.008_260)] text-sm leading-relaxed mb-6 max-w-xs"
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
              >
                El marketplace premium para reservar palcos y suites en los mejores estadios y arenas de México. Tu experiencia VIP, a un clic de distancia.
              </p>

              {/* Contact */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: Mail, text: "hola@palcos.mx" },
                  { icon: Phone, text: "+52 (55) 1234-5678" },
                  { icon: MapPin, text: "Ciudad de México, México" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon size={13} className="text-[oklch(0.72_0.12_75)] shrink-0" />
                    <span className="text-xs text-[oklch(0.50_0.008_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div className="flex gap-3">
                {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                  <button
                    key={i}
                    onClick={() => toast.info("Próximamente en redes sociales.")}
                    className="w-9 h-9 rounded-sm bg-white/5 border border-white/8 flex items-center justify-center text-[oklch(0.50_0.008_260)] hover:text-[oklch(0.72_0.12_75)] hover:border-[oklch(0.72_0.12_75/30%)] hover:bg-[oklch(0.72_0.12_75/10%)] transition-all duration-300"
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium mb-5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Plataforma
              </h4>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.label}>
                    <FooterLink
                      href={link.href}
                      className="text-sm text-[oklch(0.50_0.008_260)] hover:text-[oklch(0.82_0.10_80)] transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-[oklch(0.72_0.12_75)]" />
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium mb-5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Empresa
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <FooterLink
                      href={link.href}
                      className="text-sm text-[oklch(0.50_0.008_260)] hover:text-[oklch(0.82_0.10_80)] transition-colors flex items-center gap-1 group"
                    >
                      <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-[oklch(0.72_0.12_75)]" />
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium mb-5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Ciudades
              </h4>
              <ul className="space-y-3">
                {cities.map((city) => (
                  <li key={city}>
                    <button
                      onClick={() => toast.info(`Próximamente: Palcos en ${city}.`)}
                      className="text-sm text-[oklch(0.50_0.008_260)] hover:text-[oklch(0.82_0.10_80)] transition-colors flex items-center gap-1 group text-left"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-[oklch(0.72_0.12_75)]" />
                      {city}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/6 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.35_0.006_260)]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            © 2025 Palcos. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <FooterLink
                key={link.label}
                href={link.href}
                className="text-xs text-[oklch(0.35_0.006_260)] hover:text-[oklch(0.58_0.010_260)] transition-colors"
              >
                {link.label}
              </FooterLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
