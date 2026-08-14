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
  contactId: string;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
  contact: Contact;
};

const statusLabels: Record<LeadStatus, string> = {
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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<LeadStatus | "ALL">("ALL");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappId, setWhatsappId] = useState("");
  const [source, setSource] = useState("");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>("NEW");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadLeads() {
    try {
      setError("");

      const response = await fetch("/api/leads");

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible de charger les prospects."
        );
        return;
      }

      setLeads(result.leads || []);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setWhatsappId("");
    setSource("");
    setScore("");
    setNotes("");
    setStatus("NEW");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          whatsappId: whatsappId.trim() || undefined,
          source: source.trim() || undefined,
          score: score ? Number(score) : undefined,
          notes: notes.trim() || undefined,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible de créer le prospect."
        );
        return;
      }

      setLeads((current) => [
        result.lead,
        ...current,
      ]);

      resetForm();
      setShowForm(false);

      setMessage("Prospect créé avec succès.");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce prospect ?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(id);

    try {
      const response = await fetch(
        `/api/leads?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

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

      setMessage("Prospect supprimé avec succès.");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const contact = lead.contact;

    const searchText = [
      contact.name,
      contact.email,
      contact.phone,
      contact.whatsappId,
      lead.source,
      lead.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(
      search.toLowerCase()
    );

    const matchesStatus =
      statusFilter === "ALL" ||
      lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <>
        <DashboardTopbar title="Prospects" />

        <div className="p-6">
          <p className="text-sm text-white/60">
            Chargement des prospects...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardTopbar title="Prospects" />

      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="neutral">
              Gestion commerciale
            </Badge>

            <h1 className="mt-4 text-2xl font-semibold text-white">
              Prospects
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Retrouvez et gérez les prospects générés par
              NL Agent ainsi que vos prospects ajoutés
              manuellement.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setMessage("");
              setError("");
            }}
          >
            {showForm
              ? "Fermer"
              : "Ajouter un prospect"}
          </Button>
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

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Ajouter un prospect
              </CardTitle>

              <CardDescription>
                Ajoutez manuellement un prospect à votre
                portefeuille commercial.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
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
                      placeholder="Nom du prospect"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lead-email">
                      Email
                    </Label>

                    <Input
                      id="lead-email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="prospect@email.com"
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
                      Identifiant WhatsApp
                    </Label>

                    <Input
                      id="lead-whatsapp"
                      value={whatsappId}
                      onChange={(event) =>
                        setWhatsappId(event.target.value)
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
                      placeholder="Exemple : WhatsApp"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lead-score">
                      Score / 100
                    </Label>

                    <Input
                      id="lead-score"
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(event) =>
                        setScore(event.target.value)
                      }
                      placeholder="Exemple : 75"
                    />
                  </div>

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
                      className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none"
                    >
                      {Object.entries(statusLabels).map(
                        ([value, label]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

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

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Création..."
                      : "Créer le prospect"}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Recherche et filtres
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="lead-search">
                  Rechercher
                </Label>

                <Input
                  id="lead-search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Nom, email, téléphone, source..."
                />
              </div>

              <div>
                <Label htmlFor="lead-filter">
                  Filtrer par statut
                </Label>

                <select
                  id="lead-filter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | LeadStatus
                        | "ALL"
                    )
                  }
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="ALL">
                    Tous les statuts
                  </option>

                  {Object.entries(statusLabels).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Liste des prospects
            </CardTitle>

            <CardDescription>
              {filteredLeads.length} prospect
              {filteredLeads.length > 1 ? "s" : ""} affiché
              {filteredLeads.length > 1 ? "s" : ""}.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="rounded-md border border-dashed border-line bg-ink p-8 text-center">
                <p className="text-sm text-white/50">
                  Aucun prospect trouvé.
                </p>

                <p className="mt-2 text-xs text-white/30">
                  Les prospects créés par les conversations
                  de NL Agent apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => {
                  const contact = lead.contact;

                  return (
                    <div
                      key={lead.id}
                      className="rounded-lg border border-line bg-ink p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-base font-semibold text-white">
                              {contact.name ||
                                "Prospect sans nom"}
                            </h3>

                            <Badge variant="neutral">
                              {
                                statusLabels[
                                  lead.status
                                ]
                              }
                            </Badge>

                            {lead.score !== null && (
                              <span className="text-xs text-white/50">
                                Score : {lead.score}/100
                              </span>
                            )}
                          </div>

                          <div className="mt-4 grid gap-2 text-sm text-white/60 md:grid-cols-2">
                            {contact.email && (
                              <p>
                                📧 {contact.email}
                              </p>
                            )}

                            {contact.phone && (
                              <p>
                                📱 {contact.phone}
                              </p>
                            )}

                            {contact.whatsappId && (
                              <p>
                                💬 WhatsApp :{" "}
                                {contact.whatsappId}
                              </p>
                            )}

                            {lead.source && (
                              <p>
                                🌐 Source :{" "}
                                {lead.source}
                              </p>
                            )}
                          </div>

                          {lead.notes && (
                            <div className="mt-4 rounded-md border border-line p-3">
                              <p className="text-xs font-medium text-white/40">
                                Notes
                              </p>

                              <p className="mt-1 whitespace-pre-wrap text-sm text-white/60">
                                {lead.notes}
                              </p>
                            </div>
                          )}

                          <p className="mt-4 text-xs text-white/30">
                            Créé le{" "}
                            {new Date(
                              lead.createdAt
                            ).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
