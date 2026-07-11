import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";
import { ToastProvider } from "@/lib/Toast";
import Navbar from "@/lib/Navbar";

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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
