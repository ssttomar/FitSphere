"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { addNotification } from "@/lib/notifications";

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeUsername(value?: string | null) {
  return (value || "").trim().replace(/^@/, "").toLowerCase();
}

function compactSearchKey(value?: string | null) {
  return normalizeUsername(value).replace(/[\s._-]+/g, "");
}

function matchesQuery(user: UserResult, q: string) {
  const compactQ = compactSearchKey(q);
  const compactUser = compactSearchKey(user.username);
  const compactName = compactSearchKey(user.displayName);
  return (
    user.displayName.toLowerCase().includes(q) ||
    (user.username || "").toLowerCase().includes(q) ||
    (user.preferredCategory || "").toLowerCase().includes(q) ||
    (!!compactQ && (compactUser.includes(compactQ) || compactName.includes(compactQ)))
  );
}

function includeSelfIfMatching(list: UserResult[], q: string, self: UserResult | null): UserResult[] {
  if (!self || !matchesQuery(self, q)) return list;

  const exists = list.some((u) => u.id === self.id || (!!u.username && !!self.username && u.username === self.username));
  return exists ? list : [self, ...list];
}

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

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [followState, setFollowState] = useState<FollowState>({});
  const [selfUser, setSelfUser] = useState<UserResult | null>(null);
  const [followError, setFollowError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<UserResult[]>(DEMO_USERS.slice(0, 4));
  const inputRef = useRef<HTMLInputElement>(null);

  const updateFollowState = (updater: (prev: FollowState) => FollowState) => {
    setFollowState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("fitsphere_follow_state", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    // Load follow state from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("fitsphere_follow_state") || "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFollowState(stored);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // Load real suggested users from backend
    const token = localStorage.getItem("fitsphere_token");
    if (!token) return;
    fetch(`${API_BASE_URL}/api/users/suggested`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setSuggested(data as UserResult[]);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    // Seed self user from local cache for immediate matching.
    const id = localStorage.getItem("fitsphere_user_id") || "";
    const displayName = localStorage.getItem("fitsphere_display_name") || "";
    const username = (localStorage.getItem("fitsphere_username") || "").trim().replace(/^@/, "").toLowerCase();
    const profileImageDataUrl = localStorage.getItem("fitsphere_profile_image") || null;

    if (id && displayName) {
      const timerId = window.setTimeout(() => {
        setSelfUser({
          id,
          displayName,
          username,
          profileImageDataUrl,
        });
      }, 0);
      return () => window.clearTimeout(timerId);
    }
  }, []);

  useEffect(() => {
    // Best-effort sync: if backend profile misses username but local cache has it,
    // attempt to save it so global search can find this user.
    const token = localStorage.getItem("fitsphere_token");
    const cachedUsername = (localStorage.getItem("fitsphere_username") || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (!me) return;
        const meData = me as {
          userId?: string;
          displayName?: string;
          username?: string;
          profileImageDataUrl?: string | null;
          age?: number;
        };
        const meId = (typeof meData.userId === "string" && meData.userId) || localStorage.getItem("fitsphere_user_id") || "";
        const meDisplayName = (typeof meData.displayName === "string" && meData.displayName) || localStorage.getItem("fitsphere_display_name") || "";
        const apiUsername = (typeof meData.username === "string" ? meData.username : "").trim().replace(/^@/, "").toLowerCase();
        const mergedUsername = apiUsername || cachedUsername;
        const meProfileImage = meData.profileImageDataUrl || localStorage.getItem("fitsphere_profile_image") || null;

        if (meId && meDisplayName) {
          setSelfUser({
            id: meId,
            displayName: meDisplayName,
            username: mergedUsername,
            profileImageDataUrl: meProfileImage,
          });
        }

        if (apiUsername) {
          localStorage.setItem("fitsphere_username", apiUsername);
          return;
        }
        if (!cachedUsername) return;

        fetch(`${API_BASE_URL}/api/auth/complete-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ username: cachedUsername }),
        })
          .then(async (res) => {
            if (res.ok) return;

            // Phone-only accounts can fail /complete-account due to missing email.
            // Fallback to setup-username when age is available locally.
            let age: number | null = typeof meData.age === "number" && Number.isFinite(meData.age)
              ? meData.age
              : null;
            try {
              if (age === null) {
                const profileRaw = localStorage.getItem("fitsphere_profile_data");
                if (profileRaw) {
                  const parsed = JSON.parse(profileRaw) as { age?: number };
                  if (typeof parsed.age === "number" && Number.isFinite(parsed.age)) age = parsed.age;
                }
              }
            } catch {
              // keep current age value
            }

            if (age && age >= 10 && age <= 100) {
              await fetch(`${API_BASE_URL}/api/auth/setup-username`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ username: cachedUsername, age }),
              }).catch(() => null);
            }
          })
          .catch(() => null);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    const initialQ = (searchParams.get("q") || "").trim();
    const id = window.setTimeout(() => setQuery(initialQ), 0);
    return () => window.clearTimeout(id);
  }, [searchParams]);

  useEffect(() => {
    const qRaw = query.toLowerCase().trim();
    const q = qRaw.replace(/^@/, "");
    const timeoutId = window.setTimeout(() => {
      if (!q) {
        setResults([]);
        setSearchError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setSearchError(null);

      // Try backend search first, fall back to demo users
      const token = localStorage.getItem("fitsphere_token");
      if (token) {
        fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(async (res) => {
            if (res.ok) return res.json();
            const text = (await res.text()).trim();
            throw new Error(text || `Search failed (${res.status})`);
          })
          .then((data) => {
            const backendList = data && Array.isArray(data) ? (data as UserResult[]) : [];
            setResults(includeSelfIfMatching(backendList, q, selfUser));
            setLoading(false);
          })
          .catch((err) => {
            setResults(includeSelfIfMatching([], q, selfUser));
            setSearchError(err instanceof Error ? err.message : "Search failed. Try again.");
            setLoading(false);
          });
      } else {
        setResults(
          includeSelfIfMatching(
            DEMO_USERS.filter(
              (u) => u.displayName.toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q),
            ),
            q,
            selfUser,
          ),
        );
        setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [query, selfUser]);

  const handleFollow = async (userId: string) => {
    setFollowError(null);
    const selfId = selfUser?.id || null;
    const user = [...results, ...suggested].find((u) => u.id === userId);
    const sameUserById = !!selfId && userId === selfId;
    const sameUserByUsername =
      !!user &&
      normalizeUsername(user.username) !== "" &&
      normalizeUsername(user.username) === normalizeUsername(selfUser?.username);
    if (sameUserById || sameUserByUsername) return;

    const current = followState[userId] || "none";
    const token = localStorage.getItem("fitsphere_token");
    const isDemoId = !isUuid(userId);

    // Determine next state and HTTP method
    const isActive = current === "following" || current === "requested";
    const next: "none" | "requested" | "following" = isActive ? "none" : "requested";
    const method = isActive ? "DELETE" : "POST";

    // Optimistic update
    updateFollowState((prev) => ({ ...prev, [userId]: next }));

    // Demo/local mode for non-backend IDs.
    if (!token || isDemoId) {
      if (!isActive && user) {
        window.setTimeout(() => {
          addNotification({ type: "follow", message: `Follow request sent to ${user.displayName}` });
        }, 500);
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        updateFollowState((prev) => ({ ...prev, [userId]: current }));
        const serverText = (await res.text()).trim();
        if (res.status === 401 || res.status === 403) {
          setFollowError("Session expired. Please sign in again.");
        } else if (res.status === 400) {
          setFollowError(serverText || "Cannot follow this user.");
        } else {
          setFollowError(serverText || `Follow request failed (${res.status}).`);
        }
      } else if (!isActive && user) {
        const data = await res.json() as { followState?: string };
        const serverState = (data.followState || "requested") as "none" | "requested" | "following";
        updateFollowState((prev) => ({ ...prev, [userId]: serverState }));
        addNotification({ type: "follow", message: `Follow request sent to ${user.displayName}` });
      }
    } catch {
      updateFollowState((prev) => ({ ...prev, [userId]: current }));
      setFollowError("Network error while following user.");
    }
  };

  const selfId = selfUser?.id || null;
  const suggestedFiltered = suggested.filter((u) => u.id !== selfId && (!followState[u.id] || followState[u.id] === "none")).slice(0, 6);

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
            onClick={() => {
              setQuery("");
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results */}
      {query.trim() ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            {loading ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""}`}
          </p>
          {results.length === 0 && !loading && (
            <div className="rounded-2xl border border-white/8 bg-[#0f1117] p-8 text-center">
              <p className="text-zinc-400">No athletes found for &quot;{query.trim()}&quot;</p>
            </div>
          )}
          {searchError && (
            <p className="mt-3 text-sm text-red-400">{searchError}</p>
          )}
          <div className="space-y-3">
            {results.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isSelf={
                  (!!selfId && user.id === selfId) ||
                  (normalizeUsername(user.username) !== "" &&
                    normalizeUsername(user.username) === normalizeUsername(selfUser?.username))
                }
                followState={followState[user.id] || "none"}
                onFollow={() => handleFollow(user.id)}
              />
            ))}
          </div>
          {followError && <p className="mt-3 text-sm text-red-400">{followError}</p>}
        </div>
      ) : (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Suggested Athletes</p>
          <div className="space-y-3">
            {suggestedFiltered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isSelf={
                  (!!selfId && user.id === selfId) ||
                  (normalizeUsername(user.username) !== "" &&
                    normalizeUsername(user.username) === normalizeUsername(selfUser?.username))
                }
                followState={followState[user.id] || "none"}
                onFollow={() => handleFollow(user.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-400">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function UserCard({
  user,
  isSelf,
  followState,
  onFollow,
}: {
  user: UserResult;
  isSelf: boolean;
  followState: "none" | "requested" | "following";
  onFollow: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#0f1117] p-4 hover:border-white/15 transition-colors">
      <Link href={`/dashboard/users/${user.id}`} className="shrink-0">
        <Avatar name={user.displayName} src={user.profileImageDataUrl} size={48} />
      </Link>
      <Link href={`/dashboard/users/${user.id}`} className="min-w-0 flex-1 hover:opacity-80 transition-opacity">
        <p className="font-bold text-white truncate">{user.displayName}</p>
        <p className="text-xs text-zinc-500 truncate">
          {user.username ? `@${user.username}` : ""}
          {user.username && user.preferredCategory ? " - " : ""}
          {user.preferredCategory || ""}
          {(user.username || user.preferredCategory) && user.experienceLevel ? " - " : ""}
          {user.experienceLevel || ""}
        </p>
      </Link>
      <button
        onClick={onFollow}
        disabled={isSelf}
        className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
          isSelf
            ? "border border-white/10 bg-white/5 text-zinc-500 cursor-not-allowed"
            : followState === "following"
            ? "border border-white/15 bg-white/5 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            : followState === "requested"
            ? "border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            : "bg-orange-500 text-white hover:bg-orange-400"
        }`}
      >
        {isSelf ? "You" : followState === "following" ? "Following" : followState === "requested" ? "Requested" : "Follow"}
      </button>
    </div>
  );
}

