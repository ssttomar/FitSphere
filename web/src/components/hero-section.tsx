"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// ─── Video sources ────────────────────────────────────────────────────────────
// After running scripts/optimize-videos.sh swap paths to /videos/optimized/hero*.mp4
const HERO_VIDEOS = [
  { mp4: "/videos/hero1.mp4", label: "Strength Training" },
  { mp4: "/videos/hero2.mp4", label: "Cardio & Endurance" },
];

// ─── Fallback carousel images ─────────────────────────────────────────────────
const FALLBACK_IMAGES = [
  "/images/hero-fallback-1.jpg",
  "/images/hero-fallback-2.jpg",
  "/images/hero-fallback-3.jpg",
  "/images/hero-fallback-4.jpg",
  "/images/hero-fallback-5.jpg",
];

const CAROUSEL_INTERVAL = 4000; // ms between slides

// ─── FallbackCarousel ─────────────────────────────────────────────────────────
function FallbackCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % FALLBACK_IMAGES.length),
      CAROUSEL_INTERVAL,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={FALLBACK_IMAGES[index]}
            alt="FitSphere hero"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Carousel dots */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {FALLBACK_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-7 bg-orange-500" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── DualVideoBackground ──────────────────────────────────────────────────────
function DualVideoBackground({ onError }: { onError: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [ready, setReady] = useState(false);

  // Start alternating as soon as the first video can play
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % HERO_VIDEOS.length);
    }, 8000);
    return () => clearInterval(id);
  }, [ready]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {HERO_VIDEOS.map((v, i) => (
        <video
          key={v.mp4}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === activeIdx ? 1 : 0,
            transition: "opacity 1.2s ease-in-out",
            zIndex: i === activeIdx ? 1 : 0,
          }}
          src={v.mp4}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => { if (i === 0) setReady(true); }}
          onError={onError}
        />
      ))}

      {/* Loading shimmer — shown until first video plays */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="shimmer"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-10 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900"
          >
            <div className="animate-pulse h-full w-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video label badge */}
      <AnimatePresence mode="wait">
        <motion.span
          key={activeIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-6 right-6 z-20 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-widest text-white/70 backdrop-blur-md"
        >
          {HERO_VIDEOS[activeIdx].label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ─── HeroSection ──────────────────────────────────────────────────────────────
export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const [videoError, setVideoError] = useState(false);
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
    <section
      ref={heroRef}
      className="relative h-screen overflow-hidden"
    >
      {/* ── Background: video or image carousel ─────────────────────────── */}
      {videoError ? (
        <FallbackCarousel />
      ) : (
        <DualVideoBackground onError={() => setVideoError(true)} />
      )}

      {/* ── Cinematic gradient overlay ───────────────────────────────────── */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(255,77,0,0.48),transparent_40%),linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.55)_60%,rgba(0,0,0,0.88)_100%)]" />

      {/* ── Grain texture for cinematic feel ────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "160px",
        }}
      />


      {/* ── Hero content ────────────────────────────────────────────────── */}
      <div className="relative z-20 flex h-screen flex-col justify-end px-6 pb-16 pt-32 md:px-12 lg:px-20">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="hero-fade mb-6 inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-zinc-100 backdrop-blur-md"
        >
          FitSphere Performance Network
        </motion.p>

        <h1 className="hero-fade max-w-4xl text-5xl font-black leading-[1.08] sm:text-6xl md:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-serif)" }}>
          <span className="text-white">TRACK. TRAIN. </span>
          <span className="text-[#ff4d00]">TRANSFORM.</span>
        </h1>

        <p className="hero-fade mt-6 max-w-xl text-base text-zinc-200 md:text-lg">
          The ultimate social platform for athletes and creators.
        </p>

        <div className="hero-fade mt-10 flex flex-wrap gap-4">
          <Button
            variant="primary"
            onClick={() => router.push("/auth?mode=login")}
          >
            Start Training
          </Button>
          <Button
            variant="glass"
            onClick={() => router.push("/#workouts")}
          >
            Explore Workouts
          </Button>
        </div>
      </div>
    </section>
  );
}
