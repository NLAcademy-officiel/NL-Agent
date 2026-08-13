"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
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
  conversations: Conversation[];
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  NEGOTIATION: "Négociation",
  WON: "Gagné",
  LOST: "Perdu",
};

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export default function LeadDetailPage() {
  const params = useParams();

  const leadId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [lead, setLead] = useState<Lead | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] =
    useState<LeadStatus>("NEW");

  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /*
   * Charger le prospect
   */
  async function loadLead() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/leads/${leadId}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Impossible de charger le prospect."
        );
      }

      setLead(result.lead);

      setStatus(result.lead.status);

      setScore(
        result.lead.score !== null
          ? String(result.lead.score)
          : ""
      );

      setNotes(result.lead.notes || "");
    } catch (error) {
      console.error(
        "Load lead detail error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Impossible de charger le prospect."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (leadId) {
      loadLead();
    }
  }, [leadId]);

  /*
   * Sauvegarder les modifications
   */
  async function handleSave() {
    if (!lead) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/leads/${lead.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            score:
              score.trim() === ""
                ? null
                : Number(score),
            notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible de mettre à jour le prospect."
        );
        return;
      }

      setLead(result.lead);

      setStatus(result.lead.status);

      setScore(
        result.lead.score !== null
          ? String(result.lead.score)
          : ""
      );

      setNotes(result.lead.notes || "");

      setMessage(
        "Prospect mis à jour avec succès."
      );
    } catch (error) {
      console.error(
        "Update lead detail error:",
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
   * Formatage des dates
   */
  function formatDate(date: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  if (loading) {
    return (
      <>
        <DashboardTopbar title="Prospect" />

        <div className="p-6">
          <p className="text-sm text-white/50">
            Chargement du prospect...
          </p>
        </div>
      </>
    );
  }

  if (error && !lead) {
    return (
      <>
        <DashboardTopbar title="Prospect" />

        <div className="p-6">
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>

          <div className="mt-4">
            <Link href="/dashboard/leads">
              <Button type="button">
                Retour aux prospects
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <>
      <DashboardTopbar title="Détail du prospect" />

      <div className="p-6">
        {/* EN-TÊTE */}
        <div className="mb-6">
          <Link
            href="/dashboard/leads"
            className="text-sm text-white/40 hover:text-white"
          >
            ← Retour aux prospects
          </Link>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="neutral">
                Phase 8 — Prospect
              </Badge>

              <h1 className="mt-4 text-2xl font-semibold text-white">
                {lead.contact.name ||
                  "Prospect sans nom"}
              </h1>

              <p className="mt-2 text-sm text-white/50">
                Prospect créé le{" "}
                {formatDate(lead.createdAt)}
              </p>
            </div>

            <div className="rounded-full border border-line px-4 py-2 text-sm text-white/70">
              {STATUS_LABELS[lead.status]}
            </div>
          </div>
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* INFORMATIONS */}
          <Card>
            <CardHeader>
              <CardTitle>
                Informations du prospect
              </CardTitle>

              <CardDescription>
                Coordonnées et informations principales.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <p className="text-xs text-white/40">
                  Nom
                </p>

                <p className="mt-1 text-sm text-white">
                  {lead.contact.name ||
                    "Non renseigné"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  E-mail
                </p>

                <p className="mt-1 text-sm text-white">
                  {lead.contact.email ||
                    "Non renseigné"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Téléphone
                </p>

                <p className="mt-1 text-sm text-white">
                  {lead.contact.phone ||
                    "Non renseigné"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  WhatsApp
                </p>

                <p className="mt-1 text-sm text-white">
                  {lead.contact.whatsappId ||
                    "Non renseigné"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40">
                  Source
                </p>

                <p className="mt-1 text-sm text-white">
                  {lead.source ||
                    "Non renseignée"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* QUALIFICATION */}
          <Card>
            <CardHeader>
              <CardTitle>
                Qualification
              </CardTitle>

              <CardDescription>
                Modifiez le statut et le score du prospect.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <label
                  htmlFor="lead-status"
                  className="text-sm font-medium text-white"
                >
                  Statut
                </label>

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
                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {STATUS_LABELS[option]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="lead-score"
                  className="text-sm font-medium text-white"
                >
                  Score
                </label>

                <input
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
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-500"
                />

                <p className="mt-2 text-xs text-white/30">
                  Le score indique le niveau de
                  qualification du prospect.
                </p>
              </div>

              <div>
                <label
                  htmlFor="lead-notes"
                  className="text-sm font-medium text-white"
                >
                  Notes
                </label>

                <textarea
                  id="lead-notes"
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Notes concernant ce prospect..."
                  rows={6}
                  className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-500"
                />
              </div>

              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* CONVERSATIONS */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Historique des conversations
            </CardTitle>

            <CardDescription>
              Conversations associées à ce prospect.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {lead.conversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line p-8 text-center">
                <p className="text-sm font-medium text-white">
                  Aucune conversation
                </p>

                <p className="mt-2 text-sm text-white/40">
                  Les conversations associées à ce
                  prospect apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {lead.conversations.map(
                  (conversation) => (
                    <div
                      key={conversation.id}
                      className="rounded-lg border border-line bg-ink p-4"
                    >
                      <div className="mb-4">
                        <p className="text-xs text-white/40">
                          Conversation
                        </p>

                        <p className="mt-1 text-sm text-white/60">
                          {formatDate(
                            conversation.updatedAt
                          )}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {conversation.messages.map(
                          (item) => {
                            const isUser =
                              item.role ===
                              "user";

                            return (
                              <div
                                key={item.id}
                                className={`flex ${
                                  isUser
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                                    isUser
                                      ? "bg-brand-500 text-white"
                                      : "border border-line bg-black/20 text-white/70"
                                  }`}
                                >
                                  <p className="mb-1 text-xs opacity-50">
                                    {isUser
                                      ? "Prospect"
                                      : "NL Assistant"}
                                  </p>

                                  <p className="whitespace-pre-wrap leading-6">
                                    {item.content}
                                  </p>

                                  <p className="mt-2 text-[10px] opacity-40">
                                    {formatDate(
                                      item.createdAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
