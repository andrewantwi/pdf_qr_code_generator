"use client";

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  danger?: boolean;
  onConfirm: () => void;
}

export default function ConfirmModal({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  busy = false,
  danger = true,
  onConfirm,
}: ConfirmModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!busy) onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-xl border border-line animate-scale-in"
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            danger
              ? "bg-red-100 dark:bg-red-900/30"
              : "bg-accent-soft"
          }`}
        >
          {danger ? (
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h3 id="confirm-modal-title" className="text-sm font-semibold text-ink mb-1">
          {title}
        </h3>
        {description && <div className="text-xs text-muted mb-5">{description}</div>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-danger-secondary disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={danger ? "btn-danger" : "btn-primary"}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
