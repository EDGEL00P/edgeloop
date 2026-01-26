import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/admin/login");
  }

  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        <p className="text-sm opacity-70">Restricted access. Manage system settings and data.</p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Overview</h2>
        <p className="mt-2 text-sm opacity-70">Admin tools will appear here.</p>
      </section>
    </div>
  );
}
