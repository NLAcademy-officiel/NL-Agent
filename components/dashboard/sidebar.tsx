"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
{
href: "/dashboard",
label: "Vue d'ensemble",
},
{
href: "/dashboard/agent",
label: "Mon agent",
},
{
href: "/dashboard/conversations",
label: "Conversations",
},
{
href: "/dashboard/leads",
label: "Prospects",
},
{
href: "/dashboard/statistiques",
label: "Statistiques",
},
{
href: "/dashboard/abonnement",
label: "Abonnement",
},
{
href: "/dashboard/parametres",
label: "Parametres",
},
];

export function DashboardSidebar() {
const pathname = usePathname();
const [open, setOpen] = useState(false);

const closeMenu = () => {
setOpen(false);
};

return (
<>
<button
type="button"
onClick={() => setOpen(true)}
aria-label="Ouvrir le menu"
aria-expanded={open}
className="fixed right-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-lg text-white shadow-lg transition hover:bg-white/10 md:hidden"
>
MENU
</button>

{open && (
<button
type="button"
aria-label="Fermer le menu"
onClick={closeMenu}
className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm md:hidden"
/>
)}

<aside
aria-label="Navigation mobile"
className={cn(
"fixed right-0 top-0 z-[80] flex h-screen w-[min(85vw,320px)] flex-col border-l border-line bg-surface shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
open ? "translate-x-0" : "translate-x-full"
)}
>
<div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
<div className="flex items-center gap-2">
<span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
NL
</span>

<span className="text-sm font-semibold text-white">
NL Agent
</span>
</div>

<button
type="button"
onClick={closeMenu}
aria-label="Fermer le menu"
className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-white/70 transition hover:bg-white/10 hover:text-white"
>
X
</button>
</div>

<nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
{NAV.map((item) => {
const active =
pathname === item.href ||
(item.href !== "/dashboard" &&
pathname.startsWith(item.href));

return (
<Link
key={item.href}
href={item.href}
onClick={closeMenu}
className={cn(
"rounded-xl px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white",
active && "bg-brand-500/15 text-brand-300"
)}
>
{item.label}
</Link>
);
})}
</nav>

<div className="shrink-0 border-t border-line p-4">
<p className="text-xs text-white/40">
NL Agent
</p>
</div>
</aside>

<aside
aria-label="Navigation principale"
className="hidden w-64 shrink-0 border-r border-line bg-surface md:block"
>
<div className="flex h-16 items-center gap-2 border-b border-line px-6">
<span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
NL
</span>

<span className="text-sm font-semibold text-white">
NL Agent
</span>
</div>

<nav className="flex flex-col gap-1 p-4">
{NAV.map((item) => {
const active =
pathname === item.href ||
(item.href !== "/dashboard" &&
pathname.startsWith(item.href));

return (
<Link
key={item.href}
href={item.href}
className={cn(
"rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white",
active && "bg-brand-500/15 text-brand-300"
)}
>
{item.label}
</Link>
);
})}
</nav>
</aside>
</>
);
}