import type { Metadata } from "next";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Administration",
};

const STATS = [
  { label: "Organisations actives", value: "—" },
  { label: "Utilisateurs", value: "—" },
  { label: "Abonnements actifs", value: "—" },
  { label: "Incidents ouverts", value: "—" },
];

export default function AdminPage() {
  return (
    <>
      <DashboardTopbar title="Administration" />
      <div className="p-6">
        <div className="mb-6">
          <Badge variant="neutral">Phase 1 — squelette</Badge>
          <p className="mt-3 max-w-2xl text-sm text-white/60">
            Espace réservé à l&apos;équipe NL Agent pour superviser les organisations clientes, les utilisateurs et
            les abonnements. Aucune donnée réelle n&apos;est encore connectée.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <Card key={s.label}>
              <CardDescription>{s.label}</CardDescription>
              <p className="mt-2 text-2xl font-semibold text-white">{s.value}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
