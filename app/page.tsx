"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { getToken } from "@/lib/auth";
import { useToast } from "@/lib/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_MINUTES = 11;

interface StatusResult {
  id: string;
  filename: string;
  status: "processing" | "live" | "failed";
  progress: number;
  pdf_url: string | null;
  error_message: string | null;
  qr_code_base64?: string;
}

const STEP_LABELS: Record<number, string> = {
  0: "Starting…",
  5: "Creating GitHub repository…",
  20: "Configuring repository…",
  35: "Uploading PDF…",
  50: "Enabling GitHub Pages…",
  65: "Waiting for Pages build (this takes the longest)…",
  99: "Finalising…",
  100: "Live!",
};

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const pollStart = useRef<number>(0);
  const redirected = useRef(false);

  useEffect(() => {
    if (!authLoading && !user && !redirected.current) {
      redirected.current = true;
      router.replace("/login");
    }
  }, [authLoading, user]);

  function pollStatus(id: string) {
    pollStart.current = Date.now();
    const poll = async () => {
      const elapsedMinutes = (Date.now() - pollStart.current) / 60000;
      if (elapsedMinutes > MAX_POLL_MINUTES) {
        setLoading(false);
        setError("This is taking longer than expected. Check the dashboard in a few minutes - it may still complete.");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/status/${id}`);
        const data: StatusResult = await res.json();
        setProgress(data.progress ?? 0);
        if (data.status === "live") {
          setProgress(100);
          setResult(data);
          setLoading(false);
          toast("QR code generated successfully!", "success");
          return;
        }
        if (data.status === "failed") {
          setError(data.error_message || "Publishing failed. Please try again.");
          toast(data.error_message || "Publishing failed.", "error");
          setLoading(false);
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };
    poll();
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (res.status === 401) {
        logout();
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Upload failed. Please try again.");
      }

      const data = await res.json();
      toast("PDF upload started! Generating QR code…", "info");
      pollStatus(data.id);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      toast(err.message || "Upload failed.", "error");
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result?.pdf_url) return;
    navigator.clipboard.writeText(result.pdf_url);
    setCopied(true);
    toast("Link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  }

  if (authLoading) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">PDF → QR Code</h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{user.username}</span>
              <button onClick={() => { logout(); toast("Logged out", "info"); }} className="text-xs text-slate-400 hover:text-slate-600 underline">
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label
            htmlFor="pdf-upload"
            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg py-10 px-4 cursor-pointer hover:border-slate-400 transition-colors"
          >
            <span className="text-sm text-slate-600 text-center">
              {file ? file.name : "Click to choose a PDF, or drag it here"}
            </span>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-4 w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            {loading ? "Publishing…" : "Generate QR Code"}
          </button>

          {loading && (
            <div className="mt-4 space-y-2">
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-slate-900 h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(progress, 2)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                {STEP_LABELS[progress] || `Publishing… ${progress}%`}
              </p>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
        </div>

        {result?.qr_code_base64 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mt-4 text-center">
            <img
              src={`data:image/png;base64,${result.qr_code_base64}`}
              alt="QR code"
              className="mx-auto w-48 h-48"
            />
            <p className="text-sm text-slate-500 mt-4 break-all">{result.pdf_url}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCopy}
                className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={`data:image/png;base64,${result.qr_code_base64}`}
                download={`${result.filename}-qr.png`}
                className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Download QR
              </a>
            </div>
          </div>
        )}

        <p className="text-center mt-6">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600">
            View past documents →
          </Link>
        </p>
      </div>
    </main>
  );
}
