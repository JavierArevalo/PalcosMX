/**
 * Onboarding hub shown after a box (and its availability) has been
 * published: owner can loop back to add another box, connect payment
 * (optional, deferred from the old step 1), or head to the dashboard.
 */
import { CheckCircle2, Plus, CreditCard, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

export default function OnboardingChoiceStep({
  boxCount,
  onAddAnother,
  onAddPayment,
  onFinish,
}: {
  boxCount: number;
  onAddAnother: () => void;
  onAddPayment: () => void;
  onFinish: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[oklch(0.6_0.12_150/12%)] border border-[oklch(0.6_0.12_150/30%)] flex items-center justify-center">
          <CheckCircle2 size={22} className="text-[oklch(0.75_0.10_150)]" />
        </div>
        <p className="text-sm text-[oklch(0.65_0.010_260)]" style={outfit}>
          {boxCount === 1 ? "Tu palco ya está publicado." : `Ya llevas ${boxCount} palcos publicados.`}
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={onAddAnother} variant="outline" className="w-full py-5 rounded-sm text-sm gap-2">
          <Plus size={16} />
          Agregar otro palco
        </Button>
        <Button onClick={onAddPayment} variant="outline" className="w-full py-5 rounded-sm text-sm gap-2">
          <CreditCard size={16} />
          Agregar método de pago
        </Button>
        <Button onClick={onFinish} className="btn-gold w-full py-5 rounded-sm text-sm gap-2">
          <LayoutGrid size={16} />
          Ir a Mis Palcos
        </Button>
      </div>
    </div>
  );
}
