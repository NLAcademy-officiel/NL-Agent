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
 * GET
 * Récupérer la liste des prospects.
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
    const search = searchParams.get("search")?.trim() || "";

    const leads = await prisma.lead.findMany({
      where: {
        organizationId: session.organizationId,

        ...(search
          ? {
              OR: [
                {
                  contact: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  contact: {
                    email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  contact: {
                    phone: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  contact: {
                    whatsappId: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
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
        error: "Impossible de récupérer les prospects.",
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
        { error: "Non authentifié." },
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
        ? String(body.email).trim().toLowerCase()
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

    if (!name && !email && !phone && !whatsappId) {
      return NextResponse.json(
        {
          error:
            "Au moins un nom, un e-mail, un téléphone ou un identifiant WhatsApp est obligatoire.",
        },
        { status: 400 }
      );
    }

    const lead = await prisma.$transaction(async (tx) => {
      /*
       * Si un contact existe déjà avec le même e-mail,
       * téléphone ou WhatsApp, on le réutilise.
       */
      let contact = null;

      if (email) {
        contact = await tx.contact.findFirst({
          where: {
            organizationId: session.organizationId,
            email,
          },
        });
      }

      if (!contact && phone) {
        contact = await tx.contact.findFirst({
          where: {
            organizationId: session.organizationId,
            phone,
          },
        });
      }

      if (!contact && whatsappId) {
        contact = await tx.contact.findFirst({
          where: {
            organizationId: session.organizationId,
            whatsappId,
          },
        });
      }

      /*
       * Création ou mise à jour du contact.
       */
      if (!contact) {
        contact = await tx.contact.create({
          data: {
            organizationId: session.organizationId,
            name,
            email,
            phone,
            whatsappId,
          },
        });
      } else {
        contact = await tx.contact.update({
          where: {
            id: contact.id,
          },
          data: {
            ...(name ? { name } : {}),
            ...(email ? { email } : {}),
            ...(phone ? { phone } : {}),
            ...(whatsappId ? { whatsappId } : {}),
          },
        });
      }

      /*
       * Comme contactId est @unique,
       * on vérifie si ce contact possède déjà un Lead.
       */
      const existingLead = await tx.lead.findUnique({
        where: {
          contactId: contact.id,
        },
        include: {
          contact: true,
        },
      });

      if (existingLead) {
        throw new Error("LEAD_ALREADY_EXISTS");
      }

      return tx.lead.create({
        data: {
          organizationId: session.organizationId,
          contactId: contact.id,
          status: "NEW",
          source,
          notes,
          score: null,
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
    if (
      error instanceof Error &&
      error.message === "LEAD_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        {
          error:
            "Ce contact possède déjà un prospect.",
        },
        { status: 409 }
      );
    }

    console.error("Create lead error:", error);

    return NextResponse.json(
      {
        error: "Impossible de créer le prospect.",
      },
      { status: 500 }
    );
  }
}

/*
 * PUT
 * Modifier un prospect existant.
 */
export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error: "L'identifiant du prospect est obligatoire.",
        },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id,
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

    const name =
      body.name !== undefined
        ? String(body.name).trim()
        : lead.contact.name;

    const email =
      body.email !== undefined
        ? String(body.email).trim().toLowerCase()
        : lead.contact.email;

    const phone =
      body.phone !== undefined
        ? String(body.phone).trim()
        : lead.contact.phone;

    const whatsappId =
      body.whatsappId !== undefined
        ? String(body.whatsappId).trim()
        : lead.contact.whatsappId;

    const source =
      body.source !== undefined
        ? String(body.source).trim()
        : lead.source;

    const notes =
      body.notes !== undefined
        ? String(body.notes).trim()
        : lead.notes;

    const status =
      body.status !== undefined
        ? String(body.status)
        : lead.status;

    const score =
      body.score === null ||
      body.score === undefined ||
      body.score === ""
        ? lead.score
        : Number(body.score);

    if (!name && !email && !phone && !whatsappId) {
      return NextResponse.json(
        {
          error:
            "Au moins un nom, un e-mail, un téléphone ou un identifiant WhatsApp est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (
      !VALID_STATUSES.includes(
        status as LeadStatus
      )
    ) {
      return NextResponse.json(
        {
          error: "Statut de prospect invalide.",
        },
        { status: 400 }
      );
    }

    if (
      score !== null &&
      (Number.isNaN(score) ||
        score < 0 ||
        score > 100)
    ) {
      return NextResponse.json(
        {
          error:
            "Le score doit être compris entre 0 et 100.",
        },
        { status: 400 }
      );
    }

    const updatedLead =
      await prisma.$transaction(async (tx) => {
        const updatedContact =
          await tx.contact.update({
            where: {
              id: lead.contactId,
            },
            data: {
              name,
              email,
              phone,
              whatsappId,
            },
          });

        return tx.lead.update({
          where: {
            id: lead.id,
          },
          data: {
            status: status as LeadStatus,
            source,
            notes,
            score,
          },
          include: {
            contact: true,
          },
        });
      });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: "Prospect mis à jour avec succès.",
    });
  } catch (error) {
    console.error("Update lead error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de modifier le prospect.",
      },
      { status: 500 }
    );
  }
}

/*
 * DELETE
 * Supprimer un prospect.
 */
export async function DELETE(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error: "L'identifiant du prospect est obligatoire.",
        },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
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

    await prisma.lead.delete({
      where: {
        id: lead.id,
      },
    });

    /*
     * Le contact reste volontairement dans la base.
     * Cela permet de conserver l'historique des conversations.
     */

    return NextResponse.json({
      success: true,
      message: "Prospect supprimé avec succès.",
    });
  } catch (error) {
    console.error("Delete lead error:", error);

    return NextResponse.json(
      {
        error: "Impossible de supprimer le prospect.",
      },
      { status: 500 }
    );
  }
}
