"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────

type ExerciseSet = {
  reps: number;
  weight?: number;   // kg, for gym
  distance?: number; // m, for swimming
  time?: number;     // min, for running
  hr?: number;       // bpm, for running
};

type LoggedExercise = {
  name: string;
  sets: ExerciseSet[];
};

type TrainingCategory = "Gym" | "Calisthenics" | "Swimming" | "Running";

type TrainingSession = {
  id: string;
  date: string;
  category: TrainingCategory;
  exercises: LoggedExercise[];
  note: string;
  durationMin: number;
  totalVolume: number;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fitsphere_training_logs";
const POSTS_KEY = "fitsphere_posts";
const NUMBER_INPUT_CLASS =
  "bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-orange-500/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const CATEGORIES: {
  name: TrainingCategory;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    name: "Gym",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h1.5m15 0H21M3 12h1.5m15 0H21M3 18h1.5m15 0H21M6 6v12M18 6v12" />
      </svg>
    ),
  },
  {
    name: "Calisthenics",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5l3 3m0 0l3-3M6 13.5v6M21 10.5l-3 3m0 0l-3-3m3 3v6" />
      </svg>
    ),
  },
  {
    name: "Swimming",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12.75c0 .69.56 1.25 1.25 1.25H19c.69 0 1.25-.56 1.25-1.25M3.75 8.25c0-.69.56-1.25 1.25-1.25h4.5A1.25 1.25 0 0110.75 8.25v1M3.75 16.5c1.25 0 2.5-.5 3.75-.5s2.5.5 3.75.5 2.5-.5 3.75-.5 2.5.5 3.75.5" />
        <circle cx="16" cy="6" r="1.5" />
      </svg>
    ),
  },
  {
    name: "Running",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM6.75 9.75l2.25-3 3 2.25 2.25-3 4.5 3M6.75 9.75L3 18m3.75-8.25l3.75 8.25m0 0l1.5-3 3 3 1.5-3" />
      </svg>
    ),
  },
];

const EXERCISE_LIBRARY: Record<TrainingCategory, string[]> = {
  Gym: [
    "Bench Press", "Incline Bench", "Shoulder Press", "Lateral Raises",
    "Deadlift", "Squat", "Leg Press", "Leg Curl",
    "Barbell Row", "Pull-ups", "Bicep Curl", "Tricep Dips",
    "Cable Fly", "Lat Pulldown", "Romanian Deadlift",
  ],
  Calisthenics: [
    "Pull-ups", "Push-ups", "Dips", "Muscle-ups",
    "Handstand Push-ups", "L-Sit", "Front Lever", "Back Lever",
    "Pistol Squat", "Dragon Flag", "Planche", "Human Flag",
    "Ring Dips", "Tuck Planche",
  ],
  Swimming: [
    "Freestyle", "Backstroke", "Breaststroke", "Butterfly",
    "Individual Medley", "Kick Drill", "Pull Drill", "Interval Sprint",
  ],
  Running: [
    "Easy Run", "Tempo Run", "Long Run", "Interval Sprint",
    "Hill Run", "Fartlek", "Recovery Jog", "Race Pace",
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function calcTotalVolume(category: TrainingCategory, exercises: LoggedExercise[]): number {
  if (category === "Gym" || category === "Calisthenics") {
    return exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) => s + (set.reps || 0) * (set.weight || 1), 0), 0
    );
  }
  if (category === "Swimming") {
    return exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) => s + (set.distance || 0) * (set.reps || 1), 0), 0
    );
  }
  if (category === "Running") {
    return exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) => s + (set.distance || 0), 0), 0
    );
  }
  return 0;
}

function volumeLabel(category: TrainingCategory, vol: number): string {
  if (category === "Gym") return `${vol.toLocaleString()} kg`;
  if (category === "Calisthenics") return `${vol.toLocaleString()} reps`;
  if (category === "Swimming") return `${vol.toLocaleString()} m`;
  if (category === "Running") return `${vol.toFixed(1)} km`;
  return String(vol);
}

function getCategoryMeta(name: TrainingCategory) {
  return CATEGORIES.find((c) => c.name === name)!;
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + start.getDay()) / 7);
}

