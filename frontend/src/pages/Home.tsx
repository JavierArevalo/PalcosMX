/**
 * Palcos Home Page — Cinematic Dark Luxury
 * Assembles all landing page sections in order
 */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import FeaturedVenues from "@/components/FeaturedVenues";
import OwnerCTA from "@/components/OwnerCTA";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[oklch(0.09_0.005_260)]">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <FeaturedVenues />
      <OwnerCTA />
      <Testimonials />
      <Footer />
    </div>
  );
}
