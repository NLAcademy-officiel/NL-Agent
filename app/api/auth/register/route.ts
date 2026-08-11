import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const company = String(body.company ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!company || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cette adresse e-mail est déjà utilisée." },
        { status: 409 }
      );
    }

    const slugBase = company
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const slug = `${slugBase || "organisation"}-${Date.now()}`;

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: company,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "OWNER",
          organizationId: organization.id,
        },
      });

      return { organization, user };
    });

    const token = await createSession({
      userId: result.user.id,
      organizationId: result.organization.id,
      role: result.user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Compte créé avec succès.",
      },
      { status: 201 }
    );

    response.cookies.set("nl_agent_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du compte." },
      { status: 500 }
    );
  }
}