function isoToday(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1117] px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-orange-400 font-bold">{p.value}</p>
      ))}
    </div>
  );
}

// ── Default set factories ──────────────────────────────────────────────────────

function defaultSet(category: TrainingCategory): ExerciseSet {
  if (category === "Running") return { reps: 1, distance: 5, time: 30, hr: undefined };
  if (category === "Swimming") return { reps: 10, distance: 50 };
  return { reps: 10, weight: 0 };
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TrainingTrackerPage() {
  // ── Persisted state ──
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  // ── Log form state ──
  const [selectedCategory, setSelectedCategory] = useState<TrainingCategory | null>(null);
  const [addedExercises, setAddedExercises] = useState<LoggedExercise[]>([]);
  const [sessionDate, setSessionDate] = useState<string>(isoToday());
  const [sessionDuration, setSessionDuration] = useState<number>(60);
  const [sessionNote, setSessionNote] = useState<string>("");
  const [savedSession, setSavedSession] = useState<TrainingSession | null>(null);

  // ── UI state ──
  const [chartTab, setChartTab] = useState<"overview" | "volume" | "cardio">("overview");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState<string>("");
  const [sharedSessionId, setSharedSessionId] = useState<string | null>(null);

  // ── Load from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSessions(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Save to localStorage ──
  const persistSessions = (updated: TrainingSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // ── Derived chart data ──
  const gymSessions = useMemo(
    () => sessions.filter((s) => s.category === "Gym").slice(-8),
    [sessions]
  );
  const runningSessions = useMemo(
    () => sessions.filter((s) => s.category === "Running").slice(-8),
    [sessions]
  );

  const volumeChartData = useMemo(
    () =>
      gymSessions.map((s) => ({
        date: shortDate(s.date),
        volume: Math.round(s.totalVolume),
      })),
    [gymSessions]
  );

  const runChartData = useMemo(
    () =>
      runningSessions.map((s) => ({
        date: shortDate(s.date),
        km: parseFloat(s.totalVolume.toFixed(1)),
      })),
    [runningSessions]
  );

  // Weekly frequency for current month
  const weeklyFrequency = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    sessions.forEach((s) => {
      const d = new Date(s.date);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        const wk = getWeekNumber(d);
        map[wk] = (map[wk] || 0) + 1;
      }
    });
    return Object.entries(map).map(([wk, count]) => ({ week: `Wk ${wk}`, count }));
  }, [sessions]);

  // ── Exercise management ──
  const filteredLibrary = useMemo(() => {
    if (!selectedCategory) return [];
    const lib = EXERCISE_LIBRARY[selectedCategory];
    if (!exerciseSearch.trim()) return lib;
    return lib.filter((e) =>
      e.toLowerCase().includes(exerciseSearch.toLowerCase())
    );
  }, [selectedCategory, exerciseSearch]);

  const addExercise = (name: string) => {
    if (addedExercises.find((e) => e.name === name)) return;
    setAddedExercises((prev) => [
      ...prev,
      { name, sets: [defaultSet(selectedCategory!)] },
    ]);
  };

  const removeExercise = (name: string) => {
    setAddedExercises((prev) => prev.filter((e) => e.name !== name));
  };

  const addSet = (exIdx: number) => {
    setAddedExercises((prev) => {
      const copy = [...prev];
      copy[exIdx] = {
        ...copy[exIdx],
        sets: [...copy[exIdx].sets, defaultSet(selectedCategory!)],
      };
      return copy;
    });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setAddedExercises((prev) => {
      const copy = [...prev];
      const newSets = copy[exIdx].sets.filter((_, i) => i !== setIdx);
      if (newSets.length === 0) return copy; // keep at least one set
      copy[exIdx] = { ...copy[exIdx], sets: newSets };
      return copy;
    });
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof ExerciseSet, value: number) => {
    setAddedExercises((prev) => {
      const copy = [...prev];
      const sets = [...copy[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      copy[exIdx] = { ...copy[exIdx], sets };
      return copy;
    });
  };

  // ── Save session ──
  const handleSaveSession = () => {
    if (!selectedCategory || addedExercises.length === 0) return;

    const totalVol = calcTotalVolume(selectedCategory, addedExercises);

    const session: TrainingSession = {
      id: generateId(),
      date: sessionDate || isoToday(),
      category: selectedCategory,
      exercises: addedExercises,
      note: sessionNote.trim(),
      durationMin: sessionDuration,
      totalVolume: totalVol,
    };

    const updated = [session, ...sessions];
    persistSessions(updated);
    setSavedSession(session);
    setSharedSessionId(null);

    // Reset form
    setAddedExercises([]);
    setSessionNote("");
    setSessionDuration(60);
    setSessionDate(isoToday());
    setSelectedCategory(null);
    setExerciseSearch("");
  };

  // ── Share to feed ──
  const handleShareToFeed = (session: TrainingSession) => {
    const displayName = localStorage.getItem("fitsphere_display_name") || "Athlete";
    const profileImage = localStorage.getItem("fitsphere_profile_image") || null;
    const initials = displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const catMeta = getCategoryMeta(session.category);
    const exNames = session.exercises.map((e) => e.name).join(", ");

    const post = {
      id: generateId(),
      author: displayName,
      initials,
      profileImage,
      time: "Just now",
      type: "activity",
      title: `${session.category} Session – ${formatDate(session.date)}`,
      content: `${session.exercises.length} exercise${session.exercises.length !== 1 ? "s" : ""}: ${exNames}. Total: ${volumeLabel(session.category, session.totalVolume)} in ${session.durationMin} min.${session.note ? ` ${session.note}` : ""}`,
      tag: session.category,
      likes: 0,
      comments: 0,
      liked: false,
    };

    // Save to posts localStorage
    try {
      const postsRaw = localStorage.getItem(POSTS_KEY);
      const posts = postsRaw ? JSON.parse(postsRaw) : [];
      localStorage.setItem(POSTS_KEY, JSON.stringify([post, ...posts]));
    } catch {
      // ignore
    }

    window.dispatchEvent(new CustomEvent("fitsphere:post-shared", { detail: post }));
    setSharedSessionId(session.id);
  };

  // ── Selected session detail ──
  const detailSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  // ── Reset form when category changes ──
  const handleCategorySelect = (cat: TrainingCategory) => {
    if (selectedCategory === cat) {
      setSelectedCategory(null);
      setAddedExercises([]);
      setExerciseSearch("");
      return;
    }
    setSelectedCategory(cat);
    setAddedExercises([]);
    setExerciseSearch("");
    setSavedSession(null);
  };

  const recentSessions = sessions.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0a0c12] pb-20">
      <div className="mx-auto max-w-5xl px-4 pt-8 space-y-8">

        {/* ── Page Header ── */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Training Tracker</h1>
          <p className="mt-1 text-sm text-zinc-500">Log workouts, track progress, and share achievements.</p>
        </div>

        {/* ── Category Selector ── */}
        <section>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Select Category</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`group flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all ${
                    isActive
                      ? `${cat.bg} ${cat.border} ${cat.color}`
                      : "border-white/8 bg-[#0f1117] text-zinc-500 hover:border-white/15 hover:text-zinc-300"
                  }`}
                >
                  <div className={`transition-colors ${isActive ? cat.color : "text-zinc-600 group-hover:text-zinc-400"}`}>
                    {cat.icon}
                  </div>
                  <span className="text-sm font-bold">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Workout Logger ── */}
        {selectedCategory && (
          <section className="rounded-2xl border border-white/8 bg-[#0f1117] overflow-hidden">
            <div className="border-b border-white/8 px-5 py-4">
              <h2 className="font-bold text-white text-base">
                Log {selectedCategory} Session
              </h2>
            </div>

            <div className="p-5 space-y-6">
              {/* ── Exercise Library ── */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Exercise Library</p>
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full mb-3 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
                />
                <div className="flex flex-wrap gap-2">
                  {filteredLibrary.map((ex) => {
                    const added = addedExercises.some((e) => e.name === ex);
                    return (
                      <button
                        key={ex}
                        onClick={() => (added ? removeExercise(ex) : addExercise(ex))}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                          added
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                            : "bg-white/5 text-zinc-400 border-white/8 hover:text-zinc-200 hover:border-white/20"
                        }`}
                      >
                        {added ? "− " : "+ "}{ex}
                      </button>
                    );
                  })}
                  {filteredLibrary.length === 0 && (
                    <p className="text-xs text-zinc-600">No exercises match your search.</p>
                  )}
                </div>
              </div>

              {/* ── Exercise Log Table ── */}
              {addedExercises.length > 0 && (
                <div className="space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Logged Exercises</p>
                  {addedExercises.map((ex, exIdx) => (
                    <div key={ex.name} className="rounded-xl border border-white/8 overflow-hidden">
                      {/* Exercise header */}
                      <div className="flex items-center justify-between bg-white/3 px-4 py-3 border-b border-white/8">
                        <span className="text-sm font-bold text-white">{ex.name}</span>
                        <button
                          onClick={() => removeExercise(ex.name)}
                          className="text-zinc-600 hover:text-red-400 transition-colors text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Sets table */}
                      <div className="px-4 py-3 space-y-2">
                        {/* Column headers */}
                        <div className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1"
                          style={{
                            gridTemplateColumns:
                              selectedCategory === "Running"
                                ? "2rem 1fr 1fr 1fr 2rem"
                                : selectedCategory === "Swimming"
                                ? "2rem 1fr 1fr 2rem"
                                : "2rem 1fr 1fr 2rem",
                          }}
                        >
                          <span>#</span>
                          {selectedCategory === "Gym" || selectedCategory === "Calisthenics" ? (
                            <>
                              <span>Reps</span>
                              <span>Weight (kg)</span>
                            </>
                          ) : selectedCategory === "Swimming" ? (
                            <>
                              <span>Laps</span>
                              <span>m/lap</span>
                            </>
                          ) : (
                            <>
                              <span>Distance (km)</span>
                              <span>Time (min)</span>
                              <span>HR (bpm)</span>
                            </>
                          )}
                          <span></span>
                        </div>

                        {/* Set rows */}
                        {ex.sets.map((set, setIdx) => (
                          <div
                            key={setIdx}
                            className="grid gap-2 items-center"
                            style={{
                              gridTemplateColumns:
                                selectedCategory === "Running"
                                  ? "2rem 1fr 1fr 1fr 2rem"
                                  : "2rem 1fr 1fr 2rem",
                            }}
                          >
                            <span className="text-xs text-zinc-500 font-semibold">{setIdx + 1}</span>

                            {(selectedCategory === "Gym" || selectedCategory === "Calisthenics") && (
                              <>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={set.reps || ""}
                                  onChange={(e) => updateSet(exIdx, setIdx, "reps", parseFloat(e.target.value) || 0)}
                                  className={NUMBER_INPUT_CLASS}
                                />
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={set.weight ?? ""}
                                  onChange={(e) => updateSet(exIdx, setIdx, "weight", parseFloat(e.target.value) || 0)}
                                  className={NUMBER_INPUT_CLASS}
                                />
                              </>
                            )}

                            {selectedCategory === "Swimming" && (
                              <>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0"
                                  value={set.reps || ""}
                                  onChange={(e) => updateSet(exIdx, setIdx, "reps", parseFloat(e.target.value) || 0)}
                                  className={NUMBER_INPUT_CLASS}
                                />
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="50"
                                  value={set.distance ?? ""}
                                  onChange={(e) => updateSet(exIdx, setIdx, "distance", parseFloat(e.target.value) || 0)}
                                  className={NUMBER_INPUT_CLASS}
                                />
                              </>
                            )}

                            {selectedCategory === "Running" && (
                              <>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="5"
                                  value={set.distance ?? ""}
                                  onChange={(e) => updateSet(exIdx, setIdx, "distance", parseFloat(e.target.value) || 0)}
                                  className={NUMBER_INPUT_CLASS}
                                />
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="30"
                                  value={set.time ?? ""}
                                  onChange={(e) => updateSet(exIdx, setIdx, "time", parseFloat(e.target.value) || 0)}
                                  className={NUMBER_INPUT_CLASS}
                                />
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="—"
                                  value={set.hr ?? ""}
                                  onChange={(e) => updateSet(exIdx, setIdx, "hr", parseFloat(e.target.value) || 0)}
                                  className={`${NUMBER_INPUT_CLASS} placeholder-zinc-600`}
                                />
                              </>
                            )}

                            <button
                              onClick={() => removeSet(exIdx, setIdx)}
                              className="flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => addSet(exIdx)}
                          className="mt-1 text-xs font-semibold text-orange-400/70 hover:text-orange-400 transition-colors"
                        >
                          + Add Set
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Session Meta ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Duration (min)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="60"
                    value={sessionDuration || ""}
                    onChange={(e) => setSessionDuration(parseInt(e.target.value) || 1)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Session Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="How did it feel? Any PRs or observations..."
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  className="w-full resize-none bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
                />
              </div>

              {/* ── Save Button ── */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveSession}
                  disabled={addedExercises.length === 0}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                    addedExercises.length > 0
                      ? "bg-orange-500 text-white hover:bg-orange-400"
                      : "bg-white/8 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  Save Session
                </button>
                {addedExercises.length === 0 && (
                  <p className="text-xs text-zinc-600">Add at least one exercise to save.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Post-Save Banner ── */}
        {savedSession && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Session Saved!</p>
                <p className="text-xs text-zinc-400">
                  {savedSession.category} · {savedSession.exercises.length} exercise{savedSession.exercises.length !== 1 ? "s" : ""} · {volumeLabel(savedSession.category, savedSession.totalVolume)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sharedSessionId === savedSession.id ? (
                <span className="rounded-xl px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">
                  Shared to Feed!
                </span>
              ) : (
                <button
                  onClick={() => handleShareToFeed(savedSession)}
                  className="rounded-xl px-4 py-2 text-sm font-bold bg-orange-500 text-white hover:bg-orange-400 transition-colors"
                >
                  Share to Feed
                </button>
              )}
              <button
                onClick={() => setSavedSession(null)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </section>
        )}

        {/* ── Charts Section ── */}
        <section className="rounded-2xl border border-white/8 bg-[#0f1117] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {(["overview", "volume", "cardio"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setChartTab(tab)}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  chartTab === tab
                    ? "text-orange-400 border-b-2 border-orange-500"
                    : "text-zinc-600 hover:text-zinc-300"
                }`}
              >
                {tab === "overview" ? "Overview" : tab === "volume" ? "Volume" : "Cardio"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── Overview Tab ── */}
            {chartTab === "overview" && (
              <div className="space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Sessions", value: sessions.length },
                    { label: "Gym Sessions", value: sessions.filter((s) => s.category === "Gym").length },
                    { label: "Run Sessions", value: sessions.filter((s) => s.category === "Running").length },
                    {
                      label: "This Month",
                      value: sessions.filter((s) => {
                        const d = new Date(s.date);
                        const now = new Date();
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      }).length,
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                      <p className="text-2xl font-black text-white">{stat.value}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Weekly frequency */}
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Weekly Frequency – This Month
                  </p>
                  <div className="flex items-end gap-2 h-16">
                    {weeklyFrequency.map(({ week, count }) => {
                      const maxCount = Math.max(...weeklyFrequency.map((w) => w.count), 1);
                      const pct = count / maxCount;
                      return (
                        <div key={week} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-md bg-orange-500/70 transition-all"
                            style={{ height: `${Math.max(pct * 48, count > 0 ? 6 : 2)}px` }}
                          />
                          <span className="text-[9px] text-zinc-600 font-semibold">{week}</span>
                          <span className="text-[9px] text-zinc-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category breakdown */}
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Category Breakdown
                  </p>
                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => {
                      const count = sessions.filter((s) => s.category === cat.name).length;
                      const pct = sessions.length > 0 ? (count / sessions.length) * 100 : 0;
                      return (
                        <div key={cat.name} className="flex items-center gap-3">
                          <span className={`text-xs font-semibold w-24 shrink-0 ${cat.color}`}>{cat.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cat.bg.replace("/10", "/60")} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Volume Tab ── */}
            {chartTab === "volume" && (
              <div>
                <p className="mb-1 text-sm font-bold text-white">Gym Volume – Last 8 Sessions</p>
                <p className="mb-4 text-xs text-zinc-500">Total kg·reps lifted per session</p>
                {volumeChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-white/8 text-zinc-600 text-sm">
                    No gym sessions logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={volumeChartData} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="volume" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* ── Cardio Tab ── */}
            {chartTab === "cardio" && (
              <div>
                <p className="mb-1 text-sm font-bold text-white">Running Distance – Last 8 Sessions</p>
                <p className="mb-4 text-xs text-zinc-500">Kilometers per session</p>
                {runChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 rounded-xl border border-dashed border-white/8 text-zinc-600 text-sm">
                    No running sessions logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={runChartData} margin={{ top: 4, right: 4, bottom: 4, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="km"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#fb923c" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Recent Sessions ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Recent Sessions
            </p>
            {selectedSessionId && (
              <button
                onClick={() => setSelectedSessionId(null)}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Close Detail
              </button>
            )}
          </div>

          {recentSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/8 flex items-center justify-center py-12 text-zinc-600 text-sm">
              No sessions logged yet. Pick a category above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => {
                const cat = getCategoryMeta(session.category);
                const isExpanded = selectedSessionId === session.id;
                return (
                  <div key={session.id} className="rounded-2xl border border-white/8 bg-[#0f1117] overflow-hidden">
                    {/* Session row */}
                    <button
                      onClick={() => setSelectedSessionId(isExpanded ? null : session.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                    >
                      {/* Category icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.bg} ${cat.border} border`}>
                        <span className={cat.color}>{cat.icon}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{session.category}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${cat.bg} ${cat.color}`}>
                            {session.exercises.length} exercise{session.exercises.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {formatDate(session.date)} · {session.durationMin} min
                        </p>
                      </div>

                      {/* Volume */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-400">{volumeLabel(session.category, session.totalVolume)}</p>
                        <p className="text-[10px] text-zinc-600">total</p>
                      </div>

                      {/* Chevron */}
                      <svg
                        className={`w-4 h-4 text-zinc-600 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && detailSession && detailSession.id === session.id && (
                      <div className="border-t border-white/8 px-5 py-4 space-y-4">
                        {/* Exercises */}
                        <div className="space-y-3">
                          {detailSession.exercises.map((ex) => (
                            <div key={ex.name}>
                              <p className="text-xs font-bold text-zinc-300 mb-1.5">{ex.name}</p>
                              <div className="space-y-1">
                                {ex.sets.map((set, si) => (
                                  <div key={si} className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span className="w-6 text-zinc-600 font-semibold">#{si + 1}</span>
                                    {detailSession.category === "Gym" || detailSession.category === "Calisthenics" ? (
                                      <>
                                        <span>{set.reps} reps</span>
                                        {set.weight != null && (
                                          <span className="text-zinc-600">@ {set.weight} kg</span>
                                        )}
                                      </>
                                    ) : detailSession.category === "Swimming" ? (
                                      <>
                                        <span>{set.reps} laps</span>
                                        <span className="text-zinc-600">× {set.distance} m</span>
                                        <span className="text-orange-400">= {(set.reps || 0) * (set.distance || 0)} m</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>{set.distance} km</span>
                                        {set.time != null && <span className="text-zinc-600">in {set.time} min</span>}
                                        {set.hr != null && set.hr > 0 && (
                                          <span className="text-red-400">{set.hr} bpm</span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Note */}
                        {detailSession.note && (
                          <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Note</p>
                            <p className="text-xs text-zinc-300">{detailSession.note}</p>
                          </div>
                        )}

                        {/* Share button */}
                        <div className="flex items-center gap-2">
                          {sharedSessionId === detailSession.id ? (
                            <span className="text-xs font-semibold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded-lg px-3 py-1.5">
                              Shared to Feed!
                            </span>
                          ) : (
                            <button
                              onClick={() => handleShareToFeed(detailSession)}
                              className="rounded-lg px-3 py-1.5 text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-white transition-all"
                            >
                              Share to Feed
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
