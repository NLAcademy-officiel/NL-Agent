import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

const STATS = [
  { label: "Conversations (7 jours)", value: "—" },
  { label: "Prospects qualifiés", value: "—" },
  { label: "Taux de réponse", value: "—" },
  { label: "Relances en attente", value: "—" },
];

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("nl_agent_session")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const session = await getSession(token);

  if (!session) {
    redirect("/auth/login");
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: session.organizationId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!organization) {
    redirect("/auth/login");
  }

  return (
    <>
      <DashboardTopbar title="Vue d'ensemble" />

      <div className="p-6">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="neutral">Phase 2 — authentification</Badge>

            <span className="text-sm text-white/50">
              {organization.name}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Bienvenue dans NL Agent
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Votre espace entreprise est maintenant connecté à votre compte.
            Les statistiques, conversations, prospects et agents IA seront
            progressivement intégrés dans les prochaines phases.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <Card key={s.label}>
              <CardDescription>{s.label}</CardDescription>
              <p className="mt-2 text-2xl font-semibold text-white">
                {s.value}
              </p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mon agent commercial</CardTitle>

            <CardDescription>
              Configurez votre agent IA : ton, offres, base de connaissances
              et canaux de conversation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-white/70">
                Entreprise :{" "}
                <span className="font-medium text-white">
                  {organization.name}
                </span>
              </p>

              <p className="text-sm text-white/50">
                La configuration de l&apos;agent sera disponible dans la
                prochaine phase.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
