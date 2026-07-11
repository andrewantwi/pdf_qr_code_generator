"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/Toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center group-hover:bg-brand-700 transition-[background-color] duration-150 ease-out-quart">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-900">PDFtoQR</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-700 transition-[color] duration-150 ease-out-quart">
                Documents
              </Link>
              <span className="text-xs text-slate-300 hidden sm:inline">{user.username}</span>
              <button
                onClick={() => { logout(); toast("Logged out", "info"); }}
                className="text-xs text-slate-400 hover:text-slate-600 transition-[color] duration-150 ease-out-quart select-none"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs text-slate-400 hover:text-slate-700 transition-[color] duration-150 ease-out-quart">
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-[background-color,transform] duration-150 ease-out-quart active:scale-[0.95] select-none"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
