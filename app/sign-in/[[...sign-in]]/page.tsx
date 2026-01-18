/**
 * Sign-In Page
 * 
 * Renders Clerk's SignIn component for user authentication.
 * Uses Next.js optional catch-all route to handle all sign-in sub-routes.
 * 
 * @module app/sign-in/[[...sign-in]]/page
 */

import type React from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
