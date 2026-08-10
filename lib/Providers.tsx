"use client";

import { AuthProvider } from "@/lib/AuthProvider";
import { ToastProvider } from "@/lib/Toast";
import { ThemeProvider } from "@/lib/ThemeProvider";
import Sidebar from "@/lib/Sidebar";
import ThemeToggle from "@/app/ThemeToggle";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Sidebar />
          <div className="md:ml-[15.5rem] min-h-screen relative">
            {children}
            <ThemeToggle />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}