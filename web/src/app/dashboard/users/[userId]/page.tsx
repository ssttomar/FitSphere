"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { addNotification } from "@/lib/notifications";

type PublicProfile = {
  id: string;
  username: string;
  displayName: string;
  profileImageDataUrl: string;
  coverImageDataUrl: string;
  experienceLevel: string;
  preferredCategory: string;
  fitnessGoal: string;
  notes: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  followState?: "none" | "requested" | "following";
  isSelf: boolean;
};

type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  profileImageDataUrl: string;
  experienceLevel: string;
  preferredCategory: string;
};

function Avatar({ name, src, size = 80 }: { name: string; src?: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  if (src) {
    return <img src={src} alt={initials} className="rounded-full object-cover ring-4 ring-[#0a0b0f]" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center font-black text-white ring-4 ring-[#0a0b0f]"
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {initials}
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [listOpen, setListOpen] = useState<"followers" | "following" | null>(null);
  const [list, setList] = useState<UserSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("fitsphere_token") : null;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => { setProfile(data); setLoading(false); })
      .catch(() => { setError("Could not load profile."); setLoading(false); });
  }, [userId, token]);

  const openList = (type: "followers" | "following") => {
    setListOpen(type);
    setListLoading(true);
    fetch(`${API_BASE_URL}/api/users/${userId}/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setList(data); setListLoading(false); })
      .catch(() => { setList([]); setListLoading(false); });
  };

  const toggleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    const currentState = profile.followState || (profile.isFollowing ? "following" : "none");
    const isActive = currentState === "following" || currentState === "requested";
    const method = isActive ? "DELETE" : "POST";
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as {
          isFollowing?: boolean;
          followState?: "none" | "requested" | "following";
          followerCount?: number;
        };
        const nextFollowState = data.followState || "none";
        const nextIsFollowing = typeof data.isFollowing === "boolean"
          ? data.isFollowing
          : nextFollowState === "following";

        setProfile((p) => p
          ? {
              ...p,
              isFollowing: nextIsFollowing,
              followState: nextFollowState,
              followerCount: typeof data.followerCount === "number" ? data.followerCount : p.followerCount,
            }
          : p);

        if (!isActive) {
          if (nextFollowState === "requested") {
            addNotification({ type: "follow", message: `Follow request sent to ${profile.displayName}` });
          } else if (nextFollowState === "following") {
            addNotification({ type: "follow", message: `You are now following ${profile.displayName}` });
          }
        }
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">{error || "User not found."}</p>
        <button onClick={() => router.back()} className="text-sm text-orange-400 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Back */}
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Cover */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="h-40 w-full bg-gradient-to-br from-orange-900/40 to-zinc-900"
          style={profile.coverImageDataUrl ? { backgroundImage: `url(${profile.coverImageDataUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
        />
        <div className="absolute -bottom-10 left-6">
          <Avatar name={profile.displayName} src={profile.profileImageDataUrl || undefined} size={80} />
        </div>
      </div>

      {/* Profile info */}
      <div className="mt-12 px-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white">{profile.displayName}</h1>
            {profile.username && <p className="text-sm text-zinc-500">@{profile.username}</p>}
          </div>
          {!profile.isSelf && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`shrink-0 rounded-xl px-5 py-2 text-sm font-bold transition-all disabled:opacity-60 ${
                (profile.followState === "following" || profile.isFollowing)
                  ? "border border-white/15 bg-white/5 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                  : profile.followState === "requested"
                  ? "border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                  : "bg-orange-500 text-white hover:bg-orange-400"
              }`}
            >
              {followLoading ? "..." : profile.followState === "requested" ? "Requested" : profile.isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[profile.fitnessGoal, profile.preferredCategory, profile.experienceLevel].filter(Boolean).map((tag) => (
            <span key={tag} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
              {tag}
            </span>
          ))}
        </div>

        {profile.notes && <p className="mt-3 text-sm leading-relaxed text-zinc-300">{profile.notes}</p>}

        {/* Stats */}
        <div className="mt-5 flex gap-6 border-t border-white/8 pt-5">
          <button onClick={() => openList("followers")} className="text-center hover:opacity-75 transition-opacity">
            <p className="text-xl font-black text-white">{profile.followerCount}</p>
            <p className="text-xs text-zinc-500">Followers</p>
          </button>
          <button onClick={() => openList("following")} className="text-center hover:opacity-75 transition-opacity">
            <p className="text-xl font-black text-white">{profile.followingCount}</p>
            <p className="text-xs text-zinc-500">Following</p>
          </button>
        </div>
      </div>

      {/* Followers / Following modal */}
      {listOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setListOpen(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1117] pb-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="font-bold text-white capitalize">{listOpen}</h2>
              <button onClick={() => setListOpen(null)} className="text-zinc-500 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {listLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                </div>
              ) : list.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-10">No {listOpen} yet.</p>
              ) : (
                list.map((u) => (
                  <UserRow key={u.id} user={u} onClose={() => setListOpen(null)} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({ user, onClose }: { user: UserSummary; onClose: () => void }) {
  const router = useRouter();
  const go = () => { onClose(); router.push(`/dashboard/users/${user.id}`); };
  return (
    <button onClick={go} className="flex w-full items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left">
      <Avatar name={user.displayName} src={user.profileImageDataUrl || undefined} size={40} />
      <div className="min-w-0">
        <p className="font-semibold text-white truncate">{user.displayName}</p>
        {user.username && <p className="text-xs text-zinc-500 truncate">@{user.username}</p>}
      </div>
      {user.preferredCategory && (
        <span className="ml-auto shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-400">{user.preferredCategory}</span>
      )}
    </button>
  );
}
