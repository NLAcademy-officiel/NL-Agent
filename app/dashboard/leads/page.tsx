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

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

type Contact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsappId: string | null;
};

type Lead = {
  id: string;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
  contact: Contact;
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  NEGOTIATION: "Négociation",
  WON: "Gagné",
  LOST: "Perdu",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappId, setWhatsappId] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] =
    useState<LeadStatus>("NEW");
  const [score, setScore] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Charger les prospects
   */
  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/leads?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Impossible de charger les prospects."
        );
      }

      setLeads(result.leads || []);
    } catch (error) {
      console.error("Load leads error:", error);

      setError(
        "Impossible de charger les prospects."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  /*
   * Recherche
   */
  function handleSearch(event: FormEvent) {
    event.preventDefault();
    loadLeads();
  }

  /*
   * Ajouter ou modifier un prospect
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !name.trim() &&
      !email.trim() &&
      !phone.trim() &&
      !whatsappId.trim()
    ) {
      setError(
        "Veuillez renseigner au moins un nom, un e-mail, un téléphone ou un identifiant WhatsApp."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const isEditing = Boolean(editingId);

      const response = await fetch("/api/leads", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? {
                id: editingId,
                name,
                email,
                phone,
                whatsappId,
                source,
                notes,
                status,
                score:
                  score.trim() === ""
                    ? null
                    : Number(score),
              }
            : {
                name,
                email,
                phone,
                whatsappId,
                source,
                notes,
              }
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible d'enregistrer le prospect."
        );
        return;
      }

      if (isEditing) {
        setLeads((current) =>
          current.map((lead) =>
            lead.id === result.lead.id
              ? result.lead
              : lead
          )
        );

        setMessage(
          "Prospect mis à jour avec succès."
        );
      } else {
        setLeads((current) => [
          result.lead,
          ...current,
        ]);

        setMessage(
          "Prospect créé avec succès."
        );
      }

      resetForm();
    } catch (error) {
      console.error("Save lead error:", error);

      setError(
        "Impossible de contacter le serveur."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Modifier
   */
  function handleEdit(lead: Lead) {
    setEditingId(lead.id);

    setName(lead.contact.name || "");
    setEmail(lead.contact.email || "");
    setPhone(lead.contact.phone || "");
    setWhatsappId(lead.contact.whatsappId || "");

    setSource(lead.source || "");
    setNotes(lead.notes || "");
    setStatus(lead.status);
    setScore(
      lead.score !== null
        ? String(lead.score)
        : ""
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * Réinitialiser le formulaire
   */
  function resetForm() {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setWhatsappId("");
    setSource("");
    setNotes("");
    setStatus("NEW");
    setScore("");
  }

  /*
   * Annuler modification
   */
  function handleCancel() {
    resetForm();
    setMessage("");
    setError("");
  }

  /*
   * Supprimer
   */
  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce prospect ?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible de supprimer le prospect."
        );
        return;
      }

      setLeads((current) =>
        current.filter((lead) => lead.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setMessage(
        "Prospect supprimé avec succès."
      );
    } catch (error) {
      console.error(
        "Delete lead error:",
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
      <DashboardTopbar title="Prospects" />

      <div className="p-6">
        <div className="mb-6">
          <Badge variant="neutral">
            Phase 8 — Gestion des prospects
          </Badge>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Prospects
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Gérez vos prospects, leur statut, leurs
            coordonnées et leur niveau de qualification.
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

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* FORMULAIRE */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId
                  ? "Modifier le prospect"
                  : "Ajouter un prospect"}
              </CardTitle>

              <CardDescription>
                {editingId
                  ? "Modifiez les informations du prospect."
                  : "Ajoutez manuellement un nouveau prospect."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <Label htmlFor="lead-name">
                    Nom
                  </Label>

                  <Input
                    id="lead-name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Exemple : Jean Dupont"
                  />
                </div>

                <div>
                  <Label htmlFor="lead-email">
                    E-mail
                  </Label>

                  <Input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="jean@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="lead-phone">
                    Téléphone
                  </Label>

                  <Input
                    id="lead-phone"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="+225..."
                  />
                </div>

                <div>
                  <Label htmlFor="lead-whatsapp">
                    WhatsApp ID
                  </Label>

                  <Input
                    id="lead-whatsapp"
                    value={whatsappId}
                    onChange={(event) =>
                      setWhatsappId(
                        event.target.value
                      )
                    }
                    placeholder="Identifiant WhatsApp"
                  />
                </div>

                <div>
                  <Label htmlFor="lead-source">
                    Source
                  </Label>

                  <Input
                    id="lead-source"
                    value={source}
                    onChange={(event) =>
                      setSource(event.target.value)
                    }
                    placeholder="Exemple : WhatsApp, Facebook, Site..."
                  />
                </div>

                {editingId && (
                  <>
                    <div>
                      <Label htmlFor="lead-status">
                        Statut
                      </Label>

                      <select
                        id="lead-status"
                        value={status}
                        onChange={(event) =>
                          setStatus(
                            event.target
                              .value as LeadStatus
                          )
                        }
                        className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                      >
                        <option value="NEW">
                          Nouveau
                        </option>

                        <option value="CONTACTED">
                          Contacté
                        </option>

                        <option value="QUALIFIED">
                          Qualifié
                        </option>

                        <option value="NEGOTIATION">
                          Négociation
                        </option>

                        <option value="WON">
                          Gagné
                        </option>

                        <option value="LOST">
                          Perdu
                        </option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="lead-score">
                        Score
                      </Label>

                      <Input
                        id="lead-score"
                        type="number"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(event) =>
                          setScore(
                            event.target.value
                          )
                        }
                        placeholder="0 - 100"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="lead-notes">
                    Notes
                  </Label>

                  <textarea
                    id="lead-notes"
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="Informations complémentaires..."
                    rows={5}
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
                      ? "Enregistrer les modifications"
                      : "Ajouter le prospect"}
                  </Button>

                  {editingId && (
                    <Button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* LISTE */}
          <Card>
            <CardHeader>
              <CardTitle>
                Liste des prospects
              </CardTitle>

              <CardDescription>
                {leads.length} prospect
                {leads.length > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* RECHERCHE */}
              <form
                onSubmit={handleSearch}
                className="mb-6 flex gap-3"
              >
                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Rechercher un prospect..."
                />

                <Button type="submit">
                  Rechercher
                </Button>
              </form>

              {loading ? (
                <p className="text-sm text-white/50">
                  Chargement des prospects...
                </p>
              ) : leads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line p-8 text-center">
                  <p className="text-sm font-medium text-white">
                    Aucun prospect
                  </p>

                  <p className="mt-2 text-sm text-white/40">
                    Ajoutez votre premier prospect
                    pour commencer.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-lg border border-line bg-ink p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white">
                            {lead.contact.name ||
                              "Prospect sans nom"}
                          </h3>

                          <div className="mt-2 space-y-1 text-sm text-white/50">
                            {lead.contact.email && (
                              <p>
                                {lead.contact.email}
                              </p>
                            )}

                            {lead.contact.phone && (
                              <p>
                                {lead.contact.phone}
                              </p>
                            )}

                            {lead.contact
                              .whatsappId && (
                              <p>
                                WhatsApp :{" "}
                                {
                                  lead.contact
                                    .whatsappId
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-line px-3 py-1 text-xs text-white/60">
                            {
                              STATUS_LABELS[
                                lead.status
                              ]
                            }
                          </span>

                          {lead.score !== null && (
                            <span className="rounded-full border border-line px-3 py-1 text-xs text-white/60">
                              Score : {lead.score}
                            </span>
                          )}
                        </div>
                      </div>

                      {lead.source && (
                        <p className="mt-4 text-xs text-white/40">
                          Source : {lead.source}
                        </p>
                      )}

                      {lead.notes && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/50">
                          {lead.notes}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            handleEdit(lead)
                          }
                          disabled={
                            deletingId === lead.id
                          }
                        >
                          Modifier
                        </Button>

                        <Button
                          type="button"
                          onClick={() =>
                            handleDelete(lead.id)
                          }
                          disabled={
                            deletingId === lead.id
                          }
                        >
                          {deletingId === lead.id
                            ? "Suppression..."
                            : "Supprimer"}
                        </Button>
                      </div>

                      <p className="mt-4 text-xs text-white/30">
                        Créé le{" "}
                        {new Intl.DateTimeFormat(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        ).format(
                          new Date(
                            lead.createdAt
                          )
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
