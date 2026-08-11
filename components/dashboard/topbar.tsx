"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";

export function DashboardTopbar({ title }: { title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/auth/login");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-ink px-6">
      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        <Badge variant="neutral">NLAcademy</Badge>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="rounded-md px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Déconnexion..." : "Déconnexion"}
        </button>
      </div>
    </header>
  );
}
