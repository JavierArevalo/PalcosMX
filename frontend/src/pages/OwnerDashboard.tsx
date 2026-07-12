/**
 * /mis-palcos — owner dashboard: manage boxes and listings, review and
 * accept/decline incoming requests, see earnings history.
 */
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";
import BoxForm from "@/components/owner/BoxForm";
import BoxCard from "@/components/owner/BoxCard";
import RequestRow from "@/components/owner/RequestRow";
import { api, type Box, type Stadium } from "@/lib/api";
import { formatMXN, formatDate } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const allRequests = (boxes ?? []).flatMap((box) =>
    Object.values(box.requested_dates ?? {}).flat().map((request) => ({ request, box })),
  );
  // Pending first, then by date.
  allRequests.sort((a, b) => {
    if (a.request.status === "pending" && b.request.status !== "pending") return -1;
    if (b.request.status === "pending" && a.request.status !== "pending") return 1;
    return a.request.date.localeCompare(b.request.date);
  });
  const pendingCount = allRequests.filter(({ request }) => request.status === "pending").length;

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

      <Tabs defaultValue="boxes">
        <TabsList className="mb-8">
          <TabsTrigger value="boxes" style={outfit}>Mis Palcos</TabsTrigger>
          <TabsTrigger value="requests" style={outfit}>
            Solicitudes{pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[oklch(0.72_0.12_75)] text-[oklch(0.09_0.005_260)] text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ Mis Palcos --- */}
        <TabsContent value="boxes">
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
        </TabsContent>

        {/* ------------------------------------------------ Solicitudes --- */}
        <TabsContent value="requests">
          <div className="space-y-3 max-w-4xl">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
            ) : allRequests.length > 0 ? (
              allRequests.map(({ request, box }) => (
                <RequestRow key={request.request_id} request={request} box={box} />
              ))
            ) : (
              <p className="text-[oklch(0.58_0.010_260)] italic py-8" style={outfit}>
                Sin solicitudes por ahora — aparecerán aquí cuando un arrendatario pida una fecha.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
