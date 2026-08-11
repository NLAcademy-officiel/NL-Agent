"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

type SettingsData = {
  user: {
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  };
};

export default function SettingsPage() {
  const router = useRouter();

  const [data, setData] = useState<SettingsData | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    try {
      const response = await fetch("/api/organization/settings");

      if (!response.ok) {
        router.push("/auth/login");
        return;
      }

      const result = await response.json();

      setData(result);
      setName(result.organization.name);
    } catch {
      setError("Impossible de charger les informations.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/organization/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
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

      setMessage("Nom de l'entreprise mis à jour avec succès.");

      setData((current) =>
        current
          ? {
              ...current,
              organization: {
                ...current.organization,
                name: result.organization.name,
              },
            }
          : current
      );

      setName(result.organization.name);

      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    loadSettings();

    return (
      <>
        <DashboardTopbar title="Profil & Organisation" />

        <div className="p-6">
          <p className="text-sm text-white/60">
            Chargement de votre espace...
          </p>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <DashboardTopbar title="Profil & Organisation" />

        <div className="p-6">
          <p className="text-sm text-red-300">
            {error || "Impossible de charger les informations."}
          </p>
        </div>
      </>
    );
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
            Consultez et gérez les informations de votre compte et de votre
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
                  {data.user.name || "Non renseigné"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Adresse e-mail
                </p>

                <p className="mt-1 text-sm text-white">
                  {data.user.email}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Rôle</p>

                <p className="mt-1 text-sm text-white">
                  {data.user.role}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Compte créé le
                </p>

                <p className="mt-1 text-sm text-white">
                  {new Date(
                    data.user.createdAt
                  ).toLocaleDateString("fr-FR")}
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
                  {data.organization.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Identifiant
                </p>

                <p className="mt-1 break-all text-sm text-white/70">
                  {data.organization.id}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">Slug</p>

                <p className="mt-1 text-sm text-white">
                  {data.organization.slug}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Organisation créée le
                </p>

                <p className="mt-1 text-sm text-white">
                  {new Date(
                    data.organization.createdAt
                  ).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Modifier l'organisation</CardTitle>

            <CardDescription>
              Modifiez le nom de votre entreprise.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
              <div>
                <Label htmlFor="organization-name">
                  Nom de l'entreprise
                </Label>

                <Input
                  id="organization-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nom de votre entreprise"
                  maxLength={100}
                  required
                />
              </div>

              {message && (
                <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={saving}>
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
