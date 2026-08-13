"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

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

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string | null;
  createdAt: string;
};

type Conversation = {
  id: string;
  status: "OPEN" | "PENDING" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  agent: {
    id: string;
    name: string;
  } | null;
  channel: {
    id: string;
    name: string;
    type: "WEBSITE" | "WHATSAPP";
  };
  messages: Message[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour 👋 Je suis votre assistant IA. Comment puis-je vous aider ?",
    },
  ]);

  const [message, setMessage] = useState("");
  const [loadingConversations, setLoadingConversations] =
    useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * Chargement des conversations
   */
  async function loadConversations() {
    try {
      setLoadingConversations(true);
      setError("");

      const response = await fetch(
        "/api/conversations",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Impossible de récupérer les conversations."
        );
      }

      setConversations(result.conversations || []);

      /*
       * Si aucune conversation n'est sélectionnée
       * et qu'il existe une conversation enregistrée,
       * on sélectionne automatiquement la plus récente.
       */
      if (
        !selectedConversationId &&
        result.conversations?.length > 0
      ) {
        setSelectedConversationId(
          result.conversations[0].id
        );
      }
    } catch (error) {
      console.error(
        "Load conversations error:",
        error
      );

      setError(
        "Impossible de charger les conversations."
      );
    } finally {
      setLoadingConversations(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  /*
   * Conversation sélectionnée
   */
  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        selectedConversationId
    ) || null;

  /*
   * Synchronisation des messages avec
   * la conversation sélectionnée.
   */
  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    const formattedMessages =
      selectedConversation.messages
        .filter((item) => item.content)
        .map((item) => ({
          id: item.id,
          role:
            item.direction === "INBOUND"
              ? ("user" as const)
              : ("assistant" as const),
          content: item.content as string,
        }));

    if (formattedMessages.length > 0) {
      setMessages(formattedMessages);
    }
  }, [selectedConversationId, conversations]);

  /*
   * Scroll automatique vers le dernier message
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  /*
   * Envoi du message à l'agent
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending) {
      return;
    }

    setError("");

    const temporaryUserMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmedMessage,
    };

    setMessages((current) => [
      ...current,
      temporaryUserMessage,
    ]);

    setMessage("");
    setSending(true);

    try {
      const response = await fetch(
        "/api/agent/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Impossible d'obtenir une réponse de l'agent."
        );
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: result.reply,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      /*
       * Recharge les conversations afin de récupérer
       * les messages réellement sauvegardés dans Prisma.
       */
      await loadConversations();

      if (result.conversationId) {
        setSelectedConversationId(
          result.conversationId
        );
      }
    } catch (error) {
      console.error("Send message error:", error);

      setError(
        "Impossible de contacter le serveur. Réessayez."
      );
    } finally {
      setSending(false);
    }
  }

  /*
   * Nouvelle conversation
   *
   * Pour l'instant, on réinitialise l'interface.
   * La nouvelle conversation Prisma sera créée
   * automatiquement lors du prochain message.
   */
  function clearConversation() {
    setSelectedConversationId(null);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "Bonjour 👋 Je suis votre assistant IA. Comment puis-je vous aider ?",
      },
    ]);

    setError("");
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function getStatusLabel(
    status: Conversation["status"]
  ) {
    switch (status) {
      case "OPEN":
        return "Ouverte";

      case "PENDING":
        return "En attente";

      case "CLOSED":
        return "Fermée";

      default:
        return status;
    }
  }

  return (
    <>
      <DashboardTopbar title="Conversations" />

      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="neutral">
              Phase 6 — Conversations IA
            </Badge>

            <h1 className="mt-4 text-2xl font-semibold text-white">
              Conversations
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Consultez et testez les conversations de
              votre agent IA.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={loadConversations}
              disabled={loadingConversations}
            >
              {loadingConversations
                ? "Actualisation..."
                : "Actualiser"}
            </Button>

            <Button
              type="button"
              onClick={clearConversation}
              disabled={sending}
            >
              Nouvelle conversation
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Liste des conversations */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-line">
              <CardTitle>
                Historique
              </CardTitle>

              <CardDescription>
                {conversations.length} conversation
                {conversations.length > 1
                  ? "s"
                  : ""}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-2">
              {loadingConversations ? (
                <div className="p-4 text-sm text-white/50">
                  Chargement...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4">
                  <p className="text-sm text-white/50">
                    Aucune conversation enregistrée.
                  </p>

                  <p className="mt-2 text-xs text-white/30">
                    Envoyez votre premier message à
                    l'agent pour commencer.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map(
                    (conversation) => {
                      const active =
                        selectedConversationId ===
                        conversation.id;

                      const lastMessage =
                        conversation.messages[
                          conversation.messages
                            .length - 1
                        ];

                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() =>
                            setSelectedConversationId(
                              conversation.id
                            )
                          }
                          className={`w-full rounded-lg p-3 text-left transition-colors ${
                            active
                              ? "bg-brand-500/15"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {conversation.contact
                                  .name ||
                                  "Prospect"}
                              </p>

                              <p className="mt-1 truncate text-xs text-white/40">
                                {lastMessage?.content ||
                                  "Aucun message"}
                              </p>
                            </div>

                            <span className="shrink-0 text-[10px] text-white/30">
                              {formatDate(
                                conversation.updatedAt
                              )}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`text-[10px] ${
                                conversation.status ===
                                "OPEN"
                                  ? "text-green-400"
                                  : conversation.status ===
                                      "PENDING"
                                    ? "text-yellow-400"
                                    : "text-white/40"
                              }`}
                            >
                              ●{" "}
                              {getStatusLabel(
                                conversation.status
                              )}
                            </span>

                            <span className="text-[10px] text-white/30">
                              {conversation.channel.name}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-line">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>
                    {selectedConversation?.contact
                      .name ||
                      "NL Assistant"}
                  </CardTitle>

                  <CardDescription>
                    {selectedConversation
                      ? selectedConversation.contact
                          .email ||
                        selectedConversation.contact
                          .phone ||
                        "Prospect test"
                      : "Votre agent répond automatiquement en français ou en anglais."}
                  </CardDescription>
                </div>

                {selectedConversation && (
                  <Badge variant="neutral">
                    {getStatusLabel(
                      selectedConversation.status
                    )}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="flex min-h-[520px] flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                  {messages.map((item) => {
                    const isUser =
                      item.role === "user";

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
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                            isUser
                              ? "bg-brand-500 text-white"
                              : "border border-line bg-ink text-white/80"
                          }`}
                        >
                          <p className="mb-1 text-xs font-medium opacity-60">
                            {isUser
                              ? "Vous"
                              : "NL Assistant"}
                          </p>

                          <p className="whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {sending && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-line bg-ink px-4 py-3 text-sm text-white/50">
                        NL Assistant réfléchit...
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-line p-4">
                  <form
                    onSubmit={handleSubmit}
                    className="flex gap-3"
                  >
                    <Input
                      value={message}
                      onChange={(event) =>
                        setMessage(
                          event.target.value
                        )
                      }
                      placeholder="Écrivez votre message..."
                      disabled={sending}
                      autoComplete="off"
                    />

                    <Button
                      type="submit"
                      disabled={
                        sending ||
                        !message.trim()
                      }
                    >
                      {sending
                        ? "..."
                        : "Envoyer"}
                    </Button>
                  </form>

                  <p className="mt-2 text-xs text-white/30">
                    Français 🇫🇷 ou English 🇬🇧 —
                    l'agent détecte automatiquement
                    la langue.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
