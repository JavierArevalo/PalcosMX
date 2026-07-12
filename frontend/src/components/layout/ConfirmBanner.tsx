/**
 * Shown to logged-in, unconfirmed users on every app page: inline code
 * entry + resend, mirroring the /confirmar screen for convenience.
 */
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

export default function ConfirmBanner() {
  const { user, demoCode, confirm, resendCode } = useAuth();
  const [code, setCode] = useState("");

  if (!user || user.confirmed) return null;

  const handleConfirm = async () => {
    try {
      await confirm(code.trim());
      toast.success("¡Cuenta confirmada!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Código inválido");
    }
  };

  const handleResend = async () => {
    try {
      await resendCode();
      toast.success("Código reenviado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reenviar");
    }
  };

  return (
    <div
      className="mb-8 flex flex-wrap items-center gap-3 rounded-md border border-[oklch(0.72_0.12_75/40%)] bg-[oklch(0.72_0.12_75/10%)] px-4 py-3 text-sm text-[oklch(0.82_0.10_80)]"
      style={outfit}
    >
      <span className="flex-1 min-w-52">
        Tu cuenta no está confirmada — ingresa el código para desbloquear reservas.
        {demoCode && (
          <span className="ml-1 font-mono text-[oklch(0.82_0.10_80)]">(código demo: {demoCode})</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de 6 dígitos"
          maxLength={6}
          className="w-36 h-8 text-center font-mono"
        />
        <Button onClick={handleConfirm} size="sm" className="btn-gold rounded-sm">
          Confirmar
        </Button>
        <button onClick={handleResend} className="text-xs underline-offset-2 hover:underline">
          Reenviar
        </button>
      </div>
    </div>
  );
}
