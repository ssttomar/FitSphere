import { HeroSection } from "@/components/hero-section";
import { VideoCarousel } from "@/components/video-carousel";
import { AthleteShowcase3D } from "@/components/athlete-showcase-3d";
import { ProductModules } from "@/components/product-modules";
import { DashboardPreview } from "@/components/dashboard-preview";
import { SocialFeedPreview } from "@/components/social-feed-preview";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(255,112,52,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(22,188,255,0.14),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.07),transparent_40%)]" />
      <HeroSection />
      <VideoCarousel />
      <AthleteShowcase3D />
      <ProductModules />
      <DashboardPreview />
      <SocialFeedPreview />
    </div>
  );
}
