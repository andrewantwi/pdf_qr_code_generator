"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import LoadingSpinner from "@/lib/LoadingSpinner";
import { apiRequest, isApiUnauthorized } from "@/lib/api";
import { useToast } from "@/lib/Toast";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_MINUTES = 11;
const MAX_CONSECUTIVE_FAILURES = 5;
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [tracking, setTracking] = useState(true);
  const pollStart = useRef<number>(0);
  const pollTimeout = useRef<ReturnType<typeof setTimeout>>();
  const failureCount = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function selectFile(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast("Please choose a PDF file.", "error");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`, "error");
      return;
    }
    setFile(f);
  }

  useEffect(() => {
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, []);

  function pollStatus(id: string) {
    pollStart.current = Date.now();
    failureCount.current = 0;
    const poll = async () => {
      const elapsedMinutes = (Date.now() - pollStart.current) / 60000;
      if (elapsedMinutes > MAX_POLL_MINUTES) {
        setLoading(false);
        setError("This is taking longer than expected. Check the dashboard in a few minutes.");
        return;
      }
      try {
        const data = await apiRequest<StatusResult>(`/status/${id}`);
        failureCount.current = 0;
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
      } catch (err: any) {
        if (isApiUnauthorized(err)) {
          setLoading(false);
          toast("Session expired. Please sign in again.", "error");
          router.replace("/login");
          return;
        }
        failureCount.current += 1;
        if (failureCount.current >= MAX_CONSECUTIVE_FAILURES) {
          setLoading(false);
          setError("Could not reach the server. Check the dashboard in a few minutes.");
          toast("Could not reach the server.", "error");
          return;
        }
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
    formData.append("tracking", tracking ? "true" : "false");

    try {
      const data = await apiRequest<{ id: string }>("/upload", {
        method: "POST",
        formData,
      });
      toast("PDF uploaded! Generating QR code…", "info");
      pollStatus(data.id);
    } catch (err: any) {
      if (isApiUnauthorized(err)) {
        toast("Session expired. Please sign in again.", "error");
        router.push("/login");
        return;
      }
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

  if (authLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (!user) return null;

  return (
    <main className="page-shell animate-fade-in">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10 animate-slide-up">
          <p className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            PDF<span className="text-accent">to</span>QR
          </p>
          <p className="text-sm text-muted mt-2.5">
            Upload a PDF, get a QR code that opens it instantly.
          </p>
        </div>

        <div className="card p-8 md:p-10 animate-slide-up">
          <label
            htmlFor="pdf-upload"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              selectFile(e.dataTransfer.files[0]);
            }}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-14 px-4 cursor-pointer transition-[border-color,background-color,transform] duration-200 ease-out-quart focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              dragging
                ? "border-accent bg-accent-soft scale-[1.01]"
                : file
                  ? "border-accent bg-accent-soft/70"
                  : "border-line hover:border-accent/50 hover:bg-accent-soft/50"
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-[background-color,transform] duration-200 ease-out-quart ${
              file ? "bg-accent-soft scale-105" : "bg-accent-soft/80"
            }`}>
              <svg className={`w-5 h-5 ${file ? "text-accent" : "text-faint"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <span className="text-sm text-ink/80 text-center font-medium">
              {file ? file.name : "Choose a PDF or drag it here"}
            </span>
            {file ? (
              <span className="text-xs text-faint mt-1.5">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            ) : (
              <span className="text-xs text-faint mt-1.5">PDF only · up to 20 MB</span>
            )}
            <input
              ref={fileInputRef}
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                selectFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>

          <label className="flex items-center justify-center gap-2 mt-4 text-sm text-muted select-none cursor-pointer">
            <input
              type="checkbox"
              checked={tracking}
              disabled={loading}
              onChange={(e) => setTracking(e.target.checked)}
              className="accent-accent disabled:opacity-50"
            />
            <span>
              Count QR scans
              <span className="text-xs text-faint ml-1.5">track how many times the QR is opened</span>
            </span>
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="btn-primary mt-6"
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
            <div className="mt-6 space-y-2.5 animate-fade-in" aria-live="polite">
              <div className="w-full h-2 bg-accent-soft rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out-quint animate-progress-shimmer"
                  style={{
                    width: `${Math.max(progress, 2)}%`,
                    background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--muted)), rgb(var(--accent)))",
                    backgroundSize: "200% 100%",
                  }}
                />
              </div>
              <p className="text-xs text-faint text-center">
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
          <div className="card p-6 mt-4 text-center animate-slide-up-fast">
            <div className="inline-block p-3 bg-surface rounded-xl border border-line shadow-sm">
              <img
                src={`data:image/png;base64,${result.qr_code_base64}`}
                alt="QR code"
                className="mx-auto w-48 h-48"
              />
            </div>
            <p className="text-sm text-muted mt-4 break-all px-2">{result.pdf_url}</p>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCopy} className="btn-secondary">
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a
                href={`data:image/png;base64,${result.qr_code_base64}`}
                download={`${result.filename}-qr.png`}
                className="btn-secondary text-center"
              >
                Download QR
              </a>
            </div>
          </div>
        )}

        <p className="text-center mt-8 animate-fade-in">
          <Link href="/dashboard" className="text-xs text-faint hover:text-accent transition-colors">
            View past documents →
          </Link>
        </p>
      </div>
    </main>
  );
}
