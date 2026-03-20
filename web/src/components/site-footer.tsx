"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/logo";
import { Instagram, Twitter, Youtube, Send, CheckCircle } from "lucide-react";

const footerLinks: Record<string, string[]> = {
  Platform: ["Features", "AI Coach", "Leaderboards", "Community", "Nutrition"],
  Company: ["About", "Blog", "Careers", "Press", "Contact"],
  Support: ["Help Center", "Privacy Policy", "Terms of Service", "Cookie Policy"],
};

const socials = [
  { icon: Instagram, label: "Instagram" },
  { icon: Twitter, label: "Twitter / X" },
  { icon: Youtube, label: "YouTube" },
];

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <footer className="relative mt-32 border-t border-white/8 bg-[#050505]">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,77,0,0.07),transparent_55%)] pointer-events-none" />

      <div className="relative mx-auto max-w-[1600px] px-4 pt-20 pb-10 md:px-10">
        {/* Newsletter block */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-20 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 backdrop-blur-sm md:p-12"
        >
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-orange-400">
                Newsletter
              </span>
              <h3 className="section-title mt-2 text-3xl text-white sm:text-4xl">
                Stay in the Loop.
                <br />
                <span className="text-[#ff4d00]">Train Smarter.</span>
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                Get weekly training insights, feature updates, and community
                highlights — direct to your inbox. No spam, only gains.
              </p>
            </div>

            <div>
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-7 text-center"
                >
                  <CheckCircle className="mb-3 h-8 w-8 text-emerald-400" />
                  <p className="font-semibold text-emerald-400">
                    You&apos;re in! Welcome to FitSphere.
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Check your inbox for a welcome email.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/8 px-5 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none transition-all focus:border-orange-500/50 focus:bg-white/10"
                  />
                  <button
                    type="submit"
                    className="accent-glow flex items-center gap-2 rounded-full bg-[#ff4d00] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-400 whitespace-nowrap"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Subscribe</span>
                  </button>
                </form>
              )}

              {/* Social icons */}
              <div className="mt-5 flex items-center gap-3">
                <span className="text-xs text-zinc-500">Follow us:</span>
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      aria-label={s.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-400 transition-all hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Links grid */}
        <div className="mb-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <Logo size={36} />
            <p className="mt-3 max-w-[180px] text-sm leading-relaxed text-zinc-500">
              The ultimate social platform for athletes and creators.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-8">
          <p className="text-xs text-zinc-600">
            © 2025 FitSphere. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">
            Built for athletes. Powered by AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
