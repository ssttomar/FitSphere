"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/api";

function seededRand(seed: number) {
  const x = Math.sin(seed + 42) * 10000;
  return x - Math.floor(x);
}

function WorkoutHeatmap() {
  const WEEKS = 26;
  const intensityColors = [
    "bg-white/5 border border-white/6",
    "bg-orange-900/35",
    "bg-orange-600/50",
    "bg-orange-500/75",
    "bg-orange-400",
  ];

  const data = useMemo(
    () =>
      Array.from({ length: WEEKS }, (_, w) =>
        Array.from({ length: 7 }, (_, d) => {
          if (w < 3) return 0;
          const r = seededRand(w * 7 + d);
          if (r < 0.32) return 0;
          if (r < 0.56) return 1;
          if (r < 0.76) return 2;
          if (r < 0.9) return 3;
          return 4;
        }),
      ),
    [],
  );

  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Workout consistency</p>
      <div className="mb-1 flex pl-0">
        {months.map((month) => (
          <div key={month} className="text-[9px] font-medium text-zinc-600" style={{ flex: 1, minWidth: 0 }}>
            {month}
          </div>
        ))}
      </div>
      <div className="no-scrollbar flex gap-[3px] overflow-x-auto">
        {data.map((week, wi) => (
          <div key={wi} className="flex shrink-0 flex-col gap-[3px]">
            {week.map((level, di) => (
              <div
                key={di}
                title={level > 0 ? `Intensity ${level}` : "Rest day"}
                className={`h-[10px] w-[10px] cursor-pointer rounded-[2px] transition-opacity hover:opacity-80 ${intensityColors[level]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-zinc-600">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`h-[10px] w-[10px] rounded-[2px] ${intensityColors[level]}`} />
        ))}
        <span className="text-[10px] text-zinc-600">More</span>
      </div>
    </div>
  );
}

function MacroRingSmall({
  label,
  value,
  pct,
  color,
  size = 60,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  size?: number;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const cx = size / 2;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
        <text x={cx} y={cx + 3.5} textAnchor="middle" fill="white" fontSize="9" fontWeight="800">
          {value}
        </text>
      </svg>
      <span className="text-[9px] font-medium text-zinc-500">{label}</span>
    </div>
  );
}

type Profile = {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  fitnessGoal: string;
  preferredCategory: string;
  experienceLevel: string;
  heightCm: number;
  weightKg: number;
  age?: number;
  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;
  notes: string;
  profileImageDataUrl?: string | null;
  coverImageDataUrl?: string | null;
  weeklyWorkoutCount: number;
  weeklyRunKm: number;
  weeklyCaloriesBurned: number;
  followerCount: number;
  followingCount: number;
};

type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  profileImageDataUrl: string;
  experienceLevel: string;
  preferredCategory: string;
};

type EditProfileForm = {
  displayName: string;
  heightCm: string;
  weightKg: string;
  fitnessGoals: string[];
  preferredCategories: string[];
  experienceLevel: string;
  trainingDaysPerWeek: string;
  sessionDurationMinutes: string;
  notes: string;
  profileImageDataUrl: string;
  coverImageDataUrl: string;
};

type Post = {
  id: string;
  type: "activity" | "blog";
  title: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  tag?: string;
};

const MY_POSTS: Post[] = [
  {
    id: "1",
    type: "activity",
    title: "Morning Strength Session",
    content: "Squat 130kg x 5, deadlift 150kg x 3. New weekly PR. Progressive overload is working.",
    likes: 18,
    comments: 4,
    time: "2h ago",
    tag: "Strength",
  },
  {
    id: "2",
    type: "blog",
    title: "Why I Train at 5AM Every Day",
    content: "It started as a challenge. 30 days of waking up before sunrise turned into a routine.",
    likes: 42,
    comments: 11,
    time: "3d ago",
    tag: "Mindset",
  },
  {
    id: "3",
    type: "activity",
    title: "HIIT Cardio - 40 min",
    content: "620 calories burned. Heart rate stayed above 165 BPM for 30 minutes.",
    likes: 9,
    comments: 2,
    time: "5d ago",
    tag: "Cardio",
  },
];

const ACHIEVEMENTS = [
  { icon: "T", label: "First Workout", earned: true },
  { icon: "F", label: "7-Day Streak", earned: true },
  { icon: "B", label: "100kg Bench", earned: true },
  { icon: "R", label: "5K Run", earned: false },
  { icon: "S", label: "30-Day Streak", earned: false },
  { icon: "G", label: "Goal Achieved", earned: false },
];

const FITNESS_GOALS = ["Fat loss", "Muscle gain", "Strength", "Endurance", "Flexibility", "General fitness"];
const CATEGORIES = ["Gym", "Running", "Calisthenics", "Cycling", "Swimming", "Sports"];
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"];

function parseCsv(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toEditForm(profile: Profile): EditProfileForm {
  return {
    displayName: profile.displayName || "",
    heightCm: String(profile.heightCm || ""),
    weightKg: String(profile.weightKg || ""),
    fitnessGoals: parseCsv(profile.fitnessGoal),
    preferredCategories: parseCsv(profile.preferredCategory),
    experienceLevel: profile.experienceLevel || "",
    trainingDaysPerWeek: String(profile.trainingDaysPerWeek || ""),
    sessionDurationMinutes: String(profile.sessionDurationMinutes || ""),
    notes: profile.notes || "",
    profileImageDataUrl: profile.profileImageDataUrl || "",
    coverImageDataUrl: profile.coverImageDataUrl || "",
  };
}

function emptyEditForm(displayName: string): EditProfileForm {
  return {
    displayName,
    heightCm: "",
    weightKg: "",
    fitnessGoals: [],
    preferredCategories: [],
    experienceLevel: "",
    trainingDaysPerWeek: "",
    sessionDurationMinutes: "",
    notes: "",
    profileImageDataUrl: "",
    coverImageDataUrl: "",
  };
}

type StoredPost = Post & { createdAt?: number; photos?: string[]; prs?: { exercise: string; value: string; unit: string }[] };

function loadStoredPosts(): StoredPost[] {
  try {
    return JSON.parse(localStorage.getItem("fitsphere_posts") || "[]");
  } catch { return []; }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<"posts" | "blogs">("posts");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditProfileForm | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [fallbackName, setFallbackName] = useState("Athlete");
  const [fallbackUsername, setFallbackUsername] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<StoredPost[]>([]);
  const [followListOpen, setFollowListOpen] = useState<"followers" | "following" | null>(null);
  const [followList, setFollowList] = useState<UserSummary[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  useEffect(() => {
    // Load posts from localStorage
    setMyPosts(loadStoredPosts());
    // Keep in sync when new post is shared
    const handlePost = () => setMyPosts(loadStoredPosts());
    window.addEventListener("fitsphere:post-shared", handlePost);
    return () => window.removeEventListener("fitsphere:post-shared", handlePost);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("fitsphere_token");
    if (!token) {
      window.location.href = "/auth?mode=login";
      return;
    }

    const storedName = localStorage.getItem("fitsphere_display_name") || "Athlete";
    const storedUsername = localStorage.getItem("fitsphere_username") || "";
    window.setTimeout(() => setFallbackName(storedName), 0);
    window.setTimeout(() => setFallbackUsername(storedUsername), 0);

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Profile load failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        const loaded = data as Profile;
        const cachedUsername = localStorage.getItem("fitsphere_username") || "";
        if (!loaded.username && cachedUsername) {
          loaded.username = cachedUsername;
        }
        // Merge images from localStorage if the DB record has none (e.g. after a logout cleared them)
        if (!loaded.profileImageDataUrl) {
          const cached = localStorage.getItem("fitsphere_profile_image");
          if (cached) loaded.profileImageDataUrl = cached;
        }
        if (!loaded.coverImageDataUrl) {
          const cached = localStorage.getItem("fitsphere_cover_image");
          if (cached) loaded.coverImageDataUrl = cached;
        }
        setProfile(loaded);
        if (loaded.username) {
          localStorage.setItem("fitsphere_username", loaded.username);
          setFallbackUsername(loaded.username);
        }
        if (loaded.profileImageDataUrl) localStorage.setItem("fitsphere_profile_image", loaded.profileImageDataUrl);
        if (loaded.coverImageDataUrl) localStorage.setItem("fitsphere_cover_image", loaded.coverImageDataUrl);
        localStorage.setItem(
          "fitsphere_profile_data",
          JSON.stringify({
            heightCm: loaded.heightCm,
            weightKg: loaded.weightKg,
            age: loaded.age,
          }),
        );
        setLoadError(null);
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Could not load profile."));
  }, []);

  const initials = useMemo(
    () =>
      (profile?.displayName || fallbackName)
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "A",
    [fallbackName, profile?.displayName],
  );

  const bmi =
    profile?.heightCm && profile?.weightKg
      ? (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1)
      : null;

  const filteredPosts = tab === "blogs"
    ? myPosts.filter((p) => p.type === "blog")
    : myPosts.filter((p) => p.type === "activity");

  const openEditor = () => {
    if (profile) {
      setForm(toEditForm(profile));
    } else {
      const base = emptyEditForm(fallbackName);
      base.profileImageDataUrl = localStorage.getItem("fitsphere_profile_image") || "";
      base.coverImageDataUrl = localStorage.getItem("fitsphere_cover_image") || "";
      setForm(base);
    }
    setSaveError(null);
    setEditing(true);
  };

  const openFollowList = (type: "followers" | "following") => {
    if (!profile?.userId) return;
    setFollowListOpen(type);
    setFollowListLoading(true);
    const token = localStorage.getItem("fitsphere_token");
    fetch(`${API_BASE_URL}/api/users/${profile.userId}/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setFollowList(data); setFollowListLoading(false); })
      .catch(() => { setFollowList([]); setFollowListLoading(false); });
  };

  const toggleArrayValue = (field: "fitnessGoals" | "preferredCategories", value: string) => {
    if (!form) return;
    const current = form[field];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    setForm({ ...form, [field]: next });
  };

  const onAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !form) return;
    if (file.size > 2_500_000) {
      setSaveError("Image must be smaller than 2.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSaveError(null);
      setForm((prev) => (prev ? { ...prev, profileImageDataUrl: String(reader.result || "") } : prev));
    };
    reader.readAsDataURL(file);
  };

  const onCoverFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !form) return;
    if (file.size > 4_000_000) {
      setSaveError("Cover image must be smaller than 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSaveError(null);
      setForm((prev) => (prev ? { ...prev, coverImageDataUrl: String(reader.result || "") } : prev));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (state: EditProfileForm) => {
    if (!state.displayName.trim()) return "Display name is required.";
    const height = Number(state.heightCm);
    if (!Number.isFinite(height) || height < 100 || height > 260) return "Height must be between 100 and 260 cm.";
    const weight = Number(state.weightKg);
    if (!Number.isFinite(weight) || weight < 30 || weight > 300) return "Weight must be between 30 and 300 kg.";
    if (state.fitnessGoals.length === 0) return "Select at least one fitness goal.";
    if (!state.experienceLevel) return "Select your experience level.";
    if (state.preferredCategories.length === 0) return "Select at least one preferred category.";
    const days = Number(state.trainingDaysPerWeek);
    if (!Number.isInteger(days) || days < 1 || days > 7) return "Training days must be between 1 and 7.";
    const duration = Number(state.sessionDurationMinutes);
    if (!Number.isFinite(duration) || duration < 20 || duration > 240) return "Session duration must be between 20 and 240 minutes.";
    return null;
  };

  const saveProfile = async () => {
    if (!form) return;
    const validation = validateForm(form);
    if (validation) {
      setSaveError(validation);
      return;
    }

    const token = localStorage.getItem("fitsphere_token");
    if (!token) {
      window.location.href = "/auth?mode=login";
      return;
    }

    setSaveLoading(true);
    setSaveError(null);
    try {
      const payload = {
        displayName: form.displayName.trim(),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        fitnessGoal: form.fitnessGoals.join(", "),
        experienceLevel: form.experienceLevel,
        preferredCategory: form.preferredCategories.join(", "),
        trainingDaysPerWeek: Number(form.trainingDaysPerWeek),
        sessionDurationMinutes: Number(form.sessionDurationMinutes),
        notes: form.notes.trim(),
        profileImageDataUrl: form.profileImageDataUrl,   // "" = clear, data URL = update, null never sent
        coverImageDataUrl: form.coverImageDataUrl,
      };

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      let updated: Profile;
      if (response.ok) {
        updated = (await response.json()) as Profile;
      } else if (response.status === 403 || response.status === 404 || response.status === 405) {
        // Compatibility fallback for older backend that only supports onboarding update.
        const fallbackResponse = await fetch(`${API_BASE_URL}/api/auth/onboarding`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            heightCm: payload.heightCm,
            weightKg: payload.weightKg,
            fitnessGoal: payload.fitnessGoal,
            experienceLevel: payload.experienceLevel,
            preferredCategory: payload.preferredCategory,
            trainingDaysPerWeek: payload.trainingDaysPerWeek,
            sessionDurationMinutes: payload.sessionDurationMinutes,
            notes: payload.notes,
          }),
        });
        if (!fallbackResponse.ok) {
          if (fallbackResponse.status === 401 || fallbackResponse.status === 403) {
            throw new Error("Unauthorized (403). Please log out and log in again.");
          }
          throw new Error(await fallbackResponse.text());
        }
        const fallbackData = (await fallbackResponse.json()) as Profile;
          updated = {
            ...fallbackData,
            displayName: payload.displayName,
            profileImageDataUrl: payload.profileImageDataUrl,
            coverImageDataUrl: payload.coverImageDataUrl,
          };
      } else {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized (403). Please log out and log in again.");
        }
        const text = await response.text();
        throw new Error(text || `Save failed (${response.status}).`);
      }

      setProfile(updated);
      localStorage.setItem("fitsphere_display_name", updated.displayName || "Athlete");
      if (updated.username) {
        localStorage.setItem("fitsphere_username", updated.username);
        setFallbackUsername(updated.username);
      }
      if (updated.profileImageDataUrl) {
        localStorage.setItem("fitsphere_profile_image", updated.profileImageDataUrl);
      } else {
        localStorage.removeItem("fitsphere_profile_image");
      }
      if (updated.coverImageDataUrl) {
        localStorage.setItem("fitsphere_cover_image", updated.coverImageDataUrl);
      } else {
        localStorage.removeItem("fitsphere_cover_image");
      }
      localStorage.setItem(
        "fitsphere_profile_data",
        JSON.stringify({
          heightCm: updated.heightCm,
          weightKg: updated.weightKg,
          age: updated.age,
        }),
      );
      // Notify layout in the same tab (storage events don't fire for same-tab writes)
      window.dispatchEvent(new CustomEvent("fitsphere:profile-updated", {
        detail: {
          displayName: updated.displayName,
          profileImage: updated.profileImageDataUrl || null,
          heightCm: updated.heightCm,
          weightKg: updated.weightKg,
          age: updated.age,
        },
      }));
      setFallbackName(updated.displayName || "Athlete");
      setEditing(false);
      setForm(null);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setSaveError("Request timed out. Check backend and try again.");
        return;
      }
      setSaveError(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="relative isolate mx-auto max-w-4xl overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-32 -top-24 -z-10 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 -z-10 h-80 w-80 rounded-full bg-blue-500/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(255,120,0,0.07),transparent_35%),radial-gradient(circle_at_88%_30%,rgba(59,130,246,0.06),transparent_36%)]" />
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Feed
      </Link>

      <div className="mb-6 overflow-hidden rounded-3xl border border-white/8 bg-[#0f1117]">
        <div className="relative h-40 overflow-hidden">
          {profile?.coverImageDataUrl ? (
            <Image
              src={profile.coverImageDataUrl}
              alt="Profile cover"
              fill
              unoptimized
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/55 via-orange-500/35 to-blue-600/30" />
          )}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,100,0,0.22),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117]/55 via-transparent to-transparent" />
        </div>

        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="relative z-10 h-20 w-20 overflow-hidden rounded-full border-4 border-[#0f1117] bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.9)]">
              {profile?.profileImageDataUrl ? (
                <Image
                  src={profile.profileImageDataUrl}
                  alt="Profile"
                  width={80}
                  height={80}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white">{initials}</div>
              )}
            </div>
            <button
              type="button"
              onClick={openEditor}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Edit Profile
            </button>
          </div>

          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
            {profile?.displayName || fallbackName}
          </h1>
          {profile?.username && (
            <p className="mt-0.5 text-sm font-medium text-orange-400">@{profile.username}</p>
          )}
          <p className="mt-1 text-sm text-zinc-400">{profile?.email}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {[profile?.fitnessGoal, profile?.preferredCategory, profile?.experienceLevel]
              .filter(Boolean)
              .map((tag) => (
                <span key={tag} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                  {tag}
                </span>
              ))}
          </div>

          {profile?.notes && <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-300">{profile.notes}</p>}

          <div className="mt-6 grid grid-cols-4 gap-4 border-t border-white/8 pt-5">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{myPosts.filter((p) => p.type === "activity").length}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Activities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">{myPosts.length}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Posts</p>
            </div>
            <button onClick={() => openFollowList("followers")} className="text-center hover:opacity-75 transition-opacity">
              <p className="text-2xl font-black text-white">{profile?.followerCount ?? 0}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Followers</p>
            </button>
            <button onClick={() => openFollowList("following")} className="text-center hover:opacity-75 transition-opacity">
              <p className="text-2xl font-black text-white">{profile?.followingCount ?? 0}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Following</p>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="flex gap-1 rounded-xl border border-white/8 bg-white/5 p-1">
            {(["posts", "blogs"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTab(type)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all ${tab === type ? "bg-[#0f1117] text-white shadow" : "text-zinc-400 hover:text-white"}`}
              >
                {type === "posts" ? "Activities" : "Blog Posts"}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-10 text-center">
              <p className="text-zinc-500 text-sm">No {tab === "blogs" ? "blog posts" : "activities"} yet.</p>
              <p className="mt-1 text-zinc-600 text-xs">Share your progress using the &quot;Share Progress&quot; button.</p>
            </div>
          )}
          {filteredPosts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-white/8 bg-[#0f1117] p-5">
              <div className="mb-3 flex items-center gap-2">
                {post.type === "blog" && (
                  <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">Blog</span>
                )}
                {post.tag && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-400">{post.tag}</span>}
                <span className="ml-auto text-xs text-zinc-500">{post.time}</span>
              </div>
              <h3 className="mb-2 font-bold text-white">{post.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-300">{post.content}</p>
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
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">⚡ {post.likes ?? 0}</span>
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">💬 {post.comments ?? 0}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-4">
          {profile && (
            <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Body stats</p>
              <div className="space-y-2.5">
                {[
                  { label: "Height", value: `${profile.heightCm} cm` },
                  { label: "Weight", value: `${profile.weightKg} kg` },
                  { label: "BMI", value: bmi ?? "-" },
                  { label: "Training Days", value: `${profile.trainingDaysPerWeek} / week` },
                  { label: "Session Length", value: `${profile.sessionDurationMinutes} min` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{item.label}</span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Achievements</p>
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border p-3 text-center transition-all ${item.earned ? "border-orange-500/30 bg-orange-500/10" : "border-white/8 bg-white/3 opacity-40"}`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="mt-1 text-xs leading-tight text-zinc-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Weekly summary</p>
            {[
              { label: "Workouts", value: profile?.weeklyWorkoutCount ?? 0, max: 7, color: "bg-orange-500" },
              { label: "Run Distance", value: profile?.weeklyRunKm ?? 0, max: 50, color: "bg-blue-500" },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, (Number(item.value) / item.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Today&apos;s Macros</p>
              <span className="text-xs font-bold text-orange-400">1,840 kcal</span>
            </div>
            <div className="flex justify-around">
              {[
                { label: "Protein", value: "142g", pct: 71, color: "#ff4d00" },
                { label: "Carbs", value: "198g", pct: 66, color: "#3b82f6" },
                { label: "Fats", value: "58g", pct: 58, color: "#f59e0b" },
              ].map((macro) => (
                <MacroRingSmall key={macro.label} {...macro} />
              ))}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-400" style={{ width: "73%" }} />
            </div>
            <p className="mt-1.5 text-center text-xs text-zinc-500">73% of daily goal</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <WorkoutHeatmap />
      </div>

      {loadError && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {loadError}. Check that the backend is running and reachable at <code>{API_BASE_URL}</code>.
        </div>
      )}

      {/* Followers / Following modal */}
      {followListOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setFollowListOpen(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1117] pb-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="font-bold text-white capitalize">{followListOpen}</h2>
              <button onClick={() => setFollowListOpen(null)} className="text-zinc-500 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {followListLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                </div>
              ) : followList.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-10">No {followListOpen} yet.</p>
              ) : (
                followList.map((u) => (
                  <a key={u.id} href={`/dashboard/users/${u.id}`} onClick={() => setFollowListOpen(null)} className="flex w-full items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors">
                    {u.profileImageDataUrl ? (
                      <img src={u.profileImageDataUrl} alt={u.displayName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-black text-white shrink-0">
                        {u.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{u.displayName}</p>
                      {u.username && <p className="text-xs text-zinc-500 truncate">@{u.username}</p>}
                    </div>
                    {u.preferredCategory && (
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-400">{u.preferredCategory}</span>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile();
            }}
            className="theme-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1117] p-5 shadow-[0_40px_120px_-40px_rgba(255,90,0,0.45)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Profile editor</p>
                <h2 className="text-xl font-bold text-white">Update your signup details</h2>
              </div>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white">
                Close
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Profile photo</p>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/5">
                  {form.profileImageDataUrl ? (
                    <Image
                      src={form.profileImageDataUrl}
                      alt="Profile preview"
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-400">{initials}</div>
                  )}
                </div>
                <label className="cursor-pointer rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15">
                  Upload image
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarFileChange} />
                </label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, profileImageDataUrl: "" })}
                  className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Cover photo</p>
              <div className="overflow-hidden rounded-lg border border-white/12 bg-[#10141f]">
                <div className="relative h-24 w-full">
                  {form.coverImageDataUrl ? (
                    <Image
                      src={form.coverImageDataUrl}
                      alt="Cover preview"
                      fill
                      unoptimized
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600/55 via-orange-500/35 to-blue-600/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <label className="cursor-pointer rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15">
                  Upload cover
                  <input type="file" accept="image/*" className="hidden" onChange={onCoverFileChange} />
                </label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, coverImageDataUrl: "" })}
                  className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-sm text-zinc-300">
                Display name
                <input
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-white outline-none focus:border-orange-500/60"
                />
              </label>
              <label className="text-sm text-zinc-300">
                Username (read only)
                <input value={(profile?.username || fallbackUsername) ? `@${profile?.username || fallbackUsername}` : ""} readOnly className="mt-1 w-full rounded-lg border border-white/12 bg-white/10 px-3 py-2 text-zinc-400" />
              </label>
              <label className="text-sm text-zinc-300">
                Email (read only)
                <input value={profile?.email || ""} readOnly className="mt-1 w-full rounded-lg border border-white/12 bg-white/10 px-3 py-2 text-zinc-400" />
              </label>
              <label className="text-sm text-zinc-300">
                Height (cm)
                <input
                  type="number"
                  min="100"
                  max="260"
                  value={form.heightCm}
                  onChange={(event) => setForm({ ...form, heightCm: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-white outline-none focus:border-orange-500/60"
                />
              </label>
              <label className="text-sm text-zinc-300">
                Weight (kg)
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={form.weightKg}
                  onChange={(event) => setForm({ ...form, weightKg: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-white outline-none focus:border-orange-500/60"
                />
              </label>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Fitness goals</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {FITNESS_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleArrayValue("fitnessGoals", goal)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${form.fitnessGoals.includes(goal) ? "border-orange-500/50 bg-orange-500/18 text-orange-300" : "border-white/12 bg-white/6 text-zinc-300 hover:bg-white/10"}`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Experience level</p>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm({ ...form, experienceLevel: level })}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${form.experienceLevel === level ? "border-orange-500/50 bg-orange-500/18 text-orange-300" : "border-white/12 bg-white/6 text-zinc-300 hover:bg-white/10"}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Preferred categories</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleArrayValue("preferredCategories", category)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${form.preferredCategories.includes(category) ? "border-orange-500/50 bg-orange-500/18 text-orange-300" : "border-white/12 bg-white/6 text-zinc-300 hover:bg-white/10"}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-sm text-zinc-300">
                Training days per week
                <div className="mt-1 grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setForm({ ...form, trainingDaysPerWeek: String(day) })}
                      className={`rounded-md border py-2 text-xs font-bold transition-colors ${
                        form.trainingDaysPerWeek === String(day)
                          ? "border-orange-500/60 bg-orange-500/20 text-orange-300"
                          : "border-white/12 bg-white/6 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </label>
              <label className="text-sm text-zinc-300">
                Session duration (minutes)
                <input
                  type="number"
                  min="20"
                  max="240"
                  value={form.sessionDurationMinutes}
                  onChange={(event) => setForm({ ...form, sessionDurationMinutes: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-white outline-none focus:border-orange-500/60"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm text-zinc-300">
              Notes
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="mt-1 w-full resize-none rounded-lg border border-white/12 bg-white/6 px-3 py-2 text-white outline-none focus:border-orange-500/60"
              />
            </label>

            {saveError && (
              <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {saveError}
              </p>
            )}

            <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t border-white/10 bg-[#0f1117]/95 pt-3 backdrop-blur">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400 disabled:opacity-60"
              >
                {saveLoading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
