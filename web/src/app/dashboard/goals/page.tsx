"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE_URL } from "@/lib/api";

//  Types 

type GoalType = "lose_fat" | "gain_muscle" | "maintain";
type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active";

interface GoalSettings {
  goal: GoalType;
  activityLevel: ActivityLevel;
  calorieTarget: number;
  protein: number;
  carbs: number;
  fat: number;
  updatedAt: string;
}

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodLogs {
  [dateString: string]: FoodEntry[];
}

interface ProfileData {
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: string;
}

//  Constants 

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
  extremely_active: "Extremely Active",
};

const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  sedentary: "Little or no exercise",
  lightly_active: "Light exercise 13 days/week",
  moderately_active: "Moderate exercise 35 days/week",
  very_active: "Hard exercise 67 days/week",
  extremely_active: "Very hard exercise, physical job",
};

const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  lose_fat: -500,
  gain_muscle: 300,
  maintain: 0,
};

const MACRO_RATIOS: Record<GoalType, { protein: number; fat: number }> = {
  lose_fat: { protein: 2.2, fat: 0.8 },
  gain_muscle: { protein: 1.8, fat: 1.0 },
  maintain: { protein: 1.6, fat: 1.0 },
};

const MACRO_COLORS = {
  protein: "#ff4d00",
  carbs: "#3b82f6",
  fat: "#f59e0b",
  calories: "#f97316",
};

const TODAY = new Date().toISOString().split("T")[0];
const PROFILE_STORAGE_KEY = "fitsphere_profile_data";

//  Helpers 

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function calcTDEE(weightKg: number, heightCm: number, age: number, activityLevel: ActivityLevel, gender: string): number {
  const bmr =
    gender === "female"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

function calcMacros(calorieTarget: number, weightKg: number, goal: GoalType): { protein: number; carbs: number; fat: number } {
  const { protein: proteinRatio, fat: fatRatio } = MACRO_RATIOS[goal];
  const protein = Math.round(proteinRatio * weightKg);
  const fat = Math.round(fatRatio * weightKg);
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbsCals = Math.max(0, calorieTarget - proteinCals - fatCals);
  const carbs = Math.round(carbsCals / 4);
  return { protein, carbs, fat };
}

function loadGoalSettings(): GoalSettings | null {
  try {
    const raw = localStorage.getItem("fitsphere_goals");
    return raw ? (JSON.parse(raw) as GoalSettings) : null;
  } catch {
    return null;
  }
}

function saveGoalSettings(settings: GoalSettings) {
  localStorage.setItem("fitsphere_goals", JSON.stringify(settings));
}

function loadFoodLogs(): FoodLogs {
  try {
    const raw = localStorage.getItem("fitsphere_food_logs");
    return raw ? (JSON.parse(raw) as FoodLogs) : {};
  } catch {
    return {};
  }
}

function saveFoodLogs(logs: FoodLogs) {
  localStorage.setItem("fitsphere_food_logs", JSON.stringify(logs));
}

function loadProfileFromStorage(): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfileData) : {};
  } catch {
    return {};
  }
}

function saveProfileToStorage(profile: ProfileData) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

//  SVG Progress Ring 

