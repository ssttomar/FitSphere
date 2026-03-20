"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type Profile = {
  displayName: string; email: string;
  fitnessGoal: string; preferredCategory: string; experienceLevel: string;
  heightCm: number; weightKg: number; trainingDaysPerWeek: number;
  weeklyWorkoutCount: number; weeklyRunKm: number; weeklyCaloriesBurned: number;
};

type Post = {
  id: string; author: string; initials: string; time: string;
  type: "activity" | "blog"; title: string; content: string;
  likes: number; comments: number; liked: boolean;
  tag?: string; badge?: string;
};

const MOCK_POSTS: Post[] = [
  { id: "1", author: "Alex Rivera", initials: "AR", time: "2h ago", type: "activity", title: "Morning Strength Session", content: "Hit a new PR today — Squat 140kg × 5 reps. Focused on depth and tempo. The progressive overload program is really paying off after 8 weeks of consistent training.", likes: 34, comments: 8, liked: false, tag: "Strength", badge: "PR" },
  { id: "2", author: "Maya Chen", initials: "MC", time: "4h ago", type: "blog", title: "5 Things I Learned From Running My First Marathon", content: "After months of training, race day finally came. Here's what no one tells you about running 42km: your mental game matters more than your legs. I broke down at km 30, rebuilt at km 35, and crossed the finish line in tears. Here's exactly what I changed in my final 6-week block to make it happen.", likes: 89, comments: 22, liked: true, tag: "Running" },
  { id: "3", author: "Jordan Park", initials: "JP", time: "6h ago", type: "activity", title: "Calisthenics — Skill Day", content: "Nailed my first clean muscle-up. 3 sets. Still can't believe it. Next goal: handstand push-up. Months of shoulder prep finally paid off.", likes: 55, comments: 14, liked: false, tag: "Calisthenics", badge: "Milestone" },
  { id: "4", author: "Sam Torres", initials: "ST", time: "8h ago", type: "blog", title: "The Truth About Protein: What Actually Matters", content: "Everyone obsesses over hitting 2g/kg bodyweight. After tracking nutrition for 2 years here's my honest take — meal timing, food quality, and sleep matter far more than hitting an exact macro number. Let me show you my actual data from the past year.", likes: 113, comments: 31, liked: false, tag: "Nutrition" },
  { id: "5", author: "Priya Nair", initials: "PN", time: "1d ago", type: "activity", title: "HIIT Cardio — 45 min", content: "700 calories burned. Heart rate peaked at 187 BPM. Used the FitSphere AI plan and it was brutal but perfect.", likes: 27, comments: 5, liked: true, tag: "Cardio" },
];

const SUGGESTED = [
  { name: "Marcus Webb", initials: "MW", location: "London, UK", tag: "Powerlifter" },
  { name: "Lily Zhang", initials: "LZ", location: "Sydney, AU", tag: "Marathon Runner" },
  { name: "Diego Morales", initials: "DM", location: "Madrid, ES", tag: "Calisthenics" },
];

