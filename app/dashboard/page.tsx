"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Your documents</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-slate-500">{user.username}</span>
            )}
            <button
              onClick={() => { logout(); toast("Logged out", "info"); }}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Logout
            </button>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
              + New upload
            </Link>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading…</p>}

        {!loading && docs.length === 0 && (
          <p className="text-sm text-slate-400">No documents yet. Upload your first PDF.</p>
        )}

        <ul className="space-y-3">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{doc.filename}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {doc.status} · {new Date(doc.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {doc.pdf_url && (
                  <a
                    href={doc.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-500 hover:text-slate-800 underline"
                  >
                    View
                  </a>
                )}
                <button
                  onClick={() => handleConfirmDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-40"
                >
                  {deleting === doc.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 pt-6 border-t border-slate-200">
          <button
            onClick={() => setConfirmDeleteAccount(true)}
            disabled={deletingAccount}
            className="text-xs text-red-400 hover:text-red-600 underline disabled:opacity-40"
          >
            {deletingAccount ? "Deleting account…" : "Delete account"}
          </button>
        </div>
      </div>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full mx-4">
            <p className="text-sm text-slate-900 font-medium mb-2">Delete document?</p>
            <p className="text-xs text-slate-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full mx-4">
            <p className="text-sm text-slate-900 font-medium mb-2">Delete account?</p>
            <p className="text-xs text-slate-500 mb-5">All documents will be permanently deleted. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteAccount(false)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
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
