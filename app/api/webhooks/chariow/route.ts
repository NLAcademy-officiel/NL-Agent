import { NextResponse } from "next/server";

import { prisma } from "@/lib/database/prisma";

type ChariowPulse = {
event?: string;
sale?: {
id?: string;
status?: string;
amount?: number;
currency?: string;
created_at?: string;
};
product?: {
id?: string;
name?: string;
};
customer?: {
id?: string;
name?: string;
email?: string;
phone?: string;
};
store?: {
id?: string;
name?: string;
};
};

const PLAN_BY_PRODUCT: Record<string, string> = {
prd_k4merxkk: "Starter",
prd_64bi5h5w: "Business",
prd_krai669t: "Pro",
};

export async function POST(request: Request) {
try {
const body = (await request.json()) as ChariowPulse;

console.log("Chariow Pulse received:", body);

if (body.event !== "successful.sale") {
return NextResponse.json({
success: true,
ignored: true,
message: "Event ignored.",
});
}

const productId = body.product?.id;

if (!productId) {
return NextResponse.json(
{
success: false,
error: "Product ID missing.",
},
{ status: 400 }
);
}

const planName = PLAN_BY_PRODUCT[productId];

if (!planName) {
console.warn("Unknown Chariow product:", productId);

return NextResponse.json({
success: true,
ignored: true,
message: "Product not configured.",
});
}

const customerEmail = body.customer?.email?.trim().toLowerCase();

if (!customerEmail) {
return NextResponse.json(
{
success: false,
error: "Customer email missing.",
},
{ status: 400 }
);
}

const saleId = body.sale?.id ?? null;

const user = await prisma.user.findUnique({
where: {
email: customerEmail,
},
});

if (!user) {
console.warn(
"NL Agent user not found for email:",
customerEmail
);

return NextResponse.json({
success: true,
waitingForUser: true,
message:
"Payment received but NL Agent user was not found.",
});
}

const organizationId = user.organizationId;

const existingSubscription =
await prisma.chariowSubscription.findFirst({
where: {
organizationId,
},
orderBy: {
startedAt: "desc",
},
});

const startedAt = new Date();

const expiresAt = new Date(startedAt);
expiresAt.setMonth(expiresAt.getMonth() + 1);

const subscriptionData = {
organizationId,
externalId: saleId,
productId,
planName,
status: "ACTIVE" as const,
startedAt,
expiresAt,
metadata: {
source: "CHARIOW_PULSE",
event: body.event,
customerId: body.customer?.id ?? null,
customerEmail,
customerName: body.customer?.name ?? null,
customerPhone: body.customer?.phone ?? null,
saleId,
amount: body.sale?.amount ?? null,
currency: body.sale?.currency ?? null,
productName: body.product?.name ?? null,
storeId: body.store?.id ?? null,
storeName: body.store?.name ?? null,
},
};

let subscription;

if (existingSubscription) {
subscription = await prisma.chariowSubscription.update({
where: {
id: existingSubscription.id,
},
data: subscriptionData,
});
} else {
subscription = await prisma.chariowSubscription.create({
data: subscriptionData,
});
}

return NextResponse.json({
success: true,
activated: true,
message: "Chariow payment confirmed and subscription activated.",
subscription: {
id: subscription.id,
organizationId: subscription.organizationId,
planName: subscription.planName,
status: subscription.status,
externalId: subscription.externalId,
productId: subscription.productId,
startedAt: subscription.startedAt,
expiresAt: subscription.expiresAt,
},
});
} catch (error) {
console.error("Chariow webhook error:", error);

return NextResponse.json(
{
success: false,
error: "Unable to process Chariow webhook.",
},
{ status: 500 }
);
}
}