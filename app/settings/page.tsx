"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import LoadingSpinner from "@/lib/LoadingSpinner";
import { apiRequest, isApiUnauthorized } from "@/lib/api";
import { useToast } from "@/lib/Toast";
import ConfirmModal from "@/lib/ConfirmModal";

export default function Settings() {
  const { user, loading: authLoading, refreshUser, logout } = useRequireAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) setUsername(user.username || "");
  }, [user]);

  async function handleSaveUsername() {
    if (!username.trim()) return;
    setSaving(true);
    try {
      await apiRequest("/auth/profile", {
        method: "PATCH",
        body: { username: username.trim() },
      });
      await refreshUser();
      setEditing(false);
      toast("Profile updated", "success");
    } catch (err: any) {
      if (isApiUnauthorized(err)) {
        logout();
        router.push("/login");
        toast("Session expired. Please sign in again.", "error");
      } else {
        toast(err.message || "Update failed", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast("Fill in both fields", "error");
      return;
    }
    if (newPassword.length < 4) {
      toast("Password must be at least 4 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await apiRequest("/auth/password", {
        method: "PATCH",
        body: { current_password: currentPassword, new_password: newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Password updated", "success");
    } catch (err: any) {
      if (isApiUnauthorized(err)) {
        logout();
        router.push("/login");
        toast("Session expired. Please sign in again.", "error");
      } else {
        toast(err.message || "Update failed", "error");
      }
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setConfirmDeleteAccount(false);
    try {
      await apiRequest("/auth/account", { method: "DELETE" });
      logout();
      toast("Account deleted", "success");
      router.push("/register");
    } catch (err: any) {
      toast(err.message || "Delete failed", "error");
    } finally {
      setDeletingAccount(false);
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
        <div className="mb-10 animate-slide-up">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Settings</h1>
          <p className="text-sm text-faint mt-1.5">Manage your account.</p>
        </div>

        <div className="space-y-4">
          {/* Profile Card */}
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center text-lg font-semibold text-accent shrink-0">
                {user?.username?.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                {editing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveUsername();
                    }}
                    className="w-full"
                  >
                    <label htmlFor="edit-username" className="sr-only">Username</label>
                    <input
                      id="edit-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field py-2 px-3 text-sm w-full"
                      autoFocus
                    />
                  </form>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-ink truncate">{user?.username}</p>
                    <p className="text-xs text-faint truncate">{user?.email || "No email on file"}</p>
                    <div className="mt-1">
                      {user?.email_verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Email verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          Email not verified
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => { setEditing(false); setUsername(user?.username || ""); }}
                    className="btn-danger-secondary py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving || !username.trim() || username === user?.username}
                    className="btn-primary !py-2 !px-4 text-xs"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setUsername(user?.username || ""); setEditing(true); }}
                  className="btn-primary !py-2 !px-4 text-xs"
                >
                  Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="card p-6 animate-slide-up">
            <p className="text-sm font-medium text-ink mb-4">Change password</p>
            <div className="space-y-3">
              <div>
                <label htmlFor="current-password" className="text-xs font-medium text-muted mb-1.5 block">Current password</label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field pr-11 py-2 text-sm"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-faint hover:text-ink transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="new-password" className="text-xs font-medium text-muted mb-1.5 block">New password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field py-2 text-sm"
                  placeholder="Min. 4 characters"
                  required
                  minLength={4}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="text-xs font-medium text-muted mb-1.5 block">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field py-2 text-sm"
                  placeholder="Re-enter new password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="btn-primary !py-2 !px-4 text-xs"
              >
                {savingPassword ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="card p-6 border-red-200 dark:border-red-900/40 animate-slide-up">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625l6.28-10.875zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Danger zone
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">Delete account</p>
                <p className="text-xs text-muted mt-1">
                  Permanently deletes your account, uploaded documents, and all associated data. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setConfirmDeleteAccount(true)}
                disabled={deletingAccount}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold
                         bg-red-600 text-white hover:bg-red-700
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-[transform,background-color] duration-150 ease-out-quart
                         active:scale-[0.97] select-none"
              >
                {deletingAccount ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteAccount}
        onClose={() => setConfirmDeleteAccount(false)}
        title="Delete your account?"
        confirmLabel="Delete account"
        busy={deletingAccount}
        busyLabel="Deleting account…"
        onConfirm={handleDeleteAccount}
        description={
          <div className="mt-4 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-dashed border-red-200 dark:border-red-800 p-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 dark:text-red-400">This will</p>
            <ul className="text-xs text-muted space-y-1.5">
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Erase your account and sign-in credentials
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Delete every document you have uploaded
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove all generated QR codes
              </li>
            </ul>
          </div>
        }
      />
    </main>
  );
}