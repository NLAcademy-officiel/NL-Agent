import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500 text-[11px] font-bold text-white">
            NL
          </span>
          © {new Date().getFullYear()} NL Agent — Tous droits réservés
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-white/60">
          <Link href="/auth/login" className="hover:text-white">Connexion</Link>
          <Link href="/auth/register" className="hover:text-white">Créer un compte</Link>
        </div>
      </div>
    </footer>
  );
}
