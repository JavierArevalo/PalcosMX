import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConfirmBanner from "@/components/layout/ConfirmBanner";

/**
 * Shared frame for the app pages (everything except the landing, which
 * composes its own sections). Pads below the fixed navbar.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[oklch(0.09_0.005_260)] flex flex-col">
      <Navbar solid />
      <main className="flex-1 pt-24 lg:pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConfirmBanner />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
