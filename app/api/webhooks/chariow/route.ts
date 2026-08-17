import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/database/prisma";

type ChariowPulse = {
event?: string;

sale?: {
id?: string;
amount?: {
value?: number;
formatted?: string;
short?: string;
currency?: string;
};
original_amount?: {
value?: number;
formatted?: string;
short?: string;
currency?: string;
};
};

product?: {
id?: string;
name?: string;
};

customer?: {
id?: string;
name?: string;
first_name?: string;
last_name?: string;
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

function verifySignature(
rawBody: string,
signature: string | null,
secret: string
) {
if (!signature) {
return false;
}

const expectedSignature = crypto
.createHmac("sha256", secret)
.update(rawBody)
.digest("hex");

const received = Buffer.from(signature, "utf8");
const expected = Buffer.from(expectedSignature, "utf8");

if (received.length !== expected.length) {
return false;
}

return crypto.timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
try {
const secret = process.env.CHARIOW_PULSE_SECRET;

if (!secret) {
console.error("CHARIOW_PULSE_SECRET is not configured.");

return NextResponse.json(
{
success: false,
error: "Webhook secret is not configured.",
},
{ status: 500 }
);
}

const rawBody = await request.text();

const signature = request.headers.get("x-chariow-signature");

const isValid = verifySignature(
rawBody,
signature,
secret
);

if (!isValid) {
console.warn("Invalid Chariow webhook signature.");

return NextResponse.json(
{
success: false,
error: "Invalid signature.",
},
{ status: 401 }
);
}

const body = JSON.parse(rawBody) as ChariowPulse;

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

const customerEmail = body.customer?.email
?.trim()
.toLowerCase();

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

if (!saleId) {
return NextResponse.json(
{
success: false,
error: "Sale ID missing.",
},
{ status: 400 }
);
}

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
externalId: saleId,
},
});

if (existingSubscription) {
return NextResponse.json({
success: true,
alreadyProcessed: true,
message: "This Chariow sale was already processed.",
subscription: {
id: existingSubscription.id,
planName: existingSubscription.planName,
status: existingSubscription.status,
},
});
}

const startedAt = new Date();

const expiresAt = new Date(startedAt);
expiresAt.setMonth(expiresAt.getMonth() + 1);

const subscription =
await prisma.chariowSubscription.create({
data: {
organizationId,
externalId: saleId,
productId,
planName,
status: "ACTIVE",
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
amount: body.sale?.amount?.value ?? null,
currency:
body.sale?.amount?.currency ?? null,
productName: body.product?.name ?? null,
storeId: body.store?.id ?? null,
storeName: body.store?.name ?? null,
},
},
});

return NextResponse.json({
success: true,
activated: true,
message:
"Chariow payment confirmed and subscription activated.",
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