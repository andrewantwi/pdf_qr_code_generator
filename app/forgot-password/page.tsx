"use client";

import { useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/lib/Toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: { email },
        auth: false,
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
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
              If an account exists for <span className="text-accent font-medium">{email}</span>,
              a password reset link is on its way.
            </p>
            <Link
              href="/login"
              className="block text-center mt-6 text-xs text-faint hover:text-accent transition-colors"
            >
              Back to sign in →
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
          <h1 className="text-lg font-medium text-ink/80">Reset your password</h1>
          <p className="text-sm text-faint mt-1">We&apos;ll email you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
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
          </div>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl animate-shake">
              <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link href="/login" className="text-xs text-faint hover:text-accent transition-colors">
            Back to sign in →
          </Link>
        </p>
      </div>
    </main>
  );
}