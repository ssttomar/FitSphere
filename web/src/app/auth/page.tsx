"use client";

import { useState } from "react";
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

  const title = mode === "register" ? "Create your FitSphere account" : "Welcome back";

  const onSubmit = async (event: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
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
            {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Login"}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-5 text-center">
            <p className="text-sm text-zinc-400">New to FitSphere?</p>
            <button
              type="button"
              onClick={() => setMode("register")}
              className="mt-2 w-full rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Create an Account
            </button>
          </div>
        )}

        {mode === "register" && (
          <p className="mt-5 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-white underline underline-offset-2 hover:text-zinc-200"
            >
              Login
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
