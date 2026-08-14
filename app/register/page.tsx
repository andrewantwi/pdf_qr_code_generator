"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/lib/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.push("/");
  }, [authLoading, user, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiRequest<{ detail: string }>("/auth/register", {
        method: "POST",
        body: { username, email, password },
        auth: false,
      });
      setRegisteredEmail(email);
      toast("Account created! Verify your email to sign in.", "success");
    } catch (err: any) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (!registeredEmail) return;
    setResending(true);
    try {
      await apiRequest("/auth/resend-verification", {
        method: "POST",
        body: { email: registeredEmail },
        auth: false,
      });
      toast("Verification link sent. Check your inbox.", "success");
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
          <p className="text-sm text-faint animate-pulse">Loading…</p>
        </div>
      </main>
    );
  }

  if (registeredEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 animate-fade-in">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="card p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-soft flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-ink">Check your inbox</h1>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              We sent a verification link to{" "}
              <span className="text-accent font-medium">{registeredEmail}</span>. Click it to
              verify your email, then sign in.
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn-secondary w-full mt-6 disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend verification link"}
            </button>
            <Link href="/login" className="btn-primary w-full mt-3 text-center">
              Go to login
            </Link>
          </div>
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
          <h1 className="text-lg font-medium text-ink/80">Create your account</h1>
          <p className="text-sm text-faint mt-1">Start turning PDFs into QR codes.</p>
        </div>

        <form onSubmit={handleRegister} className="card p-8 space-y-5">
          <div>
            <label htmlFor="username" className="text-xs font-medium text-muted mb-1.5 block">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-xs font-medium text-muted mb-1.5 block">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
              autoComplete="email"
            />
            <p className="text-[11px] text-faint mt-1.5">
              We&apos;ll send a verification link to this address.
            </p>
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-medium text-muted mb-1.5 block">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 4 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-11"
                required
                minLength={4}
                autoComplete="new-password"
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
          <div>
            <label htmlFor="confirm-password" className="text-xs font-medium text-muted mb-1.5 block">Confirm password</label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-11"
                required
                minLength={4}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-faint hover:text-ink transition-colors"
              >
                {showConfirm ? (
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
                Creating account…
              </span>
            ) : "Create account"}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link href="/login" className="text-xs text-faint hover:text-accent transition-colors">
            Already have an account? Sign in →
          </Link>
        </p>
      </div>
    </main>
  );
}
