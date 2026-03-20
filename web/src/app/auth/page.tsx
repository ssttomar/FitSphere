"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { apiFetch, AuthResponse } from "@/lib/api";

type Mode = "login" | "register";

const FITNESS_IMAGES = [
  "/images/hero-fallback-1.jpg",
  "/images/hero-fallback-2.jpg",
  "/images/hero-fallback-3.jpg",
  "/images/hero-fallback-4.jpg",
  "/images/hero-fallback-5.jpg",
];

const LOGIN_IMAGE = FITNESS_IMAGES[0];
const REGISTER_IMAGE = FITNESS_IMAGES[2];

export default function AuthPage() {
  const router = useRouter();
  const initialMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "register"
      ? "register"
      : "login";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const isLogin = mode === "login";
  const heroImage = isLogin ? LOGIN_IMAGE : REGISTER_IMAGE;

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
    <main className="min-h-screen flex">
      {/* ── Left Panel: Hero Image ── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between overflow-hidden">
        <Image
          src={heroImage}
          alt="Fitness background"
          fill
          className="object-cover object-center transition-all duration-700"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Top nav */}
        <div className="relative z-10 flex items-center justify-between p-8">
          <Logo size={40} />
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 p-10 pb-12">
          <h2 className="text-5xl xl:text-6xl font-black text-white leading-tight mb-4">
            {isLogin ? (
              <>Welcome<br />Back</>
            ) : (
              <>Start Your<br />Journey</>
            )}
          </h2>
          <p className="text-white/75 text-sm leading-relaxed max-w-xs mb-8">
            {isLogin
              ? "Track your workouts, analyze your nutrition, and crush your fitness goals — all in one place."
              : "Join thousands of athletes who use FitSphere to train smarter, eat better, and live healthier every day."}
          </p>

          {/* Stats row */}
          <div className="flex gap-8 mb-10">
            {[
              { label: "Active Users", value: "50K+" },
              { label: "Workouts Logged", value: "2M+" },
              { label: "Goals Achieved", value: "98%" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-orange-400 font-black text-xl">{stat.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {[
              {
                label: "Facebook",
                path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
              },
              {
                label: "Twitter / X",
                path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
              },
              {
                label: "Instagram",
                path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 20.5h11a4 4 0 004-4v-11a4 4 0 00-4-4h-11a4 4 0 00-4 4v11a4 4 0 004 4z",
              },
              {
                label: "YouTube",
                path: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02l5.75-3.02-5.75-3.02v6.04z",
              },
            ].map((social) => (
              <button
                key={social.label}
                aria-label={social.label}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition-colors duration-200 backdrop-blur-sm border border-white/20"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={social.path} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#0a0c12] px-6 py-10 lg:px-12 xl:px-16">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Logo size={40} />
        </div>

        <div className="w-full max-w-sm">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-8">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isLogin
                  ? "bg-orange-500 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !isLogin
                  ? "bg-orange-500 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-3xl font-black text-white">
              {isLogin ? "Sign in" : "Create account"}
            </h1>
            <p className="text-zinc-400 text-sm mt-1.5">
              {isLogin
                ? "Enter your credentials to access your fitness dashboard."
                : "Join FitSphere and start your transformation today."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  name="displayName"
                  placeholder="e.g. Alex Johnson"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/60 focus:bg-white/8 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/60 focus:bg-white/8 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                name="password"
                type="password"
                placeholder={isLogin ? "••••••••" : "Min. 8 characters"}
                required
                minLength={8}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/60 focus:bg-white/8 transition"
              />
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      rememberMe ? "bg-orange-500 border-orange-500" : "border-white/30 bg-transparent"
                    }`}
                  >
                    {rememberMe && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-zinc-400 text-sm">Remember Me</span>
                </label>
                <button type="button" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign in now"
                : "Create Account"}
            </button>
          </form>

          {/* Footer links */}
          {isLogin && (
            <p className="mt-6 text-center text-xs text-zinc-500 leading-relaxed">
              By clicking on &ldquo;Sign in now&rdquo; you agree to our{" "}
              <button className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors">
                Terms of Service
              </button>{" "}
              &amp;{" "}
              <button className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors">
                Privacy Policy
              </button>
            </p>
          )}

          {!isLogin && (
            <p className="mt-6 text-center text-xs text-zinc-500 leading-relaxed">
              By creating an account you agree to our{" "}
              <button className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors">
                Terms of Service
              </button>{" "}
              &amp;{" "}
              <button className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors">
                Privacy Policy
              </button>
            </p>
          )}

          {/* Mobile back link */}
          <div className="lg:hidden mt-6 text-center">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
