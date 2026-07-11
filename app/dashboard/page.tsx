"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { getToken, clearToken } from "@/lib/auth";
import { useToast } from "@/lib/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Doc {
  id: string;
  filename: string;
  pdf_url: string | null;
  status: string;
  progress: number;
  created_at: string;
}

function statusColor(status: string) {
  switch (status) {
    case "live": return "bg-emerald-100 text-emerald-700";
    case "processing": return "bg-amber-100 text-amber-700";
    case "failed": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (!authLoading && !user && !redirected.current) {
      redirected.current = true;
      router.replace("/login");
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/documents`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => {
        if (res.status === 401) { logout(); router.push("/login"); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) setDocs(data);
      })
      .finally(() => setLoading(false));
  }, [user, logout, router]);

  function handleConfirmDelete(id: string) {
    setConfirmDelete(id);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setDeleting(id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) { logout(); router.push("/login"); return; }
      if (!res.ok) throw new Error("Failed to delete");
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast("Document deleted", "success");
    } catch (err: any) {
      toast(err.message || "Delete failed", "error");
    } finally {
      setDeleting(null);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setConfirmDeleteAccount(false);
    try {
      const res = await fetch(`${API_URL}/auth/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to delete account");
      clearToken();
      toast("Account deleted", "success");
      router.push("/register");
    } catch (err: any) {
      toast(err.message || "Delete failed", "error");
    } finally {
      setDeletingAccount(false);
    }
  }

  if (authLoading) return null;

  return (
    <main className="min-h-screen px-4 py-10 md:py-16 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Documents</h1>
            <p className="text-xs text-slate-400 mt-0.5">All your uploaded PDFs and their QR codes.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-900">No documents yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-5">Upload your first PDF to get started.</p>
            <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Upload a PDF →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc, i) => (
              <div
                key={doc.id}
                className="card p-4 flex items-center justify-between animate-slide-up hover:border-brand-200 transition-[border-color] duration-150 ease-out-quart"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Link href={`/documents/${doc.id}`} className="min-w-0 mr-4 flex-1 group">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-600 transition-[color] duration-150 ease-out-quart">{doc.filename}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.pdf_url && (
                    <a
                      href={doc.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-[background-color,transform] duration-150 ease-out-quart active:scale-[0.93] select-none"
                      title="Open PDF"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => handleConfirmDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 flex items-center justify-center transition-[background-color,transform] duration-150 ease-out-quart disabled:opacity-40 active:scale-[0.93] select-none"
                    title="Delete"
                  >
                    <svg className={`w-4 h-4 ${deleting === doc.id ? "text-slate-300" : "text-slate-400 hover:text-red-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
          <Link href="/" className="text-xs text-slate-400 hover:text-brand-600 transition-[color] duration-150 ease-out-quart">
            ← New upload
          </Link>
          <button
            onClick={() => setConfirmDeleteAccount(true)}
            disabled={deletingAccount}
            className="text-xs text-red-400 hover:text-red-600 transition-[color] duration-150 ease-out-quart disabled:opacity-40 select-none"
          >
            {deletingAccount ? "Deleting account…" : "Delete account"}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 animate-scale-in">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">Delete document?</p>
            <p className="text-xs text-slate-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-[background-color,transform] duration-150 ease-out-quart active:scale-[0.97] select-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-[background-color,transform] duration-150 ease-out-quart active:scale-[0.97] select-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 animate-scale-in">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">Delete account?</p>
            <p className="text-xs text-slate-500 mb-5">All your documents will be permanently removed. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteAccount(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-[background-color,transform] duration-150 ease-out-quart active:scale-[0.97] select-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-[background-color,transform] duration-150 ease-out-quart active:scale-[0.97] select-none"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
