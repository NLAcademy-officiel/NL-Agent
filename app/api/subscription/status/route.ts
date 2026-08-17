import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

const SESSION_COOKIE = "nl_agent_session";

export async function GET() {
try {
const cookieStore = cookies();
const token = cookieStore.get(SESSION_COOKIE)?.value;

if (!token) {
return NextResponse.json(
{
authenticated: false,
subscription: null,
error: "Vous devez être connecté.",
},
{ status: 401 }
);
}

const session = await getSession(token);

if (!session) {
return NextResponse.json(
{
authenticated: false,
subscription: null,
error: "Votre session a expiré.",
},
{ status: 401 }
);
}

const subscription = await prisma.chariowSubscription.findFirst({
where: {
organizationId: session.organizationId,
},
orderBy: {
createdAt: "desc",
},
});

if (!subscription) {
return NextResponse.json({
authenticated: true,
hasSubscription: false,
subscription: null,
});
}

return NextResponse.json({
authenticated: true,
hasSubscription: true,
subscription: {
id: subscription.id,
organizationId: subscription.organizationId,
externalId: subscription.externalId,
productId: subscription.productId,
planName: subscription.planName,
status: subscription.status,
startedAt: subscription.startedAt,
expiresAt: subscription.expiresAt,
metadata: subscription.metadata,
createdAt: subscription.createdAt,
updatedAt: subscription.updatedAt,
},
});
} catch (error) {
console.error("Subscription status error:", error);

return NextResponse.json(
{
authenticated: false,
subscription: null,
error:
"Impossible de récupérer le statut de votre abonnement.",
},
{ status: 500 }
);
}
}