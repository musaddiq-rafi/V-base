interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Loading..." }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <span className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** Inline variant for embedded loading states (inside a room/editor) */
export function InlineLoader({ label }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background gap-3">
      <div className="relative w-8 h-8">
        <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <span className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}
