"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, AuthResponse } from "@/lib/api";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const initialMode =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register"
      ? "register"
      : "login";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === "register" ? "Create your FitSphere account" : "Welcome back"), [mode]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const displayName = String(formData.get("displayName") || "").trim();

    try {
      let response: AuthResponse;
      if (mode === "register") {
        response = await apiFetch<AuthResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, displayName }),
        });
      } else {
        response = await apiFetch<AuthResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      }

      localStorage.setItem("fitsphere_token", response.token);
      localStorage.setItem("fitsphere_user_id", response.userId);
      localStorage.setItem("fitsphere_display_name", response.displayName);

      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070d] px-6 py-16">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl">
        <Link href="/" className="text-xs uppercase tracking-[0.2em] text-zinc-400">Back to home</Link>
        <h1 className="mt-4 font-display text-4xl uppercase text-white">{title}</h1>

        <div className="mt-6 grid grid-cols-2 rounded-full border border-white/10 bg-black/25 p-1 text-sm">
          <button
            className={`rounded-full px-4 py-2 ${mode === "login" ? "bg-white text-black" : "text-zinc-300"}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`rounded-full px-4 py-2 ${mode === "register" ? "bg-white text-black" : "text-zinc-300"}`}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <input
              name="displayName"
              placeholder="Display name"
              required
              className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none"
            />
          )}
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none"
          />

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-black disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "register" ? "Register" : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
