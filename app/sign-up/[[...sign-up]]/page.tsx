/**
 * Sign-Up Page
 * 
 * Renders Clerk's SignUp component for user registration.
 * Uses Next.js optional catch-all route to handle all sign-up sub-routes.
 * 
 * @module app/sign-up/[[...sign-up]]/page
 */

import type React from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
