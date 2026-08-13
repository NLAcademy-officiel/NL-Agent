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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json(
        {
          error:
            "L'identifiant du prospect est obligatoire.",
        },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId: session.organizationId,
      },
      include: {
        contact: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          error: "Prospect introuvable.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error("Get lead error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de récupérer le prospect.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json(
        {
          error:
            "L'identifiant du prospect est obligatoire.",
        },
        { status: 400 }
      );
    }

    const existingLead =
      await prisma.lead.findFirst({
        where: {
          id: leadId,
          organizationId: session.organizationId,
        },
      });

    if (!existingLead) {
      return NextResponse.json(
        {
          error: "Prospect introuvable.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const validStatuses = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "NEGOTIATION",
      "WON",
      "LOST",
    ];

    const status =
      body.status !== undefined
        ? String(body.status)
        : undefined;

    if (
      status &&
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          error: "Statut de prospect invalide.",
        },
        { status: 400 }
      );
    }

    let score:
      | number
      | null
      | undefined = undefined;

    if (
      body.score === null ||
      body.score === ""
    ) {
      score = null;
    } else if (body.score !== undefined) {
      score = Number(body.score);

      if (
        Number.isNaN(score) ||
        score < 0 ||
        score > 100
      ) {
        return NextResponse.json(
          {
            error:
              "Le score doit être compris entre 0 et 100.",
          },
          { status: 400 }
        );
      }
    }

    const notes =
      body.notes !== undefined
        ? String(body.notes).trim()
        : undefined;

    const source =
      body.source !== undefined
        ? String(body.source).trim()
        : undefined;

    const lead = await prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        ...(status && {
          status: status as
            | "NEW"
            | "CONTACTED"
            | "QUALIFIED"
            | "NEGOTIATION"
            | "WON"
            | "LOST",
        }),

        ...(score !== undefined && {
          score,
        }),

        ...(notes !== undefined && {
          notes: notes || null,
        }),

        ...(source !== undefined && {
          source: source || null,
        }),
      },
      include: {
        contact: true,
      },
    });

    return NextResponse.json({
      success: true,
      lead,
      message:
        "Prospect mis à jour avec succès.",
    });
  } catch (error) {
    console.error("Update lead error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de mettre à jour le prospect.",
      },
      { status: 500 }
    );
  }
}
