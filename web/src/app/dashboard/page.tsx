"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Profile = {
  displayName: string;
  email: string;
  fitnessGoal: string;
  preferredCategory: string;
  experienceLevel: string;
  heightCm: number;
  weightKg: number;
  trainingDaysPerWeek: number;
  weeklyWorkoutCount: number;
  weeklyRunKm: number;
  weeklyCaloriesBurned: number;
  profileImageDataUrl?: string | null;
  coverImageDataUrl?: string | null;
};

type PostMedia = {
  id: string;
  label: string;
  phase?: "before" | "after";
};

type PREntry = {
  exercise: string;
  value: string;
  unit: string;
};

type Post = {
  id: string;
  author: string;
  initials: string;
  profileImage?: string | null;
  time: string;
  type: "activity" | "blog";
  title: string;
  content: string;
  likes: number;
  comments: number;
  liked: boolean;
  tag?: string;
  badge?: string;
  media?: PostMedia[];
  route?: { distanceKm: number; elevationM: number };
  photos?: string[];
  prs?: PREntry[];
};

const PANEL_CLASS =
  "rounded-2xl border border-white/12 bg-[linear-gradient(155deg,rgba(26,26,26,0.95),rgba(15,17,24,0.94))] shadow-[0_24px_55px_-35px_rgba(255,77,0,0.5)] backdrop-blur-xl";

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: "Alex Rivera",
    initials: "AR",
    time: "2h ago",
    type: "activity",
    title: "Morning Strength Session",
    content:
      "Hit a new squat PR at 140kg for 5 reps. Tempo work and full depth felt stable after 8 weeks of progressive overload.",
    likes: 34,
    comments: 8,
    liked: false,
    tag: "Strength",
    badge: "PR",
    media: [
      { id: "m1", label: "Week 1 baseline", phase: "before" },
      { id: "m2", label: "Week 8 check-in", phase: "after" },
      { id: "m3", label: "Post-session pump" },
    ],
  },
  {
    id: "2",
    author: "Maya Chen",
    initials: "MC",
    time: "4h ago",
    type: "blog",
    title: "What I Learned From My First Marathon",
    content:
      "At km 30, pacing discipline was everything. In the final 6-week block, strength plus fueling strategy mattered more than extra mileage.",
    likes: 89,
    comments: 22,
    liked: true,
    tag: "Running",
  },
  {
    id: "3",
    author: "Priya Nair",
    initials: "PN",
    time: "6h ago",
    type: "activity",
    title: "Tempo Run - 14.2 km",
    content:
      "Built a steady threshold pace and kept cadence locked across the final 4km. The route had just enough elevation to test control.",
    likes: 56,
    comments: 14,
    liked: false,
    tag: "Run",
    route: { distanceKm: 14.2, elevationM: 124 },
  },
  {
    id: "4",
    author: "Jordan Park",
    initials: "JP",
    time: "8h ago",
    type: "activity",
    title: "Calisthenics Skill Day",
    content:
      "First clean muscle-up for 3 sets. Shoulder prep and strict pull-up volume finally converted to explosive output.",
    likes: 51,
    comments: 11,
    liked: false,
    tag: "Calisthenics",
    badge: "Milestone",
  },
  {
    id: "5",
    author: "Sam Torres",
    initials: "ST",
    time: "1d ago",
    type: "blog",
    title: "Protein Quality vs Macro Precision",
    content:
      "After two years of logging nutrition data, meal quality and sleep consistency beat perfect macro timing for body recomposition.",
    likes: 102,
    comments: 28,
    liked: false,
    tag: "Nutrition",
  },
];

const SUGGESTED = [
  {
    name: "Marcus Webb",
    initials: "MW",
    location: "London, UK",
    tag: "Powerlifter",
    prs: ["Deadlift 220kg", "Squat 200kg", "Bench 140kg"],
    recentActivity: "Deadlift PR yesterday",
  },
  {
    name: "Lily Zhang",
    initials: "LZ",
    location: "Sydney, AU",
    tag: "Marathon Runner",
    prs: ["Marathon 3h 48m", "Half 1h 44m", "10K 41:22"],
    recentActivity: "22km long run today",
  },
  {
    name: "Diego Morales",
    initials: "DM",
    location: "Madrid, ES",
    tag: "Calisthenics",
    prs: ["Muscle-Up x12", "L-Sit 45s", "Front Lever 12s"],
    recentActivity: "Skill session 2h ago",
  },
];

