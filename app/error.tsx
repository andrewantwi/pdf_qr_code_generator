"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight text-ink">Something went wrong</h1>
        <p className="text-sm text-faint mt-2">An unexpected error occurred while loading this page.</p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
