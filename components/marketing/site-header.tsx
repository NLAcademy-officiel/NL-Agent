"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            NL
          </span>
          NL Agent
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-white/60 transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className="text-sm text-white/70 hover:text-white">
            Connexion
          </Link>
          <Link href="/auth/register">
            <Button size="sm">Essayer gratuitement</Button>
          </Link>
        </div>

        <button
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-1.5 p-2 md:hidden"
        >
          <span className={`h-px w-6 bg-white transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-6 bg-white transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-ink px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm text-white/70 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/auth/login" onClick={() => setOpen(false)} className="text-sm text-white/70">
                Connexion
              </Link>
              <Link href="/auth/register" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full">Essayer gratuitement</Button>
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