const TICKER_EVENTS = [
  { user: "Marcus W.", action: "PRed Deadlift 220kg" },
  { user: "Priya N.", action: "hit a 30-day streak" },
  { user: "Alex R.", action: "benched 120kg x 5 reps" },
  { user: "Jordan P.", action: "landed first clean muscle-up" },
  { user: "Lily Z.", action: "marathon in under 4h" },
  { user: "Sam T.", action: "cut 10kg in 90 days" },
];

const RADAR_DATA = [
  { subject: "Strength", value: 85, fullMark: 100 },
  { subject: "Endurance", value: 68, fullMark: 100 },
  { subject: "Mobility", value: 55, fullMark: 100 },
  { subject: "Power", value: 72, fullMark: 100 },
  { subject: "Recovery", value: 78, fullMark: 100 },
];

const RADAR_DETAILS: Record<string, { metric: string; note: string }> = {
  Strength: { metric: "Top lift: Squat 140kg", note: "Up 6% in 6 weeks" },
  Endurance: { metric: "5K pace: 4:36/km", note: "Threshold pace improving" },
  Mobility: { metric: "Hip ROM score: 72/100", note: "Ankle work still lagging" },
  Power: { metric: "Vertical jump: 49cm", note: "Explosive block active" },
  Recovery: { metric: "Sleep avg: 7h 38m", note: "HRV trend remains stable" },
};

const MACROS = [
  { label: "Protein", value: 142, goal: 200, color: "#ff4d00" },
  { label: "Carbs", value: 198, goal: 300, color: "#3b82f6" },
  { label: "Fat", value: 58, goal: 90, color: "#f59e0b" },
];

const TRAINING_LOAD = [58, 61, 66, 64, 71, 74, 73, 77, 75, 72, 76, 79, 81, 80];

function Avatar({
  initials,
  src,
  size = "md",
}: {
  initials: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sz =
    size === "sm"
      ? "h-7 w-7 text-xs"
      : size === "lg"
        ? "h-12 w-12 text-base"
        : "h-9 w-9 text-sm";
  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        className={`${sz} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sz} shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 text-white font-black flex items-center justify-center`}
    >
      {initials}
    </div>
  );
}

