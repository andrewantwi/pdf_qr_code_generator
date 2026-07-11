"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/Toast";

const navLinks = [
  { href: "/", label: "Upload PDF", icon: "upload" },
  { href: "/dashboard", label: "Documents", icon: "documents" },
];

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const cls = active ? "text-brand-600" : "text-slate-400";
  if (icon === "upload") {
    return (
      <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    );
  }
  return (
    <svg className={`w-5 h-5 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-30 w-8 h-8 flex md:hidden items-center justify-center rounded-lg hover:bg-slate-100 transition-[background-color] duration-150 ease-out-quart"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden animate-fade-in-fast"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-56 bg-white border-r border-slate-200 flex flex-col transition-transform duration-250 ease-out-quart md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center group-hover:bg-brand-700 transition-[background-color] duration-150 ease-out-quart">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-900">PDFtoQR</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex md:hidden items-center justify-center rounded-lg hover:bg-slate-100 transition-[background-color] duration-150 ease-out-quart"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-[background-color,color] duration-150 ease-out-quart ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <NavIcon icon={link.icon} active={active} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100">
          {user ? (
            <div className="space-y-2">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-900 truncate">{user.username}</p>
              </div>
              <button
                onClick={() => { logout(); toast("Logged out", "info"); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-[background-color,color] duration-150 ease-out-quart"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-[background-color,color] duration-150 ease-out-quart"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-[background-color] duration-150 ease-out-quart active:scale-[0.97] select-none"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
