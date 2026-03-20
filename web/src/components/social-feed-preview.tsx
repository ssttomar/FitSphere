"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Trophy, UserPlus, TrendingUp } from "lucide-react";

const FRIEND_AVATARS = [
  "/images/download (5).jpg",
  "/images/download (6).jpg",
  "/images/hero-fallback-4.jpg",
];

const prPosts = [
  {
    id: 1,
    user: "Sumit Singh",
    handle: "@sumit.lifts",
    image: "/images/hero-fallback-1.jpg",
    badge: "New PR",
    badgeColor: "bg-orange-500",
    achievement: "225 kg Deadlift",
    desc: "8 months of grinding. Finally hit the 5-plate pull. Every early morning paid off.",
    likes: 847,
    comments: 64,
    category: "Powerlifting",
  },
  {
    id: 2,
    user: "Mara Volkov",
    handle: "@mara.moves",
    image: "/images/hero-fallback-2.jpg",
    badge: "PR Broken",
    badgeColor: "bg-emerald-500",
    achievement: "5K — 19:42",
    desc: "Sub-20 was the dream. Heart rate hit 196 on the last km. Worth every second.",
    likes: 512,
    comments: 38,
    category: "Running",
  },
  {
    id: 3,
    user: "Kai Tanaka",
    handle: "@stridebykai",
    image: "/images/hero-fallback-3.jpg",
    badge: "Milestone",
    badgeColor: "bg-yellow-500",
    achievement: "100 kg Bench",
    desc: "3-plate bench at 75 kg bodyweight. Dedicated this one to the grind.",
    likes: 1024,
    comments: 91,
    category: "Strength",
  },
];

export function SocialFeedPreview() {
  return (
    <section className="mx-auto mt-32 w-full max-w-[1600px] px-4 md:px-10" data-reveal>
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-orange-400">
          <TrendingUp className="h-3 w-3" /> Progress Feed
        </span>
        <h2
          className="section-title mt-4 text-4xl text-white sm:text-5xl lg:text-6xl"
        >
          Share Your PRs.
          <br />
          <span className="text-[#ff4d00]">Celebrate Every Rep.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
          Post your milestones, cheer on your training partners, and build a
          feed that actually motivates you.
        </p>
      </div>

      {/* PR Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {prPosts.map((post, i) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0c]"
          >
            {/* Image */}
            <div className="relative h-56 w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.achievement}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/30 to-transparent" />
              <span
                className={`absolute left-4 top-4 ${post.badgeColor} rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white`}
              >
                {post.badge}
              </span>
              <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-widest text-white/70 backdrop-blur-md">
                {post.category}
              </span>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/20">
                  <span className="text-xs font-bold text-orange-400">
                    {post.user[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{post.user}</p>
                  <p className="text-xs text-zinc-500">{post.handle}</p>
                </div>
                <button className="ml-auto flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10">
                  <UserPlus className="h-3 w-3" /> Follow
                </button>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <h3 className="text-xl font-black text-white">
                  {post.achievement}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">{post.desc}</p>

              <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4">
                <button className="flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-xs text-zinc-300 transition-all hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-400">
                  <Heart className="h-3.5 w-3.5" /> {post.likes}
                </button>
                <button className="flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10">
                  <MessageCircle className="h-3.5 w-3.5" /> {post.comments}
                </button>
                <button className="ml-auto flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10">
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Friend activity strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {FRIEND_AVATARS.map((src) => (
              <div
                key={src}
                className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-black"
              >
                <Image
                  src={src}
                  alt="friend"
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-white">12 friends</span> logged
            workouts today
          </p>
        </div>
        <button className="rounded-full bg-[#ff4d00] px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-orange-400">
          View Feed
        </button>
      </motion.div>
    </section>
  );
}
