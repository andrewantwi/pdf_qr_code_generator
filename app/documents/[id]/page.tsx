"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import LoadingSpinner from "@/lib/LoadingSpinner";
import { apiRequest, isApiUnauthorized } from "@/lib/api";
import { useToast } from "@/lib/Toast";

const POLL_INTERVAL_MS = 4000;

interface DocDetail {
  id: string;
  filename: string;
  status: "processing" | "live" | "failed";
  progress: number;
  pdf_url: string | null;
  error_message: string | null;
  qr_code_base64?: string;
  created_at?: string;
}

function statusBadgeColor(status: string) {
  switch (status) {
    case "live": return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800";
    case "processing": return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800";
    case "failed": return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800";
    default: return "bg-accent-soft text-muted border-line";
  }
}

export default function DocumentDetailPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const pollTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, []);

  const fetchDoc = useCallback(async () => {
    if (!user || !id) return;
    try {
      const data = await apiRequest<DocDetail>(`/status/${id}`);
      setDoc(data);
      setLoading(false);
      if (data.status === "processing") {
        pollTimeout.current = setTimeout(fetchDoc, POLL_INTERVAL_MS);
      }
    } catch (err: any) {
      if (isApiUnauthorized(err)) {
        toast("Session expired. Please sign in again.", "error");
        router.push("/login");
        return;
      }
      toast(err.message || "Failed to load document", "error");
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (!user || !id) return;
    setLoading(true);
    fetchDoc();
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, [user, id, fetchDoc]);

  function handleCopy() {
    if (!doc?.pdf_url) return;
    navigator.clipboard.writeText(doc.pdf_url);
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
    <main className="min-h-screen px-4 py-10 md:py-16 animate-fade-in">
      <div className="max-w-lg mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-faint hover:text-accent transition-[color] duration-150 ease-out-quart mb-6"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to documents
        </Link>

        {loading ? (
          <div className="card p-6 animate-pulse space-y-4">
            <div className="h-5 bg-accent-soft rounded w-1/2" />
            <div className="h-3 bg-accent-soft rounded w-1/3" />
            <div className="h-48 bg-accent-soft rounded-xl" />
          </div>
        ) : !doc ? (
          <div className="card p-12 text-center">
            <p className="text-sm text-muted">Document not found.</p>
            <Link href="/dashboard" className="text-sm font-medium text-accent hover:opacity-80 mt-2 inline-block">
              Go to dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-6 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 mr-4">
                  <h1 className="text-lg font-bold text-ink truncate">{doc.filename}</h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusBadgeColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    {doc.created_at && (
                      <span className="text-xs text-faint">
                        {new Date(doc.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {doc.status === "failed" && doc.error_message && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl mb-4">
                  <p className="text-xs text-red-600 dark:text-red-400">{doc.error_message}</p>
                </div>
              )}

              {doc.status === "processing" && (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-ink">Still processing</p>
                  <p className="text-xs text-faint mt-1">The QR code will appear once processing is complete.</p>
                </div>
              )}

              {doc.qr_code_base64 && (
                <div className="text-center">
                  <div className="bg-surface border border-line rounded-2xl p-4 inline-block mb-2 shadow-sm">
                    <img
                      src={`data:image/png;base64,${doc.qr_code_base64}`}
                      alt="QR code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}
            </div>

            {doc.pdf_url && (
              <div className="card p-5 animate-slide-up" style={{ animationDelay: "50ms" }}>
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Document URL</h2>
                <p className="text-sm text-ink/80 break-all bg-accent-soft rounded-xl p-3 border border-line mb-3">
                  {doc.pdf_url}
                </p>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="btn-secondary">
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                  <a
                    href={doc.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-center"
                  >
                    Open PDF
                  </a>
                </div>
              </div>
            )}

            {doc.qr_code_base64 && (
              <div className="card p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Download QR</h2>
                <a
                  href={`data:image/png;base64,${doc.qr_code_base64}`}
                  download={`${doc.filename}-qr.png`}
                  className="btn-primary text-center inline-block"
                >
                  Download QR Code
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
