/**
 * /preferencias — Screen 3: renter onboarding preferences (also reachable
 * later from the account menu). Skippable.
 */
import { useLocation } from "wouter";
import AppShell from "@/components/layout/AppShell";
import PreferencesForm from "@/components/renter/PreferencesForm";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;

export default function Preferences() {
  const [, navigate] = useLocation();

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="gold-divider" />
            <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={outfit}>
              Paso 3 de 3
            </span>
            <div className="gold-divider rotate-180" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3" style={serif}>
            Tus <span className="text-gold-gradient italic">Preferencias</span>
          </h1>
          <p className="text-sm text-[oklch(0.58_0.010_260)]" style={outfit}>
            Personalizan "Sugeridos para mí" — todas son opcionales.
          </p>
        </div>

        <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-6 sm:p-8">
          <PreferencesForm onSaved={() => navigate("/explorar")} />
          <button
            onClick={() => navigate("/explorar")}
            className="w-full text-center text-xs text-[oklch(0.50_0.008_260)] hover:text-white transition-colors mt-4"
            style={outfit}
          >
            Omitir por ahora
          </button>
        </div>
      </div>
    </AppShell>
  );
}
