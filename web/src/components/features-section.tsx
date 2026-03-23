"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BarChart3, Camera, Trophy, Zap, ArrowRight, Users, Flame } from "lucide-react";

function cardAnim(i: number) {
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.65, delay: i * 0.1, ease: "easeOut" as const },
  };
}

const SCAN_MACROS = [
  { label: "Protein", value: "38g", color: "#ff4d00", pct: 76 },
  { label: "Carbs", value: "52g", color: "#3b82f6", pct: 52 },
  { label: "Fats", value: "18g", color: "#f59e0b", pct: 36 },
];

const LEADERBOARD = [
  { rank: 1, name: "Marcus Webb", initials: "MW", score: "4,820 pts", tag: "Powerlifting", delta: "+240" },
  { rank: 2, name: "Priya Nair", initials: "PN", score: "4,510 pts", tag: "Cardio", delta: "+180" },
  { rank: 3, name: "Jordan Park", initials: "JP", score: "4,205 pts", tag: "Calisthenics", delta: "+95" },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto mt-32 w-full max-w-[1600px] px-4 md:px-10" data-reveal>
      {/* Header */}
      <div className="mb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-zinc-400">
          Platform Features
        </span>
        <h2 className="section-title mt-4 text-4xl text-white sm:text-5xl">
          Everything You Need to
          <br />
          <span className="text-[#ff4d00]">Dominate Your Fitness.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
          Three powerful pillars — tracking, nutrition, and competition — built into one seamless experience.
        </p>
      </div>

      {/* ── Bento Grid ── */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        style={{ gridAutoRows: "280px" }}
      >
        {/* [1] Smart Tracking — Large (2 cols × 2 rows) */}
        <motion.div
          {...cardAnim(0)}
          className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-3xl group cursor-pointer border border-white/8"
        >
          <Image
            src="/images/download (7).jpg"
            alt="Smart Tracking"
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent" />
          {/* Top badge */}
          <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-orange-500/30 bg-black/70 px-4 py-2 backdrop-blur-md">
            <BarChart3 className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">Smart Tracking</span>
          </div>
          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h3 className="section-title text-3xl text-white sm:text-4xl">
              Log Every Lift.<br />Analyze Every Rep.
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-300">
              Track workouts with elite-grade analytics. Monitor volume, progressive overload, and strength curves — all in one dashboard built for serious athletes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Auto Volume Tracking", "PR History", "Smart Templates"].map((pt) => (
                <span key={pt} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-zinc-200 backdrop-blur-sm">
                  {pt}
                </span>
              ))}
            </div>
            {/* Mini stat strip */}
            <div className="mt-5 flex gap-8 border-t border-white/10 pt-5">
              {[
                { value: "2.1M+", label: "Workouts Logged" },
                { value: "847K+", label: "PRs Broken" },
                { value: "99.4%", label: "Accuracy" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* [2] AI Nutrition — Glassmorphism with scan animation */}
        <motion.div
          {...cardAnim(1)}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#091410] to-[#050b08] p-6 flex flex-col justify-between"
        >
          {/* Scan zone */}
          <div className="relative flex-1 overflow-hidden rounded-xl bg-black/40 border border-white/8 mb-4 flex items-center justify-center min-h-0">
            <span className="text-5xl">🍱</span>
            {/* Laser scan line */}
            <div
              className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
              style={{ animation: "scan-laser 2.2s ease-in-out infinite", position: "absolute" }}
            />
            {/* Corner brackets */}
            {(["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2",
              "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"] as const).map((cls, i) => (
              <div key={i} className={`absolute h-4 w-4 ${cls} border-emerald-400 opacity-70`} />
            ))}
          </div>
          {/* Label */}
          <div className="flex items-center gap-2 mb-1">
            <Camera className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">AI Nutrition</span>
          </div>
          <h3 className="text-xl font-black text-white leading-tight">Snap. Analyze.<br />Fuel Smarter.</h3>
          {/* Macro mini-bars */}
          <div className="mt-3 space-y-1.5">
            {SCAN_MACROS.map((m) => (
              <div key={m.label} className="flex items-center gap-2">
                <span className="w-10 text-xs text-zinc-500">{m.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
                <span className="text-xs font-bold text-white">{m.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* [3] Readiness stat card */}
        <motion.div
          {...cardAnim(2)}
          className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-gradient-to-br from-orange-500/12 via-orange-600/4 to-transparent p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">AI Coach</span>
            </div>
            <p className="text-6xl font-black text-white leading-none">
              8.6<span className="text-2xl text-zinc-500">/10</span>
            </p>
            <p className="text-sm text-zinc-300 mt-1.5 font-medium">Today&apos;s Readiness</p>
          </div>
          <div>
            <div className="h-2 rounded-full bg-white/10 mb-3 overflow-hidden">
              <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-[#ff4d00] to-emerald-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">CNS &amp; Recovery balanced</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400 font-semibold">
                Peak
              </span>
            </div>
          </div>
        </motion.div>

        {/* [4] Leaderboards — Full width (3 cols) */}
        <motion.div
          {...cardAnim(3)}
          className="md:col-span-3 relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#100f07] to-[#070606] group"
        >
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(255,200,0,0.06),transparent_60%)]" />
          <div className="relative z-10 h-full p-8 flex items-center gap-8 lg:gap-14">
            {/* Left text */}
            <div className="flex-shrink-0 max-w-[220px]">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Leaderboards</span>
              </div>
              <h3 className="section-title text-3xl text-white">
                Compete.<br />Dominate.
              </h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Weekly challenges ranked across strength, cardio &amp; endurance.
              </p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-5 py-2.5 text-sm font-bold text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                View Rankings <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Leaderboard rows */}
            <div className="flex-1 space-y-2.5 min-w-0">
              {LEADERBOARD.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 rounded-2xl border px-5 py-3 transition-all ${
                    entry.rank === 1
                      ? "border-yellow-500/40 bg-yellow-500/10"
                      : "border-white/8 bg-white/4"
                  }`}
                >
                  <span className={`w-6 text-lg font-black ${entry.rank === 1 ? "text-yellow-400" : "text-zinc-600"}`}>
                    #{entry.rank}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-xs font-black text-white shrink-0">
                    {entry.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                    <p className="text-xs text-zinc-500">{entry.tag}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-white">{entry.score}</p>
                    <p className="text-xs text-emerald-400 font-medium">{entry.delta} this week</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right stats */}
            <div className="flex-shrink-0 hidden lg:flex flex-col gap-6 text-right">
              {[
                { value: "12K+", label: "Active Athletes", Icon: Users },
                { value: "340+", label: "Weekly PRs", Icon: Flame },
              ].map(({ value, label, Icon }) => (
                <div key={label}>
                  <p className="text-3xl font-black text-white">{value}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <Icon className="h-3 w-3 text-zinc-500" />
                    <p className="text-xs text-zinc-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
