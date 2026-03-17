"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroSection } from "@/components/hero-section";
import { VideoCarousel } from "@/components/video-carousel";
import { AthleteShowcase3D } from "@/components/athlete-showcase-3d";
import { DashboardPreview } from "@/components/dashboard-preview";
import { SocialFeedPreview } from "@/components/social-feed-preview";
import { CommunitySection } from "@/components/community-section";
import { AICalorieSection } from "@/components/ai-calorie-section";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 48 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 84%",
            },
          },
        );
      });

      gsap.to("[data-parallax]", {
        yPercent: -16,
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative min-h-screen overflow-hidden bg-[#000000]">
      <div data-parallax className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_20%,rgba(255,77,0,0.2),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_50%_84%,rgba(255,77,0,0.1),transparent_42%)]" />
      <HeroSection />
      <VideoCarousel />
      <AthleteShowcase3D />
      <DashboardPreview />
      <SocialFeedPreview />
      <CommunitySection />
      <AICalorieSection />
    </div>
  );
}
