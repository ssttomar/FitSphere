"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { API_BASE_URL } from "@/lib/api";

type MeProfile = {
  username?: string | null;
  email?: string | null;
  displayName?: string | null;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: string | null;
  experienceLevel?: string | null;
  preferredCategory?: string | null;
  trainingDaysPerWeek?: number;
  sessionDurationMinutes?: number;
};

function splitCsv(value: string | null | undefined): string[] {
  return (value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const STEPS = [
  { id: 1, label: "Body Stats" },
  { id: 2, label: "Your Goals" },
  { id: 3, label: "Training Style" },
];

const LEFT_CONTENT = [
  {
    heading: <>Build Your<br />Athlete<br />Profile</>,
    sub: "Tell us about your body so we can calibrate your training zones and nutrition targets.",
    tag: "Step 1 of 3 - Body Stats",
  },
  {
    heading: <>Define What<br />You&apos;re<br />Training For</>,
    sub: "Whether it's shredding fat, building mass, or running faster - we align every session to your goal.",
    tag: "Step 2 of 3 - Goals",
  },
  {
    heading: <>Design Your<br />Perfect<br />Schedule</>,
    sub: "Your AI coach crafts a weekly plan tailored to how many days you can commit and how long you train.",
    tag: "Step 3 of 3 - Training Style",
  },
];

const FITNESS_GOALS = ["Fat loss", "Muscle gain", "Strength", "Endurance", "Flexibility", "General fitness"];

const CATEGORIES = ["Gym", "Running", "Calisthenics", "Cycling", "Swimming", "Sports"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("Athlete");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);

  // Body stats
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Goals  multi-select
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  // Training style
  const [trainingDays, setTrainingDays] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("fitsphere_token");
    if (!token) { router.replace("/auth?mode=login"); return; }
    const name = localStorage.getItem("fitsphere_display_name");
    if (name) setDisplayName(name.split(" ")[0]);

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const me = data as MeProfile;

        const missingUsername = !me.username || !me.username.trim();
        const missingEmail = !me.email || !me.email.trim();
        setNeedsUsername(missingUsername);
        setNeedsEmail(missingEmail);

        if (!missingUsername && me.username) setUsername(me.username);
        if (!missingEmail && me.email) setEmail(me.email);
        if (me.displayName && me.displayName.trim()) setDisplayName(me.displayName.split(" ")[0]);

        if (typeof me.heightCm === "number" && me.heightCm > 0) setHeightCm(String(me.heightCm));
        if (typeof me.weightKg === "number" && me.weightKg > 0) setWeightKg(String(me.weightKg));
        if (me.fitnessGoal) setFitnessGoals(splitCsv(me.fitnessGoal));
        if (me.experienceLevel) setExperienceLevel(me.experienceLevel);
        if (me.preferredCategory) setPreferredCategories(splitCsv(me.preferredCategory));
        if (typeof me.trainingDaysPerWeek === "number" && me.trainingDaysPerWeek > 0) setTrainingDays(String(me.trainingDaysPerWeek));
        if (typeof me.sessionDurationMinutes === "number" && me.sessionDurationMinutes > 0) setSessionDuration(String(me.sessionDurationMinutes));

        const hasOnboarding =
          (me.heightCm ?? 0) > 0 &&
          (me.weightKg ?? 0) > 0 &&
          !!me.fitnessGoal?.trim() &&
          !!me.experienceLevel?.trim() &&
          !!me.preferredCategory?.trim() &&
          (me.trainingDaysPerWeek ?? 0) > 0 &&
          (me.sessionDurationMinutes ?? 0) > 0;

        if (localStorage.getItem("fitsphere_onboarding_done") && !missingUsername && !missingEmail && hasOnboarding) {
          router.replace("/dashboard");
        }
      })
      .catch(() => null);
  }, [router]);

  function toggleGoal(val: string) {
    setFitnessGoals((prev) =>
      prev.includes(val) ? prev.filter((g) => g !== val) : [...prev, val]
    );
  }

  function toggleCategory(val: string) {
    setPreferredCategories((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  }

  const nextStep = () => { setError(null); setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const validate = (): string | null => {
    if (step === 0) {
      if (needsUsername) {
        const uname = username.trim().toLowerCase();
        if (!uname || uname.length < 3 || uname.length > 30 || !/^[a-z0-9._]+$/.test(uname)) {
          return "Enter a valid username (3-30 chars, lowercase letters, numbers, dots, underscores).";
        }
      }
      if (needsEmail) {
        const emailTrimmed = email.trim();
        if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
          return "Enter a valid email address.";
        }
      }
      if (!heightCm || Number(heightCm) < 100 || Number(heightCm) > 260) return "Enter a valid height (100-260 cm).";
      if (!weightKg || Number(weightKg) < 30 || Number(weightKg) > 300) return "Enter a valid weight (30-300 kg).";
    }
    if (step === 1) {
      if (fitnessGoals.length === 0) return "Select at least one fitness goal.";
      if (!experienceLevel) return "Select your experience level.";
      if (preferredCategories.length === 0) return "Select at least one preferred category.";
    }
    if (step === 2) {
      if (!trainingDays) return "Select how many days you train per week.";
      const dur = Number(sessionDuration);
      if (!sessionDuration || dur < 10 || dur > 360) return "Enter a session duration between 10 and 360 minutes.";
    }
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    if (step < STEPS.length - 1) { nextStep(); return; }

    setError(null);
    setLoading(true);
    const token = localStorage.getItem("fitsphere_token");
    if (!token) { router.replace("/auth?mode=login"); return; }

    const payload = {
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      // Send as comma-separated strings for API compatibility
      fitnessGoal: fitnessGoals.join(", "),
      experienceLevel,
      preferredCategory: preferredCategories.join(", "),
      trainingDaysPerWeek: Number(trainingDays),
      sessionDurationMinutes: Number(sessionDuration),
      notes,
    };

    try {
      const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!meRes.ok) throw new Error("Could not verify account basics");
      const me = (await meRes.json()) as MeProfile;

      const mustSetUsername = !me.username || !me.username.trim();
      const mustSetEmail = !me.email || !me.email.trim();
      setNeedsUsername(mustSetUsername);
      setNeedsEmail(mustSetEmail);

      if (mustSetUsername || mustSetEmail) {
        const uname = username.trim().toLowerCase();
        const emailTrimmed = email.trim().toLowerCase();

        if (mustSetUsername && (!uname || uname.length < 3 || uname.length > 30 || !/^[a-z0-9._]+$/.test(uname))) {
          setStep(0);
          throw new Error("Username is required before continuing.");
        }
        if (mustSetEmail && (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed))) {
          setStep(0);
          throw new Error("Email is required before continuing.");
        }

        const basicsPayload: { username?: string; email?: string } = {};
        if (mustSetUsername) basicsPayload.username = uname;
        if (mustSetEmail) basicsPayload.email = emailTrimmed;

        const completeRes = await fetch(`${API_BASE_URL}/api/auth/complete-account`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(basicsPayload),
        });
        if (!completeRes.ok && completeRes.status !== 404) {
          throw new Error(await completeRes.text());
        }

        if (completeRes.ok) {
          const updatedBasics = (await completeRes.json()) as MeProfile;
          if (updatedBasics.username) localStorage.setItem("fitsphere_username", updatedBasics.username);
        } else if (mustSetUsername && uname) {
          // Backend may be on an older build without /complete-account.
          // Cache entered username locally so UI can still display it.
          localStorage.setItem("fitsphere_username", uname);
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());

      // Mark onboarding as done so login skips this page
      localStorage.setItem("fitsphere_onboarding_done", "true");
      let existingAge: number | undefined;
      try {
        const existingProfileRaw = localStorage.getItem("fitsphere_profile_data");
        if (existingProfileRaw) {
          const existingProfile = JSON.parse(existingProfileRaw) as { age?: number };
          existingAge = existingProfile.age;
        }
      } catch {
        existingAge = undefined;
      }
      localStorage.setItem(
        "fitsphere_profile_data",
        JSON.stringify({
          heightCm: payload.heightCm,
          weightKg: payload.weightKg,
          age: existingAge,
        }),
      );
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const bmi = heightCm && weightKg
    ? (Number(weightKg) / Math.pow(Number(heightCm) / 100, 2)).toFixed(1)
    : null;

  const left = LEFT_CONTENT[step];
  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/60 transition";
  const labelCls = "block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider";

  const chipBtn = (selected: boolean) =>
    `rounded-xl border px-3 py-3 text-sm font-semibold transition-all text-left ${
      selected
        ? "border-orange-500 bg-orange-500/15 text-orange-400"
        : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:bg-white/8"
    }`;

  return (
    <main className="min-h-screen flex">

      {/*  Left Panel  */}
      <div className="relative hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col justify-between overflow-hidden">
        <Image
          src="/images/hero-fallback-5.jpg"
          alt="Athlete"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

        <div className="relative z-10 p-8">
          <Logo size={38} />
        </div>

        <div className="relative z-10 p-10 pb-14">
          <span className="inline-flex items-center rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-widest text-orange-400 mb-6">
            {left.tag}
          </span>
          <h2 className="text-5xl xl:text-6xl font-black text-white leading-tight mb-4">
            {left.heading}
          </h2>
          <p className="text-white/65 text-sm leading-relaxed max-w-xs mb-10">
            {left.sub}
          </p>

          {/* Step indicators */}
          <div className="flex items-center gap-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 ${i <= step ? "opacity-100" : "opacity-30"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                    i < step ? "bg-orange-500 border-orange-500 text-white"
                    : i === step ? "bg-transparent border-orange-500 text-orange-400"
                    : "bg-transparent border-white/30 text-white/40"
                  }`}>
                    {i < step ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (i + 1)}
                  </div>
                  <span className="text-xs text-white/70">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-px transition-all ${i < step ? "bg-orange-500" : "bg-white/20"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*  Right Panel  */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#0a0c12] px-6 py-10 lg:px-12 xl:px-16 overflow-y-auto">

        <div className="lg:hidden mb-8 self-start">
          <Logo size={36} />
        </div>

        <div className="w-full max-w-md">
          {/* Greeting */}
          <div className="mb-6">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-1">
              Welcome, {displayName}
            </p>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
              {step === 0 && "Your Body Stats"}
              {step === 1 && "Set Your Goals"}
              {step === 2 && "Training Preferences"}
            </h1>
            <p className="text-zinc-400 text-sm mt-1.5">
              {step === 0 && "We use this to calculate your BMI and training intensity."}
              {step === 1 && "Pick everything that applies - you can edit this anytime in your profile."}
              {step === 2 && "How often and how long do you want to train?"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-7">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-orange-500" : "bg-white/10"}`} />
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-5">

            {/*  Step 0: Body Stats  */}
            {step === 0 && (
              <>
                {(needsUsername || needsEmail) && (
                  <div className="space-y-4">
                    {needsUsername && (
                      <div>
                        <label className={labelCls}>Username</label>
                        <input
                          type="text"
                          placeholder="e.g. amit_singh"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                          className={inputCls}
                        />
                      </div>
                    )}
                    {needsEmail && (
                      <div>
                        <label className={labelCls}>Email</label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Height</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 175"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value.replace(/[^0-9.]/g, ""))}
                        className={inputCls}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">cm</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Weight</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 75"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value.replace(/[^0-9.]/g, ""))}
                        className={inputCls}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">kg</span>
                    </div>
                  </div>
                </div>

                {bmi && (
                  <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-zinc-300">Your BMI</span>
                    <span className="text-orange-400 font-black text-lg">{bmi}</span>
                  </div>
                )}
              </>
            )}

            {/*  Step 1: Goals (multi-select)  */}
            {step === 1 && (
              <>
                <div>
                  <label className={labelCls}>
                    Fitness Goals{" "}
                    <span className="normal-case text-zinc-500 font-normal tracking-normal">(select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {FITNESS_GOALS.map((value) => (
                      <button key={value} type="button" onClick={() => toggleGoal(value)} className={chipBtn(fitnessGoals.includes(value))}>
                        {value}
                        {fitnessGoals.includes(value) && (
                          <span className="ml-auto float-right text-orange-400 text-xs">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {fitnessGoals.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Selected: <span className="text-orange-400 font-medium">{fitnessGoals.join(", ")}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Experience Level</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <button key={level} type="button" onClick={() => setExperienceLevel(level)}
                        className={chipBtn(experienceLevel === level)}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Preferred Categories{" "}
                    <span className="normal-case text-zinc-500 font-normal tracking-normal">(select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {CATEGORIES.map((value) => (
                      <button key={value} type="button" onClick={() => toggleCategory(value)}
                        className={chipBtn(preferredCategories.includes(value))}>
                        {value}
                      </button>
                    ))}
                  </div>
                  {preferredCategories.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Selected: <span className="text-orange-400 font-medium">{preferredCategories.join(", ")}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            {/*  Step 2: Training Style  */}
            {step === 2 && (
              <>
                <div>
                  <label className={labelCls}>Training Days Per Week</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <button key={d} type="button"
                        onClick={() => setTrainingDays(String(d))}
                        className={`flex-1 rounded-xl border py-3 text-sm font-bold transition-all ${
                          trainingDays === String(d)
                            ? "border-orange-500 bg-orange-500/15 text-orange-400"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/25"
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Session Duration</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 60"
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(e.target.value.replace(/\D/g, ""))}
                      className={inputCls}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">min</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5">Enter any value from 10 to 360 minutes.</p>
                </div>

                <div>
                  <label className={labelCls}>Notes <span className="normal-case text-zinc-500 font-normal tracking-normal">(optional)</span></label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Injuries, equipment limits, schedule constraints..."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/60 transition resize-none"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-1">
              {step > 0 && (
                <button type="button" onClick={prevStep}
                  className="flex-1 rounded-xl border border-white/15 bg-transparent py-3.5 text-sm font-bold text-white hover:border-white/30 hover:bg-white/5 transition">
                  Back
                </button>
              )}
              <button type="submit" disabled={loading}
                className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-400 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition disabled:opacity-50">
                {loading ? "Saving..." : step < STEPS.length - 1 ? "Continue" : "Complete Setup"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

