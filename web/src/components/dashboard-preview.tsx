"use client";

import { BarChart3, Flame, Gauge, Trophy } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const weeklyProgress = [
  { day: "Mon", load: 58, burn: 510 },
  { day: "Tue", load: 71, burn: 640 },
  { day: "Wed", load: 63, burn: 590 },
  { day: "Thu", load: 78, burn: 710 },
  { day: "Fri", load: 86, burn: 760 },
  { day: "Sat", load: 91, burn: 810 },
  { day: "Sun", load: 68, burn: 600 },
];

const records = [
  { metric: "Bench", value: 100 },
  { metric: "Squat", value: 170 },
  { metric: "Deadlift", value: 205 },
  { metric: "5K", value: 22 },
];

export function DashboardPreview() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <section className="mx-auto mt-20 w-full max-w-[1600px] px-4 md:px-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl uppercase tracking-wider text-white sm:text-4xl">Performance Dashboard</h2>
        <p className="max-w-md text-sm text-zinc-400 sm:text-base">Animated analytics for workload, weekly output, personal records, and goal velocity.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <article className="glass-card lg:col-span-2">
          <header className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Workout Progress</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Weekly Training Load</h3>
            </div>
            <BarChart3 className="h-5 w-5 text-cyan-300" />
          </header>
          <div className="h-[270px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProgress}>
                  <defs>
                    <linearGradient id="fitLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#52e5ff" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#52e5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ background: "#111318", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="load" stroke="#52e5ff" strokeWidth={2.6} fill="url(#fitLoad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />
            )}
          </div>
        </article>

        <article className="glass-card">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Goals</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Monthly Goal Progress</h3>
          <div className="mt-7 space-y-5">
            {[72, 58, 84].map((value, index) => (
              <div key={value}>
                <div className="mb-2 flex justify-between text-sm text-zinc-300">
                  <span>{["Strength", "Endurance", "Consistency"][index]}</span>
                  <span>{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-orange-400" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Calories Burned</h3>
            <Flame className="h-5 w-5 text-orange-300" />
          </div>
          <div className="h-[220px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProgress}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ background: "#111318", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12 }} />
                  <Bar dataKey="burn" fill="#ff8a3d" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />
            )}
          </div>
        </article>

        <article className="glass-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Personal Records</h3>
            <Trophy className="h-5 w-5 text-yellow-300" />
          </div>
          <ul className="space-y-3 text-zinc-200">
            {records.map((record) => (
              <li key={record.metric} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span>{record.metric}</span>
                <strong>{record.value}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">AI Coach Pulse</h3>
            <Gauge className="h-5 w-5 text-emerald-300" />
          </div>
          <p className="text-sm text-zinc-300">You increased bench press by 10kg in 4 weeks. Suggested recovery window: 36h before your next heavy push session.</p>
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Readiness score: 8.6/10
          </div>
        </article>
      </div>
    </section>
  );
}
