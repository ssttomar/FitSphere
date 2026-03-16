"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ParticleField } from "@/components/particle-field";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-fade",
        { opacity: 0, y: 34 },
        { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: "power3.out" },
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-[92vh] overflow-hidden rounded-b-[2.25rem] border border-white/10">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="https://player.vimeo.com/external/367482742.sd.mp4?s=20bfc6f82f4fce1619ce4ecf2e5765f56a4372fc&profile_id=139&oauth2_token_id=57447761"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,53,0.45),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(0,204,255,0.28),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.82))]" />
      <ParticleField />

      <div className="absolute right-6 top-6 z-30 flex gap-3 md:right-12 md:top-8">
        <Button variant="glass" size="sm" onClick={() => router.push("/auth?mode=login")}>Login</Button>
        <Button variant="primary" size="sm" onClick={() => router.push("/auth?mode=register")}>Register</Button>
      </div>

      <div className="relative z-20 flex min-h-[92vh] flex-col justify-end px-6 pb-14 pt-32 md:px-12 lg:px-20">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="hero-fade mb-6 inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-100 backdrop-blur-md"
        >
          FitSphere Performance Network
        </motion.p>

        <h1 className="hero-fade max-w-4xl font-display text-5xl uppercase tracking-[0.03em] text-white sm:text-6xl md:text-7xl lg:text-8xl">
          Track. Train. Transform.
        </h1>

        <p className="hero-fade mt-6 max-w-xl text-base text-zinc-200 md:text-lg">
          The ultimate social platform for athletes and creators.
        </p>

        <div className="hero-fade mt-10 flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => router.push("/auth?mode=register")}>
            Start Training
          </Button>
          <Button variant="glass" onClick={() => router.push("/auth?mode=register")}>
            Join Community
          </Button>
        </div>
      </div>
    </section>
  );
}
