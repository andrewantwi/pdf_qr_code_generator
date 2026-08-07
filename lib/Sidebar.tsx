"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/Toast";
import { useTheme } from "@/lib/ThemeProvider";

const navLinks = [
  { href: "/", label: "Upload PDF", icon: "upload" as const },
  { href: "/dashboard", label: "Documents", icon: "documents" as const },
];

function NavIcon({ icon }: { icon: "upload" | "documents" }) {
  if (icon === "upload") {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
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
  const { theme, toggle: toggleTheme } = useTheme();
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[15.5rem] flex-col bg-surface border-r border-line transition-transform duration-250 ease-out-quart md:translate-x-0 ${
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
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-accent-soft/60 hover:text-ink transition-colors duration-150"
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

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
