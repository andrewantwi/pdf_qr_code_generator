"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { getToken } from "@/lib/auth";
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeleting(id);
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
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-40"
                >
                  {deleting === doc.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
