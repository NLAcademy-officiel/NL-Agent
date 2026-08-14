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

/*
 * Récupérer un prospect avec :
 * Lead
 * └── Contact
 *     └── Conversations
 *         └── Messages
 */
async function findLeadWithRelations(
  leadId: string,
  organizationId: string
) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      organizationId,
    },
    include: {
      contact: {
        include: {
          conversations: {
            include: {
              messages: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!lead) {
    return null;
  }

  /*
   * Le frontend LeadDetailPage attend :
   *
   * lead.contact
   * lead.conversations
   *
   * Or Prisma possède la relation :
   *
   * Lead → Contact → Conversations
   *
   * On expose donc les conversations directement
   * sur l'objet lead pour simplifier le frontend.
   */
  return {
    ...lead,
    conversations: lead.contact.conversations,
  };
}

/*
 * GET
 * Récupérer un prospect avec ses coordonnées
 * et son historique de conversations.
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

    const leadId = String(params.id ?? "").trim();

    if (!leadId) {
      return NextResponse.json(
        {
          error:
            "L'identifiant du prospect est obligatoire.",
        },
        { status: 400 }
      );
    }

    const lead = await findLeadWithRelations(
      leadId,
      session.organizationId
    );

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

/*
 * PATCH
 * Modifier le statut, le score, les notes
 * et/ou la source d'un prospect.
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

    const leadId = String(params.id ?? "").trim();

    if (!leadId) {
      return NextResponse.json(
        {
          error:
            "L'identifiant du prospect est obligatoire.",
        },
        { status: 400 }
      );
    }

    /*
     * Vérification que le prospect appartient
     * bien à l'organisation de la session.
     */
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

    const body = await request.json();

    /*
     * STATUT
     */
    let status: LeadStatus | undefined;

    if (body.status !== undefined) {
      const requestedStatus = String(
        body.status
      ).trim();

      if (
        !VALID_STATUSES.includes(
          requestedStatus as LeadStatus
        )
      ) {
        return NextResponse.json(
          {
            error: "Statut de prospect invalide.",
          },
          { status: 400 }
        );
      }

      status = requestedStatus as LeadStatus;
    }

    /*
     * SCORE
     *
     * undefined → ne pas modifier
     * null / ""  → supprimer le score
     * nombre     → score entre 0 et 100
     */
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
      const parsedScore = Number(body.score);

      if (
        Number.isNaN(parsedScore) ||
        parsedScore < 0 ||
        parsedScore > 100
      ) {
        return NextResponse.json(
          {
            error:
              "Le score doit être compris entre 0 et 100.",
          },
          { status: 400 }
        );
      }

      score = parsedScore;
    }

    /*
     * NOTES
     */
    let notes: string | undefined = undefined;

    if (body.notes !== undefined) {
      notes = String(body.notes).trim();
    }

    /*
     * SOURCE
     */
    let source: string | undefined = undefined;

    if (body.source !== undefined) {
      source = String(body.source).trim();
    }

    /*
     * Mise à jour du prospect.
     *
     * IMPORTANT :
     * organizationId n'est pas utilisé directement
     * dans le where du update car la vérification
     * d'appartenance a déjà été effectuée juste avant.
     */
    await prisma.lead.update({
      where: {
        id: existingLead.id,
      },
      data: {
        ...(status !== undefined && {
          status,
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
    });

    /*
     * On recharge le prospect avec toutes ses relations
     * afin que la réponse soit immédiatement compatible
     * avec LeadDetailPage.
     */
    const updatedLead = await findLeadWithRelations(
      existingLead.id,
      session.organizationId
    );

    if (!updatedLead) {
      return NextResponse.json(
        {
          error:
            "Le prospect a été modifié mais ne peut pas être rechargé.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
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
