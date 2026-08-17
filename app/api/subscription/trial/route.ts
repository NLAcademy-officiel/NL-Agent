import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

const SESSION_COOKIE = "nl_agent_session";
const TRIAL_DAYS = 7;

const VALID_PLANS = ["Starter", "Business", "Pro"] as const;

type PlanName = (typeof VALID_PLANS)[number];

export async function POST(request: Request) {
  try {
    /*
     * 1. Récupération du cookie de session
     */
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Vous devez être connecté pour commencer votre essai gratuit.",
        },
        { status: 401 }
      );
    }

    /*
     * 2. Vérification de la session
     */
    const session = await getSession(token);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Votre session a expiré. Veuillez vous reconnecter.",
        },
        { status: 401 }
      );
    }

    /*
     * 3. Récupération du plan choisi
     */
    const body = await request.json();

    const planName = String(body.planName ?? "").trim() as PlanName;

    if (!VALID_PLANS.includes(planName)) {
      return NextResponse.json(
        {
          error: "Le plan sélectionné est invalide.",
        },
        { status: 400 }
      );
    }

    /*
     * 4. Vérification d'un abonnement existant
     */
    const existingSubscription =
      await prisma.chariowSubscription.findFirst({
        where: {
          organizationId: session.organizationId,
          status: {
            in: ["TRIAL", "ACTIVE"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        subscription: {
          id: existingSubscription.id,
          planName: existingSubscription.planName,
          status: existingSubscription.status,
          startedAt: existingSubscription.startedAt,
          expiresAt: existingSubscription.expiresAt,
        },
      });
    }

    /*
     * 5. Calcul de la période d'essai
     */
    const startedAt = new Date();

    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);

    /*
     * 6. Création de l'abonnement
     */
    const subscription = await prisma.chariowSubscription.create({
      data: {
        organizationId: session.organizationId,
        planName,
        status: "TRIAL",
        startedAt,
        expiresAt,
        metadata: {
          source: "NL_AGENT",
          trialDays: TRIAL_DAYS,
        },
      },
    });

    /*
     * 7. Retour de la réponse
     */
    return NextResponse.json({
      success: true,
      alreadySubscribed: false,
      message: "Votre essai gratuit de 7 jours a été activé.",
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        status: subscription.status,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
      },
    });
  } catch (error) {
    console.error("Trial subscription error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de l'activation de votre essai gratuit.",
      },
      { status: 500 }
    );
  }
}