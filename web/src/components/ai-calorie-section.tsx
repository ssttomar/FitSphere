"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Bot, Sparkles, Zap, TrendingUp, CheckCircle } from "lucide-react";

const messages = [
  {
    type: "ai",
    text: "Based on today's squat session, I recommend a 48h recovery window for your legs. Your CNS fatigue score is elevated.",
  },
  {
    type: "user",
    text: "Can I still do upper body tomorrow?",
  },
  {
    type: "ai",
    text: "Yes — an upper-body pull session would complement your recovery perfectly. I've queued a suggested routine for you.",
  },
];

const coachFeatures = [
  "Personalized weekly program generation",
  "Readiness score based on HRV & sleep data",
  "Auto-adjusted volume & intensity",
  "Real-time form cues & injury prevention",
];

export function AICalorieSection() {
  return (
    <section className="mx-auto mt-32 w-full max-w-[1600px] px-4 md:px-10" data-reveal>
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-orange-400">
          <Bot className="h-3 w-3" /> AI Powered Coach
        </span>
        <h2 className="section-title mt-4 text-4xl text-white sm:text-5xl lg:text-6xl">
          Your Coach.
          <br />
          <span className="text-[#ff4d00]">Always On.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
          An intelligent training partner that learns your body, adapts your
          plan, and guides every decision — from reps to recovery.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        {/* Left: Athlete image with readiness overlay */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative h-[580px] overflow-hidden rounded-3xl"
        >
          <Image
            src="/images/Female resting with intense workout.jpg"
            alt="AI Coach athlete"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

          {/* Floating readiness card */}
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-black/75 p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-zinc-400">
                Today&apos;s Readiness
              </span>
              <Zap className="h-4 w-4 text-[#ff4d00]" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">8.6</span>
              <span className="mb-1.5 text-sm text-zinc-400">/ 10</span>
              <span className="mb-1 ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                Peak Condition
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#ff4d00] to-emerald-400"
                style={{ width: "86%" }}
              />
            </div>
          </div>

          {/* Top floating badge */}
          <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-200">AI Coach Active</span>
          </div>
        </motion.div>

        {/* Right: AI Chat + feature list */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex flex-col gap-5"
        >
          {/* Chat interface */}
          <div className="rounded-3xl border border-white/10 bg-[#0c0c0c] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4d00] to-[#ff8f61]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  FitSphere AI
                </p>
                <p className="text-xs text-emerald-400">● Online</p>
              </div>
              <span className="ml-auto rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-orange-400">
                Personalized
              </span>
            </div>

            <div className="space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.18, duration: 0.4 }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.type === "ai"
                        ? "border border-white/10 bg-white/8 text-zinc-200"
                        : "bg-[#ff4d00] text-white"
                    }`}
                  >
                    {msg.type === "ai" && (
                      <Sparkles className="mb-1.5 h-3 w-3 text-[#ff4d00]" />
                    )}
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Feature list */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-[#ff4d00]" />
              What your AI Coach does
            </h3>
            <ul className="space-y-3">
              {coachFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#ff4d00]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
