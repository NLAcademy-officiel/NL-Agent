"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
{ href: "/dashboard", label: "Vue d'ensemble" },
{ href: "/dashboard/agent", label: "Mon agent" },
{ href: "/dashboard/conversations", label: "Conversations" },
{ href: "/dashboard/leads", label: "Prospects" },
{ href: "/dashboard/statistiques", label: "Statistiques" },
{ href: "/dashboard/abonnement", label: "Abonnement" },
{ href: "/dashboard/parametres", label: "Paramètres" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-surface md:block">
      <div className="flex h-16 items-center gap-2 border-b border-line px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
          NL
        </span>
        <span className="text-sm font-semibold">NL Agent</span>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white",
                active && "bg-brand-500/15 text-brand-300",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
