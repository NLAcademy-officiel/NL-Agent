import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

const SESSION_COOKIE = "nl_agent_session";

const VALID_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

type LeadStatus = (typeof VALID_STATUSES)[number];

async function getAuthenticatedSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return getSession(token);
}

/**
 * GET /api/leads/[id]
 *
 * Récupère un prospect avec :
 * - ses informations de contact
 * - ses conversations
 * - les messages de chaque conversation
 *
 * Le prospect doit appartenir à l'organisation
 * de l'utilisateur connecté.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const leadId = params?.id;

    if (!leadId) {
      return NextResponse.json(
        {
          error: "L'identifiant du prospect est obligatoire.",
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

        conversations: {
          orderBy: {
            updatedAt: "desc",
          },

          include: {
            messages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
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
      conversations: lead.conversations,
    });
  } catch (error) {
    console.error("Get lead error:", error);

    return NextResponse.json(
      {
        error: "Impossible de récupérer le prospect.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/leads/[id]
 *
 * Met à jour :
 * - le statut
 * - le score
 * - les notes
 * - la source
 *
 * Le prospect doit appartenir à l'organisation
 * de l'utilisateur connecté.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const leadId = params?.id;

    if (!leadId) {
      return NextResponse.json(
        {
          error: "L'identifiant du prospect est obligatoire.",
        },
        { status: 400 }
      );
    }

    const existingLead = await prisma.lead.findFirst({
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

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Le corps de la requête est invalide.",
        },
        { status: 400 }
      );
    }

    /**
     * STATUS
     */
    let status: LeadStatus | undefined;

    if (body.status !== undefined) {
      const requestedStatus = String(body.status).trim();

      if (
        !VALID_STATUSES.includes(
          requestedStatus as LeadStatus
        )
      ) {
        return NextResponse.json(
          {
            error: "Statut de prospect invalide.",
            validStatuses: VALID_STATUSES,
          },
          { status: 400 }
        );
      }

      status = requestedStatus as LeadStatus;
    }

    /**
     * SCORE
     */
    let score: number | null | undefined = undefined;

    if (
      body.score === null ||
      body.score === ""
    ) {
      score = null;
    } else if (body.score !== undefined) {
      const numericScore = Number(body.score);

      if (
        !Number.isFinite(numericScore) ||
        !Number.isInteger(numericScore) ||
        numericScore < 0 ||
        numericScore > 100
      ) {
        return NextResponse.json(
          {
            error:
              "Le score doit être un nombre entier compris entre 0 et 100.",
          },
          { status: 400 }
        );
      }

      score = numericScore;
    }

    /**
     * NOTES
     */
    let notes: string | null | undefined = undefined;

    if (body.notes !== undefined) {
      if (
        body.notes === null ||
        String(body.notes).trim() === ""
      ) {
        notes = null;
      } else {
        notes = String(body.notes).trim();
      }
    }

    /**
     * SOURCE
     */
    let source: string | null | undefined = undefined;

    if (body.source !== undefined) {
      if (
        body.source === null ||
        String(body.source).trim() === ""
      ) {
        source = null;
      } else {
        source = String(body.source).trim();
      }
    }

    /**
     * Mise à jour
     */
    const updatedLead = await prisma.lead.update({
      where: {
        id: leadId,
      },

      data: {
        ...(status !== undefined && {
          status,
        }),

        ...(score !== undefined && {
          score,
        }),

        ...(notes !== undefined && {
          notes,
        }),

        ...(source !== undefined && {
          source,
        }),
      },

      include: {
        contact: true,

        conversations: {
          orderBy: {
            updatedAt: "desc",
          },

          include: {
            messages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      conversations: updatedLead.conversations,
      message: "Prospect mis à jour avec succès.",
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
