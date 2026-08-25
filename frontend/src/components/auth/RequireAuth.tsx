import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Route guard: redirects guests to /acceso and wrong-role users to the
 * landing page once the session check resolves.
 */
export default function RequireAuth({
  role,
  children,
}: {
  role?: "owner" | "renter";
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    // Preserve the intended destination (e.g. an email link to /solicitudes)
    // through the login redirect.
    if (!user) navigate(`/acceso?next=${encodeURIComponent(location)}`);
    else if (role && user.role !== role) navigate("/");
  }, [user, isLoading, role, navigate, location]);

  if (isLoading || !user || (role && user.role !== role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.09_0.005_260)]">
        <div className="w-8 h-8 border-2 border-[oklch(0.72_0.12_75)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
