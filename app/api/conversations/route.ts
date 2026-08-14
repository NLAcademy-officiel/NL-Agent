import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

const SESSION_COOKIE = "nl_agent_session";

async function getAuthenticatedSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return getSession(token);
}

/**
 * GET
 * Récupère toutes les conversations
 * de l'organisation connectée.
 */
export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Non authentifié.",
        },
        { status: 401 }
      );
    }

    const conversations =
      await prisma.conversation.findMany({
        where: {
          organizationId: session.organizationId,
        },
        include: {
          contact: true,
          agent: true,
          channel: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Impossible de récupérer les conversations.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Crée une nouvelle conversation.
 *
 * Le contact est recherché par e-mail ou téléphone.
 * S'il n'existe pas, il est créé.
 *
 * Une conversation est ensuite créée avec :
 * - le premier agent actif disponible ;
 * - un canal WEBSITE ;
 * - le contact identifié.
 *
 * Un Lead est également créé automatiquement
 * s'il n'existe pas déjà pour ce contact.
 */
export async function POST(
  request: Request
) {
  try {
    const session =
      await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Non authentifié.",
        },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Corps de requête invalide.",
        },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const whatsappId =
      typeof body.whatsappId === "string"
        ? body.whatsappId.trim()
        : "";

    const channelType =
      typeof body.channelType === "string"
        ? body.channelType.trim().toUpperCase()
        : "WEBSITE";

    if (
      !name &&
      !email &&
      !phone &&
      !whatsappId
    ) {
      return NextResponse.json(
        {
          error:
            "Au moins un nom, une adresse e-mail, un numéro de téléphone ou un identifiant WhatsApp est requis.",
        },
        { status: 400 }
      );
    }

    /**
     * Vérification du canal demandé.
     *
     * Le schéma Prisma accepte actuellement :
     * WEBSITE
     * WHATSAPP
     */
    if (
      channelType !== "WEBSITE" &&
      channelType !== "WHATSAPP"
    ) {
      return NextResponse.json(
        {
          error:
            "Type de canal invalide. Utilisez WEBSITE ou WHATSAPP.",
        },
        { status: 400 }
      );
    }

    /**
     * Recherche du contact existant.
     *
     * IMPORTANT :
     * La recherche est toujours limitée
     * à l'organisation connectée.
     */
    let contact =
      await prisma.contact.findFirst({
        where: {
          organizationId:
            session.organizationId,
          OR: [
            ...(email
              ? [{ email }]
              : []),
            ...(phone
              ? [{ phone }]
              : []),
            ...(whatsappId
              ? [{ whatsappId }]
              : []),
          ],
        },
      });

    /**
     * Création ou mise à jour du contact.
     */
    if (!contact) {
      contact =
        await prisma.contact.create({
          data: {
            organizationId:
              session.organizationId,
            name: name || null,
            email: email || null,
            phone: phone || null,
            whatsappId:
              whatsappId || null,
          },
        });
    } else {
      contact =
        await prisma.contact.update({
          where: {
            id: contact.id,
          },
          data: {
            ...(name
              ? { name }
              : {}),
            ...(email
              ? { email }
              : {}),
            ...(phone
              ? { phone }
              : {}),
            ...(whatsappId
              ? { whatsappId }
              : {}),
          },
        });
    }

    /**
     * Recherche du premier agent actif
     * de l'organisation.
     */
    const agent =
      await prisma.agent.findFirst({
        where: {
          organizationId:
            session.organizationId,
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    /**
     * Recherche du canal demandé.
     */
    let channel =
      await prisma.channel.findFirst({
        where: {
          organizationId:
            session.organizationId,
          type: channelType as
            | "WEBSITE"
            | "WHATSAPP",
        },
      });

    /**
     * Création automatique du canal
     * s'il n'existe pas.
     */
    if (!channel) {
      channel =
        await prisma.channel.create({
          data: {
            organizationId:
              session.organizationId,
            type: channelType as
              | "WEBSITE"
              | "WHATSAPP",
            name:
              channelType === "WHATSAPP"
                ? "WhatsApp"
                : "Site Web",
            isActive: true,
          },
        });
    }

    /**
     * Création de la conversation.
     */
    const conversation =
      await prisma.conversation.create({
        data: {
          organizationId:
            session.organizationId,
          agentId:
            agent?.id ?? null,
          channelId: channel.id,
          contactId: contact.id,
          status: "OPEN",
        },
        include: {
          contact: true,
          agent: true,
          channel: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    /**
     * Création automatique du Lead.
     *
     * Grâce à contactId @unique dans Prisma,
     * un contact ne peut avoir qu'un seul Lead.
     */
    const lead =
      await prisma.lead.upsert({
        where: {
          contactId: contact.id,
        },
        update: {},
        create: {
          organizationId:
            session.organizationId,
          contactId: contact.id,
          status: "NEW",
          source:
            channelType === "WHATSAPP"
              ? "WHATSAPP"
              : "WEBSITE",
        },
        include: {
          contact: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        conversation,
        lead,
        message:
          "Conversation créée avec succès.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Impossible de créer la conversation.",
      },
      { status: 500 }
    );
  }
}
