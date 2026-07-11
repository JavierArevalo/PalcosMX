import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";

export default function RenterDashboard() {
  return (
    <AppShell>
      <PageHeading
        eyebrow="Mi Cuenta"
        title="Mis"
        accent="Reservas"
        subtitle="Próximamente: el ciclo completo de tus solicitudes."
      />
    </AppShell>
  );
}
