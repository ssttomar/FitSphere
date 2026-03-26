"use client";

import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { API_BASE_URL, ApiError } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "login" | "signup";
type SignupStep = "method" | "phone" | "phone-otp" | "details" | "email" | "email-otp" | "google-setup";

type GoogleCredentialResponse = { credential: string };

type AuthResponse = {
  userId: string;
  token: string;
  displayName: string;
  isNewUser?: boolean;
};

type RegisterRequestBody = {
  username: string;
  displayName: string;
  password: string;
  phone: string;
  email?: string;
  emailOtp?: string;
};

declare global {
  interface Window {
    __gsiLoaded?: boolean;
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const COUNTRY_CODES = [
  { dial: "+91", flag: "🇮🇳", name: "India" },
  { dial: "+1",  flag: "🇺🇸", name: "United States" },
  { dial: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { dial: "+61", flag: "🇦🇺", name: "Australia" },
  { dial: "+1",  flag: "🇨🇦", name: "Canada" },
  { dial: "+971",flag: "🇦🇪", name: "UAE" },
  { dial: "+65", flag: "🇸🇬", name: "Singapore" },
  { dial: "+49", flag: "🇩🇪", name: "Germany" },
  { dial: "+33", flag: "🇫🇷", name: "France" },
  { dial: "+86", flag: "🇨🇳", name: "China" },
  { dial: "+81", flag: "🇯🇵", name: "Japan" },
  { dial: "+82", flag: "🇰🇷", name: "South Korea" },
  { dial: "+55", flag: "🇧🇷", name: "Brazil" },
  { dial: "+7",  flag: "🇷🇺", name: "Russia" },
  { dial: "+92", flag: "🇵🇰", name: "Pakistan" },
  { dial: "+880",flag: "🇧🇩", name: "Bangladesh" },
  { dial: "+234",flag: "🇳🇬", name: "Nigeria" },
  { dial: "+27", flag: "🇿🇦", name: "South Africa" },
  { dial: "+966",flag: "🇸🇦", name: "Saudi Arabia" },
  { dial: "+62", flag: "🇮🇩", name: "Indonesia" },
  { dial: "+60", flag: "🇲🇾", name: "Malaysia" },
  { dial: "+66", flag: "🇹🇭", name: "Thailand" },
  { dial: "+63", flag: "🇵🇭", name: "Philippines" },
  { dial: "+64", flag: "🇳🇿", name: "New Zealand" },
  { dial: "+41", flag: "🇨🇭", name: "Switzerland" },
  { dial: "+31", flag: "🇳🇱", name: "Netherlands" },
  { dial: "+46", flag: "🇸🇪", name: "Sweden" },
  { dial: "+34", flag: "🇪🇸", name: "Spain" },
  { dial: "+39", flag: "🇮🇹", name: "Italy" },
  { dial: "+20", flag: "🇪🇬", name: "Egypt" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function decodeGoogleJwt(token: string): { name?: string; email?: string; picture?: string } {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function suggestUsername(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 20);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = body || `Request failed (${res.status})`;
    try { const p = JSON.parse(body); msg = p.message || p.error || msg; } catch {}
    throw new ApiError(msg, res.status, body);
  }
  return res.json();
}

function saveAuth(resp: { userId: string; token: string; displayName: string }) {
  localStorage.setItem("fitsphere_token", resp.token);
  localStorage.setItem("fitsphere_user_id", resp.userId);
  localStorage.setItem("fitsphere_display_name", resp.displayName);
}

// ── OTP Input (6 boxes) ───────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 1) {
      // Paste handling
      const next = [...value];
      digits.split("").forEach((d, j) => { if (i + j < 6) next[i + j] = d; });
      onChange(next);
      refs.current[Math.min(i + digits.length, 5)]?.focus();
      return;
    }
    const next = [...value];
    next[i] = digits;
    onChange(next);
    if (digits && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-14 w-11 rounded-xl border border-white/15 bg-white/6 text-center text-xl font-bold text-white outline-none focus:border-orange-500/70 focus:bg-white/10 transition-all caret-transparent"
        />
      ))}
    </div>
  );
}

// ── Dev OTP badge ─────────────────────────────────────────────────────────────

function DevOtpBadge({ otp }: { otp: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <span className="text-amber-400">🔧</span>
      <div>
        <p className="text-xs font-bold text-amber-300">Dev mode — SMS not configured</p>
        <p className="text-sm font-mono text-amber-200 tracking-[0.3em] mt-0.5">{otp}</p>
      </div>
    </div>
  );
}

