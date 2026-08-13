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
     * 3. Récupération de l'agent
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
     * 4. Vérification du statut
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
     * 5. Récupération des connaissances
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
     * 6. Construction de la base de connaissances
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
     * 7. Instructions de base de l'agent
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
     * 8. Appel OpenAI
     */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: systemInstructions,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    /*
     * 9. Récupération de la réponse
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
     * 10. Retour de la réponse
     */
    return NextResponse.json({
      success: true,
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
