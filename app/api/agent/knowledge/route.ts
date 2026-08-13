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

async function getAgentForOrganization(organizationId: string) {
  return prisma.agent.findFirst({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const agent = await getAgentForOrganization(
      session.organizationId
    );

    if (!agent) {
      return NextResponse.json(
        { error: "Aucun agent trouvé." },
        { status: 404 }
      );
    }

    const knowledge = await prisma.agentKnowledge.findMany({
      where: {
        agentId: agent.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      knowledge,
    });
  } catch (error) {
    console.error("Agent knowledge GET error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors du chargement des connaissances.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    if (
      session.role !== "OWNER" &&
      session.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Vous n'avez pas les permissions nécessaires.",
        },
        { status: 403 }
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
            "Le titre ne peut pas dépasser 200 caractères.",
        },
        { status: 400 }
      );
    }

    const agent = await getAgentForOrganization(
      session.organizationId
    );

    if (!agent) {
      return NextResponse.json(
        { error: "Aucun agent trouvé." },
        { status: 404 }
      );
    }

    const knowledge = await prisma.agentKnowledge.create({
      data: {
        agentId: agent.id,
        title,
        content,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        knowledge,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Agent knowledge POST error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de l'ajout de la connaissance.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    if (
      session.role !== "OWNER" &&
      session.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Vous n'avez pas les permissions nécessaires.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id = String(body.id ?? "").trim();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!id || !title || !content) {
      return NextResponse.json(
        {
          error:
            "L'identifiant, le titre et le contenu sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          error:
            "Le titre ne peut pas dépasser 200 caractères.",
        },
        { status: 400 }
      );
    }

    const agent = await getAgentForOrganization(
      session.organizationId
    );

    if (!agent) {
      return NextResponse.json(
        { error: "Aucun agent trouvé." },
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
            "Cette connaissance n'existe pas ou ne vous appartient pas.",
        },
        { status: 404 }
      );
    }

    const knowledge =
      await prisma.agentKnowledge.update({
        where: {
          id,
        },
        data: {
          title,
          content,
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      knowledge,
    });
  } catch (error) {
    console.error("Agent knowledge PATCH error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la modification de la connaissance.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    if (
      session.role !== "OWNER" &&
      session.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Vous n'avez pas les permissions nécessaires.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error:
            "L'identifiant de la connaissance est obligatoire.",
        },
        { status: 400 }
      );
    }

    const agent = await getAgentForOrganization(
      session.organizationId
    );

    if (!agent) {
      return NextResponse.json(
        { error: "Aucun agent trouvé." },
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
            "Cette connaissance n'existe pas ou ne vous appartient pas.",
        },
        { status: 404 }
      );
    }

    await prisma.agentKnowledge.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Connaissance supprimée avec succès.",
    });
  } catch (error) {
    console.error("Agent knowledge DELETE error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la suppression de la connaissance.",
      },
      { status: 500 }
    );
  }
}
