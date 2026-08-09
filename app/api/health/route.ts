import { NextResponse } from "next/server";

/**
 * Route de vérification simple, sans dépendance externe ni secret.
 * Sert à valider que les API Routes / Route Handlers fonctionnent
 * correctement dans ce squelette (Phase 1).
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "nl-agent",
    phase: 1,
    timestamp: new Date().toISOString(),
  });
}
