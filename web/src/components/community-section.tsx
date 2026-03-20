"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Users, Globe, ArrowRight, Flame } from "lucide-react";

const stats = [
  { value: "50K+", label: "Active Athletes" },
  { value: "200+", label: "Communities" },
  { value: "2M+", label: "Workouts Logged" },
  { value: "98%", label: "Retention Rate" },
];

const groups = [
  { name: "Powerlifting India", members: "12.4k", tag: "Strength" },
  { name: "Delhi Runners Club", members: "8.9k", tag: "Running" },
  { name: "Calisthenics Athletes", members: "6.2k", tag: "Bodyweight" },
];

export function CommunitySection() {
  return (
    <section className="relative mt-32 w-full overflow-hidden" data-reveal>
      {/* Full-bleed background */}
      <div className="relative min-h-[700px] w-full">
        <Image
          src="/images/hero-fallback-5.jpg"
          alt="FitSphere Community"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={false}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_50%,rgba(255,77,0,0.15),transparent_50%)]" />

        {/* Content */}
        <div className="relative z-10 mx-auto flex min-h-[700px] max-w-[1600px] flex-col justify-center px-4 py-24 md:px-10 lg:max-w-[60%]">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-sm">
              <Globe className="h-3 w-3 text-orange-400" /> Community
            </span>

            <h2 className="section-title text-4xl text-white sm:text-5xl lg:text-6xl">
              Train Together.
              <br />
              <span className="text-[#ff4d00]">Grow Together.</span>
            </h2>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-300">
              Find your tribe. Join specialized communities for your sport,
              connect with athletes who share your goals, and build
              accountability that actually keeps you showing up.
            </p>

            {/* Stats grid */}
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md"
                >
                  <p className="text-2xl font-black text-[#ff4d00]">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Community chips */}
            <div className="mt-6 flex flex-wrap gap-3">
              {groups.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 backdrop-blur-md"
                >
                  <Users className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-xs font-medium text-white">
                    {g.name}
                  </span>
                  <span className="text-xs text-zinc-400">{g.members}</span>
                </div>
              ))}
            </div>

            <button className="accent-glow mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#ff4d00] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-orange-400">
              Join a Community <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Floating community cards below the hero section */}
      <div className="relative z-10 -mt-12 mx-auto max-w-[1600px] px-4 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Flame,
              name: "Powerlifting Hub",
              desc: "Heavy compound sessions, PR check-ins, and strength cycles.",
              members: "12.4k",
              color: "text-orange-400",
              border: "border-orange-500/20",
            },
            {
              icon: Users,
              name: "Delhi Runners",
              desc: "Tempo groups, weekend long runs, and pace leaderboards.",
              members: "8.9k",
              color: "text-blue-400",
              border: "border-blue-500/20",
            },
            {
              icon: Users,
              name: "Calisthenics Athletes",
              desc: "Muscle-up skill blocks, mobility, and bodyweight progression.",
              members: "6.2k",
              color: "text-emerald-400",
              border: "border-emerald-500/20",
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.55 }}
                className={`group rounded-3xl border ${card.border} bg-[#0c0c0c]/90 p-6 backdrop-blur-xl`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${card.color}`} />
                  <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                    {card.members} members
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white">{card.name}</h3>
                <p className="mt-2 text-sm text-zinc-400">{card.desc}</p>
                <button className="mt-5 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-all hover:bg-[#ff4d00] hover:border-[#ff4d00]">
                  Join Community
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
