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
    /*
     * 1. Vérification de la session
     */
    const session = await getAuthenticatedSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Non authentifié.",
        },
        { status: 401 }
      );
    }

    /*
     * 2. Récupération des statistiques
     *
     * Toutes les requêtes sont limitées
     * à l'organisation de l'utilisateur connecté.
     */

    const organizationId = session.organizationId;

    const [
      leads,
      conversations,
      messages,
      knowledge,
      openConversations,
      newLeads,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          organizationId,
        },
      }),

      prisma.conversation.count({
        where: {
          organizationId,
        },
      }),

      prisma.message.count({
        where: {
          conversation: {
            organizationId,
          },
        },
      }),

      prisma.agentKnowledge.count({
        where: {
          agent: {
            organizationId,
          },
        },
      }),

      prisma.conversation.count({
        where: {
          organizationId,
          status: "OPEN",
        },
      }),

      prisma.lead.count({
        where: {
          organizationId,
          status: "NEW",
        },
      }),
    ]);

    /*
     * 3. Retour des statistiques
     */
    return NextResponse.json({
      success: true,

      statistics: {
        leads,
        conversations,
        messages,
        knowledge,
        openConversations,
        newLeads,
      },
    });
  } catch (error) {
    console.error(
      "Statistics error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Impossible de récupérer les statistiques.",
      },
      { status: 500 }
    );
  }
}
