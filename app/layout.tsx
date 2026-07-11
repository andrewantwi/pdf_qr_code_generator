import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";
import { ToastProvider } from "@/lib/Toast";
import { ThemeProvider } from "@/lib/ThemeProvider";
import Sidebar from "@/lib/Sidebar";

export const metadata: Metadata = {
  title: "PDFtoQR — Turn PDFs into QR codes",
  description: "Upload a PDF, get a QR code that opens it instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Sidebar />
              <div className="md:ml-56 min-h-screen">
                {children}
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
