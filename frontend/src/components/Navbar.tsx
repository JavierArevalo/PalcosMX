/**
 * Palcos Navbar — Cinematic Dark Luxury
 * Transparent on top, blurs to dark on scroll (or always solid on app pages).
 * Auth-aware: guests get login/CTA, users get role links + account menu.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { HashLink } from "@/components/HashLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const publicLinks = [
  { label: "Explorar", href: "/explorar" },
  { label: "Cómo Funciona", href: "/#how-it-works" },
];

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

export default function Navbar({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Renters get a link to their bookings; owners get a link to their dashboard.
  const reservationLink = user?.role === "renter" ? { label: "Mis Reservas", href: "/mis-reservas" } : null;
  const isOwner = user?.role === "owner";

  // Not an owner yet: send them to signup with the owner role preselected.
  // Already an owner: straight to their dashboard.
  const handleOwnerEntry = () => navigate(isOwner ? "/mis-palcos" : "/acceso?role=owner");

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada. ¡Hasta pronto!");
      navigate("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cerrar la sesión");
    }
  };

  const dark = solid || scrolled;

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          dark
            ? "bg-[oklch(0.09_0.005_260/0.95)] backdrop-blur-md border-b border-white/8 shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-[oklch(0.82_0.10_80)] to-[oklch(0.62_0.11_70)] flex items-center justify-center">
                <span className="text-[oklch(0.09_0.005_260)] font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', serif" }}>P</span>
              </div>
              <span
                className="text-xl font-semibold tracking-wide text-gold-gradient"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Palcos
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-8">
              {publicLinks.map((link) => (
                <HashLink
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-[oklch(0.75_0.008_80)] hover:text-[oklch(0.82_0.10_80)] transition-colors duration-200 tracking-wide cursor-pointer"
                  style={outfit}
                >
                  {link.label}
                </HashLink>
              ))}
              {reservationLink && (
                <Link
                  href={reservationLink.href}
                  className="text-sm font-medium text-[oklch(0.82_0.10_80)] hover:text-white transition-colors duration-200 tracking-wide"
                  style={outfit}
                >
                  {reservationLink.label}
                </Link>
              )}
              {isOwner ? (
                <>
                  <Link
                    href="/mis-palcos"
                    className="text-sm font-medium text-[oklch(0.82_0.10_80)] hover:text-white transition-colors duration-200 tracking-wide"
                    style={outfit}
                  >
                    Mis Palcos
                  </Link>
                  <Link
                    href="/solicitudes"
                    className="text-sm font-medium text-[oklch(0.82_0.10_80)] hover:text-white transition-colors duration-200 tracking-wide"
                    style={outfit}
                  >
                    Solicitudes
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleOwnerEntry}
                  className="text-sm font-medium text-[oklch(0.82_0.10_80)] hover:text-white transition-colors duration-200 tracking-wide"
                  style={outfit}
                >
                  Para Propietarios
                </button>
              )}
            </div>

            {/* Desktop right side */}
            <div className="hidden lg:flex items-center gap-3">
              {!user ? (
                <>
                  <Link
                    href="/acceso"
                    className="text-sm font-medium text-[oklch(0.75_0.008_80)] hover:text-white transition-colors px-4 py-2"
                    style={outfit}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link href="/explorar" className="btn-gold px-5 py-2.5 rounded-sm text-sm">
                    Reservar Ahora
                  </Link>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-sm border border-white/10 hover:border-[oklch(0.72_0.12_75/40%)] transition-colors text-sm text-white" style={outfit}>
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[oklch(0.82_0.10_80)] to-[oklch(0.62_0.11_70)] flex items-center justify-center text-[oklch(0.09_0.005_260)] text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    {user.name.split(" ")[0]}
                    {!user.confirmed && (
                      <span className="text-[10px] uppercase tracking-wider text-[oklch(0.72_0.12_75)] border border-[oklch(0.72_0.12_75/40%)] rounded-sm px-1.5 py-0.5">
                        Sin confirmar
                      </span>
                    )}
                    <ChevronDown size={14} className="text-[oklch(0.58_0.010_260)]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel style={outfit}>
                      <div className="text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {user.email} · {user.role === "owner" ? "Propietario" : "Arrendatario"}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {!user.confirmed && (
                      <DropdownMenuItem onClick={() => navigate("/confirmar")} style={outfit}>
                        Confirmar cuenta
                      </DropdownMenuItem>
                    )}
                    {user.role === "renter" && (
                      <DropdownMenuItem onClick={() => navigate("/preferencias")} style={outfit}>
                        <Settings size={14} /> Preferencias
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} style={outfit}>
                      <LogOut size={14} /> Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Abrir menú"
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
              {publicLinks.map((link) => (
                <HashLink
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-[oklch(0.80_0.008_80)] hover:text-[oklch(0.82_0.10_80)] transition-colors py-2 border-b border-white/5 cursor-pointer"
                  style={outfit}
                >
                  {link.label}
                </HashLink>
              ))}
              {reservationLink && (
                <Link
                  href={reservationLink.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-[oklch(0.82_0.10_80)] py-2 border-b border-white/5"
                  style={outfit}
                >
                  {reservationLink.label}
                </Link>
              )}
              {isOwner ? (
                <>
                  <Link
                    href="/mis-palcos"
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium text-[oklch(0.82_0.10_80)] py-2 border-b border-white/5"
                    style={outfit}
                  >
                    Mis Palcos
                  </Link>
                  <Link
                    href="/solicitudes"
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium text-[oklch(0.82_0.10_80)] py-2 border-b border-white/5"
                    style={outfit}
                  >
                    Solicitudes
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleOwnerEntry();
                  }}
                  className="text-left text-base font-medium text-[oklch(0.82_0.10_80)] py-2 border-b border-white/5"
                  style={outfit}
                >
                  Para Propietarios
                </button>
              )}
              {!user ? (
                <>
                  <Link
                    href="/acceso"
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium text-[oklch(0.80_0.008_80)] py-2 border-b border-white/5"
                    style={outfit}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/explorar"
                    onClick={() => setMobileOpen(false)}
                    className="btn-gold w-full py-3 rounded-sm text-sm mt-2 text-center"
                  >
                    Reservar Ahora
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="text-left text-base font-medium text-[oklch(0.80_0.008_80)] py-2"
                  style={outfit}
                >
                  Cerrar sesión ({user.name.split(" ")[0]})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
