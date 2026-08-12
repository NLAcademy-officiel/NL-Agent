"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AgentData = {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export default function AgentPage() {
  const [agent, setAgent] = useState<AgentData | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAgent() {
      try {
        const response = await fetch("/api/agent/settings");

        if (!response.ok) {
          throw new Error("Impossible de charger l'agent.");
        }

        const result: AgentData = await response.json();

        setAgent(result);
        setName(result.name);
        setDescription(result.description || "");
        setSystemPrompt(result.systemPrompt || "");
        setStatus(result.status);
      } catch {
        setError("Impossible de charger les paramètres de l'agent.");
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/agent/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          systemPrompt: systemPrompt.trim(),
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Une erreur est survenue lors de la modification."
        );
        return;
      }

      setAgent(result);

      setName(result.name);
      setDescription(result.description || "");
      setSystemPrompt(result.systemPrompt || "");
      setStatus(result.status);

      setMessage("Configuration de l'agent mise à jour avec succès.");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <DashboardTopbar title="Mon Agent" />

        <div className="p-6">
          <p className="text-sm text-white/60">
            Chargement de votre agent...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardTopbar title="Mon Agent" />

      <div className="p-6">
        <div className="mb-6">
          <Badge variant="neutral">Phase 4 — Agent IA</Badge>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Mon Agent
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Configurez votre agent IA, son identité, ses instructions et
            son comportement.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identité de l'agent</CardTitle>

              <CardDescription>
                Définissez le nom et la présentation de votre agent.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="agent-name">
                  Nom de l'agent
                </Label>

                <Input
                  id="agent-name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Exemple : NL Assistant"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <Label htmlFor="agent-description">
                  Description
                </Label>

                <textarea
                  id="agent-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Décrivez brièvement le rôle de votre agent..."
                  rows={4}
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructions de l'agent</CardTitle>

              <CardDescription>
                Donnez à votre agent les règles et informations qu'il
                doit respecter.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <textarea
                value={systemPrompt}
                onChange={(event) =>
                  setSystemPrompt(event.target.value)
                }
                placeholder="Exemple : Tu es l'assistant commercial de mon entreprise..."
                rows={10}
                className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-500"
              />

              <p className="mt-2 text-xs text-white/40">
                Ces instructions serviront de base au comportement de
                l'agent IA.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Langues</CardTitle>

              <CardDescription>
                Votre agent pourra communiquer en français et en anglais.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-md border border-line bg-ink p-4">
                <p className="text-sm font-medium text-white">
                  🇫🇷 Français + 🇬🇧 English
                </p>

                <p className="mt-1 text-sm text-white/50">
                  Mode automatique : l'agent répondra dans la langue
                  utilisée par le prospect.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut</CardTitle>

              <CardDescription>
                Contrôlez la disponibilité de votre agent.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as "ACTIVE" | "INACTIVE"
                  )
                }
                className="w-full max-w-md rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              >
                <option value="ACTIVE">
                  Actif
                </option>

                <option value="INACTIVE">
                  Inactif
                </option>
              </select>
            </CardContent>
          </Card>

          {message && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
              {message}
            </div>
          )}

          <div>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Enregistrement..."
                : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
