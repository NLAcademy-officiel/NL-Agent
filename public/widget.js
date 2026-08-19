(function () {
"use strict";

const script =
document.currentScript ||
document.querySelector("script[data-widget-id]");

if (!script) {
console.error("NL Agent: script du widget introuvable.");
return;
}

const widgetId = script.getAttribute("data-widget-id");

if (!widgetId) {
console.error("NL Agent: widgetId manquant.");
return;
}

const apiBaseUrl =
script.getAttribute("data-api-url") ||
new URL(script.src).origin;

let conversationId = null;
let isOpen = false;

/* =========================================================
STYLES NL BOT
========================================================= */

const style = document.createElement("style");

style.textContent = `
#nl-agent-widget,
#nl-agent-widget * {
box-sizing: border-box;
}

#nl-agent-widget {
font-family:
Inter,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
Arial,
sans-serif;
}

/* =========================
BOUTON NL BOT
========================= */

.nl-bot-button {
position: fixed;
right: 22px;
bottom: 95px;
width: 72px;
height: 72px;
border: 0;
border-radius: 50%;
padding: 0;
cursor: pointer;
z-index: 2147483000;

background:
radial-gradient(
circle at 50% 45%,
rgba(0, 168, 255, 0.22),
transparent 58%
),
linear-gradient(
145deg,
#ffd700,
#c5a15a 45%,
#d0d5db
);

box-shadow:
0 0 0 4px rgba(0, 168, 255, 0.10),
0 0 28px rgba(0, 168, 255, 0.42),
0 14px 35px rgba(0, 0, 0, 0.25);

display: flex;
align-items: center;
justify-content: center;

animation:
nlBotAppear 0.7s cubic-bezier(.2,.8,.2,1) forwards,
nlBotFloat 3.5s ease-in-out 0.8s infinite;
}

.nl-bot-button:hover {
transform: scale(1.06);
}

.nl-bot-button:active {
transform: scale(0.96);
}

@keyframes nlBotAppear {
0% {
opacity: 0;
transform: scale(0);
}

70% {
opacity: 1;
transform: scale(1.1);
}

100% {
opacity: 1;
transform: scale(1);
}
}

@keyframes nlBotFloat {
0%,
100% {
margin-bottom: 0;
}

50% {
margin-bottom: 5px;
}
}

/* =========================
TÊTE NL BOT
========================= */

.nl-bot-head {
position: relative;
width: 58px;
height: 58px;

border-radius: 45% 45% 48% 48%;

background:
linear-gradient(
145deg,
#fff8d6 0%,
#ffd700 22%,
#c5a15a 55%,
#d0d5db 100%
);

border: 2px solid rgba(255,255,255,.75);

box-shadow:
inset 0 3px 7px rgba(255,255,255,.75),
inset 0 -7px 10px rgba(80,70,40,.25),
0 5px 15px rgba(0,0,0,.25);

overflow: hidden;
}

.nl-bot-head::before {
content: "NL";

position: absolute;
top: 5px;
left: 50%;
transform: translateX(-50%);

font-size: 10px;
font-weight: 900;
letter-spacing: 1px;

color: #ffd700;

text-shadow:
0 1px 1px #8c6d24,
0 0 5px rgba(255,215,0,.7);

background:
linear-gradient(
145deg,
#f8f8f8,
#c5c9ce,
#8e949b
);

border-radius: 4px;
padding: 2px 5px;

box-shadow:
inset 0 1px 2px rgba(255,255,255,.8),
0 2px 3px rgba(0,0,0,.25);
}

/* =========================
VISAGE
========================= */

.nl-bot-face {
position: absolute;
left: 8px;
right: 8px;
top: 21px;
bottom: 7px;

border-radius: 40%;

background:
linear-gradient(
180deg,
#27323b,
#101820
);

box-shadow:
inset 0 2px 5px rgba(0,0,0,.8),
0 1px 2px rgba(255,255,255,.4);
}

.nl-bot-eyes {
position: absolute;
top: 9px;
left: 8px;
right: 8px;

display: flex;
justify-content: space-between;
}

.nl-bot-eye {
width: 13px;
height: 13px;
border-radius: 50%;

background:
radial-gradient(
circle at 35% 30%,
#ffffff,
#8de4ff 20%,
#00a8ff 50%,
#1264ff 75%,
#003b7a
);

box-shadow:
0 0 6px #00a8ff,
0 0 12px rgba(0,168,255,.8);

animation: nlBotEyePulse 2.8s ease-in-out infinite;
}

@keyframes nlBotEyePulse {
0%,
100% {
box-shadow:
0 0 6px #00a8ff,
0 0 12px rgba(0,168,255,.7);
}

50% {
box-shadow:
0 0 9px #00a8ff,
0 0 18px rgba(0,168,255,1);
}
}

.nl-bot-mouth {
position: absolute;
bottom: 7px;
left: 50%;
width: 13px;
height: 5px;

transform: translateX(-50%);

border-bottom: 2px solid #00a8ff;
border-radius: 50%;

opacity: .85;
}

/* =========================
HEADSET
========================= */

.nl-bot-headset {
position: absolute;
left: -5px;
right: -5px;
top: 8px;
bottom: 5px;

border: 3px solid #c5a15a;
border-bottom: 0;

border-radius: 50% 50% 0 0;

pointer-events: none;
}

.nl-bot-ear {
position: absolute;

width: 13px;
height: 22px;

top: 23px;

border-radius: 6px;

background:
linear-gradient(
145deg,
#f7f7f7,
#d0d5db,
#92989f
);

box-shadow:
inset 0 1px 2px white,
0 2px 4px rgba(0,0,0,.3);
}

.nl-bot-ear.left {
left: -7px;
}

.nl-bot-ear.right {
right: -7px;
}

.nl-bot-ear::after {
content: "";

position: absolute;

width: 5px;
height: 5px;

border-radius: 50%;

background: #00a8ff;

box-shadow:
0 0 7px #00a8ff;

top: 8px;
left: 4px;
}

/* =========================
MICRO
========================= */

.nl-bot-mic {
position: absolute;

width: 18px;
height: 3px;

background: #c5a15a;

right: -12px;
bottom: 15px;

transform: rotate(12deg);

border-radius: 4px;
}

.nl-bot-mic::after {
content: "";

position: absolute;

right: -4px;
top: -3px;

width: 8px;
height: 8px;

border-radius: 50%;

background: #00a8ff;

box-shadow:
0 0 6px #00a8ff,
0 0 12px rgba(0,168,255,.9);

animation: nlBotMicPulse 1.5s ease-in-out infinite;
}

@keyframes nlBotMicPulse {
0%,
100% {
opacity: .6;
}

50% {
opacity: 1;
}
}

/* =========================
NOTIFICATION
========================= */

.nl-bot-notification {
position: absolute;

right: -1px;
top: -1px;

width: 13px;
height: 13px;

border-radius: 50%;

background: #00a8ff;

border: 2px solid white;

box-shadow:
0 0 8px #00a8ff;

animation: nlBotNotification 1.5s infinite;
}

@keyframes nlBotNotification {
0% {
transform: scale(1);
opacity: 1;
}

50% {
transform: scale(1.25);
opacity: .65;
}

100% {
transform: scale(1);
opacity: 1;
}
}

/* =========================
FENÊTRE CHAT
========================= */

.nl-agent-window {
position: fixed;

right: 22px;
bottom: 181px;

width: 370px;
height: 560px;

max-width: calc(100vw - 28px);
max-height: calc(100vh - 130px);

background: rgba(255,255,255,.98);

border: 1px solid rgba(197,161,90,.35);

border-radius: 22px;

box-shadow:
0 25px 70px rgba(0,0,0,.25),
0 0 35px rgba(0,168,255,.12);

overflow: hidden;

z-index: 2147482999;

display: none;
flex-direction: column;

transform-origin: bottom right;

animation: nlChatOpen .35s cubic-bezier(.2,.8,.2,1);
}

@keyframes nlChatOpen {
0% {
opacity: 0;
transform:
scale(.75)
rotate(15deg);
}

100% {
opacity: 1;
transform:
scale(1)
rotate(0deg);
}
}

.nl-agent-header {
position: relative;

padding: 17px 18px;

color: white;

background:
linear-gradient(
135deg,
#111827,
#1f2937
);

display: flex;
align-items: center;
gap: 12px;
}

.nl-agent-header-avatar {
width: 42px;
height: 42px;

border-radius: 50%;

background:
linear-gradient(
145deg,
#ffd700,
#c5a15a,
#d0d5db
);

display: flex;
align-items: center;
justify-content: center;

box-shadow:
0 0 15px rgba(0,168,255,.35);
}

.nl-agent-header-avatar::before {
content: "NL";

color: #fff;
font-weight: 900;
font-size: 11px;
}

.nl-agent-title {
display: flex;
flex-direction: column;
gap: 2px;
}

.nl-agent-title strong {
font-size: 15px;
}

.nl-agent-title span {
font-size: 11px;
opacity: .72;
}

.nl-agent-status {
margin-left: auto;

display: flex;
align-items: center;
gap: 5px;

font-size: 10px;
}

.nl-agent-status-dot {
width: 7px;
height: 7px;

border-radius: 50%;

background: #00a8ff;

box-shadow:
0 0 8px #00a8ff;
}

.nl-agent-close {
margin-left: 8px;
width: 32px;
height: 32px;
border: 0;
border-radius: 50%;
background: rgba(255,255,255,.10);
color: white;
font-size: 24px;
line-height: 1;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
transition: all .2s ease;
}

.nl-agent-close:hover {
background: rgba(0,168,255,.25);
transform: scale(1.08);
}

.nl-agent-close:active {
transform: scale(.94);
}

.nl-agent-messages {
flex: 1;

padding: 16px;

overflow-y: auto;

background:
radial-gradient(
circle at top right,
rgba(0,168,255,.06),
transparent 35%
),
#f7f9fb;
}

.nl-agent-message {
margin-bottom: 11px;

padding: 11px 13px;

border-radius: 14px;

max-width: 84%;

font-size: 14px;
line-height: 1.45;

white-space: pre-wrap;

animation: nlMessageIn .25s ease;
}

@keyframes nlMessageIn {
from {
opacity: 0;
transform: translateY(6px);
}

to {
opacity: 1;
transform: translateY(0);
}
}

.nl-agent-message.bot {
background: white;

color: #17202a;

margin-right: auto;

border:
1px solid rgba(197,161,90,.18);

box-shadow:
0 4px 12px rgba(0,0,0,.05);
}

.nl-agent-message.user {
background:
linear-gradient(
135deg,
#111827,
#263548
);

color: white;

margin-left: auto;
}

.nl-agent-form {
display: flex;

gap: 8px;

padding: 12px;

background: white;

border-top:
1px solid #e5e7eb;
}

.nl-agent-input {
flex: 1;

min-width: 0;

padding: 11px 13px;

border:
1px solid #d1d5db;

border-radius: 12px;

outline: none;

font-size: 14px;
}

.nl-agent-input:focus {
border-color: #00a8ff;

box-shadow:
0 0 0 3px rgba(0,168,255,.10);
}

.nl-agent-send {
border: none;

border-radius: 12px;

padding: 0 15px;

background:
linear-gradient(
135deg,
#c5a15a,
#ffd700
);

color: #111827;

font-weight: 700;

cursor: pointer;
}

.nl-agent-send:disabled {
opacity: .5;

cursor: not-allowed;
}

/* =========================
MOBILE
========================= */

@media (max-width: 600px) {
.nl-bot-button {
right: 15px;
bottom: 85px;

width: 64px;
height: 64px;
}

.nl-agent-window {
right: 10px;
bottom: 155px;

width: calc(100vw - 20px);

height: min(
560px,
calc(100vh - 110px)
);

border-radius: 18px;
}
}
`;

document.head.appendChild(style);

/* =========================================================
CONTENEUR
========================================================= */

const container = document.createElement("div");

container.id = "nl-agent-widget";

/* =========================================================
BOUTON
========================================================= */

const button = document.createElement("button");

button.className = "nl-bot-button";

button.type = "button";

button.setAttribute(
"aria-label",
"Ouvrir NL Assistant"
);

button.innerHTML = `
<div class="nl-bot-head">
<div class="nl-bot-headset"></div>

<div class="nl-bot-face">
<div class="nl-bot-eyes">
<div class="nl-bot-eye"></div>
<div class="nl-bot-eye"></div>
</div>

<div class="nl-bot-mouth"></div>
</div>

<div class="nl-bot-ear left"></div>
<div class="nl-bot-ear right"></div>

<div class="nl-bot-mic"></div>
</div>

<span class="nl-bot-notification"></span>
`;

/* =========================================================
FENÊTRE
========================================================= */

const windowEl = document.createElement("div");

windowEl.className = "nl-agent-window";

windowEl.innerHTML = `
<div class="nl-agent-header">

<div class="nl-agent-header-avatar">
NL
</div>

<div class="nl-agent-title">
<strong>NL Assistant</strong>
<span>Assistant intelligent</span>
</div>

<div class="nl-agent-status">
<span class="nl-agent-status-dot"></span>
En ligne
</div>

<button
class="nl-agent-close"
type="button"
aria-label="Fermer NL Assistant"
>
×
</button>
</div>

<div class="nl-agent-messages"></div>

<form class="nl-agent-form">

<input
class="nl-agent-input"
type="text"
placeholder="Écrivez votre message..."
autocomplete="off"
/>

<button
class="nl-agent-send"
type="submit"
>
Envoyer
</button>

</form>
`;

container.appendChild(button);
container.appendChild(windowEl);

document.body.appendChild(container);

/* =========================================================
ELEMENTS
========================================================= */

const messagesEl =
windowEl.querySelector(
".nl-agent-messages"
);

const form =
windowEl.querySelector(
".nl-agent-form"
);

const input =
windowEl.querySelector(
".nl-agent-input"
);

const sendButton =
windowEl.querySelector(
".nl-agent-send"
);

  const closeButton =
windowEl.querySelector(
".nl-agent-close"
);


/* =========================================================
MESSAGE
========================================================= */

function addMessage(
content,
type
) {
const message =
document.createElement("div");

message.className =
"nl-agent-message " + type;

message.textContent = content;

messagesEl.appendChild(message);

messagesEl.scrollTop =
messagesEl.scrollHeight;
}

/* =========================================================
BIENVENUE
========================================================= */

function showWelcome() {
if (
messagesEl.children.length === 0
) {
addMessage(
"Bonjour 👋 Je suis NL Assistant, votre assistant intelligent. Comment puis-je vous aider ?",
"bot"
);
}
}

/* =========================================================
OUVERTURE
========================================================= */

button.addEventListener(
"click",
function () {
isOpen = !isOpen;

windowEl.style.display =
isOpen ? "flex" : "none";

if (isOpen) {
showWelcome();

input.focus();

const head =
button.querySelector(
".nl-bot-head"
);

if (head) {
head.style.transform =
"rotate(10deg) scale(1.05)";

setTimeout(() => {
head.style.transform =
"rotate(0deg) scale(1)";
}, 400);
}
}
}
);

  /* =========================================================
* FERMETURE
* ========================================================= */

closeButton.addEventListener(
"click",
function () {
isOpen = false;
windowEl.style.display = "none";
button.focus();
}
);

/* =========================================================
ENVOI
========================================================= */

form.addEventListener(
"submit",
async function (event) {
event.preventDefault();

const message =
input.value.trim();

if (
!message ||
sendButton.disabled
) {
return;
}

addMessage(
message,
"user"
);

input.value = "";

sendButton.disabled = true;

try {
const response =
await fetch(
apiBaseUrl +
"/api/public-chat",
{
method: "POST",

headers: {
"Content-Type":
"application/json"
},

body: JSON.stringify({
widgetId,
message,
conversationId
})
}
);

const data =
await response.json();

if (!response.ok) {
throw new Error(
data.error ||
"Impossible de contacter NL Assistant."
);
}

conversationId =
data.conversationId ||
conversationId;

addMessage(
data.reply ||
"Je n'ai pas pu générer de réponse.",
"bot"
);
} catch (error) {
console.error(
"NL Agent Widget error:",
error
);

addMessage(
"Désolé, une erreur est survenue. Veuillez réessayer plus tard.",
"bot"
);
} finally {
sendButton.disabled =
false;

input.focus();
}
}
);
})();

