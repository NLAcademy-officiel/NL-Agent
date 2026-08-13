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
 * Récupère les messages d'une conversation.
 *
 * URL :
 * /api/messages?conversationId=xxxxx
 */
export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const conversationId =
      searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        {
          error:
            "L'identifiant de la conversation est obligatoire.",
        },
        { status: 400 }
      );
    }

    /*
     * Vérification que la conversation appartient
     * bien à l'organisation connectée.
     */
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          organizationId: session.organizationId,
        },
      });

    if (!conversation) {
      return NextResponse.json(
        {
          error: "Conversation introuvable.",
        },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        attachments: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return NextResponse.json(
      {
        error: "Impossible de récupérer les messages.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Enregistre un message dans une conversation.
 */
export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const conversationId = String(
      body.conversationId ?? ""
    ).trim();

    const content = String(
      body.content ?? ""
    ).trim();

    const direction = String(
      body.direction ?? "INBOUND"
    ).toUpperCase();

    const senderType = String(
      body.senderType ??
        (direction === "INBOUND"
          ? "CONTACT"
          : "AGENT")
    ).toUpperCase();

    const type = String(
      body.type ?? "TEXT"
    ).toUpperCase();

    const externalId = body.externalId
      ? String(body.externalId)
      : null;

    const metadata =
      body.metadata &&
      typeof body.metadata === "object"
        ? body.metadata
        : undefined;

    if (!conversationId) {
      return NextResponse.json(
        {
          error:
            "L'identifiant de la conversation est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          error: "Le contenu du message est obligatoire.",
        },
        { status: 400 }
      );
    }

    /*
     * Vérification des valeurs autorisées
     * par les enums Prisma.
     */
    const allowedDirections = [
      "INBOUND",
      "OUTBOUND",
    ];

    const allowedSenderTypes = [
      "CONTACT",
      "AGENT",
      "HUMAN",
      "SYSTEM",
    ];

    const allowedTypes = [
      "TEXT",
      "IMAGE",
      "DOCUMENT",
      "AUDIO",
      "VIDEO",
      "OTHER",
    ];

    if (!allowedDirections.includes(direction)) {
      return NextResponse.json(
        {
          error:
            "Direction de message invalide.",
        },
        { status: 400 }
      );
    }

    if (!allowedSenderTypes.includes(senderType)) {
      return NextResponse.json(
        {
          error:
            "Type d'expéditeur invalide.",
        },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        {
          error:
            "Type de message invalide.",
        },
        { status: 400 }
      );
    }

    /*
     * Vérification de la conversation.
     */
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          organizationId: session.organizationId,
        },
      });

    if (!conversation) {
      return NextResponse.json(
        {
          error: "Conversation introuvable.",
        },
        { status: 404 }
      );
    }

    /*
     * Création du message.
     */
    const createdMessage =
      await prisma.message.create({
        data: {
          conversationId,
          direction: direction as
            | "INBOUND"
            | "OUTBOUND",
          type: type as
            | "TEXT"
            | "IMAGE"
            | "DOCUMENT"
            | "AUDIO"
            | "VIDEO"
            | "OTHER",
          senderType: senderType as
            | "CONTACT"
            | "AGENT"
            | "HUMAN"
            | "SYSTEM",
          content,
          externalId,
          metadata,
        },
        include: {
          attachments: true,
        },
      });

    /*
     * Mise à jour de la date de modification
     * de la conversation.
     */
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: createdMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create message error:", error);

    return NextResponse.json(
      {
        error: "Impossible d'enregistrer le message.",
      },
      { status: 500 }
    );
  }
}
