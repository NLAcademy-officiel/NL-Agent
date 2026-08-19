import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { generateWidgetId } from "@/lib/widget/widget-id";

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
const session = await getAuthenticatedSession();

if (!session) {
return NextResponse.json(
{
error: "Non authentifié.",
},
{ status: 401 }
);
}

let channel = await prisma.channel.findFirst({
where: {
organizationId: session.organizationId,
type: "WEBSITE",
},
orderBy: {
createdAt: "asc",
},
});

if (!channel) {
const widgetId = generateWidgetId();

channel = await prisma.channel.create({
data: {
organizationId: session.organizationId,
type: "WEBSITE",
name: "Site Web",
widgetId,
isActive: true,
configuration: {
source: "website_widget",
},
},
});
} else if (!channel.widgetId) {
const widgetId = generateWidgetId();

channel = await prisma.channel.update({
where: {
id: channel.id,
},
data: {
widgetId,
},
});
}

return NextResponse.json({
success: true,
widgetId: channel.widgetId,
channelId: channel.id,
isActive: channel.isActive,
});
} catch (error) {
console.error("Widget API error:", error);

return NextResponse.json(
{
error:
"Impossible de récupérer la configuration du widget.",
},
{ status: 500 }
);
}
}

