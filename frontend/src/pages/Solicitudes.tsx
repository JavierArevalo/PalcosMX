/**
 * /solicitudes — owner's incoming rent requests, standalone from
 * /mis-palcos so the new-request notification email can deep-link
 * straight here (see notifications.py).
 */
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";
import RequestRow from "@/components/owner/RequestRow";
import { api, type Box } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

export default function Solicitudes() {
  const { data: boxes, isLoading } = useQuery({
    queryKey: ["myBoxes"],
    queryFn: () => api<Box[]>("/api/my/boxes"),
  });

  const allRequests = (boxes ?? []).flatMap((box) =>
    Object.values(box.requested_dates ?? {}).flat().map((request) => ({ request, box })),
  );
  // Pending first, then by date.
  allRequests.sort((a, b) => {
    if (a.request.status === "pending" && b.request.status !== "pending") return -1;
    if (b.request.status === "pending" && a.request.status !== "pending") return 1;
    return a.request.date.localeCompare(b.request.date);
  });

  return (
    <AppShell>
      <PageHeading
        eyebrow="Mi Cuenta"
        title="Mis"
        accent="Solicitudes"
        subtitle="Revisa y responde a las solicitudes de renta de tus palcos."
      />

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
    </AppShell>
  );
}
