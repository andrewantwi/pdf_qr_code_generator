"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/lib/AuthProvider";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/lib/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const oauthToken = params.get("token");
    if (oauthToken) {
      setToken(oauthToken);
      const cleanUrl = window.location.pathname + window.location.search.replace(/[?&]token=[^&]*/, "").replace(/^[?&]/, "");
      window.history.replaceState({}, "", cleanUrl || "/");
      refreshUser().then(() => {
        toast("Signed in with Google!", "success");
        router.replace("/");
      });
      return;
    }

    if (params.get("verified") === "1") {
      toast("Email verified. Sign in to continue.", "success");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("verified") === "0") {
      toast("Verification link is invalid or expired. Request a new one.", "error");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("google_error")) {
      toast("Google sign-in failed. Please try again.", "error");
      window.history.replaceState({}, "", window.location.pathname);
    }

    apiRequest<{ google_enabled: boolean }>("/auth/config", { auth: false })
      .then((cfg) => setGoogleEnabled(cfg.google_enabled))
      .catch(() => {});
  }, [router, refreshUser, toast]);

  function startGoogleLogin() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const next = encodeURIComponent(window.location.origin);
    window.location.href = `${apiBase}/auth/google/login?next=${next}`;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setShowResend(false);
    try {
      const data = await apiRequest<{ token: string }>("/auth/login", {
        method: "POST",
        body: { username, password },
        auth: false,
      });
      setToken(data.token);
      await refreshUser();
      toast("Signed in successfully!", "success");
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      toast(err.message, "error");
      if (err.status === 403) setShowResend(true);
      setBusy(false);
    }
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    try {
      await apiRequest("/auth/resend-verification", {
        method: "POST",
        body: { email: resendEmail.trim() },
        auth: false,
      });
      setShowResend(false);
      setError(null);
      toast("If that email is unverified, a new link was sent.", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setResending(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-faint animate-pulse">Verifying session…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-10">
          <p className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-3">
            PDF<span className="text-accent">to</span>QR
          </p>
          <h1 className="text-lg font-medium text-ink/80">Welcome back</h1>
          <p className="text-sm text-faint mt-1">Sign in to continue.</p>
        </div>

        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={startGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-50 dark:hover:bg-brand-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-faint">or</span>
              <div className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <form onSubmit={handleLogin} className="card p-8 space-y-5">
          <div>
            <label htmlFor="username" className="text-xs font-medium text-muted mb-1.5 block">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-medium text-muted mb-1.5 block">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-11"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-faint hover:text-ink transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-faint hover:text-accent transition-colors">
              Forgot password?
            </Link>
          </div>

          {showResend && (
            <form onSubmit={handleResend} className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Enter the email you registered with to receive a new verification link.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="input-field py-1.5 text-xs flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={resending || !resendEmail.trim()}
                  className="btn-secondary py-1.5 text-xs disabled:opacity-50"
                >
                  {resending ? "Sending…" : "Resend"}
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl animate-shake">
              <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </span>
            ) : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link href="/register" className="text-xs text-faint hover:text-accent transition-colors">
            Don&apos;t have an account? Create one →
          </Link>
        </p>
      </div>
    </main>
  );
}