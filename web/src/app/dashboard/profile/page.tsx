"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type Profile = {
  displayName: string; email: string;
  fitnessGoal: string; preferredCategory: string; experienceLevel: string;
  heightCm: number; weightKg: number; trainingDaysPerWeek: number;
  sessionDurationMinutes: number; notes: string;
  weeklyWorkoutCount: number; weeklyRunKm: number; weeklyCaloriesBurned: number;
};

type Post = { id: string; type: "activity" | "blog"; title: string; content: string; likes: number; comments: number; time: string; tag?: string };

const MY_POSTS: Post[] = [
  { id: "1", type: "activity", title: "Morning Strength Session", content: "Squat 130kg × 5, Deadlift 150kg × 3. New weekly PR. Progressive overload is working.", likes: 18, comments: 4, time: "2h ago", tag: "Strength" },
  { id: "2", type: "blog", title: "Why I Train at 5AM Every Day", content: "It started as a challenge. 30 days of waking up before sunrise. 6 months later I can't imagine training any other way. Here's what changed in my body and mind...", likes: 42, comments: 11, time: "3d ago", tag: "Mindset" },
  { id: "3", type: "activity", title: "HIIT Cardio — 40 min", content: "620 calories burned. 4 rounds of 8 exercises. Heart rate stayed above 165 BPM for 30 minutes.", likes: 9, comments: 2, time: "5d ago", tag: "Cardio" },
];

const ACHIEVEMENTS = [
  { icon: "🏆", label: "First Workout", earned: true },
  { icon: "🔥", label: "7-Day Streak", earned: true },
  { icon: "💪", label: "100kg Bench", earned: true },
  { icon: "🏃", label: "5K Run", earned: false },
  { icon: "⚡", label: "30-Day Streak", earned: false },
  { icon: "🎯", label: "Goal Achieved", earned: false },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<"posts" | "blogs">("posts");
  const [initials, setInitials] = useState("A");

  useEffect(() => {
    const token = localStorage.getItem("fitsphere_token");
    if (!token) { window.location.href = "/auth?mode=login"; return; }
    const name = localStorage.getItem("fitsphere_display_name") || "Athlete";
    setInitials(name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2));
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    }).then((r) => r.ok ? r.json() : null).then((d) => d && setProfile(d as Profile)).catch(() => null);
  }, []);

  const bmi = profile?.heightCm && profile?.weightKg
    ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1) : null;

  const filteredPosts = tab === "blogs" ? MY_POSTS.filter((p) => p.type === "blog") : MY_POSTS;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        Back to Feed
      </Link>

      {/* Profile hero */}
      <div className="rounded-3xl border border-white/8 bg-[#0f1117] overflow-hidden mb-6">
        {/* Cover */}
        <div className="h-36 bg-gradient-to-r from-orange-600/50 via-orange-500/30 to-blue-600/20 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,100,0,0.3),transparent_60%)]" />
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-2xl font-black border-4 border-[#0f1117]">
              {initials}
            </div>
            <Link href="/dashboard/settings" className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors">
              Edit Profile
            </Link>
          </div>

          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
            {profile?.displayName || "Athlete"}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{profile?.email}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {[profile?.fitnessGoal, profile?.preferredCategory, profile?.experienceLevel].filter(Boolean).map((tag) => (
              <span key={tag} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">{tag}</span>
            ))}
          </div>

          {profile?.notes && (
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-lg">{profile.notes}</p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/8">
            {[
              { label: "Activities", value: profile?.weeklyWorkoutCount ?? 0 },
              { label: "Followers", value: "—" },
              { label: "Following", value: "—" },
              { label: "Calories", value: profile?.weeklyCaloriesBurned ? `${profile.weeklyCaloriesBurned.toLocaleString()}` : "—" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
        {/* Posts column */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-white/5 border border-white/8 p-1">
            {(["posts", "blogs"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-[#0f1117] text-white shadow" : "text-zinc-400 hover:text-white"}`}>
                {t === "posts" ? "🏋️ Activities" : "✍️ Blog Posts"}
              </button>
            ))}
          </div>

          {filteredPosts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-white/8 bg-[#0f1117] p-5">
              <div className="flex items-center gap-2 mb-3">
                {post.type === "blog" && <span className="text-xs font-semibold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">Blog</span>}
                {post.tag && <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-zinc-400">{post.tag}</span>}
                <span className="text-xs text-zinc-500 ml-auto">{post.time}</span>
              </div>
              <h3 className="font-bold text-white mb-2">{post.title}</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-5 mt-4 pt-4 border-t border-white/8">
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                  {post.likes}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                  {post.comments}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Body stats */}
          {profile && (
            <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Body Stats</p>
              <div className="space-y-2.5">
                {[
                  { label: "Height", value: `${profile.heightCm} cm` },
                  { label: "Weight", value: `${profile.weightKg} kg` },
                  { label: "BMI", value: bmi ?? "—" },
                  { label: "Training Days", value: `${profile.trainingDaysPerWeek} / week` },
                  { label: "Session Length", value: `${profile.sessionDurationMinutes} min` },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">{s.label}</span>
                    <span className="text-sm font-bold text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Achievements</p>
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS.map((a) => (
                <div key={a.label} className={`rounded-xl border p-3 text-center transition-all ${a.earned ? "border-orange-500/30 bg-orange-500/10" : "border-white/8 bg-white/3 opacity-40"}`}>
                  <span className="text-2xl">{a.icon}</span>
                  <p className="text-xs text-zinc-300 mt-1 leading-tight">{a.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly summary */}
          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Weekly Summary</p>
            {[
              { label: "Workouts", value: profile?.weeklyWorkoutCount ?? 0, max: 7, color: "bg-orange-500" },
              { label: "Run Distance", value: profile?.weeklyRunKm ?? 0, max: 50, color: "bg-blue-500" },
            ].map((s) => (
              <div key={s.label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{s.label}</span>
                  <span className="text-white font-bold">{s.value}</span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${Math.min(100, (Number(s.value) / s.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
