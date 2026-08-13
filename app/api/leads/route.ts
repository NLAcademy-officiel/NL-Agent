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

/*
 * GET
 * Récupérer la liste des prospects
 * de l'organisation de l'utilisateur connecté.
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

    const leads = await prisma.lead.findMany({
      where: {
        organizationId: session.organizationId,
      },
      include: {
        contact: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      leads,
      count: leads.length,
    });
  } catch (error) {
    console.error("Get leads error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de récupérer les prospects.",
      },
      { status: 500 }
    );
  }
}

/*
 * POST
 * Créer un nouveau prospect avec son contact.
 */
export async function POST(request: Request) {
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

    const body = await request.json();

    const name =
      body.name !== undefined
        ? String(body.name).trim()
        : null;

    const email =
      body.email !== undefined
        ? String(body.email).trim()
        : null;

    const phone =
      body.phone !== undefined
        ? String(body.phone).trim()
        : null;

    const whatsappId =
      body.whatsappId !== undefined
        ? String(body.whatsappId).trim()
        : null;

    const source =
      body.source !== undefined
        ? String(body.source).trim()
        : null;

    const notes =
      body.notes !== undefined
        ? String(body.notes).trim()
        : null;

    const score =
      body.score !== undefined &&
      body.score !== null &&
      body.score !== ""
        ? Number(body.score)
        : null;

    const status =
      body.status !== undefined
        ? String(body.status)
        : "NEW";

    if (!name && !email && !phone && !whatsappId) {
      return NextResponse.json(
        {
          error:
            "Au moins un nom, un email, un téléphone ou un identifiant WhatsApp est obligatoire.",
        },
        { status: 400 }
      );
    }

    const validStatuses = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "NEGOTIATION",
      "WON",
      "LOST",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Statut de prospect invalide.",
        },
        { status: 400 }
      );
    }

    if (
      score !== null &&
      (Number.isNaN(score) || score < 0 || score > 100)
    ) {
      return NextResponse.json(
        {
          error:
            "Le score doit être compris entre 0 et 100.",
        },
        { status: 400 }
      );
    }

    const lead = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          organizationId: session.organizationId,
          name,
          email,
          phone,
          whatsappId,
        },
      });

      return tx.lead.create({
        data: {
          organizationId: session.organizationId,
          contactId: contact.id,
          status: status as
            | "NEW"
            | "CONTACTED"
            | "QUALIFIED"
            | "NEGOTIATION"
            | "WON"
            | "LOST",
          source,
          notes,
          score,
        },
        include: {
          contact: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        lead,
        message: "Prospect créé avec succès.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create lead error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de créer le prospect.",
      },
      { status: 500 }
    );
  }
}
