/**
 * Palcos Navbar — Cinematic Dark Luxury
 * Transparent on top, blurs to dark on scroll
 * Gold accent on logo and CTA
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";

const navLinks = [
  { label: "Explorar", href: "#venues" },
  { label: "Cómo Funciona", href: "#how-it-works" },
  { label: "Para Propietarios", href: "#owners" },
  { label: "Contacto", href: "#footer" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogin = () => toast.info("Inicio de sesión próximamente disponible.");

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[oklch(0.09_0.005_260/0.95)] backdrop-blur-md border-b border-white/8 shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-[oklch(0.82_0.10_80)] to-[oklch(0.62_0.11_70)] flex items-center justify-center">
                <span className="text-[oklch(0.09_0.005_260)] font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', serif" }}>P</span>
              </div>
              <span
                className="text-xl font-semibold tracking-wide text-gold-gradient"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Palcos
              </span>
            </a>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-[oklch(0.75_0.008_80)] hover:text-[oklch(0.82_0.10_80)] transition-colors duration-200 tracking-wide"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={handleLogin}
                className="text-sm font-medium text-[oklch(0.75_0.008_80)] hover:text-white transition-colors px-4 py-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={handleLogin}
                className="btn-gold px-5 py-2.5 rounded-sm text-sm"
              >
                Reservar Ahora
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[oklch(0.09_0.005_260/0.98)] backdrop-blur-md border-b border-white/8 lg:hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-[oklch(0.80_0.008_80)] hover:text-[oklch(0.82_0.10_80)] transition-colors py-2 border-b border-white/5"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={handleLogin}
                className="btn-gold w-full py-3 rounded-sm text-sm mt-2"
              >
                Reservar Ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
