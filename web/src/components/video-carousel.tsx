"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type Clip = {
  title: string;
  description: string;
  videoUrl: string;
};

const clips: Clip[] = [
  {
    title: "Gym Training",
    description: "Build strength and track every rep.",
    videoUrl:
      "https://player.vimeo.com/external/371433846.sd.mp4?s=236f25097d55db4f18b2f4be5f09f43871965db8&profile_id=139&oauth2_token_id=57447761",
  },
  {
    title: "Running",
    description: "Monitor distance, pace and endurance.",
    videoUrl:
      "https://player.vimeo.com/external/459389137.sd.mp4?s=8f13b42da4f0bc267f1ac05568ce4f7a8fe7f53d&profile_id=139&oauth2_token_id=57447761",
  },
  {
    title: "Calisthenics",
    description: "Master bodyweight strength.",
    videoUrl:
      "https://player.vimeo.com/external/434045526.sd.mp4?s=5f84464656f5f547f6af8c4f8d22adf095eb4e22&profile_id=139&oauth2_token_id=57447761",
  },
];

export function VideoCarousel() {
  return (
    <section id="workouts" className="relative mx-auto mt-10 w-full max-w-[1600px] px-4 md:px-10" data-reveal>
      <div className="mb-6 flex items-end justify-between gap-5">
        <h2 className="section-title text-3xl text-white sm:text-4xl">
          Training Channels
        </h2>
        <p className="max-w-md text-sm text-zinc-400 sm:text-base">
          Immersive categories with cinematic clips for gym sessions, endurance blocks, and bodyweight mastery.
        </p>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
        {clips.map((clip, index) => (
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
            viewport={{ once: true, amount: 0.35 }}
            key={clip.title}
            className="group relative h-[70vh] min-w-[85vw] snap-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 transition-all duration-500 hover:scale-[1.015] hover:brightness-110 hover:shadow-[0_28px_80px_-32px_rgba(255,77,0,0.75)] md:min-w-[42vw]"
          >
            <video
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={clip.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
            <div className="absolute bottom-0 z-10 p-6 md:p-8">
              <h3 className="font-display text-3xl uppercase text-white md:text-5xl">{clip.title}</h3>
              <p className="mt-3 max-w-sm text-sm text-zinc-300 md:text-base">{clip.description}</p>
              <Button variant="glass" size="sm" className="mt-6 tracking-[0.2em]">
                Explore {clip.title} {">"}
              </Button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
