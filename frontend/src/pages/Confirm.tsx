import AppShell from "@/components/layout/AppShell";
import PageHeading from "@/components/PageHeading";

export default function Confirm() {
  return (
    <AppShell>
      <PageHeading
        eyebrow="Onboarding"
        title="Confirma tu"
        accent="Cuenta"
        subtitle="Próximamente: verificación por código."
      />
    </AppShell>
  );
}
