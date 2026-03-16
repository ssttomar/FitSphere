"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL, WeeklyPlanResponse } from "@/lib/api";

type Profile = {
  displayName: string;
  fitnessGoal: string;
  preferredCategory: string;
  weeklyWorkoutCount: number;
  weeklyRunKm: number;
  weeklyCaloriesBurned: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("fitsphere_token");
    if (!token) {
      window.location.href = "/auth?mode=login";
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    Promise.all([
      fetch(`${API_BASE_URL}/api/auth/me`, { headers }),
      fetch(`${API_BASE_URL}/api/coach/weekly-plan`, { method: "POST", headers, body: JSON.stringify({}) }),
    ])
      .then(async ([profileRes, planRes]) => {
        if (!profileRes.ok) throw new Error(await profileRes.text());
        if (!planRes.ok) throw new Error(await planRes.text());
        const profileData = (await profileRes.json()) as Profile;
        const planData = (await planRes.json()) as WeeklyPlanResponse;
        setProfile(profileData);
        setPlan(planData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-14">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-4xl uppercase text-white">Your Dashboard</h1>
          <Link href="/" className="text-sm uppercase tracking-[0.2em] text-zinc-400">Home</Link>
        </div>

        {error && <p className="rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-red-200">{error}</p>}

        {profile && (
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Athlete</p>
              <p className="mt-2 text-2xl font-semibold text-white">{profile.displayName}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Goal</p>
              <p className="mt-2 text-2xl font-semibold text-white">{profile.fitnessGoal}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Category</p>
              <p className="mt-2 text-2xl font-semibold text-white">{profile.preferredCategory}</p>
            </div>
          </section>
        )}

        {plan && (
          <section className="mt-8">
            <h2 className="font-display text-3xl uppercase text-white">AI Weekly Plan</h2>
            <p className="mt-2 text-zinc-300">{plan.rationale}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plan.week.map((dayPlan) => (
                <article key={dayPlan.day} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{dayPlan.day}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{dayPlan.focus}</h3>
                  <p className="mt-1 text-sm text-zinc-300">{dayPlan.durationMinutes} min • {dayPlan.intensity}</p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                    {dayPlan.blocks.map((block) => (
                      <li key={block} className="rounded-lg bg-black/30 px-3 py-2">{block}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
