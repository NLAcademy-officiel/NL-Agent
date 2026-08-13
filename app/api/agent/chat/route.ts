import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

const SESSION_COOKIE = "nl_agent_session";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getAuthenticatedSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return getSession(token);
}

export async function POST(request: Request) {
  try {
    /*
     * 1. Vérification de la session
     */
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Non authentifié.",
        },
        { status: 401 }
      );
    }

    /*
     * 2. Lecture du message
     */
    const body = await request.json();

    const message = String(body.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        {
          error: "Le message est obligatoire.",
        },
        { status: 400 }
      );
    }

    /*
     * 3. Identification du contact
     *
     * Pour le moment, l'interface de test n'envoie pas
     * encore d'e-mail ou de téléphone.
     *
     * On utilise donc un contact de test unique
     * pour l'organisation.
     */
    let contact = await prisma.contact.findFirst({
      where: {
        organizationId: session.organizationId,
        metadata: {
          path: ["source"],
          equals: "dashboard_chat",
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId: session.organizationId,
          name: "Prospect test",
          metadata: {
            source: "dashboard_chat",
          },
        },
      });
    }

    /*
     * 4. Récupération de l'agent
     */
    const agent = await prisma.agent.findFirst({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          error: "Aucun agent n'est configuré.",
        },
        { status: 404 }
      );
    }

    /*
     * 5. Vérification du statut
     */
    if (agent.status !== "ACTIVE") {
      return NextResponse.json(
        {
          error: "L'agent est actuellement inactif.",
        },
        { status: 403 }
      );
    }

    /*
     * 6. Récupération ou création du canal WEBSITE
     */
    let channel = await prisma.channel.findFirst({
      where: {
        organizationId: session.organizationId,
        type: "WEBSITE",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          organizationId: session.organizationId,
          type: "WEBSITE",
          name: "Dashboard Chat",
          isActive: true,
        },
      });
    }

    /*
     * 7. Récupération ou création de la conversation
     */
    let conversation = await prisma.conversation.findFirst({
      where: {
        organizationId: session.organizationId,
        contactId: contact.id,
        channelId: channel.id,
        status: {
          in: ["OPEN", "PENDING"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: session.organizationId,
          agentId: agent.id,
          channelId: channel.id,
          contactId: contact.id,
          status: "OPEN",
        },
      });
    } else if (conversation.agentId !== agent.id) {
      conversation = await prisma.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          agentId: agent.id,
          updatedAt: new Date(),
        },
      });
    }

    /*
     * 8. Enregistrement du message entrant
     */
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        type: "TEXT",
        senderType: "CONTACT",
        content: message,
      },
    });

    /*
     * 9. Récupération des connaissances
     */
    const knowledge = await prisma.agentKnowledge.findMany({
      where: {
        agentId: agent.id,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        title: true,
        content: true,
      },
    });

    /*
     * 10. Construction de la base de connaissances
     */
    const knowledgeText =
      knowledge.length > 0
        ? knowledge
            .map(
              (item) =>
                `### ${item.title}\n${item.content}`
            )
            .join("\n\n")
        : "Aucune connaissance supplémentaire n'a été fournie.";

    /*
     * 11. Instructions de base de l'agent
     */
    const defaultInstructions = `
Tu es un assistant IA professionnel.

Tu dois répondre de manière claire, utile, naturelle et professionnelle.

Tu communiques en français et en anglais.

RÈGLE DE LANGUE :
- Si le prospect écrit en français, réponds en français.
- Si le prospect écrit en anglais, réponds en anglais.
- Si le prospect mélange les deux langues, utilise principalement la langue dominante du message.
- Ne change pas de langue sans raison.

RÈGLE DE CONNAISSANCE :
- Utilise en priorité les informations fournies dans la base de connaissances.
- Ne fabrique jamais un prix, une date, une adresse, une formation ou une information qui n'est pas connue.
- Si une information importante manque, indique-le clairement et propose au prospect de contacter l'entreprise.

STYLE :
- Sois professionnel.
- Sois chaleureux.
- Réponds de manière concise mais suffisamment détaillée.
- Évite les réponses trop longues lorsque la question est simple.
`;

    const systemInstructions = `
${defaultInstructions}

IDENTITÉ DE L'AGENT :
Nom : ${agent.name}

Description :
${agent.description || "Assistant intelligent de l'entreprise."}

INSTRUCTIONS PERSONNALISÉES DE L'ENTREPRISE :
${agent.systemPrompt || "Aucune instruction supplémentaire."}

BASE DE CONNAISSANCES :
${knowledgeText}
`;

    /*
     * 12. Récupération de l'historique
     *
     * Cela permet à l'agent de comprendre le contexte
     * de la conversation.
     */
    const history = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 20,
      select: {
        direction: true,
        content: true,
      },
    });

    const chatMessages = [
      {
        role: "system" as const,
        content: systemInstructions,
      },
      ...history
        .filter(
          (
            item
          ): item is {
            direction: "INBOUND" | "OUTBOUND";
            content: string;
          } => Boolean(item.content)
        )
        .map((item) => ({
          role:
            item.direction === "INBOUND"
              ? ("user" as const)
              : ("assistant" as const),
          content: item.content as string,
        })),
    ];

    /*
     * 13. Appel OpenAI
     */
    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: chatMessages,
      });

    /*
     * 14. Récupération de la réponse
     */
    const reply =
      completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        {
          error:
            "L'agent n'a pas pu générer de réponse.",
        },
        { status: 500 }
      );
    }

    /*
     * 15. Enregistrement de la réponse de l'agent
     */
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        type: "TEXT",
        senderType: "AGENT",
        content: reply,
        metadata: {
          model: "gpt-4o-mini",
        },
      },
    });

    /*
     * 16. Mise à jour de la conversation
     */
    await prisma.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    /*
     * 17. Retour au frontend
     */
    return NextResponse.json({
      success: true,

      conversationId: conversation.id,

      agent: {
        id: agent.id,
        name: agent.name,
      },

      reply,

      language: "auto",
    });
  } catch (error) {
    console.error("Agent chat error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la génération de la réponse.",
      },
      { status: 500 }
    );
  }
}
