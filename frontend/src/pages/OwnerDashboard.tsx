import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";

export default function OwnerDashboard() {
  return (
    <AppShell>
      <PageHeading
        eyebrow="Mi Cuenta"
        title="Mis"
        accent="Palcos"
        subtitle="Próximamente: gestión de palcos, publicaciones y solicitudes."
      />
    </AppShell>
  );
}
