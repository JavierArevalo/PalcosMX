/**
 * /bienvenida — owner onboarding wizard. Box registration comes first
 * (no payment gate up front): registrar palco → publicar disponibilidad →
 * choice hub (agregar otro palco, loops back to the box step; conectar
 * método de pago, deferred/optional; or ir a Mis Palcos).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/layout/AppShell";
import OnboardingInfoStep from "@/components/owner/OnboardingInfoStep";
import OnboardingBoxStep from "@/components/owner/OnboardingBoxStep";
import OnboardingAvailabilityStep from "@/components/owner/OnboardingAvailabilityStep";
import OnboardingChoiceStep from "@/components/owner/OnboardingChoiceStep";
import type { Box } from "@/lib/api";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;

type Step = "box" | "availability" | "choice" | "payment";

const STEP_META: Record<Step, { eyebrow: string; subtitle: string }> = {
  box: { eyebrow: "Nuevo Palco", subtitle: "Cuéntanos sobre el palco que quieres publicar." },
  availability: { eyebrow: "Disponibilidad", subtitle: "¿Para qué fechas está disponible tu palco?" },
  choice: { eyebrow: "¡Listo!", subtitle: "¿Qué te gustaría hacer ahora?" },
  payment: { eyebrow: "Método de Pago", subtitle: "Conecta tu método de pago para recibir tus ingresos." },
};

export default function OwnerOnboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("box");
  const [box, setBox] = useState<Box | null>(null);
  const [boxCount, setBoxCount] = useState(0);

  const finish = () => navigate("/mis-palcos");
  const meta = STEP_META[step];

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="gold-divider" />
            <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={outfit}>
              {meta.eyebrow}
            </span>
            <div className="gold-divider rotate-180" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3" style={serif}>
            {step === "box" && (
              <>Registra tu <span className="text-gold-gradient italic">Palco</span></>
            )}
            {step === "availability" && (
              <>Publica tu <span className="text-gold-gradient italic">Disponibilidad</span></>
            )}
            {step === "choice" && (
              <>¡Palco <span className="text-gold-gradient italic">Registrado</span>!</>
            )}
            {step === "payment" && (
              <>Conecta tu <span className="text-gold-gradient italic">Pago</span></>
            )}
          </h1>
          <p className="text-sm text-[oklch(0.58_0.010_260)]" style={outfit}>
            {meta.subtitle}
          </p>
        </div>

        <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-6 sm:p-8">
          {step === "box" && (
            <OnboardingBoxStep
              onCreated={(createdBox) => {
                setBox(createdBox);
                setStep("availability");
              }}
            />
          )}
          {step === "availability" && box && (
            <OnboardingAvailabilityStep
              box={box}
              onFinish={() => {
                setBoxCount((c) => c + 1);
                setStep("choice");
              }}
            />
          )}
          {step === "choice" && (
            <OnboardingChoiceStep
              boxCount={boxCount}
              onAddAnother={() => {
                setBox(null);
                setStep("box");
              }}
              onAddPayment={() => setStep("payment")}
              onFinish={finish}
            />
          )}
          {step === "payment" && <OnboardingInfoStep onContinue={finish} />}

          {(step === "box" || step === "payment") && (
            <button
              onClick={finish}
              className="w-full text-center text-xs text-[oklch(0.50_0.008_260)] hover:text-white transition-colors mt-4"
              style={outfit}
            >
              Omitir por ahora
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
