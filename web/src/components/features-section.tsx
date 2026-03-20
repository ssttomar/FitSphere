"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BarChart3, Camera, Trophy, ArrowRight } from "lucide-react";

const features = [
  {
    tag: "Smart Tracking",
    icon: BarChart3,
    color: "text-orange-400",
    borderColor: "border-orange-500/20",
    dotColor: "bg-orange-400",
    gradientClass: "from-orange-500/10",
    title: "Log Every Lift.\nAnalyze Every Rep.",
    description:
      "Track workouts with elite-grade analytics. Monitor volume, progressive overload, and strength curves over time — all in one dashboard built for serious athletes.",
    image: "/images/download (7).jpg",
    points: [
      "Auto volume & intensity tracking",
      "PR history with progression graphs",
      "Customizable workout templates",
    ],
    reverse: false,
  },
  {
    tag: "AI Nutrition",
    icon: Camera,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    dotColor: "bg-emerald-400",
    gradientClass: "from-emerald-500/10",
    title: "Snap. Analyze.\nFuel Smarter.",
    description:
      "Upload a meal photo and let AI instantly calculate calories, macros, and micronutrients. No more manual logging — just eat and track. Science-grade nutrition made effortless.",
    image: "/images/download (8).jpg",
    points: [
      "Instant macro breakdown from a photo",
      "Meal history & daily calorie goals",
      "Nutrition insights & recommendations",
    ],
    reverse: true,
  },
  {
    tag: "Leaderboards",
    icon: Trophy,
    color: "text-yellow-400",
    borderColor: "border-yellow-500/20",
    dotColor: "bg-yellow-400",
    gradientClass: "from-yellow-500/10",
    title: "Compete.\nConnect. Dominate.",
    description:
      "Climb the leaderboards in your community, challenge friends on weekly fitness goals, and turn every session into something worth celebrating. Your effort, ranked.",
    image: "/images/download (9).jpg",
    points: [
      "Weekly challenge leaderboards",
      "Friend activity & comparison feed",
      "Achievement badges & milestones",
    ],
    reverse: false,
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto mt-32 w-full max-w-[1600px] px-4 md:px-10" data-reveal>
      {/* Header */}
      <div className="mb-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-zinc-400">
          Platform Features
        </span>
        <h2 className="section-title mt-4 text-4xl text-white sm:text-5xl">
          Everything You Need to
          <br />
          <span className="text-[#ff4d00]">Dominate Your Fitness.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
          Three powerful pillars — tracking, nutrition, and competition — built
          into one seamless experience.
        </p>
      </div>

      {/* Feature rows */}
      <div className="flex flex-col gap-28">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.tag}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className={`grid items-center gap-10 lg:grid-cols-2`}
            >
              {/* Image */}
              <div
                className={`relative h-[460px] overflow-hidden rounded-3xl ${feature.reverse ? "lg:order-2" : ""}`}
              >
                <Image
                  src={feature.image}
                  alt={feature.tag}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradientClass} to-transparent`}
                />
                {/* Tag badge on image */}
                <div
                  className={`absolute left-5 top-5 flex items-center gap-2 rounded-full border ${feature.borderColor} bg-black/60 px-4 py-2 backdrop-blur-md`}
                >
                  <Icon className={`h-3.5 w-3.5 ${feature.color}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${feature.color}`}>
                    {feature.tag}
                  </span>
                </div>
              </div>

              {/* Text content */}
              <div className={feature.reverse ? "lg:order-1" : ""}>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.2em] ${feature.color}`}
                >
                  <Icon className="h-3 w-3" />
                  {feature.tag}
                </span>
                <h3 className="section-title mt-5 whitespace-pre-line text-3xl text-white sm:text-4xl lg:text-5xl">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
                <ul className="mt-7 space-y-3">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <span
                        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${feature.dotColor}`}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                <button className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30">
                  Learn More <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
