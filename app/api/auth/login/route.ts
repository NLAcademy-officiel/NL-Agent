import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/database/prisma";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Adresse e-mail et mot de passe requis.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          error: "Adresse e-mail ou mot de passe incorrect.",
        },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          error: "Adresse e-mail ou mot de passe incorrect.",
        },
        { status: 401 }
      );
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name ?? "",
      role: user.role,
      organizationId: user.organizationId,
    });

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set("nl_agent_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la connexion.",
      },
      { status: 500 }
    );
  }
}
