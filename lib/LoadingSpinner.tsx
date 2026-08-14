export default function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-faint animate-pulse">{label}</p>
      </div>
    </main>
  );
}
