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
