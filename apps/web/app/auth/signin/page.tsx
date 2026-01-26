import * as React from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
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