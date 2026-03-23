"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

type UserResult = {
  id: string;
  username?: string;
  displayName: string;
  email?: string;
  experienceLevel?: string;
  preferredCategory?: string;
  profileImageDataUrl?: string | null;
};

type FollowState = Record<string, "none" | "requested" | "following">;

function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (src) {
    return <img src={src} alt={initials} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center font-black text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  );
}

const DEMO_USERS: UserResult[] = [
  { id: "u1", username: "alex_lifts", displayName: "Alex Rivera", experienceLevel: "Advanced", preferredCategory: "Strength" },
  { id: "u2", username: "maya_runs", displayName: "Maya Chen", experienceLevel: "Intermediate", preferredCategory: "Running" },
  { id: "u3", username: "priya_n", displayName: "Priya Nair", experienceLevel: "Advanced", preferredCategory: "Running" },
  { id: "u4", username: "jordan_cal", displayName: "Jordan Park", experienceLevel: "Advanced", preferredCategory: "Calisthenics" },
  { id: "u5", username: "sam_t", displayName: "Sam Torres", experienceLevel: "Intermediate", preferredCategory: "Nutrition" },
  { id: "u6", username: "marcus_pw", displayName: "Marcus Webb", experienceLevel: "Advanced", preferredCategory: "Powerlifting" },
  { id: "u7", username: "lily_z", displayName: "Lily Zhang", experienceLevel: "Advanced", preferredCategory: "Running" },
  { id: "u8", username: "diego_m", displayName: "Diego Morales", experienceLevel: "Advanced", preferredCategory: "Calisthenics" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [followState, setFollowState] = useState<FollowState>({});
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Load follow state from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("fitsphere_follow_state") || "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFollowState(stored);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    setLoading(true);
    const q = query.toLowerCase().trim();

    // Try backend search first, fall back to demo users
    const token = localStorage.getItem("fitsphere_token");
    if (token) {
      fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data) && data.length > 0) {
            setResults(data);
          } else {
            // Fall back to demo
            setResults(DEMO_USERS.filter(
              (u) =>
                u.displayName.toLowerCase().includes(q) ||
                (u.username || "").toLowerCase().includes(q) ||
                (u.preferredCategory || "").toLowerCase().includes(q),
            ));
          }
          setLoading(false);
        })
        .catch(() => {
          setResults(DEMO_USERS.filter(
            (u) =>
              u.displayName.toLowerCase().includes(q) ||
              (u.username || "").toLowerCase().includes(q),
          ));
          setLoading(false);
        });
    } else {
      setResults(DEMO_USERS.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          (u.username || "").toLowerCase().includes(q),
      ));
      setLoading(false);
    }
  }, [query]);

  const handleFollow = (userId: string) => {
    setFollowState((prev) => {
      const current = prev[userId] || "none";
      let next: "none" | "requested" | "following";
      if (current === "none") next = "following";
      else if (current === "following") next = "none";
      else next = "none"; // cancel request

      const updated = { ...prev, [userId]: next };
      try {
        localStorage.setItem("fitsphere_follow_state", JSON.stringify(updated));

        // Update social counts
        const social = JSON.parse(localStorage.getItem("fitsphere_social") || "{}");
        const prevFollowing = social.following ?? 0;
        if (next === "following") social.following = prevFollowing + 1;
        else if (current === "following") social.following = Math.max(0, prevFollowing - 1);
        localStorage.setItem("fitsphere_social", JSON.stringify(social));
      } catch { /* ignore */ }
      return updated;
    });
  };

  const suggested = DEMO_USERS.filter((u) => !followState[u.id] || followState[u.id] === "none").slice(0, 4);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Search Athletes</h1>
        <p className="text-sm text-zinc-500">Find and follow other athletes on FitSphere</p>
      </div>

      {/* Search input */}
      <div className="relative mb-8">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username..."
          className="w-full rounded-2xl border border-white/10 bg-[#0f1117] pl-12 pr-4 py-4 text-white placeholder-zinc-500 outline-none focus:border-orange-500/40 text-base"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results */}
      {query ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            {loading ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""}`}
          </p>
          {results.length === 0 && !loading && (
            <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-8 text-center">
              <p className="text-zinc-400">No athletes found for &quot;{query}&quot;</p>
            </div>
          )}
          <div className="space-y-3">
            {results.map((user) => (
              <UserCard key={user.id} user={user} followState={followState[user.id] || "none"} onFollow={() => handleFollow(user.id)} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Suggested Athletes</p>
          <div className="space-y-3">
            {suggested.map((user) => (
              <UserCard key={user.id} user={user} followState={followState[user.id] || "none"} onFollow={() => handleFollow(user.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserCard({
  user,
  followState,
  onFollow,
}: {
  user: UserResult;
  followState: "none" | "requested" | "following";
  onFollow: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#0f1117] p-4 hover:border-white/15 transition-colors">
      <Avatar name={user.displayName} src={user.profileImageDataUrl} size={48} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-white truncate">{user.displayName}</p>
        <p className="text-xs text-zinc-500 truncate">
          {user.username ? `@${user.username}` : ""}
          {user.username && user.preferredCategory ? " · " : ""}
          {user.preferredCategory || ""}
          {(user.username || user.preferredCategory) && user.experienceLevel ? " · " : ""}
          {user.experienceLevel || ""}
        </p>
      </div>
      <button
        onClick={onFollow}
        className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
          followState === "following"
            ? "border border-white/15 bg-white/5 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            : "bg-orange-500 text-white hover:bg-orange-400"
        }`}
      >
        {followState === "following" ? "Following" : "Follow"}
      </button>
    </div>
  );
}