function PersonalBestTicker() {
  return (
    <div className={`${PANEL_CLASS} overflow-hidden py-2.5`}>
      <div className="personal-best-track flex min-w-max items-center gap-8 px-4">
        {[...TICKER_EVENTS, ...TICKER_EVENTS].map((event, idx) => (
          <div key={`${event.user}-${idx}`} className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
            <span className="text-zinc-200">
              <span className="font-semibold text-white">{event.user}</span> {event.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveTicker() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIdx((prev) => (prev + 1) % TICKER_EVENTS.length),
      3000,
    );
    return () => clearInterval(timer);
  }, []);

  const event = TICKER_EVENTS[idx];
  return (
    <div className={`${PANEL_CLASS} p-3.5`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">Live activity</p>
      <p key={event.action} className="mt-2 text-xs text-zinc-200 ticker-animate leading-relaxed">
        <span className="font-semibold text-white">{event.user}</span> just {event.action}
      </p>
    </div>
  );
}

function MediaCarousel({ media }: { media: PostMedia[] }) {
  const [index, setIndex] = useState(0);
  const hasBeforeAfter =
    media.some((item) => item.phase === "before") &&
    media.some((item) => item.phase === "after");

  const showPhase = (phase: "before" | "after") => {
    const target = media.findIndex((item) => item.phase === phase);
    if (target >= 0) setIndex(target);
  };

  const active = media[index];

  return (
    <div className="rounded-xl border border-white/10 bg-[#12151d] p-2 mt-3">
      <div className="relative overflow-hidden rounded-lg border border-white/8 bg-[radial-gradient(circle_at_20%_20%,rgba(255,77,0,0.2),rgba(18,21,30,0.9))] h-48">
        {hasBeforeAfter && (
          <div className="absolute left-2 top-2 z-10 flex items-center rounded-full border border-white/15 bg-black/35 p-1 text-[10px]">
            <button
              onClick={() => showPhase("before")}
              className={`rounded-full px-2 py-0.5 transition ${active.phase === "before" ? "bg-white text-black" : "text-zinc-200"}`}
            >
              Before
            </button>
            <button
              onClick={() => showPhase("after")}
              className={`rounded-full px-2 py-0.5 transition ${active.phase === "after" ? "bg-white text-black" : "text-zinc-200"}`}
            >
              After
            </button>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-1.5 text-xs font-semibold text-orange-200">
            {active.label}
          </div>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <button
            onClick={() => setIndex((prev) => (prev - 1 + media.length) % media.length)}
            className="rounded-full border border-white/20 bg-black/40 px-2 py-1 text-xs text-zinc-200 hover:bg-black/55"
            aria-label="Previous media"
          >
            Prev
          </button>
          <button
            onClick={() => setIndex((prev) => (prev + 1) % media.length)}
            className="rounded-full border border-white/20 bg-black/40 px-2 py-1 text-xs text-zinc-200 hover:bg-black/55"
            aria-label="Next media"
          >
            Next
          </button>
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {media.map((item, dot) => (
          <button
            key={item.id}
            onClick={() => setIndex(dot)}
            className={`h-1.5 rounded-full transition-all ${dot === index ? "w-6 bg-orange-400" : "w-2 bg-white/20"}`}
            aria-label={`Slide ${dot + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function RouteMapSnippet({ route }: { route: Post["route"] }) {
  if (!route) return null;

  return (
    <div className="mt-3 rounded-xl border border-blue-500/30 bg-[linear-gradient(160deg,rgba(15,24,35,0.94),rgba(10,14,24,0.96))] p-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-blue-300">Route snippet</span>
        <span className="text-zinc-400">
          {route.distanceKm.toFixed(1)} km | {route.elevationM}m gain
        </span>
      </div>
      <div className="h-24 rounded-lg border border-white/10 bg-[#0a111d] p-2">
        <svg viewBox="0 0 220 70" className="h-full w-full">
          <defs>
            <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path
            d="M8 45 L36 38 L58 44 L82 30 L102 32 L122 18 L145 23 L168 14 L187 19 L210 10"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="45" r="3.5" fill="#f97316" />
          <circle cx="210" cy="10" r="3.5" fill="#22d3ee" />
        </svg>
      </div>
    </div>
  );
}

function AIInsightBar({ recovery }: { recovery: number }) {
  return (
    <div className={`${PANEL_CLASS} border-orange-500/20 bg-[linear-gradient(125deg,rgba(255,77,0,0.12),rgba(15,17,24,0.92))] p-4`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">AI daily insight</p>
      <p className="mt-1 text-sm text-zinc-100 leading-relaxed">
        Hey athlete, recovery is at <span className="font-semibold text-orange-300">{recovery}%</span>. This is a strong day for a heavy lower-body session.
      </p>
    </div>
  );
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { subject: string; value: number } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  const detail = RADAR_DETAILS[point.subject];

  return (
    <div className="rounded-xl border border-white/12 bg-[#141722]/95 px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white">{point.subject}</p>
      <p className="text-[11px] text-zinc-300">Score: {point.value}/100</p>
      {detail && (
        <>
          <p className="mt-1 text-[11px] text-orange-300">{detail.metric}</p>
          <p className="text-[10px] text-zinc-400">{detail.note}</p>
        </>
      )}
    </div>
  );
}

function ConcentricMacroRings() {
  const center = 70;
  const rings = [
    { ...MACROS[0], radius: 58, width: 9 },
    { ...MACROS[1], radius: 44, width: 9 },
    { ...MACROS[2], radius: 30, width: 9 },
  ];

  return (
    <div className={`${PANEL_CLASS} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Macro rings</p>
        <span className="text-xs font-semibold text-orange-300">1840 kcal</span>
      </div>
      <div className="mx-auto w-fit">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {rings.map((ring) => {
            const pct = Math.min(100, (ring.value / ring.goal) * 100);
            const circ = 2 * Math.PI * ring.radius;
            const offset = circ * (1 - pct / 100);
            return (
              <g key={ring.label}>
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={ring.width}
                />
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={ring.width}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </g>
            );
          })}
          <text x={center} y={center - 2} textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="700">
            73%
          </text>
          <text x={center} y={center + 14} textAnchor="middle" fill="#9ca3af" fontSize="10">
            daily target
          </text>
        </svg>
      </div>
      <div className="mt-2 space-y-1">
        {MACROS.map((macro) => (
          <div key={macro.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-zinc-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: macro.color }} />
              {macro.label}
            </span>
            <span className="text-zinc-400">
              {macro.value}g / {macro.goal}g
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainingLoadCard() {
  const min = Math.min(...TRAINING_LOAD);
  const max = Math.max(...TRAINING_LOAD);
  const points = TRAINING_LOAD.map((value, idx) => {
    const x = (idx / (TRAINING_LOAD.length - 1)) * 180;
    const y = 56 - ((value - min) / (max - min || 1)) * 44;
    return `${x},${y}`;
  }).join(" ");

  const latest = TRAINING_LOAD[TRAINING_LOAD.length - 1];
  const previous = TRAINING_LOAD[TRAINING_LOAD.length - 2];
  const status = latest >= previous ? "Productive" : "Detraining";

  return (
    <div className={`${PANEL_CLASS} p-4`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Training load</p>
      <div className="mt-2 rounded-xl border border-white/10 bg-[#10141f] p-3">
        <svg viewBox="0 0 180 56" className="h-14 w-full">
          <polyline fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="1" points="0,40 180,40" />
          <polyline
            fill="none"
            stroke="#fb923c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-zinc-400">Current strain: {latest}</span>
        <span className={`font-semibold ${status === "Productive" ? "text-emerald-300" : "text-amber-300"}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function buildConsistencyHeatmap(trainingDaysPerWeek: number) {
  const base = Math.max(1, Math.min(4, Math.round((trainingDaysPerWeek / 7) * 4)));
  return Array.from({ length: 53 * 7 }, (_, idx) => {
    const seed = (idx * 37 + trainingDaysPerWeek * 13) % 100;
    if (seed < 24) return 0;
    if (seed < 52) return Math.max(1, base - 1);
    if (seed < 84) return base;
    return Math.min(4, base + 1);
  });
}

function ActivityHeatmap({ trainingDaysPerWeek }: { trainingDaysPerWeek: number }) {
  const levels = useMemo(() => buildConsistencyHeatmap(trainingDaysPerWeek), [trainingDaysPerWeek]);

  return (
    <div className={`${PANEL_CLASS} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Consistency (365d)</p>
        <span className="text-xs text-zinc-400">Streak focus</span>
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto no-scrollbar pb-1">
        {levels.map((level, idx) => (
          <span
            key={idx}
            className={`h-2.5 w-2.5 rounded-[3px] ${
              level === 0
                ? "bg-white/6"
                : level === 1
                  ? "bg-emerald-600/45"
                  : level === 2
                    ? "bg-emerald-500/60"
                    : level === 3
                      ? "bg-emerald-400/75"
                      : "bg-emerald-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestedAthlete({ athlete }: { athlete: (typeof SUGGESTED)[number] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-xl border border-white/10 bg-white/5 p-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3">
        <Avatar initials={athlete.initials} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{athlete.name}</p>
          <p className="truncate text-xs text-zinc-500">{athlete.location} | {athlete.tag}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="flex-1 rounded-lg border border-orange-500/35 bg-orange-500/10 px-2 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/25">
          Follow
        </button>
        <button className="flex-1 rounded-lg border border-blue-500/35 bg-blue-500/10 px-2 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20">
          Compare
        </button>
      </div>

      {hovered && (
        <div className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-white/12 bg-[#111521] p-3 shadow-2xl">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Top PRs</p>
          <ul className="space-y-1">
            {athlete.prs.map((pr) => (
              <li key={pr} className="text-xs text-zinc-300">
                {pr}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-zinc-400">{athlete.recentActivity}</p>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [burst, setBurst] = useState(false);

  const isLong = post.content.length > 170;
  const shown = expanded || !isLong ? post.content : `${post.content.slice(0, 170)}...`;

  const handleKudos = () => {
    onLike(post.id);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 440);
  };

  return (
    <article className={`${PANEL_CLASS} p-5 transition-transform duration-300 hover:-translate-y-0.5`}>
      <div className="mb-3 flex items-start gap-3">
        <Avatar initials={post.initials} src={post.profileImage} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-white">{post.author}</span>
            {post.badge && (
              <span className="pr-badge-shimmer rounded-full border border-orange-500/45 bg-orange-500/18 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
                {post.badge}
              </span>
            )}
            {post.tag && (
              <span className="rounded-full border border-white/12 bg-white/6 px-2 py-0.5 text-[11px] text-zinc-300">
                {post.tag}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">{post.time}</p>
        </div>
        {post.type === "blog" && (
          <span className="shrink-0 rounded-lg bg-blue-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-300">
            Blog
          </span>
        )}
      </div>

      <h3 className="mb-2 text-base font-semibold text-white">{post.title}</h3>
      <p className="text-sm leading-relaxed text-zinc-300">
        {shown}
        {isLong && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="ml-1 text-orange-300 hover:text-orange-200"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </p>

      {post.media && post.media.length > 0 && <MediaCarousel media={post.media} />}
      {post.route && <RouteMapSnippet route={post.route} />}

      {post.prs && post.prs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.prs.map((pr, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-1.5">
              <span className="text-[11px] text-amber-400">🏆</span>
              <span className="text-xs font-semibold text-amber-200">{pr.exercise}</span>
              <span className="text-xs text-amber-400">{pr.value} {pr.unit}</span>
            </div>
          ))}
        </div>
      )}

      {post.photos && post.photos.length > 0 && (
        <div className={`mt-3 ${post.photos.length > 1 ? "grid gap-1.5 grid-cols-2" : ""}`}>
          {post.photos.map((src, i) => (
            <div key={i} className={`overflow-hidden rounded-xl ${post.photos!.length > 1 && post.photos!.length % 2 === 1 && i === post.photos!.length - 1 ? "col-span-2" : ""}`}>
              <img src={src} alt="" className="w-full h-auto block" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 border-t border-white/8 pt-4">
        <button
          onClick={handleKudos}
          className={`relative flex items-center gap-2 text-sm font-medium transition-colors ${
            post.liked ? "text-orange-300" : "text-zinc-400 hover:text-orange-300"
          }`}
        >
          <span className="relative inline-flex h-5 w-5 items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={post.liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M13 2L3 14h7l-1 8 12-14h-7l1-6z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {burst &&
              Array.from({ length: 6 }).map((_, idx) => (
                <span
                  key={idx}
                  className="kudos-particle"
                  style={{ ["--kudos-angle" as string]: `${idx * 60}deg` }}
                />
              ))}
          </span>
          {post.likes}
        </button>

        <button className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {post.comments}
        </button>

        <button className="ml-auto flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Share
        </button>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"feed" | "blog">("feed");
  const [social, setSocial] = useState({ followers: 0, following: 0 });
  const [composing, setComposing] = useState(false);
  const [composeType, setComposeType] = useState<"activity" | "blog">("activity");
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done">("idle");

  const initials = useMemo(
    () =>
      (profile?.displayName || "Athlete")
        .split(" ")
        .map((chunk) => chunk[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "A",
    [profile?.displayName],
  );

  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      setProfile((prev) => prev ? {
        ...prev,
        displayName: detail.displayName || prev.displayName,
        profileImageDataUrl: detail.profileImage ?? prev.profileImageDataUrl,
        coverImageDataUrl: localStorage.getItem("fitsphere_cover_image") ?? prev.coverImageDataUrl,
      } : prev);
    };
    window.addEventListener("fitsphere:profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("fitsphere:profile-updated", handleProfileUpdated);
  }, []);

  // Load user posts from localStorage + community posts
  useEffect(() => {
    const loadPosts = () => {
      try {
        const stored: Post[] = JSON.parse(localStorage.getItem("fitsphere_posts") || "[]");
        // Mark stored posts so we can identify user's own posts
        const userPosts = stored.map((p) => ({ ...p }));
        setPosts([...userPosts, ...MOCK_POSTS]);
      } catch {
        setPosts([...MOCK_POSTS]);
      }
      try {
        const s = JSON.parse(localStorage.getItem("fitsphere_social") || "{}");
        setSocial({ followers: s.followers ?? 0, following: s.following ?? 0 });
      } catch { /* ignore */ }
    };
    loadPosts();

    const handleSharedPost = (e: Event) => {
      const post = (e as CustomEvent).detail;
      if (post) {
        setPosts((prev) => [post, ...prev]);
      }
    };
    window.addEventListener("fitsphere:post-shared", handleSharedPost);
    return () => window.removeEventListener("fitsphere:post-shared", handleSharedPost);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("fitsphere_token");
    if (!token) {
      window.location.href = "/auth?mode=login";
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const profile = data as Profile;
        if (!profile.profileImageDataUrl) {
          const stored = localStorage.getItem("fitsphere_profile_image");
          if (stored) profile.profileImageDataUrl = stored;
        }
        if (!profile.coverImageDataUrl) {
          const stored = localStorage.getItem("fitsphere_cover_image");
          if (stored) profile.coverImageDataUrl = stored;
        }
        setProfile(profile);
      })
      .catch(() => null);
  }, []);

  const handleLike = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    );
  }, []);

  const submitPost = () => {
    if (!draft.title.trim() || !draft.content.trim()) return;

    const newPost: Post = {
      id: String(Date.now()),
      author: profile?.displayName || "You",
      initials,
      profileImage: profile?.profileImageDataUrl,
      time: "Just now",
      type: composeType,
      title: draft.title.trim(),
      content: draft.content.trim(),
      likes: 0,
      comments: 0,
      liked: false,
      tag: profile?.preferredCategory,
    };

    // Persist to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("fitsphere_posts") || "[]");
      stored.unshift({ ...newPost, createdAt: Date.now() });
      localStorage.setItem("fitsphere_posts", JSON.stringify(stored.slice(0, 200)));
    } catch { /* ignore */ }

    setPosts((prev) => [newPost, ...prev]);
    setDraft({ title: "", content: "" });
    setComposing(false);
    setScanState("idle");
  };

  const bmi =
    profile?.heightCm && profile?.weightKg
      ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)
      : null;

  const recovery = Math.max(
    65,
    Math.min(94, 82 + Math.floor(((profile?.trainingDaysPerWeek ?? 4) - 4) * -1.5)),
  );

  const filteredPosts = tab === "blog" ? posts.filter((post) => post.type === "blog") : posts;

  const runAiScan = () => {
    if (scanState === "scanning") return;
    setScanState("scanning");
    window.setTimeout(() => setScanState("done"), 1400);
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6">
      <div className="space-y-4">
        <PersonalBestTicker />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          <aside className="space-y-4">
            <div className={`${PANEL_CLASS} overflow-hidden`}>
              {profile?.coverImageDataUrl ? (
                <div className="h-24 overflow-hidden">
                  <img src={profile.coverImageDataUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-24 bg-[linear-gradient(115deg,rgba(255,77,0,0.35),rgba(255,77,0,0.05))]" />
              )}
              <div className="-mt-6 px-4 pb-5">
                <Link href="/dashboard/profile" className="mb-3 block w-14">
                  {profile?.profileImageDataUrl ? (
                    <img
                      src={profile.profileImageDataUrl}
                      alt={initials}
                      className="h-14 w-14 rounded-full border-4 border-[#141720] object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full border-4 border-[#141720] bg-gradient-to-br from-orange-500 to-orange-700 text-lg font-black text-white flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </Link>
                <h2 className="text-base font-black text-white">{profile?.displayName || "Athlete"}</h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {profile?.fitnessGoal || "Build performance"} |{" "}
                  {profile?.preferredCategory || "General fitness"}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/8 pt-4 text-center">
                  {[
                    { label: "Posts", value: (() => { try { return JSON.parse(localStorage.getItem("fitsphere_posts") || "[]").length; } catch { return 0; } })() },
                    { label: "Followers", value: social.followers },
                    { label: "Following", value: social.following },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-lg font-black leading-none text-white">{stat.value}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {profile && (
              <div className={`${PANEL_CLASS} p-4 space-y-3`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  This week
                </p>
                {[
                  {
                    label: "Calories burned",
                    value: `${profile.weeklyCaloriesBurned.toLocaleString()} kcal`,
                  },
                  { label: "Distance", value: `${profile.weeklyRunKm} km` },
                  { label: "BMI", value: bmi ?? "-" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{row.label}</span>
                    <span className="font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/dashboard/profile"
              className="block rounded-xl border border-white/10 bg-white/6 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10"
            >
              View full profile
            </Link>

            <div className={`${PANEL_CLASS} p-4`}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Weekly streak
              </p>
              <div className="flex gap-1.5">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-8 flex-1 rounded-lg ${
                      idx < (profile?.trainingDaysPerWeek ?? 4)
                        ? "bg-orange-500/80"
                        : "border border-white/10 bg-white/5"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-500">{profile?.trainingDaysPerWeek ?? 0} / 7 active days</p>
            </div>

            <ActivityHeatmap trainingDaysPerWeek={profile?.trainingDaysPerWeek ?? 4} />
          </aside>

          <main className="min-w-0 space-y-4">
            <AIInsightBar recovery={recovery} />

            <div className={`${PANEL_CLASS} p-4`}>
              {!composing ? (
                <button onClick={() => setComposing(true)} className="flex w-full items-center gap-3 text-left">
                  <Avatar initials={initials} src={profile?.profileImageDataUrl} />
                  <div className="flex-1 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-zinc-500 hover:border-white/20">
                    Share your workout, progress pic, or training insight...
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(["activity", "blog"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setComposeType(type)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                          composeType === type
                            ? "bg-orange-500 text-white"
                            : "bg-white/8 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <input
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder={composeType === "blog" ? "Blog title..." : "Activity title..."}
                    className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500/40"
                  />

                  <textarea
                    value={draft.content}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, content: event.target.value }))
                    }
                    placeholder={
                      composeType === "blog"
                        ? "Share your training insight, lesson, or story..."
                        : "What did you train today?"
                    }
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500/40"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={runAiScan}
                      className="rounded-lg border border-blue-500/35 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                    >
                      {scanState === "scanning"
                        ? "Scanning..."
                        : scanState === "done"
                          ? "Scan complete"
                          : "Scan with AI"}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setComposing(false);
                          setScanState("idle");
                        }}
                        className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitPost}
                        className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-400"
                      >
                        Post
                      </button>
                    </div>
                  </div>

                  {scanState === "done" && (
                    <p className="rounded-lg border border-blue-500/25 bg-blue-500/8 px-3 py-2 text-xs text-blue-200">
                      AI preview: posture symmetry improved, estimated body-fat trend down 0.4% from last check-in.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-1 rounded-xl border border-white/8 bg-white/6 p-1">
              {(["feed", "blog"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTab(type)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-colors ${
                    tab === type ? "bg-[#121720] text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {type === "feed" ? "Activity feed" : "Blogs"}
                </button>
              ))}
            </div>

            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} />
            ))}
          </main>

          <aside className="grid grid-cols-1 gap-4 auto-rows-[minmax(120px,auto)] sm:grid-cols-2 lg:grid-cols-2">
            <div className="sm:col-span-2">
              <LiveTicker />
            </div>

            <Link
              href="/dashboard/ai-coach"
              className={`${PANEL_CLASS} sm:col-span-2 block p-4 hover:border-orange-500/40 transition-colors`}
            >
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/18 text-orange-300">
                  AI
                </div>
                <p className="text-sm font-semibold text-white">AI Coach</p>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Smart plan adjustments based on recovery, training load, and nutrition trends.
              </p>
              <p className="mt-2 text-xs font-semibold text-orange-300">Open assistant</p>
            </Link>

            <div className={`${PANEL_CLASS} sm:col-span-2 p-4`}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Athlete profile
              </p>
              <ResponsiveContainer width="100%" height={190}>
                <RadarChart outerRadius={68} data={RADAR_DATA}>
                  <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip content={<RadarTooltip />} cursor={false} />
                  <Radar
                    dataKey="value"
                    stroke="#ff4d00"
                    fill="#ff4d00"
                    fillOpacity={0.2}
                    strokeWidth={1.8}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Hover any axis for detail</span>
                <span className="font-semibold text-orange-300">71.6 avg</span>
              </div>
            </div>

            <Link href="/dashboard/goals" className={`${PANEL_CLASS} block p-4 hover:border-orange-500/30 transition-colors`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">Calories & Macros</p>
              <p className="text-xs text-zinc-400 leading-relaxed">Track your daily nutrition, set calorie goals and monitor macro targets.</p>
              <p className="mt-3 text-xs font-semibold text-orange-300">Set up goals →</p>
            </Link>

            <Link href="/dashboard/training" className={`${PANEL_CLASS} block p-4 hover:border-orange-500/30 transition-colors`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">Training Log</p>
              <p className="text-xs text-zinc-400 leading-relaxed">Log sets, reps, and weights. Track your progress over time with charts.</p>
              <p className="mt-3 text-xs font-semibold text-orange-300">Open tracker →</p>
            </Link>

            <div className={`${PANEL_CLASS} sm:col-span-2 p-4`}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Suggested athletes
              </p>
              <div className="space-y-2">
                {SUGGESTED.map((athlete) => (
                  <SuggestedAthlete key={athlete.name} athlete={athlete} />
                ))}
              </div>
              <Link href="/dashboard/search" className="mt-3 block text-center text-xs font-semibold text-orange-300 hover:text-orange-200">
                Find more athletes →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
