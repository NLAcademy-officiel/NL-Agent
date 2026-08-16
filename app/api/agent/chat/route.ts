import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";

import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

const SESSION_COOKIE = "nl_agent_session";

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

async function getAuthenticatedSession() {
const cookieStore = cookies();
const token = cookieStore.get(SESSION_COOKIE)?.value;

if (!token) {
return null;
}

return getSession();
}

export async function POST(request: Request) {
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
* 2. Lecture du message
*/
const body = await request.json();
const message = String(body.message ?? "").trim();

if (!message) {
return NextResponse.json(
{
error: "Le message est obligatoire.",
},
{ status: 400 }
);
}

/*
* 3. Récupération de l'agent
*/
const agent = await prisma.agent.findFirst({
where: {
organizationId: session.organizationId,
status: "ACTIVE",
},
orderBy: {
createdAt: "asc",
},
});

if (!agent) {
return NextResponse.json(
{
error: "Aucun agent actif n'est configuré.",
},
{ status: 404 }
);
}

/*
* 4. Récupération ou création du contact
*/
const visitorId =
typeof body.visitorId === "string" && body.visitorId.trim()
? body.visitorId.trim()
: `dashboard-${session.userId}`;

let contact = await prisma.contact.findFirst({
where: {
organizationId: session.organizationId,
visitorId,
},
});

if (!contact) {
contact = await prisma.contact.create({
data: {
organizationId: session.organizationId,
visitorId,
name: "Visiteur",
},
});
}

/*
* 5. Récupération ou création du canal
*/
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
channel = await prisma.channel.create({
data: {
organizationId: session.organizationId,
type: "WEBSITE",
name: "Dashboard Chat",
isActive: true,
},
});
}

/*
* 6. Récupération ou création de la conversation
*/
let conversation = await prisma.conversation.findFirst({
where: {
organizationId: session.organizationId,
contactId: contact.id,
channelId: channel.id,
status: {
in: ["OPEN", "PENDING"],
},
},
orderBy: {
updatedAt: "desc",
},
});

if (!conversation) {
conversation = await prisma.conversation.create({
data: {
organizationId: session.organizationId,
agentId: agent.id,
channelId: channel.id,
contactId: contact.id,
status: "OPEN",
},
});
} else if (conversation.agentId !== agent.id) {
conversation = await prisma.conversation.update({
where: {
id: conversation.id,
},
data: {
agentId: agent.id,
updatedAt: new Date(),
},
});
}

/*
* 7. Enregistrement du message entrant
*/
await prisma.message.create({
data: {
conversationId: conversation.id,
direction: "INBOUND",
type: "TEXT",
senderType: "CONTACT",
content: message,
},
});

/*
* 8. Récupération des connaissances
*/
const knowledge = await prisma.agentKnowledge.findMany({
where: {
agentId: agent.id,
},
orderBy: {
createdAt: "asc",
},
select: {
title: true,
content: true,
},
});

const knowledgeText =
knowledge.length > 0
? knowledge
.map(
(item) =>
`### ${item.title}\n${item.content}`
)
.join("\n\n")
: "Aucune connaissance supplémentaire n'a été fournie.";

/*
* 9. Instructions de base de l'agent
*/
const defaultInstructions = `
Tu es un assistant IA professionnel.

Tu dois répondre de manière claire, utile, naturelle et professionnelle.

Tu communiques en français et en anglais.

RÈGLE DE LANGUE :
- Si le prospect écrit en français, réponds en français.
- Si le prospect écrit en anglais, réponds en anglais.
- Si le prospect mélange les deux langues, utilise principalement la langue dominante du message.
- Ne change pas de langue sans raison.

RÈGLE DE CONNAISSANCE :
- Utilise en priorité les informations fournies dans la base de connaissances.
- Ne fabrique jamais un prix, une date, une adresse, une formation ou une information qui n'est pas connue.
- Si une information importante manque, indique-le clairement et propose au prospect de contacter l'entreprise.

STYLE :
- Sois professionnel.
- Sois chaleureux.
- Réponds de manière concise mais suffisamment détaillée.
- Évite les réponses trop longues lorsque la question est simple.
`;

const systemInstructions = `
${defaultInstructions}

IDENTITÉ DE L'AGENT :
Nom : ${agent.name}

Description :
${agent.description || "Assistant intelligent de l'entreprise."}

INSTRUCTIONS PERSONNALISÉES DE L'ENTREPRISE :
${agent.systemPrompt || "Aucune instruction supplémentaire."}

BASE DE CONNAISSANCES :
${knowledgeText}
`;

/*
* 10. Récupération de l'historique
*/
const history = await prisma.message.findMany({
where: {
conversationId: conversation.id,
},
orderBy: {
createdAt: "asc",
},
take: 20,
select: {
direction: true,
content: true,
},
});

const chatMessages = [
{
role: "system" as const,
content: systemInstructions,
},
...history
.filter(
(
item
): item is {
direction: "INBOUND" | "OUTBOUND";
content: string;
} => Boolean(item.content)
)
.map((item) => ({
role:
item.direction === "INBOUND"
? ("user" as const)
: ("assistant" as const),
content: item.content,
})),
];

/*
* 11. Appel OpenAI
*
* Cette partie ne sera exécutée que lorsqu'une requête
* POST utilisera réellement cette route.
*/
const completion =
await openai.chat.completions.create({
model: "gpt-4o-mini",
temperature: 0.3,
messages: chatMessages,
});

/*
* 12. Récupération de la réponse
*/
const reply =
completion.choices[0]?.message?.content?.trim();

if (!reply) {
return NextResponse.json(
{
error: "L'agent n'a pas pu générer de réponse.",
},
{ status: 500 }
);
}

/*
* 13. Enregistrement de la réponse de l'agent
*/
await prisma.message.create({
data: {
conversationId: conversation.id,
direction: "OUTBOUND",
type: "TEXT",
senderType: "AGENT",
content: reply,
metadata: {
model: "gpt-4o-mini",
},
},
});

/*
* 14. Mise à jour de la conversation
*/
await prisma.conversation.update({
where: {
id: conversation.id,
},
data: {
updatedAt: new Date(),
},
});

/*
* 15. Retour au frontend
*/
return NextResponse.json({
success: true,
conversationId: conversation.id,
agent: {
id: agent.id,
name: agent.name,
},
reply,
language: "auto",
});
} catch (error) {
console.error("Agent chat error:", error);

return NextResponse.json(
{
error:
"Une erreur est survenue lors de la génération de la réponse.",
},
{ status: 500 }
);
}
}