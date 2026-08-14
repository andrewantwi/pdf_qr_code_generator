"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <p className="text-5xl font-bold text-accent">404</p>
        <h1 className="text-xl font-bold tracking-tight text-ink mt-3">Page not found</h1>
        <p className="text-sm text-faint mt-2">The page you’re looking for doesn’t exist or has moved.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Go home
        </Link>
      </div>
    </main>
  );
}
