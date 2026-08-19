import { NextResponse } from "next/server";
import OpenAI from "openai";

import { prisma } from "@/lib/database/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PublicChatBody = {
  message?: unknown;
  widgetId?: unknown;
  conversationId?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  whatsappId?: unknown;
};

function cleanString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function POST(request: Request) {
  try {
    /*
     * 1. Vérification de la clé OpenAI
     */
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Le service IA n'est pas correctement configuré.",
        },
        { status: 500 }
      );
    }

    /*
     * 2. Lecture du body
     */
    const body =
      (await request.json()) as PublicChatBody;

    const message = cleanString(body.message);
    const widgetId = cleanString(body.widgetId);
    const conversationId = cleanString(
      body.conversationId
    );

    const name = cleanString(body.name);
    const email = cleanString(body.email).toLowerCase();
    const phone = cleanString(body.phone);
    const whatsappId = cleanString(
      body.whatsappId
    );

    if (!message) {
      return NextResponse.json(
        {
          error: "Le message est obligatoire.",
        },
        { status: 400 }
      );
    }

     /*
* 3. Identification de l'organisation via le widgetId
*/
if (!widgetId) {
return NextResponse.json(
{
error: "widgetId est obligatoire.",
},
{ status: 400 }
);
}

const channelForWidget = await prisma.channel.findFirst({
where: {
widgetId,
type: "WEBSITE",
isActive: true,
},
include: {
organization: true,
},
});

if (!channelForWidget) {
return NextResponse.json(
{
error: "Widget invalide ou désactivé.",
},
{ status: 404 }
);
}

