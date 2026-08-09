import type { Metadata } from "next";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

const STATS = [
  { label: "Conversations (7 jours)", value: "—" },
  { label: "Prospects qualifiés", value: "—" },
  { label: "Taux de réponse", value: "—" },
  { label: "Relances en attente", value: "—" },
];

export default function DashboardPage() {
  return (
    <>
      <DashboardTopbar title="Vue d'ensemble" />
      <div className="p-6">
        <div className="mb-6">
          <Badge variant="neutral">Phase 1 — squelette</Badge>
          <p className="mt-3 max-w-2xl text-sm text-white/60">
            Ce tableau de bord est une interface statique. Les statistiques, conversations et prospects réels
            seront connectés dans une phase ultérieure (voir <code className="text-white/80">lib/analytics</code>,{" "}
            <code className="text-white/80">lib/crm</code>).
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <Card key={s.label}>
              <CardDescription>{s.label}</CardDescription>
              <p className="mt-2 text-2xl font-semibold text-white">{s.value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mon agent commercial</CardTitle>
            <CardDescription>
              Configurez votre agent IA : ton, offres, base de connaissances et canaux de conversation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50">
              La configuration de l&apos;agent sera disponible dans une prochaine phase.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
