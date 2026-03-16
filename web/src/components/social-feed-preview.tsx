"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import { motion } from "framer-motion";

const posts = [
  {
    user: "@mara.moves",
    title: "Completed Leg Day",
    content: "Squat 120kg x 5 | Deadlift 160kg x 3 | Total volume 9200kg",
    category: "Powerlifting",
  },
  {
    user: "@stridebykai",
    title: "Morning Tempo Session",
    content: "12.4km in 52:10 at 4:12/km. New personal pace for threshold day.",
    category: "Running",
  },
  {
    user: "@bodyweight.alex",
    title: "Muscle Up Progress",
    content: "Hit 4 strict reps + 45s handstand hold. Shoulder control finally locked in.",
    category: "Calisthenics",
  },
];

export function SocialFeedPreview() {
  return (
    <section className="mx-auto mt-20 mb-24 w-full max-w-[1600px] px-4 md:px-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl uppercase tracking-wider text-white sm:text-4xl">Social Training Feed</h2>
        <p className="max-w-md text-sm text-zinc-400 sm:text-base">Strava-style momentum with creator-grade storytelling and performance snapshots.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {posts.map((post, index) => (
          <motion.article
            key={post.user}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.08, duration: 0.55 }}
            className="glass-card"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{post.category}</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{post.title}</h3>
            <p className="mt-2 text-sm text-zinc-300">{post.user}</p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-200">{post.content}</p>

            <div className="mt-6 flex items-center gap-3 text-zinc-300">
              <button className="rounded-full border border-white/15 p-2 transition-colors hover:bg-white/10"><Heart className="h-4 w-4" /></button>
              <button className="rounded-full border border-white/15 p-2 transition-colors hover:bg-white/10"><MessageCircle className="h-4 w-4" /></button>
              <button className="rounded-full border border-white/15 p-2 transition-colors hover:bg-white/10"><Share2 className="h-4 w-4" /></button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
