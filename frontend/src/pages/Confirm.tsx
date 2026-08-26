/**
 * /confirmar — Screen 2: verify the account with the emailed code. The
 * gold alert only appears as a local-dev fallback when no real email
 * provider is configured server-side (see auth.py's _confirmation_response).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;

export default function Confirm() {
  const { user, demoCode, confirm, resendCode } = useAuth();
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const afterConfirmTarget = user?.role === "renter" ? "/preferencias" : "/bienvenida";

  if (user?.confirmed) {
    navigate(afterConfirmTarget);
    return null;
  }

  const handleConfirm = async () => {
    if (code.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }
    setBusy(true);
    try {
      await confirm(code);
      toast.success("¡Cuenta confirmada!");
      navigate(afterConfirmTarget);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Código inválido");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendCode();
      toast.success("Código reenviado — revisa tu correo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reenviar el código");
    }
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="gold-divider" />
          <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={outfit}>
            Paso 2 de 3
          </span>
          <div className="gold-divider rotate-180" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3" style={serif}>
          Confirma tu <span className="text-gold-gradient italic">Cuenta</span>
        </h1>
        <p className="text-sm text-[oklch(0.58_0.010_260)] mb-8" style={outfit}>
          Enviamos un código de confirmación a <span className="text-white">{user?.email}</span>.
        </p>

        {demoCode && (
          <Alert className="mb-8 border-[oklch(0.72_0.12_75/40%)] bg-[oklch(0.72_0.12_75/10%)] text-left">
            <MailCheck className="text-[oklch(0.72_0.12_75)]" />
            <AlertTitle style={outfit}>Correo simulado (prototipo)</AlertTitle>
            <AlertDescription style={outfit}>
              Tu código es{" "}
              <span className="font-mono text-lg text-[oklch(0.82_0.10_80)] tracking-widest">{demoCode}</span>
              {" "}— también aparece en la consola del servidor.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button onClick={handleConfirm} disabled={busy} className="btn-gold w-full py-5 rounded-sm text-sm mb-4">
            {busy ? "Confirmando..." : "Confirmar Cuenta"}
          </Button>

          <div className="flex items-center justify-between text-xs" style={outfit}>
            <button onClick={handleResend} className="text-[oklch(0.72_0.12_75)] hover:text-[oklch(0.82_0.10_80)] transition-colors">
              Reenviar código
            </button>
            <button
              onClick={() => navigate("/explorar")}
              className="text-[oklch(0.50_0.008_260)] hover:text-white transition-colors"
            >
              Omitir por ahora (solo explorar)
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
