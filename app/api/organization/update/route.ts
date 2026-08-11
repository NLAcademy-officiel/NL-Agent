import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("nl_agent_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const session = await getSession(token);

    if (!session) {
      return NextResponse.json(
        { error: "Session invalide ou expirée." },
        { status: 401 }
      );
    }

    if (session.role !== "OWNER" && session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Vous n'avez pas l'autorisation de modifier cette organisation." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est requis." },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise doit contenir au moins 2 caractères." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise ne doit pas dépasser 100 caractères." },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.update({
      where: {
        id: session.organizationId,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Organization update error:", error);

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la modification de l'entreprise.",
      },
      { status: 500 }
    );
  }
}
