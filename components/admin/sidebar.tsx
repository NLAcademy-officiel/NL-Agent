"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/admin/abonnements", label: "Abonnements" },
  { href: "/admin/systeme", label: "Système" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-surface md:block">
      <div className="flex h-16 items-center gap-2 border-b border-line px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
          NL
        </span>
        <span className="text-sm font-semibold">Administration</span>
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
                active && "bg-white/10 text-white",
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
