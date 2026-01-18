"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Something went wrong.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We hit an unexpected error while loading the dashboard. Try again.
        </p>
        <button
          className="mt-6 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => reset()}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
