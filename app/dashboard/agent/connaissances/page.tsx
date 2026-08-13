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

type Knowledge = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function AgentKnowledgePage() {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadKnowledge() {
    try {
      setError("");

      const response = await fetch("/api/agent/knowledge");

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible de charger les connaissances de l'agent."
        );
        return;
      }

      setKnowledge(result.knowledge || []);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKnowledge();
  }, []);

  function resetForm() {
    setTitle("");
    setContent("");
    setEditingId(null);
    setMessage("");
    setError("");
  }

  function handleEdit(item: Knowledge) {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const method = editingId ? "PATCH" : "POST";

      const body = editingId
        ? {
            id: editingId,
            title: title.trim(),
            content: content.trim(),
          }
        : {
            title: title.trim(),
            content: content.trim(),
          };

      const response = await fetch("/api/agent/knowledge", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Une erreur est survenue lors de l'enregistrement."
        );
        return;
      }

      if (editingId) {
        setKnowledge((current) =>
          current.map((item) =>
            item.id === result.knowledge.id
              ? result.knowledge
              : item
          )
        );

        setMessage(
          "Connaissance mise à jour avec succès."
        );
      } else {
        setKnowledge((current) => [
          result.knowledge,
          ...current,
        ]);

        setMessage(
          "Connaissance ajoutée avec succès."
        );
      }

      setTitle("");
      setContent("");
      setEditingId(null);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette connaissance ?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(id);

    try {
      const response = await fetch(
        `/api/agent/knowledge?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible de supprimer cette connaissance."
        );
        return;
      }

      setKnowledge((current) =>
        current.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setMessage(
        "Connaissance supprimée avec succès."
      );
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <>
        <DashboardTopbar title="Connaissances" />

        <div className="p-6">
          <p className="text-sm text-white/60">
            Chargement des connaissances de votre agent...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardTopbar title="Connaissances" />

      <div className="p-6">
        <div className="mb-6">
          <Badge variant="neutral">
            Phase 5 — Base de connaissances
          </Badge>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Connaissances de l'agent
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Ajoutez les informations que votre agent IA doit
            connaître pour répondre correctement aux prospects.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {editingId
                ? "Modifier une connaissance"
                : "Ajouter une connaissance"}
            </CardTitle>

            <CardDescription>
              Donnez à votre agent des informations précises sur
              votre entreprise, vos services, vos formations,
              vos tarifs ou vos procédures.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <Label htmlFor="knowledge-title">
                  Titre
                </Label>

                <Input
                  id="knowledge-title"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Exemple : Formations NLAcademy"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <Label htmlFor="knowledge-content">
                  Contenu
                </Label>

                <textarea
                  id="knowledge-content"
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  placeholder="Écrivez ici les informations que votre agent doit connaître..."
                  rows={8}
                  required
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingId
                    ? "Mettre à jour"
                    : "Ajouter la connaissance"}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Base de connaissances
              </CardTitle>

              <CardDescription>
                {knowledge.length === 0
                  ? "Aucune connaissance n'a encore été ajoutée."
                  : `${knowledge.length} connaissance${
                      knowledge.length > 1 ? "s" : ""
                    } enregistrée${
                      knowledge.length > 1 ? "s" : ""
                    }.`}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {knowledge.length === 0 ? (
                <div className="rounded-md border border-dashed border-line bg-ink p-8 text-center">
                  <p className="text-sm text-white/50">
                    Votre agent ne possède encore aucune
                    connaissance.
                  </p>

                  <p className="mt-2 text-xs text-white/30">
                    Commencez par ajouter les informations
                    importantes concernant votre entreprise.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {knowledge.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-line bg-ink p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-white">
                            {item.title}
                          </h3>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">
                            {item.content}
                          </p>

                          <p className="mt-4 text-xs text-white/30">
                            Mise à jour le{" "}
                            {new Date(
                              item.updatedAt
                            ).toLocaleDateString("fr-FR")}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            onClick={() =>
                              handleEdit(item)
                            }
                          >
                            Modifier
                          </Button>

                          <Button
                            type="button"
                            onClick={() =>
                              handleDelete(item.id)
                            }
                            disabled={
                              deletingId === item.id
                            }
                          >
                            {deletingId === item.id
                              ? "Suppression..."
                              : "Supprimer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
