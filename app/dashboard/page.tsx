"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import LoadingSpinner from "@/lib/LoadingSpinner";
import { apiRequest, isApiUnauthorized } from "@/lib/api";
import { useToast } from "@/lib/Toast";
import ConfirmModal from "@/lib/ConfirmModal";

interface Doc {
  id: string;
  filename: string;
  pdf_url: string | null;
  status: string;
  progress: number;
  created_at: string;
  scan_count?: number;
  tracking_enabled?: boolean;
}

function statusColor(status: string) {
  switch (status) {
    case "live": return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
    case "processing": return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
    case "failed": return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300";
    default: return "bg-accent-soft text-muted";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "live": return "Live";
    case "processing": return "Processing";
    case "failed": return "Failed";
    default: return status;
  }
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useRequireAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    apiRequest<Doc[]>("/documents")
      .then((data) => {
        if (!cancelled) setDocs(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isApiUnauthorized(err)) {
          logout();
          router.push("/login");
        } else {
          toast("Failed to load documents", "error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    if (!docs.some((d) => d.status === "processing")) return;
    const id = setInterval(() => {
      apiRequest<Doc[]>("/documents")
        .then(setDocs)
        .catch(() => {
          /* keep last known state; failures are transient */
        });
    }, 5000);
    return () => clearInterval(id);
  }, [user, loading, docs, logout, router, toast]);

  function handleConfirmDelete(id: string) {
    setConfirmDelete(id);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setDeleting(id);
    setConfirmDelete(null);
    try {
      await apiRequest(`/documents/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast("Document deleted", "success");
    } catch (err: any) {
      if (isApiUnauthorized(err)) {
        logout();
        router.push("/login");
      } else {
        toast(err.message || "Delete failed", "error");
      }
    } finally {
      setDeleting(null);
    }
  }

  if (authLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen px-4 py-12 md:py-16 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-10 animate-slide-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Documents</h1>
            <p className="text-sm text-faint mt-1.5">Your uploaded PDFs and QR codes.</p>
          </div>
          {!loading && docs.length > 0 && (
            <p className="text-xs font-medium text-faint tabular-nums shrink-0">
              {docs.length} {docs.length === 1 ? "file" : "files"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-accent-soft rounded w-1/3 mb-2" />
                <div className="h-3 bg-accent-soft rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="card p-14 text-center animate-fade-in">
            <div className="w-14 h-14 bg-accent-soft rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-ink">No documents yet</p>
            <p className="text-xs text-faint mt-1.5 mb-6">Upload your first PDF to get started.</p>
            <Link href="/" className="inline-flex items-center justify-center bg-accent text-accent-fg rounded-xl py-2.5 px-5 text-sm font-semibold hover:opacity-90 transition-[opacity,transform] duration-150 ease-out-quart active:scale-[0.97]">
              Upload a PDF
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {docs.map((doc, i) => (
              <div
                key={doc.id}
                className="card p-4 sm:p-5 flex items-center justify-between animate-slide-up hover:border-accent/40 transition-[border-color,box-shadow] duration-150 ease-out-quart hover:shadow-md"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Link href={`/documents/${doc.id}`} className="min-w-0 mr-3 flex-1 group">
                  <p className="text-sm font-medium text-ink truncate group-hover:text-accent transition-[color] duration-150 ease-out-quart">{doc.filename}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${statusColor(doc.status)}`}>
                      {statusLabel(doc.status)}
                    </span>
                    <span className="text-xs text-faint">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    {doc.status === "live" && doc.tracking_enabled && (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-faint tabular-nums"
                        title="QR code scan count"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {doc.scan_count ?? 0} {doc.scan_count === 1 ? "scan" : "scans"}
                      </span>
                    )}
                    {doc.status === "live" && !doc.tracking_enabled && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-accent-soft text-faint">
                        Untracked
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-1.5 shrink-0">
                  {doc.pdf_url && (
                    <a
                      href={doc.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-accent-soft hover:opacity-80 border border-line flex items-center justify-center transition-[opacity,transform] duration-150 ease-out-quart active:scale-[0.93] select-none"
                      title="Open PDF"
                      aria-label={`Open PDF: ${doc.filename}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => handleConfirmDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="w-9 h-9 rounded-xl bg-accent-soft hover:bg-red-50 dark:hover:bg-red-900/30 border border-line flex items-center justify-center transition-[background-color,transform] duration-150 ease-out-quart disabled:opacity-40 active:scale-[0.93] select-none"
                    title="Delete"
                    aria-label={`Delete document: ${doc.filename}`}
                  >
                    <svg className={`w-4 h-4 ${deleting === doc.id ? "text-faint" : "text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-line">
          <Link href="/" className="text-xs text-faint hover:text-accent transition-[color] duration-150 ease-out-quart">
            ← New upload
          </Link>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete document?"
        description="This action cannot be undone."
        busy={deleting === confirmDelete}
        busyLabel="Deleting…"
        onConfirm={handleDelete}
      />
    </main>
  );
}
