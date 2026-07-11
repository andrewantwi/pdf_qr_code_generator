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
  5: "Preparing upload…",
  20: "Configuring storage…",
  35: "Uploading PDF…",
  50: "Publishing document…",
  65: "Waiting for deployment (this takes the longest)…",
  99: "Finalising…",
  100: "Live!",
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pollStart = useRef<number>(0);
  const pollTimeout = useRef<ReturnType<typeof setTimeout>>();
  const redirected = useRef(false);
  const dropRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, []);

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
        setError("This is taking longer than expected. Check the dashboard in a few minutes.");
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
        pollTimeout.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        pollTimeout.current = setTimeout(poll, POLL_INTERVAL_MS);
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
        toast("Session expired. Please sign in again.", "error");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Upload failed. Please try again.");
      }

      const data = await res.json();
      toast("PDF uploaded! Generating QR code…", "info");
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
    <main className="min-h-screen flex flex-col items-center px-4 py-12 md:py-20 animate-fade-in">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            PDF <span className="text-brand-600">→</span> QR
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Upload a PDF, get a QR code that opens it instantly.
          </p>
        </div>

        <div className="card p-6 md:p-8 animate-slide-up">
          <label
            ref={dropRef}
            htmlFor="pdf-upload"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f && f.type === "application/pdf") setFile(f);
              else toast("Please drop a PDF file.", "error");
            }}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-12 px-4 cursor-pointer transition-[border-color,background-color] duration-200 ease-out-quart ${
              dragging
                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/40"
                : file
                  ? "border-brand-300 bg-brand-50/50 dark:bg-brand-900/30"
                  : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-[background-color] duration-200 ease-out-quart ${
              file ? "bg-brand-100" : "bg-slate-100 dark:bg-slate-700"
            }`}>
              <svg className={`w-5 h-5 ${file ? "text-brand-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-300 text-center font-medium">
              {file ? file.name : "Choose a PDF or drag it here"}
            </span>
            {file && (
              <span className="text-xs text-slate-400 mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            )}
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
            className="btn-primary mt-5"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Publishing…
              </span>
            ) : (
              "Generate QR Code"
            )}
          </button>

          {loading && (
            <div className="mt-6 space-y-2 animate-fade-in">
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out-quint"
                  style={{
                    width: `${Math.max(progress, 2)}%`,
                    background: "linear-gradient(90deg, #0077b6, #00b4d8, #0077b6)",
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                {STEP_LABELS[progress] || `Publishing… ${progress}%`}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
              <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
        </div>

        {result?.qr_code_base64 && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm mt-4 text-center animate-slide-up-fast">
            <img
              src={`data:image/png;base64,${result.qr_code_base64}`}
              alt="QR code"
              className="mx-auto w-48 h-48"
            />
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 break-all">{result.pdf_url}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCopy}
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-[background-color,transform] duration-150 ease-out-quart active:scale-[0.97] select-none"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={`data:image/png;base64,${result.qr_code_base64}`}
                download={`${result.filename}-qr.png`}
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-[background-color,transform] duration-150 ease-out-quart active:scale-[0.97] select-none inline-block text-center"
              >
                Download QR
              </a>
            </div>
          </div>
        )}

        <p className="text-center mt-6 animate-fade-in">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            View past documents &nbsp;→
          </Link>
        </p>
      </div>
    </main>
  );
}
