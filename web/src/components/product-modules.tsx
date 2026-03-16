"use client";

import { motion } from "framer-motion";
import { Award, Camera, Compass, Dumbbell, Users } from "lucide-react";

const onboardingFields = ["Height", "Weight", "Fitness Goal", "Experience Level", "Preferred Category"];

const moduleCards = [
  {
    title: "Workout Tracking",
    icon: Dumbbell,
    points: ["Exercise name, sets, reps, weight, rest", "Total volume calculation", "PR detection and streak highlights"],
  },
  {
    title: "Running Tracking",
    icon: Compass,
    points: ["Distance, time, pace and calories", "Running history and personal records", "Endurance trend projections"],
  },
  {
    title: "Community Challenges",
    icon: Users,
    points: ["Powerlifting, runners, and calisthenics clubs", "Leaderboards and group challenges", "Shared workouts and progress sharing"],
  },
  {
    title: "AI Calorie Tracker",
    icon: Camera,
    points: ["Upload food image", "Estimate calories, protein, carbs, fat", "Visual macro breakdown output"],
  },
  {
    title: "Achievements",
    icon: Award,
    points: ["First Workout, 100km Running, Bench 100kg", "30-day consistency badges", "Profile badge showcase"],
  },
];

export function ProductModules() {
  return (
    <section className="mx-auto mt-20 w-full max-w-[1600px] px-4 md:px-10">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-card">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Onboarding Flow</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">Personalized Athlete Setup</h3>
          <p className="mt-3 text-sm text-zinc-300">Create a tailored dashboard immediately after signup based on profile and performance goals.</p>

          <div className="mt-6 space-y-3">
            {onboardingFields.map((field) => (
              <label key={field} className="block rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-zinc-200">
                {field}
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-300">
            <span className="rounded-full border border-white/15 px-3 py-1">Gym</span>
            <span className="rounded-full border border-white/15 px-3 py-1">Running</span>
            <span className="rounded-full border border-white/15 px-3 py-1">Calisthenics</span>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moduleCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.07, duration: 0.45 }}
                className="glass-card"
              >
                <Icon className="h-5 w-5 text-cyan-300" />
                <h4 className="mt-4 text-lg font-semibold text-white">{card.title}</h4>
                <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                  {card.points.map((point) => (
                    <li key={point} className="rounded-lg bg-white/5 px-3 py-2">{point}</li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
