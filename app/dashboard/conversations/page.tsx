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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ConversationsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour 👋 Je suis votre assistant IA. Comment puis-je vous aider ?",
    },
  ]);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending) {
      return;
    }

    setError("");

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmedMessage,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setMessage("");
    setSending(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
        }),
      });

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
    } catch {
      setError(
        "Impossible de contacter le serveur. Réessayez."
      );
    } finally {
      setSending(false);
    }
  }

  function clearConversation() {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Bonjour 👋 Je suis votre assistant IA. Comment puis-je vous aider ?",
      },
    ]);

    setError("");
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
              Testez votre agent IA et observez ses réponses
              en temps réel.
            </p>
          </div>

          <Button
            type="button"
            onClick={clearConversation}
            disabled={sending}
          >
            Nouvelle conversation
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-line">
            <CardTitle>NL Assistant</CardTitle>

            <CardDescription>
              Votre agent répond automatiquement en français
              ou en anglais selon la langue du prospect.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex min-h-[520px] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {messages.map((item) => {
                  const isUser = item.role === "user";

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
                      setMessage(event.target.value)
                    }
                    placeholder="Écrivez votre message..."
                    disabled={sending}
                    autoComplete="off"
                  />

                  <Button
                    type="submit"
                    disabled={
                      sending || !message.trim()
                    }
                  >
                    {sending ? "..." : "Envoyer"}
                  </Button>
                </form>

                <p className="mt-2 text-xs text-white/30">
                  Français 🇫🇷 ou English 🇬🇧 — l'agent détecte
                  automatiquement la langue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
