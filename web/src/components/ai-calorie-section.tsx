"use client";

import { motion } from "framer-motion";
import { Camera, Sparkles } from "lucide-react";

const macros = [
  { label: "Calories", value: "640 kcal", width: "88%" },
  { label: "Protein", value: "44 g", width: "62%" },
  { label: "Carbs", value: "71 g", width: "78%" },
  { label: "Fat", value: "24 g", width: "49%" },
];

export function AICalorieSection() {
  return (
    <section className="mx-auto mt-20 mb-24 w-full max-w-[1600px] px-4 md:px-10" data-reveal>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,77,0,0.25),transparent_45%)]" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">AI Calorie Detection</p>
            <h2 className="section-title mt-3 text-3xl text-white sm:text-4xl">Snap. Analyze. Fuel Smarter.</h2>
            <p className="mt-3 max-w-lg text-sm text-zinc-300">
              Upload your meal image and FitSphere AI estimates calories, protein, carbs, and fats instantly.
            </p>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              <Camera className="h-4 w-4" />
              Upload Food Image
            </label>
          </div>
        </article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5 }}
          className="glass-card"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-white">Nutrition Breakdown</h3>
            <Sparkles className="h-5 w-5 text-[#ff6a2d]" />
          </div>

          <div className="space-y-4">
            {macros.map((macro) => (
              <div key={macro.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                  <span>{macro.label}</span>
                  <strong className="text-white">{macro.value}</strong>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[#ff4d00] to-[#ff8f61]"
                    style={{ width: macro.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.article>
      </div>
    </section>
  );
}
