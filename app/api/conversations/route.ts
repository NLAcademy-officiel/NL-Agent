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
 * Récupère les conversations de l'organisation connectée.
 */
export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const conversations = await prisma.conversation.findMany({
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
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return NextResponse.json(
      {
        error: "Impossible de récupérer les conversations.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Crée une nouvelle conversation.
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

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone ?? "").trim();

    if (!name && !email && !phone) {
      return NextResponse.json(
        {
          error:
            "Au moins un nom, une adresse e-mail ou un numéro de téléphone est requis.",
        },
        { status: 400 }
      );
    }

    /*
     * Recherche d'un contact existant.
     *
     * On limite toujours la recherche à l'organisation
     * actuellement connectée.
     */
    let contact = null;

    if (email) {
      contact = await prisma.contact.findFirst({
        where: {
          organizationId: session.organizationId,
          email,
        },
      });
    }

    if (!contact && phone) {
      contact = await prisma.contact.findFirst({
        where: {
          organizationId: session.organizationId,
          phone,
        },
      });
    }

    /*
     * Si le contact n'existe pas encore,
     * on le crée.
     */
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId: session.organizationId,
          name: name || null,
          email: email || null,
          phone: phone || null,
        },
      });
    } else {
      /*
       * Mise à jour des informations disponibles
       * si le contact existe déjà.
       */
      contact = await prisma.contact.update({
        where: {
          id: contact.id,
        },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
        },
      });
    }

    /*
     * Récupération du premier agent actif
     * de l'organisation.
     */
    const agent = await prisma.agent.findFirst({
      where: {
        organizationId: session.organizationId,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    /*
     * Récupération d'un canal WEBSITE.
     */
    let channel = await prisma.channel.findFirst({
      where: {
        organizationId: session.organizationId,
        type: "WEBSITE",
      },
    });

    /*
     * Si aucun canal WEBSITE n'existe encore,
     * on le crée automatiquement.
     */
    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          organizationId: session.organizationId,
          type: "WEBSITE",
          name: "Site Web",
          isActive: true,
        },
      });
    }

    /*
     * Création de la conversation.
     */
    const conversation = await prisma.conversation.create({
      data: {
        organizationId: session.organizationId,
        agentId: agent?.id ?? null,
        channelId: channel.id,
        contactId: contact.id,
        status: "OPEN",
      },
      include: {
        contact: true,
        agent: true,
        channel: true,
        messages: true,
      },
    });

    /*
     * Création automatique du Lead.
     *
     * Un contact ne peut avoir qu'un seul Lead
     * grâce à contactId @unique dans Prisma.
     */
    await prisma.lead.upsert({
      where: {
        contactId: contact.id,
      },
      update: {},
      create: {
        organizationId: session.organizationId,
        contactId: contact.id,
        status: "NEW",
        source: "WEBSITE",
      },
    });

    return NextResponse.json(
      {
        success: true,
        conversation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create conversation error:", error);

    return NextResponse.json(
      {
        error: "Impossible de créer la conversation.",
      },
      { status: 500 }
    );
  }
}
