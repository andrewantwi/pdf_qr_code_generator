import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/lib/Providers";

export const metadata: Metadata = {
  title: "PDFtoQR — Turn PDFs into QR codes",
  description: "Upload a PDF, get a QR code that opens it instantly.",
  openGraph: {
    title: "PDFtoQR — Turn PDFs into QR codes",
    description: "Upload a PDF, get a QR code that opens it instantly.",
    type: "website",
    siteName: "PDFtoQR",
  },
  twitter: {
    card: "summary",
    title: "PDFtoQR — Turn PDFs into QR codes",
    description: "Upload a PDF, get a QR code that opens it instantly.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23588157' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans text-ink bg-canvas">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
