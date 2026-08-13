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
 * Récupérer les prospects de l'organisation
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: any = {
      organizationId: session.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
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
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        contact: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      leads,
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
 * Créer un nouveau prospect
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

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const whatsappId = String(
      body.whatsappId ?? ""
    ).trim();
    const source = String(
      body.source ?? ""
    ).trim();
    const notes = String(
      body.notes ?? ""
    ).trim();

    if (!name && !email && !phone && !whatsappId) {
      return NextResponse.json(
        {
          error:
            "Veuillez renseigner au moins un nom, un e-mail, un téléphone ou un identifiant WhatsApp.",
        },
        { status: 400 }
      );
    }

    /*
     * Création du contact
     */
    const contact = await prisma.contact.create({
      data: {
        organizationId: session.organizationId,
        name: name || null,
        email: email || null,
        phone: phone || null,
        whatsappId: whatsappId || null,
      },
    });

    /*
     * Création du prospect
     */
    const lead = await prisma.lead.create({
      data: {
        organizationId: session.organizationId,
        contactId: contact.id,
        status: "NEW",
        source: source || null,
        notes: notes || null,
      },
      include: {
        contact: true,
      },
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

/*
 * PUT
 * Modifier un prospect
 */
export async function PUT(request: Request) {
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

    const id = String(body.id ?? "").trim();

    if (!id) {
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
          id,
          organizationId:
            session.organizationId,
        },
        include: {
          contact: true,
        },
      });

    if (!existingLead) {
      return NextResponse.json(
        {
          error:
            "Ce prospect n'existe pas.",
        },
        { status: 404 }
      );
    }

    const name =
      body.name !== undefined
        ? String(body.name).trim()
        : undefined;

    const email =
      body.email !== undefined
        ? String(body.email)
            .trim()
            .toLowerCase()
        : undefined;

    const phone =
      body.phone !== undefined
        ? String(body.phone).trim()
        : undefined;

    const whatsappId =
      body.whatsappId !== undefined
        ? String(body.whatsappId).trim()
        : undefined;

    const source =
      body.source !== undefined
        ? String(body.source).trim()
        : undefined;

    const notes =
      body.notes !== undefined
        ? String(body.notes).trim()
        : undefined;

    const status =
      body.status !== undefined
        ? String(body.status)
        : undefined;

    const score =
      body.score !== undefined &&
      body.score !== null &&
      body.score !== ""
        ? Number(body.score)
        : undefined;

    const validStatuses = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "NEGOTIATION",
      "WON",
      "LOST",
    ];

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

    if (
      score !== undefined &&
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

    /*
     * Mise à jour du contact
     */
    const contact = await prisma.contact.update({
      where: {
        id: existingLead.contactId,
      },
      data: {
        ...(name !== undefined && {
          name: name || null,
        }),

        ...(email !== undefined && {
          email: email || null,
        }),

        ...(phone !== undefined && {
          phone: phone || null,
        }),

        ...(whatsappId !== undefined && {
          whatsappId: whatsappId || null,
        }),
      },
    });

    /*
     * Mise à jour du prospect
     */
    const lead = await prisma.lead.update({
      where: {
        id: existingLead.id,
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

        ...(source !== undefined && {
          source: source || null,
        }),

        ...(notes !== undefined && {
          notes: notes || null,
        }),

        ...(score !== undefined && {
          score,
        }),
      },
      include: {
        contact: true,
      },
    });

    return NextResponse.json({
      success: true,
      lead: {
        ...lead,
        contact,
      },
      message:
        "Prospect mis à jour avec succès.",
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
 * Supprimer un prospect
 */
export async function DELETE(request: Request) {
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

    const id = String(body.id ?? "").trim();

    if (!id) {
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
        id,
        organizationId:
          session.organizationId,
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          error:
            "Ce prospect n'existe pas.",
        },
        { status: 404 }
      );
    }

    /*
     * Le Lead possède une relation
     * Contact avec onDelete: Cascade.
     * Supprimer le contact supprimera donc
     * également le Lead.
     */
    await prisma.contact.delete({
      where: {
        id: lead.contactId,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Prospect supprimé avec succès.",
    });
  } catch (error) {
    console.error("Delete lead error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de supprimer le prospect.",
      },
      { status: 500 }
    );
  }
}