const organization = channelForWidget.organization;

    /*
     * 4. Récupération de l'agent actif
     */
    const agent = await prisma.agent.findFirst({
      where: {
        organizationId: organization.id,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          error:
            "Aucun agent actif n'est configuré.",
        },
        { status: 404 }
      );
    }

    /*
     * 5. Récupération ou création du contact
     *
     * On essaie d'abord l'e-mail,
     * puis le téléphone,
     * puis WhatsApp.
     */
    let contact = null;

    if (email) {
      contact = await prisma.contact.findFirst({
        where: {
          organizationId: organization.id,
          email,
        },
      });
    }

    if (!contact && phone) {
      contact = await prisma.contact.findFirst({
        where: {
          organizationId: organization.id,
          phone,
        },
      });
    }

    if (!contact && whatsappId) {
      contact = await prisma.contact.findFirst({
        where: {
          organizationId: organization.id,
          whatsappId,
        },
      });
    }

    /*
     * Si aucun contact n'existe,
     * création d'un nouveau contact.
     */
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId: organization.id,
          name: name || null,
          email: email || null,
          phone: phone || null,
          whatsappId: whatsappId || null,
          metadata: {
            source: "public_chat",
          },
        },
      });
    } else {
      /*
       * Mise à jour uniquement des informations
       * nouvellement fournies.
       */
      contact = await prisma.contact.update({
        where: {
          id: contact.id,
        },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          ...(whatsappId
            ? { whatsappId }
            : {}),
        },
      });
    }

    /*
     * 6. Récupération ou création du Lead
     *
     * Grâce à contactId @unique,
     * chaque contact possède au maximum
     * un Lead.
     */
    const lead = await prisma.lead.upsert({
      where: {
        contactId: contact.id,
      },
      update: {},
      create: {
        organizationId: organization.id,
        contactId: contact.id,
        status: "NEW",
        source: "PUBLIC_CHAT",
      },
    });

    /*
     * 7. Récupération ou création du canal WEBSITE
     */
    let channel = await prisma.channel.findFirst({
      where: {
        organizationId: organization.id,
        type: "WEBSITE",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          organizationId: organization.id,
          type: "WEBSITE",
          name: "Site Web",
          isActive: true,
          configuration: {
            source: "public_chat",
          },
        },
      });
    }

    /*
     * Vérification que le canal est actif.
     */
    if (!channel.isActive) {
      return NextResponse.json(
        {
          error:
            "Le canal de discussion est actuellement désactivé.",
        },
        { status: 403 }
      );
    }

    /*
     * 8. Récupération d'une conversation existante
     *
     * Si le frontend fournit un conversationId,
     * on vérifie qu'il appartient bien au même contact
     * et à la même organisation.
     */
    let conversation = null;

    if (conversationId) {
      conversation =
        await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            organizationId: organization.id,
            contactId: contact.id,
            channelId: channel.id,
          },
        });
    }

    /*
     * Si aucune conversation valide n'a été trouvée,
     * on cherche une conversation ouverte.
     */
    if (!conversation) {
      conversation =
        await prisma.conversation.findFirst({
          where: {
            organizationId: organization.id,
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
    }

    /*
     * Création d'une nouvelle conversation
     * si nécessaire.
     */
    if (!conversation) {
      conversation =
        await prisma.conversation.create({
          data: {
            organizationId: organization.id,
            agentId: agent.id,
            channelId: channel.id,
            contactId: contact.id,
            status: "OPEN",
          },
        });
    } else if (
      conversation.agentId !== agent.id
    ) {
      conversation =
        await prisma.conversation.update({
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
     * 9. Enregistrement du message du visiteur
     */
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        type: "TEXT",
        senderType: "CONTACT",
        content: message,
        metadata: {
          source: "public_chat",
        },
      },
    });

    /*
     * 10. Récupération de la Knowledge Base
     */
    const knowledge =
      await prisma.agentKnowledge.findMany({
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

    const knowledgeText =
      knowledge.length > 0
        ? knowledge
            .map(
              (item) =>
                `### ${item.title}\n${item.content}`
            )
            .join("\n\n")
        : "Aucune connaissance supplémentaire n'est disponible.";

    /*
     * 11. Instructions générales de NL Agent
     */
    const defaultInstructions = `
Tu es un agent commercial IA professionnel.

Tu es l'assistant officiel de l'entreprise.

Ta mission est :
- accueillir les visiteurs ;
- comprendre leurs besoins ;
- répondre à leurs questions ;
- présenter les produits, formations ou services disponibles ;
- qualifier les prospects ;
- les orienter vers l'action appropriée ;
- ne jamais inventer une information.

LANGUE :

- Si le visiteur écrit en français, réponds en français.
- Si le visiteur écrit en anglais, réponds en anglais.
- Si le visiteur mélange français et anglais, utilise principalement la langue dominante.
- Ne change pas de langue sans raison.

CONNAISSANCES :

- Utilise prioritairement les informations présentes dans la base de connaissances.
- Ne fabrique jamais un prix.
- Ne fabrique jamais une date.
- Ne fabrique jamais une adresse.
- Ne fabrique jamais une formation.
- Ne fabrique jamais une condition.
- Ne fabrique jamais une promotion.
- Si une information n'est pas disponible, dis-le clairement.

STYLE :

- Professionnel.
- Chaleureux.
- Naturel.
- Concis.
- Orienté aide et conversion.
- Ne donne pas une réponse inutilement longue.
- Pose une question lorsque cela permet de mieux qualifier le prospect.

QUALIFICATION :

Lorsque cela est pertinent, cherche à comprendre :
- le besoin du prospect ;
- son objectif ;
- le service ou la formation qui l'intéresse ;
- son niveau actuel ;
- son urgence ;
- ses coordonnées si elles sont nécessaires.

IMPORTANT :

Tu ne dois jamais prétendre être un humain.

Tu es un assistant IA.

Si le prospect demande à parler à un humain,
invite-le à contacter l'entreprise par le canal
officiel disponible.
`;

    /*
     * 12. Instructions personnalisées de l'agent
     */
    const systemInstructions = `
${defaultInstructions}

IDENTITÉ DE L'AGENT :

Nom :
${agent.name}

Description :
${
  agent.description ||
  "Assistant intelligent de l'entreprise."
}

INSTRUCTIONS DE L'ENTREPRISE :

${
  agent.systemPrompt ||
  "Aucune instruction personnalisée supplémentaire."
}

BASE DE CONNAISSANCES :

${knowledgeText}
`;

    /*
     * 13. Récupération de l'historique
     *
     * On récupère les 20 derniers messages.
     */
    const history =
      await prisma.message.findMany({
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

    /*
     * 14. Construction des messages OpenAI
     */
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
            direction:
              | "INBOUND"
              | "OUTBOUND";
            content: string;
          } => Boolean(item.content)
        )
        .map((item) => ({
          role:
            item.direction === "INBOUND"
              ? ("user" as const)
              : ("assistant" as const),
          content: item.content,
        })),
    ];

    /*
     * 15. Appel OpenAI
     */
    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: chatMessages,
      });

    /*
     * 16. Récupération de la réponse
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
     * 17. Enregistrement de la réponse IA
     */
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        type: "TEXT",
        senderType: "AGENT",
        content: reply,
        metadata: {
          source: "public_chat",
          model: "gpt-4o-mini",
        },
      },
    });

    /*
     * 18. Mise à jour de la conversation
     */
    const updatedConversation =
      await prisma.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          updatedAt: new Date(),
        },
      });

    /*
     * 19. Réponse au frontend
     */
    return NextResponse.json({
      success: true,

      conversationId:
        updatedConversation.id,

      contactId: contact.id,

      leadId: lead.id,

      agent: {
        id: agent.id,
        name: agent.name,
      },

      reply,

      language: "auto",
    });
  } catch (error) {
    console.error(
      "Public chat error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la génération de la réponse.",
      },
      { status: 500 }
    );
  }
}
