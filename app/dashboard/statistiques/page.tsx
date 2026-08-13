"use client";

import { useEffect, useState } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Statistics = {
  leads: number;
  conversations: number;
  messages: number;
  knowledge: number;
  openConversations: number;
  newLeads: number;
};

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStatistics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/statistiques");

        const result = await response.json();

        if (!response.ok) {
          setError(
            result.error ||
              "Impossible de charger les statistiques."
          );
          return;
        }

        setStatistics(result.statistics);
      } catch {
        setError("Impossible de contacter le serveur.");
      } finally {
        setLoading(false);
      }
    }

    loadStatistics();
  }, []);

  return (
    <>
      <DashboardTopbar title="Statistiques" />

      <div className="p-6">
        <div className="mb-6">
          <Badge variant="neutral">
            Analytics NL-Agent
          </Badge>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Statistiques
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Consultez les principales statistiques de votre
            agent et de votre activité.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-line bg-ink p-8">
            <p className="text-sm text-white/60">
              Chargement des statistiques...
            </p>
          </div>
        ) : statistics ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardDescription>
                    Prospects
                  </CardDescription>

                  <CardTitle className="text-3xl">
                    {statistics.leads}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-white/40">
                    Total des prospects enregistrés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>
                    Conversations
                  </CardDescription>

                  <CardTitle className="text-3xl">
                    {statistics.conversations}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-white/40">
                    Total des conversations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>
                    Messages
                  </CardDescription>

                  <CardTitle className="text-3xl">
                    {statistics.messages}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-white/40">
                    Messages enregistrés
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardDescription>
                    Connaissances
                  </CardDescription>

                  <CardTitle className="text-3xl">
                    {statistics.knowledge}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-xs text-white/40">
                    Informations disponibles pour l'agent
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Conversations ouvertes
                  </CardTitle>

                  <CardDescription>
                    Conversations actuellement actives.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-4xl font-semibold text-white">
                    {statistics.openConversations}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Nouveaux prospects
                  </CardTitle>

                  <CardDescription>
                    Prospects avec le statut NEW.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-4xl font-semibold text-white">
                    {statistics.newLeads}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-ink p-8 text-center">
            <p className="text-sm text-white/50">
              Aucune statistique disponible.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
