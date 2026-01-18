/**
 * Error Boundary Component
 * 
 * Displays error UI when an unhandled error occurs in the application.
 * Provides retry functionality to recover from transient errors.
 * 
 * @module app/error
 */

"use client";

import { useEffect } from "react";
import type React from "react";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): React.JSX.Element {
  useEffect(() => {
    // Log error for debugging (non-critical, suppress lint warning)
    // eslint-disable-next-line no-console
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Something went wrong.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We hit an unexpected error while loading the dashboard. Try again.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          className="mt-6 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={reset}
          aria-label="Retry loading the dashboard"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
