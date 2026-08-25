/**
 * /mis-palcos — owner dashboard: manage boxes and listings, see earnings
 * history. Incoming requests live at their own route, /solicitudes (see
 * pages/Solicitudes.tsx), so the new-request email can deep-link there.
 */
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";
import BoxForm from "@/components/owner/BoxForm";
import BoxCard from "@/components/owner/BoxCard";
import { api, type Box, type Stadium } from "@/lib/api";
import { formatMXN, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;

export default function OwnerDashboard() {
  const { data: boxes, isLoading } = useQuery({
    queryKey: ["myBoxes"],
    queryFn: () => api<Box[]>("/api/my/boxes"),
  });
  const { data: stadiums } = useQuery({
    queryKey: ["stadiums"],
    queryFn: () => api<Stadium[]>("/api/stadiums"),
  });

  const stadiumById = new Map((stadiums ?? []).map((s) => [s.id, s]));

  const bookings = (boxes ?? []).flatMap((box) => box.booking_history);
  const earnings = bookings.reduce((sum, b) => sum + b.price_owner_received, 0);

  return (
    <AppShell>
      <PageHeading
        eyebrow="Mi Cuenta"
        title="Mis"
        accent="Palcos"
        subtitle="Registra tus palcos, publica fechas y gestiona las solicitudes de arrendatarios."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4" style={serif}>
            Registrar <span className="text-gold-gradient italic">Palco</span>
          </h2>
          <BoxForm />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)
          ) : boxes && boxes.length > 0 ? (
            boxes.map((box) => <BoxCard key={box.id} box={box} stadium={stadiumById.get(box.stadium_id)} />)
          ) : (
            <p className="text-[oklch(0.58_0.010_260)] italic py-8 md:col-span-2" style={outfit}>
              Aún no registras palcos — usa el formulario para publicar el primero.
            </p>
          )}
        </div>
      </div>

      {/* Earnings */}
      {bookings.length > 0 && (
        <div className="mt-10 bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
            <h2 className="text-2xl font-semibold text-white" style={serif}>
              Historial de <span className="text-gold-gradient italic">Reservas</span>
            </h2>
            <span className="text-sm text-[oklch(0.75_0.008_80)]" style={outfit}>
              Ingresos totales:{" "}
              <span className="text-gold-gradient font-bold text-lg" style={serif}>{formatMXN(earnings)}</span>
            </span>
          </div>
          <div className="space-y-2">
            {bookings.map((b, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 border border-white/6 rounded-md px-3 py-2 text-xs" style={outfit}>
                <span className="text-white">
                  {formatDate(b.date)} · {b.renter_name}
                  {b.event_description ? ` · ${b.event_description}` : ""}
                </span>
                <span className="text-[oklch(0.58_0.010_260)]">
                  Rentado en {formatMXN(b.price_rented)} → recibes{" "}
                  <span className="text-[oklch(0.82_0.10_80)]">{formatMXN(b.price_owner_received)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
