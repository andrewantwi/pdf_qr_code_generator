"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/AuthProvider";
import { ToastProvider } from "@/lib/Toast";
import { ThemeProvider } from "@/lib/ThemeProvider";
import Sidebar from "@/lib/Sidebar";
import ThemeToggle from "@/app/ThemeToggle";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showShell = !PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          {showShell && <Sidebar />}
          <div
            className={
              showShell
                ? "md:ml-[15.5rem] min-h-screen relative"
                : "min-h-screen relative"
            }
          >
            {children}
            <ThemeToggle />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}