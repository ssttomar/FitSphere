"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

// ── Types ─────────────────────────────────────────────────────────────────────

type PostType = "activity" | "blog" | "pr";

interface PREntry {
  exercise: string;
  value: string;
  unit: string;
}

interface ShareDraft {
  type: PostType;
  title: string;
  content: string;
  tag: string;
  isPR: boolean;
  prs: PREntry[];
  photos: string[]; // data URLs
}

const BLANK_DRAFT: ShareDraft = {
  type: "activity",
  title: "",
  content: "",
  tag: "",
  isPR: false,
  prs: [{ exercise: "", value: "", unit: "kg" }],
  photos: [],
};

const TAG_OPTIONS = [
  "Strength", "Cardio", "Calisthenics", "Running", "Cycling",
  "Yoga", "Mobility", "HIIT", "Swimming", "Nutrition",
];

const PR_UNITS = ["kg", "lbs", "reps", "km", "miles", "min", "sec"];

// ── Share Progress Modal ───────────────────────────────────────────────────────

function ShareProgressModal({ onClose, displayName, profileImage, initials }: {
  onClose: () => void;
  displayName: string;
  profileImage: string | null;
  initials: string;
}) {
  const [draft, setDraft] = useState<ShareDraft>(BLANK_DRAFT);
  const [photoError, setPhotoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const set = <K extends keyof ShareDraft>(k: K, v: ShareDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handlePhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (draft.photos.length + files.length > 6) {
      setPhotoError("Max 6 photos.");
      return;
    }
    setPhotoError("");
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setDraft((d) => ({ ...d, photos: [...d.photos, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (idx: number) =>
    setDraft((d) => ({ ...d, photos: d.photos.filter((_, i) => i !== idx) }));

  const addPRRow = () =>
    setDraft((d) => ({ ...d, prs: [...d.prs, { exercise: "", value: "", unit: "kg" }] }));

  const removePRRow = (idx: number) =>
    setDraft((d) => ({ ...d, prs: d.prs.filter((_, i) => i !== idx) }));

  const updatePR = (idx: number, field: keyof PREntry, val: string) =>
    setDraft((d) => ({
      ...d,
      prs: d.prs.map((pr, i) => (i === idx ? { ...pr, [field]: val } : pr)),
    }));

  const canSubmit = draft.title.trim() && draft.content.trim();

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    const post = {
      id: String(Date.now()),
      author: displayName,
      initials,
      profileImage: profileImage || null,
      time: "Just now",
      type: draft.type === "pr" ? "activity" : draft.type,
      title: draft.title.trim(),
      content: draft.content.trim(),
      tag: draft.tag || undefined,
      badge: draft.isPR || draft.type === "pr" ? "PR" : undefined,
      likes: 0,
      comments: 0,
      liked: false,
      photos: draft.photos,
      prs: (draft.isPR || draft.type === "pr")
        ? draft.prs.filter((p) => p.exercise.trim() && p.value.trim())
        : [],
    };

    // Persist post to localStorage so profile Activities tab can read it
    try {
      const stored = JSON.parse(localStorage.getItem("fitsphere_posts") || "[]");
      stored.unshift({ ...post, createdAt: Date.now() });
      localStorage.setItem("fitsphere_posts", JSON.stringify(stored.slice(0, 200)));
    } catch { /* ignore storage errors */ }

    window.dispatchEvent(new CustomEvent("fitsphere:post-shared", { detail: post }));
    onClose();
  };

  const typeOptions: { value: PostType; label: string }[] = [
    { value: "activity", label: "Activity" },
    { value: "blog", label: "Blog" },
    { value: "pr", label: "PR" },
  ];

  const isPRMode = draft.isPR || draft.type === "pr";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1117] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)] flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#0f1117] px-5 py-4">
          <div className="flex items-center gap-3">
            {profileImage ? (
              <img src={profileImage} alt={initials} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-black text-white">
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white">{displayName}</p>
              <p className="text-[11px] text-zinc-500">Share your progress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/8 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 px-5 py-5">

          {/* Post type tabs */}
          <div className="flex gap-2">
            {typeOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => set("type", value)}
                className={`flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
                  draft.type === value
                    ? value === "pr"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                    : "bg-white/5 text-zinc-500 border border-white/8 hover:text-zinc-300"
                }`}
              >
                {value === "pr" ? "🏆 PR" : label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={
                draft.type === "pr"
                  ? "PR title, e.g. New Deadlift Max"
                  : draft.type === "blog"
                  ? "Blog title..."
                  : "Activity title..."
              }
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500/40 transition-colors"
            />
          </div>

          {/* Thoughts */}
          <div>
            <textarea
              value={draft.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder={
                draft.type === "pr"
                  ? "What felt different this time? How long did it take?"
                  : draft.type === "blog"
                  ? "Share your training insight, story, or lesson..."
                  : "What did you train? How did it feel?"
              }
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500/40 transition-colors"
            />
          </div>

          {/* PR records section */}
          {draft.type !== "pr" && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
              <div
                onClick={() => set("isPR", !draft.isPR)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  draft.isPR ? "bg-amber-500" : "bg-white/15"
                }`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  draft.isPR ? "translate-x-4" : "translate-x-0.5"
                }`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Mark as Personal Record</p>
                <p className="text-xs text-zinc-500">Add your PR stats — they&apos;ll get a trophy badge</p>
              </div>
            </label>
          )}

          {isPRMode && (
            <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-amber-400">Personal Records</p>
              {draft.prs.map((pr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={pr.exercise}
                    onChange={(e) => updatePR(idx, "exercise", e.target.value)}
                    placeholder="Exercise (e.g. Squat)"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500/40"
                  />
                  <input
                    value={pr.value}
                    onChange={(e) => updatePR(idx, "value", e.target.value)}
                    placeholder="Value"
                    className="w-20 shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber-500/40"
                  />
                  <select
                    value={pr.unit}
                    onChange={(e) => updatePR(idx, "unit", e.target.value)}
                    className="w-16 shrink-0 rounded-lg border border-white/10 bg-[#0f1117] px-2 py-2 text-sm text-white outline-none focus:border-amber-500/40"
                  >
                    {PR_UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                  {draft.prs.length > 1 && (
                    <button
                      onClick={() => removePRRow(idx)}
                      className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {draft.prs.length < 5 && (
                <button
                  onClick={addPRRow}
                  className="mt-1 text-xs font-semibold text-amber-400/70 hover:text-amber-400 transition-colors"
                >
                  + Add another record
                </button>
              )}
            </div>
          )}

          {/* Tag */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category</p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => set("tag", draft.tag === t ? "" : t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    draft.tag === t
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                      : "bg-white/5 text-zinc-500 border border-white/8 hover:text-zinc-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Photos <span className="normal-case font-normal text-zinc-600">({draft.photos.length}/6)</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {draft.photos.map((src, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-xl">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {draft.photos.length < 6 && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-white/12 text-zinc-600 hover:border-orange-500/40 hover:text-orange-400 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-[10px] font-semibold">Add photo</span>
                </button>
              )}
            </div>
            {photoError && <p className="mt-1.5 text-xs text-red-400">{photoError}</p>}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotos}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-white/8 bg-[#0f1117] px-5 py-4">
          <p className="text-xs text-zinc-600">
            {draft.type === "pr" || draft.isPR ? "🏆 Posting as a Personal Record" : `Posting as ${draft.type}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${
                canSubmit && !submitting
                  ? "bg-orange-500 text-white hover:bg-orange-400"
                  : "bg-white/8 text-zinc-600 cursor-not-allowed"
              }`}
            >
              {submitting ? "Posting..." : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("Athlete");
  const [initials, setInitials] = useState("A");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const syncFromStorage = () => {
    const name = localStorage.getItem("fitsphere_display_name") || "Athlete";
    const img = localStorage.getItem("fitsphere_profile_image");
    setDisplayName(name);
    setInitials(name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2));
    setProfileImage(img || null);
  };

  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const name = detail.displayName || "Athlete";
      setDisplayName(name);
      setInitials(name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
      setProfileImage(detail.profileImage || null);
    };

    const t = window.setTimeout(syncFromStorage, 0);
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("fitsphere:profile-updated", handleProfileUpdated);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("fitsphere:profile-updated", handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push("/auth?mode=login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Feed" },
    { href: "/dashboard/training", label: "Training" },
    { href: "/dashboard/goals", label: "Goals" },
    { href: "/dashboard/search", label: "Search" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0c12]">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0c12]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          {/* Logo */}
          <Logo size={32} href="/dashboard" />

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1 ml-2">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "text-white bg-white/8"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Share Progress — ghost button */}
          <button
            onClick={() => setShareOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-white/18 bg-transparent px-4 py-2 text-sm font-bold text-zinc-300 hover:border-white/35 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Share Progress
          </button>

          {/* AI Coach CTA */}
          <Link
            href="/dashboard/ai-coach"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              pathname === "/dashboard/ai-coach"
                ? "bg-orange-500 text-white"
                : "bg-orange-500/15 text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-500/30"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.182.088M14.25 3.104c.251.023.501.05.75.082M19.5 14.5l-4.091-4.091" />
            </svg>
            AI Coach
          </Link>

          {/* Notifications */}
          <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors"
            >
              {profileImage ? (
                <img src={profileImage} alt={initials} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-xs font-black">
                  {initials}
                </div>
              )}
              <span className="hidden md:block text-sm text-white font-medium max-w-[100px] truncate">{displayName}</span>
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#12141c] shadow-2xl overflow-hidden z-50">
                <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  My Profile
                </Link>
                <button
                  onClick={() => { setDropdownOpen(false); setShareOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                  Share Progress
                </button>
                <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Settings
                </Link>
                <div className="border-t border-white/8 mx-2" />
                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {children}

      {/* Share Progress Modal */}
      {shareOpen && (
        <ShareProgressModal
          onClose={() => setShareOpen(false)}
          displayName={displayName}
          profileImage={profileImage}
          initials={initials}
        />
      )}
    </div>
  );
}