// ── Google button ─────────────────────────────────────────────────────────────

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/25 transition-all disabled:opacity-50"
    >
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {loading ? "Connecting..." : "Continue with Google"}
    </button>
  );
}

// ── Signup Flow ───────────────────────────────────────────────────────────────

function SignupFlow({ onDone, onSwitchToLogin }: {
  onDone: (isNew: boolean) => void;
  onSwitchToLogin: () => void;
}) {
  const [step, setStep] = useState<SignupStep>("method");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [phoneOtp, setPhoneOtp] = useState(Array(6).fill(""));
  const [devPhoneOtp, setDevPhoneOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState(Array(6).fill(""));
  const [devEmailOtp, setDevEmailOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Google new-user setup
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googlePicture, setGooglePicture] = useState("");

  const fullPhone = countryCode.dial + phoneLocal.replace(/\D/g, "");

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken: response.credential }),
      });
      saveAuth(res);
      if (res.isNewUser) {
        // Decode Google JWT to pre-fill info
        const gPayload = decodeGoogleJwt(response.credential);
        setGoogleName(gPayload.name || res.displayName || "");
        setGoogleEmail(gPayload.email || "");
        setGooglePicture(gPayload.picture || "");
        setDisplayName(gPayload.name || res.displayName || "");
        setUsername(suggestUsername(gPayload.name || res.displayName || ""));
        setStep("google-setup");
      } else {
        onDone(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  }, [onDone]);

  // Load Google Identity Services
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (window.__gsiLoaded) {
      window.google?.accounts?.id?.initialize({ client_id: clientId, callback: handleGoogleCredential });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.__gsiLoaded = true;
      window.google?.accounts?.id?.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [handleGoogleCredential]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = window.setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCountdown]);

  // Debounced username check
  useEffect(() => {
    if (!username || username.length < 3) { setUsernameStatus("idle"); return; }
    if (!/^[a-z0-9._]+$/.test(username)) { setUsernameStatus("taken"); return; }
    setUsernameStatus("checking");
    const id = window.setTimeout(async () => {
      try {
        const res = await apiFetch<{ available: boolean }>(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        setUsernameStatus(res.available ? "available" : "taken");
      } catch { setUsernameStatus("idle"); }
    }, 500);
    return () => clearTimeout(id);
  }, [username]);

  const handleGoogleClick = () => {
    const gsi = window.google?.accounts?.id;
    if (gsi) {
      gsi.prompt();
    } else {
      setError("Google sign-in is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phoneLocal.trim() || phoneLocal.replace(/\D/g, "").length < 7) {
      setError("Enter a valid phone number"); return;
    }
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<{ message: string; devOtp?: string }>("/api/auth/send-phone-otp", {
        method: "POST",
        body: JSON.stringify({ phone: fullPhone }),
      });
      if (res.devOtp) setDevPhoneOtp(res.devOtp);
      setPhoneOtp(Array(6).fill(""));
      setStep("phone-otp");
      setResendCountdown(30);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const handleVerifyPhoneOtp = async () => {
    const otp = phoneOtp.join("");
    if (otp.length < 6) { setError("Enter all 6 digits"); return; }
    setLoading(true); setError(null);
    try {
      await apiFetch("/api/auth/verify-phone-otp", {
        method: "POST",
        body: JSON.stringify({ phone: fullPhone, otp }),
      });
      setStep("details");
    } catch (e) { setError(e instanceof Error ? e.message : "Invalid OTP"); }
    finally { setLoading(false); }
  };

  // Auto-submit phone OTP when all 6 digits filled
  useEffect(() => {
    if (step === "phone-otp" && phoneOtp.every(Boolean)) {
      handleVerifyPhoneOtp();
    }
  }, [phoneOtp]);

  const handleSendEmailOtp = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address"); return;
    }
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<{ message: string; devOtp?: string }>("/api/auth/send-email-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.devOtp) setDevEmailOtp(res.devOtp);
      setEmailOtp(Array(6).fill(""));
      setStep("email-otp");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to send email OTP"); }
    finally { setLoading(false); }
  };

  const handleRegister = async (withEmail = false) => {
    if (!displayName.trim()) { setError("Enter your full name"); return; }
    if (username.length < 3 || usernameStatus === "taken") { setError("Choose a valid available username"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

    const body: RegisterRequestBody = {
      username,
      displayName: displayName.trim(),
      password,
      phone: fullPhone,
    };
    if (withEmail && email) {
      body.email = email;
      body.emailOtp = emailOtp.join("");
    }

    setLoading(true); setError(null);
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/register-phone", {
        method: "POST",
        body: JSON.stringify(body),
      });
      saveAuth(res);
      onDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Registration failed"); }
    finally { setLoading(false); }
  };

  const handleGoogleSetup = async () => {
    if (username.length < 3 || usernameStatus === "taken") { setError("Choose a valid available username"); return; }
    const token = localStorage.getItem("fitsphere_token");
    if (!token) { setError("Session expired, please try again"); return; }
    setLoading(true); setError(null);
    try {
      await apiFetch("/api/auth/setup-username", {
        method: "POST",
        body: JSON.stringify({ username }),
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.setItem("fitsphere_username", username);
      onDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to set username"); }
    finally { setLoading(false); }
  };

  // Auto-submit email OTP when all 6 filled
  useEffect(() => {
    if (step === "email-otp" && emailOtp.every(Boolean)) {
      handleRegister(true);
    }
  }, [emailOtp]);

  const SIGNUP_STEPS: SignupStep[] = ["method", "phone", "phone-otp", "details", "email", "email-otp"];
  const stepIndex = SIGNUP_STEPS.indexOf(step);
  const progressSteps = SIGNUP_STEPS.slice(1); // exclude "method" from progress dots

  return (
    <div className="w-full max-w-sm">
      {/* Progress dots */}
      {step !== "method" && step !== "google-setup" && (
        <div className="flex justify-center gap-2 mb-8">
          {progressSteps.map((s, i) => (
            <div
              key={s}
              className={`rounded-full transition-all duration-300 ${
                i < stepIndex ? "h-2 w-2 bg-orange-500" :
                i === stepIndex - 1 ? "h-2 w-5 bg-orange-500" :
                "h-2 w-2 bg-white/15"
              }`}
            />
          ))}
        </div>
      )}

      {/* Back button */}
      {step !== "method" && step !== "google-setup" && (
        <button
          onClick={() => {
            setError(null);
            const backs: Partial<Record<SignupStep, SignupStep>> = {
              "phone": "method", "phone-otp": "phone", "details": "phone-otp",
              "email": "details", "email-otp": "email",
            };
            setStep(backs[step] ?? "method");
          }}
          className="mb-6 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* ── Step: method ── */}
      {step === "method" && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Create account</h1>
            <p className="text-zinc-400 text-sm mt-2">Join FitSphere and start your transformation.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { setStep("phone"); setError(null); }}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0-1.104 1.22-1.667 2.113-.951l15.826 12.674c.893.716.38 2.202-.755 2.202H3a.75.75 0 01-.75-.75V6.338z" />
              </svg>
              Sign up with phone number
            </button>

            <div className="relative flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-zinc-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <GoogleButton onClick={handleGoogleClick} loading={googleLoading} />
          </div>

          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}

          <p className="mt-8 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="font-semibold text-orange-400 hover:text-orange-300 transition-colors">
              Sign in
            </button>
          </p>
        </>
      )}

      {/* ── Step: phone ── */}
      {step === "phone" && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">Enter your phone number</h1>
            <p className="text-zinc-400 text-sm mt-2">We&apos;ll send you a verification code.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={countryCode.dial + "|" + countryCode.name}
                  onChange={(e) => {
                    const [dial, name] = e.target.value.split("|");
                    const found = COUNTRY_CODES.find(c => c.dial === dial && c.name === name);
                    if (found) setCountryCode(found);
                  }}
                  className="h-full appearance-none rounded-xl border border-white/12 bg-white/6 pl-3 pr-8 text-sm text-white outline-none focus:border-orange-500/50 cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.name} value={c.dial + "|" + c.name} className="bg-[#0f1117]">
                      {c.flag} {c.dial}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <input
                type="tel"
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d\s\-()]/g, ""))}
                placeholder="Phone number"
                autoFocus
                className="flex-1 rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleSendPhoneOtp()}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleSendPhoneOtp}
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send verification code →"}
            </button>
          </div>
        </>
      )}

      {/* ── Step: phone-otp ── */}
      {step === "phone-otp" && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">Enter the code</h1>
            <p className="text-zinc-400 text-sm mt-2">
              We sent a 6-digit code to <span className="text-white font-semibold">{fullPhone}</span>
            </p>
          </div>

          <div className="space-y-5">
            {devPhoneOtp && <DevOtpBadge otp={devPhoneOtp} />}

            <OtpInput value={phoneOtp} onChange={setPhoneOtp} />

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              onClick={handleVerifyPhoneOtp}
              disabled={loading || phoneOtp.join("").length < 6}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify →"}
            </button>

            <div className="text-center">
              {resendCountdown > 0 ? (
                <p className="text-sm text-zinc-500">Resend code in {resendCountdown}s</p>
              ) : (
                <button
                  onClick={handleSendPhoneOtp}
                  className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Step: details ── */}
      {step === "details" && (
        <>
          <div className="mb-7">
            <h1 className="text-2xl font-black text-white">Create your account</h1>
            <p className="text-zinc-400 text-sm mt-2">Choose a username and set your password.</p>
          </div>

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Username</label>
              <div className="relative">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                  placeholder="e.g. sumit_singh"
                  autoFocus
                  className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 pr-10 text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-orange-400" />
                  )}
                  {usernameStatus === "available" && (
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {usernameStatus === "taken" && (
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              </div>
              {usernameStatus === "taken" && username.length >= 3 && (
                <p className="mt-1 text-xs text-red-400">Username already taken</p>
              )}
              {usernameStatus === "available" && (
                <p className="mt-1 text-xs text-emerald-400">Username is available!</p>
              )}
              <p className="mt-1 text-xs text-zinc-600">Lowercase letters, numbers, dots and underscores only</p>
            </div>

            {/* Full name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Full Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sumit Singh"
                className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 pr-16 text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={() => setStep("email")}
              disabled={loading || usernameStatus !== "available" || !displayName.trim() || password.length < 8}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {/* ── Step: email (optional) ── */}
      {step === "email" && (
        <>
          <div className="mb-7">
            <h1 className="text-2xl font-black text-white">Add your email</h1>
            <p className="text-zinc-400 text-sm mt-2">
              Optional — use it to recover your account and get updates.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleSendEmailOtp}
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Add email & verify →"}
            </button>

            <button
              onClick={() => handleRegister(false)}
              disabled={loading}
              className="w-full rounded-xl border border-white/12 bg-transparent px-5 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:border-white/25 transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        </>
      )}

      {/* ── Step: email-otp ── */}
      {step === "email-otp" && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">Verify your email</h1>
            <p className="text-zinc-400 text-sm mt-2">
              Enter the 6-digit code sent to <span className="text-white font-semibold">{email}</span>
            </p>
          </div>

          <div className="space-y-5">
            {devEmailOtp && <DevOtpBadge otp={devEmailOtp} />}

            <OtpInput value={emailOtp} onChange={setEmailOtp} />

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              onClick={() => handleRegister(true)}
              disabled={loading || emailOtp.join("").length < 6}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Verify & create account →"}
            </button>
          </div>
        </>
      )}

      {/* ── Step: google-setup ── */}
      {step === "google-setup" && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-black text-white">Almost there!</h1>
            <p className="text-zinc-400 text-sm mt-1">Choose a username to complete your account.</p>
          </div>

          <div className="space-y-4">
            {/* Google profile preview */}
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              {googlePicture ? (
                <img src={googlePicture} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-black text-white">
                  {googleName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{googleName}</p>
                <p className="text-xs text-zinc-500">{googleEmail}</p>
              </div>
              <span className="ml-auto text-xs text-emerald-400 font-semibold">✓ Google</span>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""));
                    setError(null);
                  }}
                  placeholder="your_username"
                  className="w-full rounded-xl border border-white/12 bg-white/6 pl-8 pr-10 py-2.5 text-sm text-white outline-none focus:border-orange-500/60"
                />
                {usernameStatus === "checking" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">...</span>
                )}
                {usernameStatus === "available" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400">✓</span>
                )}
                {usernameStatus === "taken" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">✗</span>
                )}
              </div>
              {usernameStatus === "taken" && (
                <p className="mt-1 text-xs text-red-400">Username taken — try another</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={handleGoogleSetup}
              disabled={loading || usernameStatus === "taken" || usernameStatus === "checking" || username.length < 3}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Continue →"}
            </button>

            <p className="text-center text-xs text-zinc-600">
              You&apos;ll set up your fitness profile in the next step.
            </p>
          </div>
        </>
      )}

      {/* Terms */}
      {step !== "method" && step !== "google-setup" && (
        <p className="mt-6 text-center text-xs text-zinc-600 leading-relaxed">
          By continuing you agree to our{" "}
          <span className="text-zinc-400 cursor-pointer hover:text-white">Terms of Service</span> and{" "}
          <span className="text-zinc-400 cursor-pointer hover:text-white">Privacy Policy</span>
        </p>
      )}
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────

function LoginForm({ onDone, onSwitchToSignup }: {
  onDone: () => void;
  onSwitchToSignup: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    setGoogleLoading(true); setError(null);
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken: response.credential }),
      });
      saveAuth(res);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally { setGoogleLoading(false); }
  }, [onDone]);

  // Load Google Identity Services
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (window.__gsiLoaded) {
      window.google?.accounts?.id?.initialize({ client_id: clientId, callback: handleGoogleCredential });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true; script.defer = true;
    script.onload = () => {
      window.__gsiLoaded = true;
      window.google?.accounts?.id?.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      });
    };
    document.head.appendChild(script);
  }, [handleGoogleCredential]);

  const handleGoogleClick = () => {
    const gsi = window.google?.accounts?.id;
    if (gsi) { gsi.prompt(); }
    else { setError("Google sign-in not configured."); }
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password) { setError("Fill in all fields"); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      saveAuth(res);
      onDone();
    } catch (e) {
      setError(e instanceof ApiError && (e.status === 401 || e.status === 403)
        ? "Invalid credentials. Check your phone, username, or password."
        : e instanceof Error ? e.message : "Login failed");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true); setForgotMsg(null);
    try {
      const res = await apiFetch<{ message: string; resetToken?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotMsg(res.message + (res.resetToken ? ` Token: ${res.resetToken}` : ""));
    } catch (e) { setForgotMsg(e instanceof Error ? e.message : "Error"); }
    finally { setForgotLoading(false); }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Sign in</h1>
        <p className="text-zinc-400 text-sm mt-2">Welcome back, athlete.</p>
      </div>

      <div className="space-y-4">
        <GoogleButton onClick={handleGoogleClick} loading={googleLoading} />

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-zinc-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Phone, username, or email
          </label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="+919876543210 or sumit_singh"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 pr-16 text-white placeholder-zinc-500 outline-none focus:border-orange-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => { setForgotOpen((v) => !v); setForgotMsg(null); }}
            className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {forgotOpen && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/4 p-4">
            <p className="text-sm font-semibold text-white">Reset password</p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Account email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500/50"
            />
            <button
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="w-full rounded-xl border border-orange-500/35 bg-orange-500/12 px-4 py-2.5 text-sm font-semibold text-orange-300 hover:bg-orange-500/20 disabled:opacity-60"
            >
              {forgotLoading ? "Sending..." : "Send reset token"}
            </button>
            {forgotMsg && <p className="text-xs text-emerald-300 break-all">{forgotMsg}</p>}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-3.5 text-sm font-bold text-white transition-colors disabled:opacity-50 mt-1"
        >
          {loading ? "Signing in..." : "Sign in →"}
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <button onClick={onSwitchToSignup} className="font-semibold text-orange-400 hover:text-orange-300 transition-colors">
          Sign up
        </button>
      </p>
    </div>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────────────

export default function AuthPage() {
  const router = useRouter();
  const initialMode: Mode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "register"
      ? "signup" : "login";

  const [mode, setMode] = useState<Mode>(initialMode);

  const handleDone = (isNewUser: boolean) => {
    if (isNewUser) {
      localStorage.removeItem("fitsphere_onboarding_done");
      router.push("/onboarding");
    } else {
      localStorage.setItem("fitsphere_onboarding_done", "true");
      router.push("/dashboard");
    }
  };

  const heroImages = [
    "/images/hero-fallback-1.jpg",
    "/images/hero-fallback-3.jpg",
  ];
  const heroImage = heroImages[mode === "login" ? 0 : 1];

  return (
    <main className="min-h-screen flex">
      {/* Left panel — hero image */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between overflow-hidden">
        <Image src={heroImage} alt="" fill className="object-cover object-center transition-all duration-700" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="relative z-10 flex items-center justify-between p-8">
          <Logo size={40} />
          <Link href="/" className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors">
            Back to home
          </Link>
        </div>

        <div className="relative z-10 p-10 pb-12">
          <h2 className="text-5xl xl:text-6xl font-black text-white leading-tight mb-4">
            {mode === "login" ? (
              <><span className="text-orange-400">Welcome</span><br />Back</>
            ) : (
              <><span className="text-orange-400">Start</span><br />Your Journey</>
            )}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            {mode === "login"
              ? "Track workouts, analyze nutrition, and crush your fitness goals."
              : "Join thousands of athletes who train smarter with FitSphere."}
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#0a0c12] px-6 py-10 lg:px-12 xl:px-16 overflow-y-auto">
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <Logo size={36} />
        </div>

        {/* Mode toggle */}
        <div className="mb-8 flex rounded-xl bg-white/5 border border-white/10 p-1 w-full max-w-sm">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === m ? "bg-orange-500 text-white shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {mode === "signup" ? (
          <SignupFlow onDone={handleDone} onSwitchToLogin={() => setMode("login")} />
        ) : (
          <LoginForm onDone={() => handleDone(false)} onSwitchToSignup={() => setMode("signup")} />
        )}

        <div className="lg:hidden mt-8">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
