"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
id: string;
role: "user" | "assistant";
content: string;
};

const STORAGE_KEY = "nl_agent_public_conversation_id";

export default function NLAssistantWidget() {
const [open, setOpen] = useState(false);
const [message, setMessage] = useState("");
const [sending, setSending] = useState(false);

const [messages, setMessages] = useState<Message[]>([
{
id: "welcome",
role: "assistant",
content:
"Bonjour 👋 Je suis NL Assistant. Comment puis-je vous aider ?",
},
]);

const [conversationId, setConversationId] =
useState<string | null>(null);

const messagesEndRef = useRef<HTMLDivElement | null>(null);

/*
* Récupération de la conversation du visiteur
*/
useEffect(() => {
try {
const storedConversationId =
window.localStorage.getItem(STORAGE_KEY);

if (storedConversationId) {
setConversationId(storedConversationId);
}
} catch (error) {
console.error(
"Impossible de récupérer la conversation :",
error
);
}
}, []);

/*
* Scroll automatique vers le dernier message
*/
useEffect(() => {
if (!open) {
return;
}

messagesEndRef.current?.scrollIntoView({
behavior: "smooth",
});
}, [messages, sending, open]);

/*
* Envoi du message
*/
async function handleSubmit(
event: FormEvent<HTMLFormElement>
) {
event.preventDefault();

const trimmedMessage = message.trim();

if (!trimmedMessage || sending) {
return;
}

const temporaryMessage: Message = {
id: `${Date.now()}-user`,
role: "user",
content: trimmedMessage,
};

setMessages((current) => [
...current,
temporaryMessage,
]);

setMessage("");
setSending(true);

try {
const response = await fetch(
"/api/public-chat",
{
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
message: trimmedMessage,
conversationId,
}),
}
);

const result = await response.json();

if (!response.ok) {
throw new Error(
result.error ||
"Impossible d'obtenir une réponse."
);
}

if (result.conversationId) {
setConversationId(
result.conversationId
);

try {
window.localStorage.setItem(
STORAGE_KEY,
result.conversationId
);
} catch (error) {
console.error(
"Impossible de sauvegarder la conversation :",
error
);
}
}

setMessages((current) => [
...current,
{
id: `${Date.now()}-assistant`,
role: "assistant",
content:
result.reply ||
"Je suis désolé, je n'ai pas pu répondre.",
},
]);
} catch (error) {
console.error(
"Public chat error:",
error
);

setMessages((current) => [
...current,
{
id: `${Date.now()}-error`,
role: "assistant",
content:
"Une erreur est survenue. Veuillez réessayer dans quelques instants.",
},
]);
} finally {
setSending(false);
}
}

return (
<>
{/* Bouton flottant */}
{!open && (
<button
type="button"
onClick={() => setOpen(true)}
aria-label="Ouvrir NL Assistant"
className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-xl text-white shadow-lg transition-transform hover:scale-105"
>
💬
</button>
)}

{/* Fenêtre du chat */}
{open && (
<div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-ink shadow-2xl">
{/* Header */}
<div className="flex items-center justify-between border-b border-line px-4 py-4">
<div>
<p className="font-semibold text-white">
NL Assistant
</p>

<p className="text-xs text-white/50">
Assistant IA • Français / English
</p>
</div>

<button
type="button"
onClick={() => setOpen(false)}
aria-label="Fermer"
className="rounded-md px-2 py-1 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
>
✕
</button>
</div>

{/* Messages */}
<div className="flex-1 space-y-4 overflow-y-auto p-4">
{messages.map((item) => {
const isUser =
item.role === "user";

return (
<div
key={item.id}
className={`flex ${
isUser
? "justify-end"
: "justify-start"
}`}
>
<div
className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
isUser
? "bg-brand-500 text-white"
: "border border-line bg-white/5 text-white/80"
}`}
>
<p className="mb-1 text-[10px] font-medium uppercase tracking-wide opacity-50">
{isUser
? "Vous"
: "NL Assistant"}
</p>

<p className="whitespace-pre-wrap">
{item.content}
</p>
</div>
</div>
);
})}

{sending && (
<div className="flex justify-start">
<div className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm text-white/50">
NL Assistant réfléchit...
</div>
</div>
)}

<div ref={messagesEndRef} />
</div>

{/* Zone d'envoi */}
<div className="border-t border-line p-3">
<form
onSubmit={handleSubmit}
className="flex gap-2"
>
<input
value={message}
onChange={(event) =>
setMessage(
event.target.value
)
}
placeholder="Écrivez votre message..."
disabled={sending}
autoComplete="off"
className="min-w-0 flex-1 rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-500"
/>

<button
type="submit"
disabled={
sending ||
!message.trim()
}
className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
>
{sending ? "..." : "Envoyer"}
</button>
</form>

<p className="mt-2 text-center text-[10px] text-white/30">
🇫🇷 Français • 🇬🇧 English
</p>
</div>
</div>
)}
</>
);
}
