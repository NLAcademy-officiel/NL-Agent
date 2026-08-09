import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-16">
      <Link href="/" className="mb-10 flex items-center gap-2 text-base font-semibold text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          NL
        </span>
        NL Agent
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
