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
 * Récupérer toutes les connaissances de l'agent
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

    const agent = await prisma.agent.findFirst({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          error: "Aucun agent n'est configuré.",
        },
        { status: 404 }
      );
    }

    const knowledge = await prisma.agentKnowledge.findMany({
      where: {
        agentId: agent.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      knowledge,
    });
  } catch (error) {
    console.error("Get agent knowledge error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de récupérer la base de connaissances.",
      },
      { status: 500 }
    );
  }
}

/*
 * POST
 * Ajouter une nouvelle connaissance
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

    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!title || !content) {
      return NextResponse.json(
        {
          error:
            "Le titre et le contenu sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          error:
            "Le titre ne doit pas dépasser 200 caractères.",
        },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findFirst({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          error: "Aucun agent n'est configuré.",
        },
        { status: 404 }
      );
    }

    const knowledge = await prisma.agentKnowledge.create({
      data: {
        agentId: agent.id,
        title,
        content,
      },
    });

    return NextResponse.json(
      {
        success: true,
        knowledge,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create agent knowledge error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible d'ajouter cette connaissance.",
      },
      { status: 500 }
    );
  }
}

/*
 * PUT
 * Modifier une connaissance existante
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
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "L'identifiant de la connaissance est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        {
          error:
            "Le titre et le contenu sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          error:
            "Le titre ne doit pas dépasser 200 caractères.",
        },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findFirst({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          error: "Aucun agent n'est configuré.",
        },
        { status: 404 }
      );
    }

    const existingKnowledge =
      await prisma.agentKnowledge.findFirst({
        where: {
          id,
          agentId: agent.id,
        },
      });

    if (!existingKnowledge) {
      return NextResponse.json(
        {
          error:
            "Cette connaissance n'existe pas.",
        },
        { status: 404 }
      );
    }

    const knowledge =
      await prisma.agentKnowledge.update({
        where: {
          id: existingKnowledge.id,
        },
        data: {
          title,
          content,
        },
      });

    return NextResponse.json({
      success: true,
      knowledge,
      message:
        "Connaissance mise à jour avec succès.",
    });
  } catch (error) {
    console.error("Update agent knowledge error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de modifier cette connaissance.",
      },
      { status: 500 }
    );
  }
}

/*
 * DELETE
 * Supprimer une connaissance
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
            "L'identifiant de la connaissance est obligatoire.",
        },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findFirst({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          error: "Aucun agent n'est configuré.",
        },
        { status: 404 }
      );
    }

    const knowledge =
      await prisma.agentKnowledge.findFirst({
        where: {
          id,
          agentId: agent.id,
        },
      });

    if (!knowledge) {
      return NextResponse.json(
        {
          error:
            "Cette connaissance n'existe pas.",
        },
        { status: 404 }
      );
    }

    await prisma.agentKnowledge.delete({
      where: {
        id: knowledge.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Connaissance supprimée avec succès.",
    });
  } catch (error) {
    console.error("Delete agent knowledge error:", error);

    return NextResponse.json(
      {
        error:
          "Impossible de supprimer cette connaissance.",
      },
      { status: 500 }
    );
  }
}
