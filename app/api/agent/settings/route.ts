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

export async function GET() {
  try {
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    let agent = await prisma.agent.findFirst({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          name: "NL Assistant",
          description:
            "Assistant intelligent de votre entreprise.",
          systemPrompt:
            "Tu es l'assistant intelligent de cette entreprise. " +
            "Tu communiques de manière professionnelle, claire et utile. " +
            "Tu peux comprendre et répondre en français et en anglais. " +
            "Réponds automatiquement dans la langue utilisée par le prospect.",
          status: "ACTIVE",
          organizationId: session.organizationId,
        },
      });
    }

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      status: agent.status,
    });
  } catch (error) {
    console.error("Agent settings GET error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors du chargement de l'agent.",
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

    if (session.role !== "OWNER" && session.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Vous n'avez pas les permissions nécessaires.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const systemPrompt = String(body.systemPrompt ?? "").trim();
    const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    if (!name) {
      return NextResponse.json(
        {
          error: "Le nom de l'agent est obligatoire.",
        },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error:
            "Le nom de l'agent ne peut pas dépasser 100 caractères.",
        },
        { status: 400 }
      );
    }

    let agent = await prisma.agent.findFirst({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          name,
          description: description || null,
          systemPrompt: systemPrompt || null,
          status,
          organizationId: session.organizationId,
        },
      });
    } else {
      agent = await prisma.agent.update({
        where: {
          id: agent.id,
        },
        data: {
          name,
          description: description || null,
          systemPrompt: systemPrompt || null,
          status,
        },
      });
    }

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      status: agent.status,
    });
  } catch (error) {
    console.error("Agent settings PATCH error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de l'enregistrement de l'agent.",
      },
      { status: 500 }
    );
  }
}