const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Train insane or remain the same.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
];

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-black shrink-0`}>
      {initials}
    </div>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 180;
  const shown = expanded || !isLong ? post.content : post.content.slice(0, 180) + "...";
  return (
    <article className="rounded-2xl border border-white/8 bg-[#0f1117] p-5 hover:border-white/15 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <Avatar initials={post.initials} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white">{post.author}</span>
            {post.badge && <span className="rounded-full bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-xs text-orange-400 font-semibold">{post.badge}</span>}
            {post.tag && <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-zinc-400">{post.tag}</span>}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{post.time}</p>
        </div>
        {post.type === "blog" && <span className="text-xs font-semibold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg shrink-0">Blog</span>}
      </div>
      <h3 className="font-bold text-white mb-2">{post.title}</h3>
      <p className="text-sm text-zinc-300 leading-relaxed">
        {shown}
        {isLong && <button onClick={() => setExpanded(!expanded)} className="ml-1 text-orange-400 hover:text-orange-300 font-medium">{expanded ? " Show less" : " Read more"}</button>}
      </p>
      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/8">
        <button onClick={() => onLike(post.id)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.liked ? "text-orange-400" : "text-zinc-400 hover:text-orange-400"}`}>
          <svg className="w-4 h-4" fill={post.liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {post.likes}
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {post.comments}
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors ml-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Share
        </button>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [tab, setTab] = useState<"feed" | "blog">("feed");
  const [composing, setComposing] = useState(false);
  const [composeType, setComposeType] = useState<"activity" | "blog">("activity");
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [initials, setInitials] = useState("A");
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  useEffect(() => {
    const token = localStorage.getItem("fitsphere_token");
    if (!token) { window.location.href = "/auth?mode=login"; return; }
    const name = localStorage.getItem("fitsphere_display_name") || "Athlete";
    setInitials(name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2));
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    }).then((r) => r.ok ? r.json() : null).then((d) => d && setProfile(d as Profile)).catch(() => null);
  }, []);

  const handleLike = (id: string) =>
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));

  const submitPost = () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    setPosts((prev) => [{
      id: String(Date.now()), author: profile?.displayName || "You", initials,
      time: "Just now", type: composeType, title: draft.title, content: draft.content,
      likes: 0, comments: 0, liked: false, tag: profile?.preferredCategory,
    }, ...prev]);
    setDraft({ title: "", content: "" });
    setComposing(false);
  };

  const bmi = profile?.heightCm && profile?.weightKg
    ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-6">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-[#0f1117] overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-orange-600/40 via-orange-500/20 to-transparent" />
            <div className="px-4 pb-5 -mt-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-lg font-black border-4 border-[#0f1117] mb-3">
                {initials}
              </div>
              <h2 className="font-black text-white">{profile?.displayName || "Athlete"}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{profile?.fitnessGoal} · {profile?.preferredCategory}</p>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-white/8 pt-4">
                {[{ label: "Workouts", value: profile?.weeklyWorkoutCount ?? 0 }, { label: "Followers", value: "—" }, { label: "Following", value: "—" }].map((s) => (
                  <div key={s.label}>
                    <p className="text-white font-black text-lg leading-none">{s.value}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {profile && (
            <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">This Week</p>
              {[
                { label: "Calories Burned", value: `${profile.weeklyCaloriesBurned.toLocaleString()} kcal`, icon: "🔥" },
                { label: "Distance", value: `${profile.weeklyRunKm} km`, icon: "🏃" },
                { label: "BMI", value: bmi ?? "—", icon: "📊" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{s.icon} {s.label}</span>
                  <span className="text-sm font-bold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          <Link href="/dashboard/profile" className="block w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 py-2.5 text-center text-sm font-semibold text-white transition-colors">
            View Full Profile →
          </Link>

          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Weekly Streak</p>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`flex-1 h-8 rounded-lg ${i < (profile?.trainingDaysPerWeek ?? 4) ? "bg-orange-500" : "bg-white/5 border border-white/8"}`} />
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">{profile?.trainingDaysPerWeek ?? 0} / 7 days active</p>
          </div>
        </aside>

        {/* ── CENTER FEED ── */}
        <main className="space-y-4 min-w-0">
          {/* Compose box */}
          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            {!composing ? (
              <button onClick={() => setComposing(true)} className="w-full flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-sm font-black shrink-0">{initials}</div>
                <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-500 hover:border-white/20 transition-colors">
                  Share your workout or fitness insights...
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["activity", "blog"] as const).map((t) => (
                    <button key={t} onClick={() => setComposeType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${composeType === t ? "bg-orange-500 text-white" : "bg-white/5 text-zinc-400 hover:text-white"}`}>
                      {t === "activity" ? "🏋️ Activity" : "✍️ Blog Post"}
                    </button>
                  ))}
                </div>
                <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder={composeType === "blog" ? "Blog title..." : "Activity name..."}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition" />
                <textarea value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                  placeholder={composeType === "blog" ? "Share your fitness insights, tips, or story..." : "What did you train today?"}
                  rows={4} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition resize-none" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setComposing(false)} className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={submitPost} className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-sm font-bold text-white transition-colors">Post</button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-white/5 border border-white/8 p-1">
            {(["feed", "blog"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-[#0f1117] text-white shadow" : "text-zinc-400 hover:text-white"}`}>
                {t === "feed" ? "🏠 Activity Feed" : "✍️ Blogs"}
              </button>
            ))}
          </div>

          {(tab === "blog" ? posts.filter((p) => p.type === "blog") : posts).map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="space-y-4">
          {/* AI Coach */}
          <Link href="/dashboard/ai-coach" className="block rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-orange-600/5 p-4 hover:border-orange-500/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="font-bold text-white text-sm">AI Fitness Coach</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">Ask about nutrition, training plans, or upload a meal photo for instant calorie analysis.</p>
            <p className="text-xs text-orange-400 font-semibold mt-2 group-hover:text-orange-300">Start chatting →</p>
          </Link>

          {/* Community */}
          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Community</p>
            <div className="space-y-2 mb-4">
              {[
                { label: "Create Group", sub: "Start a training community", icon: "➕", color: "orange" },
                { label: "Browse Groups", sub: "Join 240+ active clubs", icon: "👥", color: "blue" },
              ].map((c) => (
                <button key={c.label} className="w-full flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 hover:bg-white/8 px-3 py-2.5 text-left transition-colors">
                  <span className="text-lg">{c.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.label}</p>
                    <p className="text-xs text-zinc-500">{c.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Active Challenges</p>
            {[
              { label: "30-Day Streak", sub: "847 athletes joining", col: "from-orange-500/15" },
              { label: "10K Club Run", sub: "Join 1.2k runners", col: "from-blue-500/15" },
            ].map((c) => (
              <div key={c.label} className={`rounded-xl bg-gradient-to-r ${c.col} to-transparent border border-white/8 px-3 py-2.5 mb-2`}>
                <p className="text-sm font-semibold text-white">{c.label}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-zinc-400">{c.sub}</p>
                  <button className="text-xs text-orange-400 font-bold hover:text-orange-300">Join</button>
                </div>
              </div>
            ))}
          </div>

          {/* Suggested */}
          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Suggested Athletes</p>
            <div className="space-y-3">
              {SUGGESTED.map((f) => (
                <div key={f.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-white text-xs font-black shrink-0">{f.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{f.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{f.location} · {f.tag}</p>
                  </div>
                  <button className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white transition-colors shrink-0">Follow</button>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/5 to-transparent p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Daily Motivation</p>
            <p className="text-sm text-white font-medium leading-relaxed italic">"{quote.text}"</p>
            <p className="text-xs text-zinc-500 mt-2">— {quote.author}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
