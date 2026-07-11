/**
 * Spanish status pill for the rent-request lifecycle, shared by both
 * dashboards.
 */
const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendiente",
    className: "border-[oklch(0.72_0.12_75/50%)] text-[oklch(0.82_0.10_80)] bg-[oklch(0.72_0.12_75/10%)]",
  },
  accepted: {
    label: "Aceptada",
    className: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  },
  paid: {
    label: "Pagada",
    className: "border-emerald-500/50 text-emerald-200 bg-emerald-500/15",
  },
  rejected: {
    label: "Rechazada",
    className: "border-red-500/40 text-red-300 bg-red-500/10",
  },
  completed: {
    label: "Completada",
    className: "border-white/20 text-white bg-white/5",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { label: status, className: "border-white/20 text-white" };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-sm border text-[11px] font-medium uppercase tracking-wider ${style.className}`}
      style={outfit}
    >
      {style.label}
    </span>
  );
}
