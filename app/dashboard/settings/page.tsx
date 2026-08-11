import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

import { DashboardTopbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Profil & Organisation",
};

export default async function SettingsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("nl_agent_session")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const session = await getSession(token);

  if (!session) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <>
      <DashboardTopbar title="Profil & Organisation" />

      <div className="p-6">
        <div className="mb-6">
          <Badge variant="neutral">Phase 3 — Profil</Badge>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Mon espace entreprise
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Consultez les informations de votre compte et de votre
            organisation.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mon compte</CardTitle>

              <CardDescription>
                Informations de l'utilisateur connecté.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-white/40">Nom</p>
                <p className="mt-1 text-sm text-white">
                  {user.name || "Non renseigné"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Adresse e-mail</p>
                <p className="mt-1 text-sm text-white">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Rôle</p>
                <p className="mt-1 text-sm text-white">
                  {user.role}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Compte créé le
                </p>
                <p className="mt-1 text-sm text-white">
                  {user.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organisation</CardTitle>

              <CardDescription>
                Informations de votre entreprise.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-white/40">
                  Nom de l'entreprise
                </p>

                <p className="mt-1 text-sm font-medium text-white">
                  {user.organization.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Identifiant
                </p>

                <p className="mt-1 break-all text-sm text-white/70">
                  {user.organization.id}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Slug
                </p>

                <p className="mt-1 text-sm text-white">
                  {user.organization.slug}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Organisation créée le
                </p>

                <p className="mt-1 text-sm text-white">
                  {user.organization.createdAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
