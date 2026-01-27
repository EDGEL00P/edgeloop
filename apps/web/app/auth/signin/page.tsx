import * as React from "react";
import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h1 className="text-xl font-semibold">Sign-in unavailable</h1>
          <p className="mt-2 text-sm opacity-70">
            Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg)] to-[var(--bg)]/80 p-4">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[var(--card)] border border-[var(--border)]"
          }
        }}
        routing="path"
        path="/auth/signin"
      />
    </div>
  )
}