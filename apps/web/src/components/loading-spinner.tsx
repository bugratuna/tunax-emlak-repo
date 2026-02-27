export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <span className="sr-only">{label}</span>
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600"
      />
    </div>
  );
}
