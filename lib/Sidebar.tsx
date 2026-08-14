"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/Toast";

const navLinks = [
  { href: "/", label: "Upload PDF", icon: "upload" as const },
  { href: "/dashboard", label: "Documents", icon: "documents" as const },
  { href: "/settings", label: "Settings", icon: "settings" as const },
];

type NavIconType = "upload" | "documents" | "settings";

function NavIcon({ icon }: { icon: NavIconType }) {
  if (icon === "upload") {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    );
  }
  if (icon === "settings") {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.542-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed top-3.5 left-3.5 z-30 flex md:hidden items-center justify-center w-10 h-10 rounded-full bg-surface border border-line text-ink shadow-sm transition-opacity duration-150 ${
          open ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="app-sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        ref={panelRef}
        id="app-sidebar"
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[15.5rem] flex-col bg-surface border-r border-line transition-transform duration-300 ease-out-quart md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-5">
          <Link
            href={user ? "/" : "/login"}
            className="text-[15px] font-semibold tracking-tight text-ink"
            onClick={() => setOpen(false)}
          >
            PDF<span className="text-accent">to</span>QR
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden -mr-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:text-ink"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 pt-2">
          <ul className="space-y-0.5">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                      active
                        ? "bg-accent-soft text-ink font-medium"
                        : "text-muted hover:bg-accent-soft/60 hover:text-ink"
                    }`}
                  >
                    <span className={active ? "text-accent" : "text-faint"}>
                      <NavIcon icon={link.icon} />
                    </span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto px-3 pb-4 space-y-1">
          {user ? (
            <div className="pt-2 mt-1 border-t border-line">
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold uppercase text-accent">
                  {user.username.slice(0, 1)}
                </div>
                <p className="truncate text-sm font-medium text-ink">{user.username}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  toast("Logged out", "info");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Log out
              </button>
            </div>
          ) : (
            <div className="pt-2 mt-1 border-t border-line space-y-1.5">
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-accent-soft/60 hover:text-ink transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold bg-accent text-accent-fg hover:opacity-90 transition-opacity"
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
