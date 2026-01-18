export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="h-10 w-1/3 rounded-xl bg-secondary/40" />
        <div className="mt-4 h-6 w-2/3 rounded-xl bg-secondary/30" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-32 rounded-2xl bg-secondary/20" />
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="h-64 rounded-2xl bg-secondary/20" />
          ))}
        </div>
      </div>
    </div>
  );
}
