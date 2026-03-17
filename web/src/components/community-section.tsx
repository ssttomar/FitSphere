"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";

const communities = [
  {
    name: "Powerlifting Club",
    members: "12.4k members",
    summary: "Heavy compound sessions, PR check-ins, and strength cycles.",
  },
  {
    name: "Delhi Runners",
    members: "8.9k members",
    summary: "Tempo groups, weekend long runs, and pace leaderboards.",
  },
  {
    name: "Calisthenics Athletes",
    members: "6.2k members",
    summary: "Muscle-up skill blocks, mobility, and bodyweight progression.",
  },
];

export function CommunitySection() {
  return (
    <section className="mx-auto mt-20 w-full max-w-[1600px] px-4 md:px-10" data-reveal>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="section-title text-3xl text-white sm:text-4xl">Fitness Communities</h2>
        <p className="max-w-md text-sm text-zinc-400 sm:text-base">Build accountability with athletes who train with the same intensity and goals.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {communities.map((community, index) => (
          <motion.article
            key={community.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="glass-card group"
          >
            <div className="mb-4 flex items-center justify-between">
              <Users className="h-5 w-5 text-[#ff6a2d]" />
              <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">{community.members}</span>
            </div>
            <h3 className="text-2xl font-semibold text-white">{community.name}</h3>
            <p className="mt-3 text-sm text-zinc-300">{community.summary}</p>
            <button className="accent-glow mt-6 rounded-full bg-[#ff4d00] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-transform group-hover:scale-[1.03]">
              Join Community
            </button>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