function ProgressRing({
  label,
  value,
  target,
  color,
  unit = "g",
  size = 100,
  strokeWidth = 8,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = circumference * (1 - pct);
  const remaining = Math.max(0, target - value);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-white leading-none">{value}</span>
          <span className="text-[10px] text-zinc-500 leading-none mt-0.5">{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-zinc-300">{label}</p>
        <p className="text-[10px] text-zinc-600">{remaining}{unit} left</p>
      </div>
    </div>
  );
}

//  Goal Card 

function GoalCard({
  type,
  title,
  description,
  adjustment,
  icon,
  selected,
  onClick,
  colorClass,
  borderClass,
  bgClass,
}: {
  type: GoalType;
  title: string;
  description: string;
  adjustment: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  colorClass: string;
  borderClass: string;
  bgClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-200 ${
        selected
          ? `${bgClass} ${borderClass} shadow-lg`
          : "bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-white/20" : "bg-white/8"}`}>
        {icon}
      </div>
      <div>
        <p className={`font-bold text-sm ${selected ? colorClass : "text-white"}`}>{title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <div className={`text-xs font-semibold ${selected ? colorClass : "text-zinc-600"}`}>{adjustment}</div>
    </button>
  );
}

//  Custom Tooltip for Bar Chart 

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1117] px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-orange-400 font-bold">{payload[0].value} kcal</p>
    </div>
  );
}

//  Main Page 

export default function GoalsPage() {
  const [displayName, setDisplayName] = useState("Athlete");
  const [profile, setProfile] = useState<ProfileData>({ heightCm: 175, weightKg: 75 });

  // Goal settings state
  const [selectedGoal, setSelectedGoal] = useState<GoalType>("maintain");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderately_active");
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [macroTargets, setMacroTargets] = useState({ protein: 120, carbs: 200, fat: 65 });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Food log state
  const [foodLogs, setFoodLogs] = useState<FoodLogs>({});
  const [newFood, setNewFood] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [addingFood, setAddingFood] = useState(false);
  const [showAiTooltip, setShowAiTooltip] = useState(false);
  const [foodError, setFoodError] = useState("");
  const tooltipRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const name = localStorage.getItem("fitsphere_display_name") || "Athlete";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(name);

    const profileData = loadProfileFromStorage();
    setProfile({
      heightCm: profileData.heightCm ?? 175,
      weightKg: profileData.weightKg ?? 75,
      age: typeof profileData.age === "number" && Number.isFinite(profileData.age) ? profileData.age : undefined,
      gender: profileData.gender,
    });

    const token = localStorage.getItem("fitsphere_token");
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const apiProfile = data as ProfileData;
          setProfile((prev) => {
            const next: ProfileData = {
              heightCm:
                typeof apiProfile.heightCm === "number" && Number.isFinite(apiProfile.heightCm)
                  ? apiProfile.heightCm
                  : prev.heightCm,
              weightKg:
                typeof apiProfile.weightKg === "number" && Number.isFinite(apiProfile.weightKg)
                  ? apiProfile.weightKg
                  : prev.weightKg,
              age:
                typeof apiProfile.age === "number" && Number.isFinite(apiProfile.age)
                  ? apiProfile.age
                  : prev.age,
              gender: apiProfile.gender ?? prev.gender,
            };
            saveProfileToStorage(next);
            return next;
          });
        })
        .catch(() => null);
    }

    const handleProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{
        displayName?: string;
        heightCm?: number;
        weightKg?: number;
        age?: number;
        gender?: string;
      }>).detail;
      if (!detail) return;

      if (typeof detail.displayName === "string" && detail.displayName.trim()) {
        setDisplayName(detail.displayName);
      }

      if (
        typeof detail.heightCm === "number" ||
        typeof detail.weightKg === "number" ||
        typeof detail.age === "number" ||
        typeof detail.gender === "string"
      ) {
        setProfile((prev) => {
          const next: ProfileData = {
            heightCm: typeof detail.heightCm === "number" ? detail.heightCm : prev.heightCm,
            weightKg: typeof detail.weightKg === "number" ? detail.weightKg : prev.weightKg,
            age: typeof detail.age === "number" ? detail.age : prev.age,
            gender: typeof detail.gender === "string" ? detail.gender : prev.gender,
          };
          saveProfileToStorage(next);
          return next;
        });
      }
    };
    window.addEventListener("fitsphere:profile-updated", handleProfileUpdated);

    const savedGoals = loadGoalSettings();
    if (savedGoals) {
      setSelectedGoal(savedGoals.goal);
      setActivityLevel(savedGoals.activityLevel);
      setCalorieTarget(savedGoals.calorieTarget);
      setMacroTargets({ protein: savedGoals.protein, carbs: savedGoals.carbs, fat: savedGoals.fat });
    }

    setFoodLogs(loadFoodLogs());
    setSettingsLoaded(true);

    return () => {
      window.removeEventListener("fitsphere:profile-updated", handleProfileUpdated);
    };
  }, []);

  // Recalculate targets whenever goal/profile/activity changes (after initial load)
  const recalculate = useCallback(() => {
    const wKg = profile.weightKg ?? 75;
    const hCm = profile.heightCm ?? 175;
    const age = profile.age ?? 25;
    const gender = profile.gender ?? "male";
    const tdee = calcTDEE(wKg, hCm, age, activityLevel, gender);
    const adjusted = Math.max(1200, tdee + GOAL_ADJUSTMENTS[selectedGoal]);
    const macros = calcMacros(adjusted, wKg, selectedGoal);
    setCalorieTarget(adjusted);
    setMacroTargets(macros);
  }, [profile, activityLevel, selectedGoal]);

  useEffect(() => {
    if (!settingsLoaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recalculate();
  }, [settingsLoaded, recalculate]);

  // Save settings to localStorage
  const handleSaveSettings = () => {
    const settings: GoalSettings = {
      goal: selectedGoal,
      activityLevel,
      calorieTarget,
      protein: macroTargets.protein,
      carbs: macroTargets.carbs,
      fat: macroTargets.fat,
      updatedAt: new Date().toISOString(),
    };
    saveGoalSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // Today's food entries
  const todayEntries: FoodEntry[] = foodLogs[TODAY] ?? [];

  const totals = todayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Add food entry
  const handleAddFood = () => {
    setFoodError("");
    if (!newFood.name.trim()) { setFoodError("Food name is required."); return; }
    const calories = parseFloat(newFood.calories) || 0;
    const protein = parseFloat(newFood.protein) || 0;
    const carbs = parseFloat(newFood.carbs) || 0;
    const fat = parseFloat(newFood.fat) || 0;
    if (calories <= 0) { setFoodError("Calories must be greater than 0."); return; }

    const entry: FoodEntry = {
      id: String(Date.now()),
      name: newFood.name.trim(),
      calories,
      protein,
      carbs,
      fat,
    };

    const updated: FoodLogs = {
      ...foodLogs,
      [TODAY]: [...(foodLogs[TODAY] ?? []), entry],
    };
    setFoodLogs(updated);
    saveFoodLogs(updated);
    setNewFood({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setAddingFood(false);
  };

  const handleRemoveFood = (id: string) => {
    const updated: FoodLogs = {
      ...foodLogs,
      [TODAY]: (foodLogs[TODAY] ?? []).filter((e) => e.id !== id),
    };
    setFoodLogs(updated);
    saveFoodLogs(updated);
  };

  // Weekly chart data
  const weekDays = getLast7Days();
  const weeklyData = weekDays.map((day) => {
    const entries = foodLogs[day] ?? [];
    const total = entries.reduce((sum, e) => sum + e.calories, 0);
    return {
      day: formatDay(day),
      calories: total,
      isToday: day === TODAY,
    };
  });

  // AI Detect tooltip
  const handleAiDetectEnter = () => {
    if (tooltipRef.current) clearTimeout(tooltipRef.current);
    setShowAiTooltip(true);
  };
  const handleAiDetectLeave = () => {
    tooltipRef.current = setTimeout(() => setShowAiTooltip(false), 300);
  };

  const weightKg = profile.weightKg ?? 75;

  return (
    <div className="min-h-screen bg-[#0a0c12] pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-8">

        {/*  Page Header  */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-400 mb-1">Nutrition & Goals</p>
          <h1 className="text-2xl font-black text-white">
            Hey {displayName.split(" ")[0]}, let&apos;s track your goals
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Set your fitness goal and log your daily nutrition to stay on track.</p>
        </div>

        <div className="space-y-6">

          {/*  Section 1: Goal Card  */}
          <section className="rounded-2xl border border-white/8 bg-[#0f1117] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Primary Goal</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Choose what you want to focus on</p>
              </div>
              <button
                onClick={handleSaveSettings}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  settingsSaved
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-orange-500 text-white hover:bg-orange-400"
                }`}
              >
                {settingsSaved ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>

            {/* Goal type cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
              <GoalCard
                type="lose_fat"
                title="Lose Fat"
                description="Burn body fat while preserving muscle"
                adjustment="-500 kcal deficit/day"
                selected={selectedGoal === "lose_fat"}
                onClick={() => setSelectedGoal("lose_fat")}
                colorClass="text-red-400"
                borderClass="border-red-500/40"
                bgClass="bg-red-500/8"
                icon={
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                  </svg>
                }
              />
              <GoalCard
                type="gain_muscle"
                title="Gain Muscle"
                description="Build lean mass with a caloric surplus"
                adjustment="+300 kcal surplus/day"
                selected={selectedGoal === "gain_muscle"}
                onClick={() => setSelectedGoal("gain_muscle")}
                colorClass="text-blue-400"
                borderClass="border-blue-500/40"
                bgClass="bg-blue-500/8"
                icon={
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                }
              />
              <GoalCard
                type="maintain"
                title="Maintain Weight"
                description="Stay at your current weight and composition"
                adjustment="Maintenance calories"
                selected={selectedGoal === "maintain"}
                onClick={() => setSelectedGoal("maintain")}
                colorClass="text-green-400"
                borderClass="border-green-500/40"
                bgClass="bg-green-500/8"
                icon={
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.59 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                  </svg>
                }
              />
            </div>

            {/* Activity level */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0c12] px-3 py-2 text-sm text-white outline-none focus:border-orange-500/40 transition-colors"
                >
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
                    <option key={key} value={key}>
                      {ACTIVITY_LABELS[key]}  {ACTIVITY_DESCRIPTIONS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calorie & Macro summary */}
            <div className="mt-5 rounded-xl border border-white/8 bg-white/3 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Your Daily Targets</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center">
                  <p className="text-xl font-black text-orange-400">{calorieTarget}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Calories (kcal)</p>
                </div>
                <div className="rounded-xl bg-[#ff4d00]/10 border border-[#ff4d00]/20 p-3 text-center">
                  <p className="text-xl font-black" style={{ color: MACRO_COLORS.protein }}>{macroTargets.protein}g</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Protein</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                  <p className="text-xl font-black" style={{ color: MACRO_COLORS.carbs }}>{macroTargets.carbs}g</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Carbs</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <p className="text-xl font-black" style={{ color: MACRO_COLORS.fat }}>{macroTargets.fat}g</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Fat</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-zinc-600">
                Based on {weightKg}kg body weight, {profile.heightCm ?? 175}cm height, age {profile.age ?? 25}, {ACTIVITY_LABELS[activityLevel].toLowerCase()} lifestyle. Formula: Mifflin-St Jeor.
              </p>
            </div>
          </section>

          {/*  Section 2: Today's Progress  */}
          <section className="rounded-2xl border border-white/8 bg-[#0f1117] p-6">
            <div className="mb-6">
              <h2 className="text-base font-bold text-white">Today&apos;s Progress</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* Remaining calories banner */}
            <div className="mb-6 rounded-xl border border-white/8 bg-white/3 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Remaining Calories</p>
                <p className={`text-3xl font-black mt-1 ${calorieTarget - totals.calories < 0 ? "text-red-400" : "text-white"}`}>
                  {calorieTarget - totals.calories}
                  <span className="text-base font-normal text-zinc-500 ml-1">kcal</span>
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">{totals.calories} consumed of {calorieTarget} target</p>
              </div>
              <div className="hidden sm:block">
                <div className="relative h-16 w-16">
                  <svg width={64} height={64} className="-rotate-90">
                    <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
                    <circle
                      cx={32}
                      cy={32}
                      r={26}
                      fill="none"
                      stroke={MACRO_COLORS.calories}
                      strokeWidth={7}
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - Math.min(totals.calories / calorieTarget, 1))}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {calorieTarget > 0 ? Math.round((totals.calories / calorieTarget) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Macro rings */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 justify-items-center">
              <ProgressRing
                label="Calories"
                value={totals.calories}
                target={calorieTarget}
                color={MACRO_COLORS.calories}
                unit="kcal"
                size={108}
                strokeWidth={10}
              />
              <ProgressRing
                label="Protein"
                value={totals.protein}
                target={macroTargets.protein}
                color={MACRO_COLORS.protein}
                unit="g"
                size={108}
                strokeWidth={10}
              />
              <ProgressRing
                label="Carbs"
                value={totals.carbs}
                target={macroTargets.carbs}
                color={MACRO_COLORS.carbs}
                unit="g"
                size={108}
                strokeWidth={10}
              />
              <ProgressRing
                label="Fat"
                value={totals.fat}
                target={macroTargets.fat}
                color={MACRO_COLORS.fat}
                unit="g"
                size={108}
                strokeWidth={10}
              />
            </div>

            {/* Macro bar breakdown */}
            <div className="mt-6 space-y-3">
              {[
                { label: "Protein", value: totals.protein, target: macroTargets.protein, color: MACRO_COLORS.protein },
                { label: "Carbs", value: totals.carbs, target: macroTargets.carbs, color: MACRO_COLORS.carbs },
                { label: "Fat", value: totals.fat, target: macroTargets.fat, color: MACRO_COLORS.fat },
              ].map(({ label, value, target, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-400">{label}</span>
                    <span className="text-xs text-zinc-600">{value}g / {target}g</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/6 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((value / (target || 1)) * 100, 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/*  Section 3: Food Log  */}
          <section className="rounded-2xl border border-white/8 bg-[#0f1117] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Food Log</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Log your meals for today</p>
              </div>
              <div className="flex items-center gap-2">
                {/* AI Detect button */}
                <div className="relative">
                  <button
                    onMouseEnter={handleAiDetectEnter}
                    onMouseLeave={handleAiDetectLeave}
                    onFocus={handleAiDetectEnter}
                    onBlur={handleAiDetectLeave}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-default"
                    aria-label="AI Detect  Coming soon"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    AI Detect
                  </button>
                  {showAiTooltip && (
                    <div className="absolute right-0 top-full mt-2 z-30 whitespace-nowrap rounded-xl border border-white/10 bg-[#12141c] px-3 py-2 text-xs text-zinc-400 shadow-xl">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                        Coming soon  AI food photo detection
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setAddingFood(true); setFoodError(""); }}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-400 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Food
                </button>
              </div>
            </div>

            {/* Add food form */}
            {addingFood && (
              <div className="mb-5 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-3">New Food Entry</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Food name (e.g. Grilled Chicken Breast)"
                      value={newFood.name}
                      onChange={(e) => setNewFood((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={newFood.calories}
                      onChange={(e) => setNewFood((f) => ({ ...f, calories: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={newFood.protein}
                      onChange={(e) => setNewFood((f) => ({ ...f, protein: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={newFood.carbs}
                      onChange={(e) => setNewFood((f) => ({ ...f, carbs: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Fat (g)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={newFood.fat}
                      onChange={(e) => setNewFood((f) => ({ ...f, fat: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/40 transition-colors"
                    />
                  </div>
                </div>
                {foodError && <p className="mt-2 text-xs text-red-400">{foodError}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleAddFood}
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400 transition-colors"
                  >
                    Add Entry
                  </button>
                  <button
                    onClick={() => { setAddingFood(false); setFoodError(""); setNewFood({ name: "", calories: "", protein: "", carbs: "", fat: "" }); }}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Food entries list */}
            {todayEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/3">
                  <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 20.188l-.015-.001 86.004-3.751A.75.75 0 0118 15.75V10.5a9.085 9.085 0 00-4.87-8.034 8.25 8.25 0 00-8.52 0A9.085 9.085 0 006 10.5v5.25a.75.75 0 01-.591.731L3 17.188" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-zinc-500">No food logged yet today</p>
                <p className="mt-1 text-xs text-zinc-700">Click &quot;Add Food&quot; to start logging your meals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-[1fr_80px_70px_70px_70px_36px] gap-3 px-3 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Food</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 text-right">Cals</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 text-right">Protein</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 text-right">Carbs</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 text-right">Fat</span>
                  <span />
                </div>

                {todayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex flex-col sm:grid sm:grid-cols-[1fr_80px_70px_70px_70px_36px] sm:items-center gap-1 sm:gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white truncate">{entry.name}</span>
                    <div className="flex gap-3 sm:contents">
                      <span className="text-sm text-orange-400 font-bold sm:text-right">{entry.calories}<span className="text-xs text-zinc-600 ml-0.5 sm:hidden"> kcal</span></span>
                      <span className="text-sm text-zinc-400 sm:text-right">{entry.protein}g<span className="text-xs text-zinc-700 ml-0.5 sm:hidden">P</span></span>
                      <span className="text-sm text-zinc-400 sm:text-right">{entry.carbs}g<span className="text-xs text-zinc-700 ml-0.5 sm:hidden">C</span></span>
                      <span className="text-sm text-zinc-400 sm:text-right">{entry.fat}g<span className="text-xs text-zinc-700 ml-0.5 sm:hidden">F</span></span>
                    </div>
                    <button
                      onClick={() => handleRemoveFood(entry.id)}
                      className="hidden sm:flex items-center justify-center h-7 w-7 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Remove entry"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveFood(entry.id)}
                      className="sm:hidden self-start text-xs text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {/* Totals row */}
                <div className="mt-1 flex flex-col sm:grid sm:grid-cols-[1fr_80px_70px_70px_70px_36px] sm:items-center gap-1 sm:gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Daily Total</span>
                  <div className="flex gap-3 sm:contents">
                    <span className="text-sm font-black text-orange-400 sm:text-right">{totals.calories}<span className="text-xs text-zinc-600 ml-0.5 sm:hidden"> kcal</span></span>
                    <span className="text-sm font-bold text-white sm:text-right">{totals.protein}g</span>
                    <span className="text-sm font-bold text-white sm:text-right">{totals.carbs}g</span>
                    <span className="text-sm font-bold text-white sm:text-right">{totals.fat}g</span>
                  </div>
                  <div />
                </div>
              </div>
            )}
          </section>

          {/*  Section 4: Weekly Overview  */}
          <section className="rounded-2xl border border-white/8 bg-[#0f1117] p-6">
            <div className="mb-6">
              <h2 className="text-base font-bold text-white">Weekly Overview</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Calorie intake over the last 7 days vs your target</p>
            </div>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#71717a", fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#52525b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v === 0 ? "" : `${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <ReferenceLine
                    y={calorieTarget}
                    stroke="#f97316"
                    strokeDasharray="6 3"
                    strokeOpacity={0.6}
                    label={{ value: `Target ${calorieTarget}`, fill: "#f97316", fontSize: 10, position: "right" }}
                  />
                  <Bar
                    dataKey="calories"
                    radius={[4, 4, 0, 0]}
                    fill="#f97316"
                    fillOpacity={0.7}
                    activeBar={{ fillOpacity: 1 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-orange-500/70" />
                <span className="text-xs text-zinc-500">Daily intake</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-6 rounded-full bg-orange-500/60" style={{ borderTop: "2px dashed #f97316" }} />
                <span className="text-xs text-zinc-500">Target ({calorieTarget} kcal)</span>
              </div>
            </div>

            {/* Weekly stats */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {(() => {
                const daysWithData = weeklyData.filter((d) => d.calories > 0);
                const avgCalories = daysWithData.length > 0
                  ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
                  : 0;
                const daysOnTarget = weeklyData.filter((d) => d.calories > 0 && Math.abs(d.calories - calorieTarget) <= calorieTarget * 0.1).length;
                const totalWeekly = weeklyData.reduce((s, d) => s + d.calories, 0);
                return (
                  <>
                    <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                      <p className="text-lg font-black text-white">{avgCalories}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Avg daily kcal</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                      <p className="text-lg font-black text-white">{daysOnTarget}<span className="text-zinc-600 text-sm font-normal">/7</span></p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Days on target</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                      <p className="text-lg font-black text-white">{(totalWeekly / 1000).toFixed(1)}k</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Weekly total kcal</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

