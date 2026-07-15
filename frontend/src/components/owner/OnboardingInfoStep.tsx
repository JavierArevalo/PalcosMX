/**
 * Onboarding step 1: read-only recap of what signup already collected
 * (name, email, location), plus connecting a payment method — the one
 * roadmap-required piece signup doesn't gather yet. Simulated (no real
 * Stripe call), same spirit as the simulated email confirmation.
 */
import { useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const PROVIDERS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "apple_pay", label: "Apple Pay" },
] as const;

export default function OnboardingInfoStep({ onContinue }: { onContinue: () => void }) {
  const { user } = useAuth();
  const [provider, setProvider] = useState<string>("stripe");
  const [connected, setConnected] = useState(Boolean((user as { payment_method?: unknown })?.payment_method));
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await post("/api/auth/payment-method", { provider });
      setConnected(true);
      toast.success("Método de pago conectado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo conectar el método de pago");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-sm" style={outfit}>
        <div className="flex justify-between border-b border-white/6 pb-2">
          <span className="text-[oklch(0.58_0.010_260)]">Nombre</span>
          <span className="text-white">{user?.name}</span>
        </div>
        <div className="flex justify-between border-b border-white/6 pb-2">
          <span className="text-[oklch(0.58_0.010_260)]">Correo</span>
          <span className="text-white">{user?.email}</span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-[oklch(0.58_0.010_260)]">Ubicación</span>
          <span className="text-white">{user?.location || "—"}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-[oklch(0.65_0.010_260)]" style={outfit}>
          Método de pago
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProvider(p.value)}
              disabled={connected}
              className={`rounded-md border px-3 py-2 text-xs transition-all ${
                provider === p.value
                  ? "border-[oklch(0.72_0.12_75)] bg-[oklch(0.72_0.12_75/10%)] text-[oklch(0.82_0.10_80)]"
                  : "border-white/10 text-[oklch(0.58_0.010_260)] hover:border-white/25"
              }`}
              style={outfit}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {connected ? (
        <div className="flex items-center gap-2 rounded-md border border-[oklch(0.6_0.12_150/40%)] bg-[oklch(0.6_0.12_150/10%)] px-4 py-3 text-sm text-[oklch(0.75_0.10_150)]" style={outfit}>
          <CheckCircle2 size={16} />
          Método de pago conectado — recibirás tus ingresos ahí.
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleConnect}
          disabled={busy}
          variant="outline"
          className="w-full py-5 rounded-sm text-sm gap-2"
        >
          <CreditCard size={16} />
          {busy ? "Conectando..." : "Conectar método de pago"}
        </Button>
      )}

      <Button onClick={onContinue} className="btn-gold w-full py-5 rounded-sm text-sm">
        Continuar
      </Button>
    </div>
  );
}
