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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Knowledge = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Charger les connaissances
   */
  async function loadKnowledge() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/agent/knowledge", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Impossible de charger les connaissances."
        );
      }

      setKnowledge(result.knowledge || []);
    } catch (error) {
      console.error("Load knowledge error:", error);

      setError(
        "Impossible de charger la base de connaissances."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKnowledge();
  }, []);

  /*
   * Ajouter ou modifier une connaissance
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setError(
        "Le titre et le contenu sont obligatoires."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const isEditing = Boolean(editingId);

      const response = await fetch(
        "/api/agent/knowledge",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditing
              ? {
                  id: editingId,
                  title: trimmedTitle,
                  content: trimmedContent,
                }
              : {
                  title: trimmedTitle,
                  content: trimmedContent,
                }
          ),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible d'enregistrer la connaissance."
        );
        return;
      }

      if (isEditing) {
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
          ...current,
          result.knowledge,
        ]);

        setMessage(
          "Connaissance ajoutée avec succès."
        );
      }

      setTitle("");
      setContent("");
      setEditingId(null);
    } catch (error) {
      console.error(
        "Save knowledge error:",
        error
      );

      setError(
        "Impossible de contacter le serveur."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Activer le mode modification
   */
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

  /*
   * Annuler la modification
   */
  function handleCancelEdit() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setMessage("");
    setError("");
  }

  /*
   * Supprimer une connaissance
   */
  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette connaissance ?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/agent/knowledge",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible de supprimer la connaissance."
        );
        return;
      }

      setKnowledge((current) =>
        current.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        setEditingId(null);
        setTitle("");
        setContent("");
      }

      setMessage(
        "Connaissance supprimée avec succès."
      );
    } catch (error) {
      console.error(
        "Delete knowledge error:",
        error
      );

      setError(
        "Impossible de contacter le serveur."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <DashboardTopbar title="Base de connaissances" />

      <div className="p-6">
        <div className="mb-6">
          <Badge variant="neutral">
            Phase 7 — Base de connaissances
          </Badge>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Base de connaissances
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Ajoutez et gérez les informations que votre
            agent IA doit connaître sur NLAcademy.
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

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId
                  ? "Modifier une connaissance"
                  : "Ajouter une connaissance"}
              </CardTitle>

              <CardDescription>
                {editingId
                  ? "Modifiez les informations sélectionnées."
                  : "Donnez à votre agent des informations fiables sur NLAcademy."}
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
                    placeholder="Exemple : Présentation de NLAcademy"
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
                    placeholder="Écrivez ici les informations que l'agent doit connaître..."
                    rows={12}
                    required
                    className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-500"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={
                      saving ||
                      !title.trim() ||
                      !content.trim()
                    }
                  >
                    {saving
                      ? "Enregistrement..."
                      : editingId
                      ? "Enregistrer les modifications"
                      : "Ajouter la connaissance"}
                  </Button>

                  {editingId && (
                    <Button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Liste */}
          <Card>
            <CardHeader>
              <CardTitle>
                Informations de l'agent
              </CardTitle>

              <CardDescription>
                {knowledge.length} connaissance
                {knowledge.length > 1
                  ? "s"
                  : ""}{" "}
                enregistrée
                {knowledge.length > 1
                  ? "s"
                  : ""}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p className="text-sm text-white/50">
                  Chargement de la base de connaissances...
                </p>
              ) : knowledge.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line p-6 text-center">
                  <p className="text-sm font-medium text-white">
                    Aucune connaissance
                  </p>

                  <p className="mt-2 text-sm text-white/40">
                    Ajoutez les premières informations
                    de NLAcademy.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {knowledge.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-line bg-ink p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-white">
                            {item.title}
                          </h3>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">
                            {item.content}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            handleEdit(item)
                          }
                          disabled={
                            deletingId === item.id
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

                      <p className="mt-4 text-xs text-white/30">
                        Ajoutée le{" "}
                        {new Intl.DateTimeFormat(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        ).format(
                          new Date(item.createdAt)
                        )}
                      </p>
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
