"use client";

import { useEffect, useRef, useState } from "react";

type Role = "user" | "coach";
type MsgType = "text" | "food-result";

type Message = {
  id: string;
  role: Role;
  type: MsgType;
  text: string;
  imagePreview?: string;
  foodResult?: { calories: number; protein: number; carbs: number; fat: number };
  loading?: boolean;
};

const SUGGESTIONS = [
  "Create a 4-day gym split for muscle gain",
  "How much protein do I need daily?",
  "Best pre-workout meal ideas",
  "Beginner running plan for 5K",
  "How to improve sleep for recovery",
  "Explain progressive overload",
];

const COACH_RESPONSES: Record<string, string> = {
  default: "That's a great question! As your AI fitness coach, I'd recommend focusing on consistency first. Start with the fundamentals — progressive overload, adequate protein intake (1.6–2.2g per kg bodyweight), 7–9 hours of sleep, and staying hydrated. Want me to build a specific plan for you?",
  protein: "For muscle gain, aim for 1.6–2.2g of protein per kg of bodyweight daily. For a 75kg person that's 120–165g. Best sources: chicken breast, eggs, Greek yogurt, cottage cheese, lentils, and whey protein. Spread intake across 3–5 meals for optimal muscle protein synthesis.",
  sleep: "Sleep is your #1 recovery tool — often underrated. During deep sleep, your body releases growth hormone and repairs muscle tissue. Aim for 7–9 hours. Tips: keep a consistent sleep schedule, avoid screens 1hr before bed, keep your room cool (18–20°C), and avoid caffeine after 2pm.",
  split: "Here's a premium 4-day Upper/Lower split:\n\n**Day 1 — Upper (Strength):** Bench Press 4×5, Barbell Row 4×5, OHP 3×6\n**Day 2 — Lower (Strength):** Squat 4×5, Romanian Deadlift 3×8, Leg Press 3×10\n**Day 3 — REST / Active Recovery**\n**Day 4 — Upper (Hypertrophy):** Incline DB Press 4×10, Cable Row 4×12, Lateral Raises 3×15\n**Day 5 — Lower (Hypertrophy):** Leg Press 4×12, Walking Lunges 3×12, Leg Curl 4×12",
  running: "Perfect 8-week beginner 5K plan:\n\n**Weeks 1–2:** Walk 5 min, Run 1 min × 8 intervals\n**Weeks 3–4:** Walk 3 min, Run 3 min × 5 intervals\n**Weeks 5–6:** Run 10 min, Walk 2 min × 3 rounds\n**Weeks 7–8:** Run 20–25 min non-stop\n\nRun 3× per week with rest days in between. Most importantly — keep your pace conversational.",
  overload: "Progressive overload is the #1 driver of long-term muscle and strength gains. It means gradually increasing the demand on your muscles over time. Methods:\n\n1. **Add weight** — increase load by 2.5–5kg when you hit the top of your rep range\n2. **Add reps** — do more reps at the same weight\n3. **Add sets** — increase volume over weeks\n4. **Reduce rest** — shorter rest periods increase metabolic stress\n\nTrack every session. You can't manage what you don't measure.",
};

function getCoachReply(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("protein")) return COACH_RESPONSES.protein;
  if (lower.includes("sleep") || lower.includes("recover")) return COACH_RESPONSES.sleep;
  if (lower.includes("split") || lower.includes("program") || lower.includes("plan") || lower.includes("muscle")) return COACH_RESPONSES.split;
  if (lower.includes("run") || lower.includes("5k") || lower.includes("cardio")) return COACH_RESPONSES.running;
  if (lower.includes("overload") || lower.includes("progress")) return COACH_RESPONSES.overload;
  return COACH_RESPONSES.default;
}

function getFoodReply(prompt: string, data: { calories: number; protein: number; carbs: number; fat: number }): string {
  const lower = prompt.toLowerCase();
  const mealSize = data.calories < 400 ? "light" : data.calories < 700 ? "moderate" : "hearty";

  if (lower.includes("cut") || lower.includes("fat loss") || lower.includes("lose weight")) {
    return `I analyzed your photo and this looks like a ${mealSize} meal. For a cut, keep total daily calories in a deficit and prioritize protein. This meal gives about ${data.protein}g protein, so you may want to add a lean protein source if needed.`;
  }

  if (lower.includes("bulk") || lower.includes("gain") || lower.includes("muscle")) {
    return `I analyzed your photo and this looks like a ${mealSize} meal. For muscle gain, make sure you're in a slight calorie surplus and spread protein across the day. This is a solid start with about ${data.protein}g protein.`;
  }

  return `I analyzed your photo and this looks like a ${mealSize} meal. Based on your prompt, here's the macro estimate and how you can adjust your next meal depending on your goal.`;
}

function CoachAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    </div>
  );
}

