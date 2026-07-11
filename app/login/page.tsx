"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setToken } from "@/lib/auth";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const { user, loading: authLoading, refreshUser } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    
    try {
      const res = await fetch(
        `${API_URL}/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, 
        { method: "POST" }
      );
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      
      setToken(data.token);
      await refreshUser();
      toast("Signed in successfully!", "success");
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      toast(err.message, "error");
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-sm text-slate-500 animate-pulse">Verifying session…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-sm w-full">
        <h1 className="text-xl font-semibold text-slate-900 mb-1 text-center">PDF → QR Code</h1>
        <p className="text-sm text-slate-500 mb-6 text-center">Sign in to continue</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            required
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-slate-800 transition-colors"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-4">
          <Link href="/register" className="text-sm text-slate-400 hover:text-slate-600">
            Create an account →
          </Link>
        </p>
      </div>
    </main>
  );
}