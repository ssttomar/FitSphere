"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("fitsphere_token");
    if (!token) {
      router.replace("/auth?mode=login");
    }
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem("fitsphere_token");
    if (!token) {
      setError("Please login first");
      setLoading(false);
      router.replace("/auth?mode=login");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      heightCm: Number(formData.get("heightCm")),
      weightKg: Number(formData.get("weightKg")),
      fitnessGoal: String(formData.get("fitnessGoal")),
      experienceLevel: String(formData.get("experienceLevel")),
      preferredCategory: String(formData.get("preferredCategory")),
      trainingDaysPerWeek: Number(formData.get("trainingDaysPerWeek")),
      sessionDurationMinutes: Number(formData.get("sessionDurationMinutes")),
      notes: String(formData.get("notes") || ""),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-14">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl">
        <h1 className="font-display text-4xl uppercase text-white">Athlete Onboarding</h1>
        <p className="mt-2 text-sm text-zinc-300">Complete your profile so the AI coach can generate your weekly plan.</p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
          <input name="heightCm" type="number" step="0.1" min="100" max="260" required placeholder="Height (cm)" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none" />
          <input name="weightKg" type="number" step="0.1" min="30" max="300" required placeholder="Weight (kg)" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none" />

          <select name="fitnessGoal" required className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none">
            <option value="">Fitness Goal</option>
            <option>Fat loss</option>
            <option>Muscle gain</option>
            <option>Strength</option>
            <option>Endurance</option>
          </select>

          <select name="experienceLevel" required className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none">
            <option value="">Experience Level</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <select name="preferredCategory" required className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none">
            <option value="">Preferred Category</option>
            <option>Gym</option>
            <option>Running</option>
            <option>Calisthenics</option>
          </select>

          <input name="trainingDaysPerWeek" type="number" min="1" max="7" required placeholder="Training days per week" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none" />
          <input name="sessionDurationMinutes" type="number" min="20" max="240" required placeholder="Session duration (minutes)" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none sm:col-span-2" />

          <textarea name="notes" placeholder="Injuries, recovery notes, preferences" className="min-h-24 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none sm:col-span-2" />

          {error && <p className="text-sm text-red-300 sm:col-span-2">{error}</p>}

          <button type="submit" disabled={loading} className="rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-black disabled:opacity-50 sm:col-span-2">
            {loading ? "Saving..." : "Save and continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