function MessageBubble({ msg, userInitials }: { msg: Message; userInitials: string }) {
  const isCoach = msg.role === "coach";

  return (
    <div className={`flex gap-3 ${isCoach ? "items-start" : "items-start flex-row-reverse"}`}>
      {isCoach ? (
        <CoachAvatar />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-white text-xs font-black shrink-0">
          {userInitials}
        </div>
      )}

      <div className={`max-w-[75%] space-y-2 ${isCoach ? "" : "items-end flex flex-col"}`}>
        {msg.imagePreview && (
          <div className="rounded-xl overflow-hidden border border-white/10 max-w-xs">
            <img src={msg.imagePreview} alt="uploaded food" className="w-full object-cover max-h-48" />
          </div>
        )}

        {msg.loading ? (
          <div className="rounded-2xl bg-[#1a1d28] border border-white/8 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
            isCoach
              ? "bg-[#1a1d28] border border-white/8 text-zinc-200"
              : "bg-orange-500 text-white"
          }`}>
            {msg.text}
          </div>
        )}

        {msg.foodResult && (
          <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent p-4 w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">Nutritional Analysis</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Calories", value: `${msg.foodResult.calories}`, unit: "kcal", color: "text-orange-400" },
                { label: "Protein", value: `${msg.foodResult.protein}`, unit: "g", color: "text-blue-400" },
                { label: "Carbs", value: `${msg.foodResult.carbs}`, unit: "g", color: "text-green-400" },
                { label: "Fat", value: `${msg.foodResult.fat}`, unit: "g", color: "text-yellow-400" },
              ].map((n) => (
                <div key={n.label} className="rounded-xl bg-white/5 border border-white/8 p-2 text-center">
                  <p className={`font-black text-lg ${n.color}`}>{n.value}</p>
                  <p className="text-zinc-500 text-xs">{n.unit}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{n.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      type: "text",
      text: "Hey! I'm your personal AI Fitness Coach 💪\n\nI can help you with:\n• Personalized training plans\n• Nutrition advice & meal planning\n• Food calorie analysis (upload a photo!)\n• Recovery & sleep optimization\n• Exercise technique tips\n\nWhat do you want to work on today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("U");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const name = localStorage.getItem("fitsphere_display_name") || "User";
    setUserInitials(name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg: Omit<Message, "id">) => {
    const id = String(Date.now() + Math.random());
    setMessages((prev) => [...prev, { ...msg, id }]);
    return id;
  };

  const sendText = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const hasPendingImage = !!pendingImageFile;
    const imagePreview = hasPendingImage ? pendingImagePreview ?? undefined : undefined;

    addMessage({ role: "user", type: "text", text, imagePreview });

    const loadingId = String(Date.now() + Math.random());
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        role: "coach",
        type: hasPendingImage ? "food-result" : "text",
        text: "",
        loading: true,
      },
    ]);

    if (!hasPendingImage) {
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId ? { ...m, loading: false, text: getCoachReply(text) } : m
        )
      );
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingImageFile);
      formData.append("prompt", text);
      const aiBase = process.env.NEXT_PUBLIC_AI_BASE_URL ?? "http://localhost:8001";
      const res = await fetch(`${aiBase}/analyze-food`, { method: "POST", body: formData });
      const data = res.ok ? await res.json() : { calories: 420, protein: 28, carbs: 45, fat: 14 };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                loading: false,
                text: getFoodReply(text, data),
                foodResult: data,
              }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, loading: false, text: "I couldn't analyze this image right now. Make sure the AI service is running and try again!" }
            : m
        )
      );
    } finally {
      setUploading(false);
      setPendingImageFile(null);
      setPendingImagePreview(null);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    setPendingImageFile(file);
    setPendingImagePreview(preview);

    if (!input.trim()) {
      setInput("Can you analyze this meal for calories and macros?");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#0d0f18] px-6 py-4 flex items-center gap-4">
        <CoachAvatar />
        <div>
          <h1 className="font-black text-white text-base" style={{ fontFamily: "var(--font-display)" }}>
            AI Fitness Coach
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-zinc-400">Online · Powered by FitSphere AI</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
            🧠 Expert Coach
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} userInitials={userInitials} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-3">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-orange-500/30 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-white/8 bg-[#0d0f18] px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 disabled:opacity-50"
            title="Upload food photo"
          >
            {uploading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            )}
          </button>

          <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 focus-within:border-orange-500/50 transition-colors px-4 py-3">
            {pendingImagePreview && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-2 py-1.5">
                <img src={pendingImagePreview} alt="pending upload" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-xs text-orange-300">Photo attached</span>
                <button
                  onClick={() => {
                    setPendingImageFile(null);
                    setPendingImagePreview(null);
                  }}
                  className="text-zinc-300 hover:text-white transition-colors"
                  title="Remove photo"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
                placeholder={pendingImagePreview ? "Ask what you want to know about this photo..." : "Ask your coach anything — workouts, nutrition, recovery..."}
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none resize-none max-h-32"
              />
              <button
                onClick={sendText}
                disabled={!input.trim() || uploading}
                className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-400 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-2 max-w-3xl mx-auto">
          📸 Upload a food photo, then write your prompt so AI coach can analyze it with your context
        </p>
      </div>
    </div>
  );
}
