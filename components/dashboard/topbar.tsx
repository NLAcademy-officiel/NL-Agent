import { Badge } from "@/components/ui/badge";

export function DashboardTopbar({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-ink px-6">
      <h1 className="text-base font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <Badge variant="neutral">Compte démo</Badge>
        <div className="h-8 w-8 rounded-full bg-brand-500/20 text-center text-sm leading-8 text-brand-300">
          U
        </div>
      </div>
    </header>
  );
}
