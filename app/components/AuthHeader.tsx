/**
 * Authentication Header Component
 * 
 * Displays Clerk sign-in/sign-up buttons for unauthenticated users
 * and UserButton for authenticated users.
 * 
 * @module components/AuthHeader
 */

"use client";

import type React from "react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function AuthHeader(): React.JSX.Element {
  return (
    <header className="flex h-16 items-center justify-end gap-4 p-4" role="banner">
      <SignedOut>
        <SignInButton>
          <button
            type="button"
            className="cursor-pointer rounded-full bg-[#6c47ff] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5a3ae6] sm:h-12 sm:px-5 sm:text-base"
            aria-label="Sign in to your account"
          >
            Sign In
          </button>
        </SignInButton>
        <SignUpButton>
          <button
            type="button"
            className="cursor-pointer rounded-full bg-[#6c47ff] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5a3ae6] sm:h-12 sm:px-5 sm:text-base"
            aria-label="Create a new account"
          >
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  );
}