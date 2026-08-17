"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
{
name: "Starter",
price: "9 900",
description: "Pour démarrer avec un assistant IA professionnel.",
features: [
"7 jours d'essai gratuit",
"1 agent IA",
"Gestion des prospects",
"Conversations avec les visiteurs",
"Base de connaissances",
],
href: "https://next-level-academy.mychariow.shop/prd_k4merxkk/checkout",
recommended: false,
},
{
name: "Business",
price: "24 900",
description:
"Pour les entreprises qui veulent automatiser leur relation client.",
features: [
"7 jours d'essai gratuit",
"Agent IA avancé",
"Gestion des prospects",
"Conversations",
"Base de connaissances",
"Statistiques",
"Automatisation commerciale",
],
href: "https://next-level-academy.mychariow.shop/prd_64bi5h5w/checkout",
recommended: true,
},
{
name: "Pro",
price: "49 900",
description:
"Pour les entreprises qui veulent exploiter pleinement NL Agent.",
features: [
"7 jours d'essai gratuit",
"Agent IA professionnel",
"Gestion avancée des prospects",
"Conversations",
"Base de connaissances avancée",
"Statistiques avancées",
"Automatisation commerciale",
"Support prioritaire",
],
href: "https://next-level-academy.mychariow.shop/prd_krai669t/checkout",
recommended: false,
},
];

export default function AbonnementPage() {
const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
const [activePlan, setActivePlan] = useState<string | null>(null);
const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
const [error, setError] = useState("");

async function handleSubscribe(planName: string) {
try {
setLoadingPlan(planName);
setError("");

const response = await fetch("/api/subscription/trial", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
planName,
}),
});

const data = await response.json();

if (!response.ok) {
setError(
data.error || "Impossible d'activer l'essai gratuit."
);
setLoadingPlan(null);
return;
}

setActivePlan(data.subscription?.planName || planName);
setTrialExpiresAt(data.subscription?.expiresAt || null);
setLoadingPlan(null);
} catch (error) {
console.error("Subscription error:", error);

setError(
"Une erreur est survenue. Veuillez réessayer dans quelques instants."
);

setLoadingPlan(null);
}
}

function formatDate(date: string) {
return new Date(date).toLocaleDateString("fr-FR", {
day: "2-digit",
month: "long",
year: "numeric",
});
}

return (
<main className="min-h-screen bg-background px-6 py-10 text-white">
<div className="mx-auto max-w-7xl">
<div className="mb-10 text-center">
<p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-300">
NL Agent
</p>

<h1 className="text-3xl font-bold md:text-4xl">
Choisissez votre abonnement
</h1>

<p className="mx-auto mt-3 max-w-2xl text-white/60">
Commencez gratuitement pendant 7 jours et choisissez l'offre
adaptée aux besoins de votre entreprise.
</p>
</div>

{activePlan && (
<div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-brand-500/40 bg-brand-500/10 p-6 text-center">
<div className="mb-2 text-2xl">✓</div>

<h2 className="text-xl font-bold text-white">
Votre essai gratuit est activé !
</h2>

<p className="mt-2 text-sm text-white/70">
Votre offre <strong>{activePlan}</strong> est active pendant
7 jours.
</p>

{trialExpiresAt && (
<p className="mt-1 text-sm text-brand-300">
Votre essai se termine le{" "}
<strong>{formatDate(trialExpiresAt)}</strong>.
</p>
)}

<p className="mt-4 text-sm text-white/60">
Vous pouvez continuer à utiliser NL Agent pendant votre
période d'essai gratuit.
</p>
</div>
)}

{error && (
<div className="mx-auto mb-8 max-w-2xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
{error}
</div>
)}

<div className="grid gap-6 lg:grid-cols-3">
{plans.map((plan) => (
<div
key={plan.name}
className={`relative flex flex-col rounded-2xl border p-6 ${
plan.recommended
? "border-brand-500 bg-brand-500/10"
: "border-line bg-surface"
}`}
>
{plan.recommended && (
<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white">
Offre recommandée
</div>
)}

<div>
<h2 className="text-xl font-bold">{plan.name}</h2>

<p className="mt-2 min-h-[48px] text-sm text-white/60">
{plan.description}
</p>
</div>

<div className="mt-6">
<span className="text-4xl font-bold">{plan.price}</span>

<span className="ml-2 text-sm text-white/50">
FCFA / mois
</span>
</div>

<div className="mt-4 rounded-lg bg-white/5 px-4 py-3 text-center text-sm font-semibold text-brand-300">
7 jours gratuits
</div>

<ul className="mt-6 flex-1 space-y-3">
{plan.features.map((feature) => (
<li
key={feature}
className="flex items-start gap-2 text-sm text-white/75"
>
<span className="mt-0.5 text-brand-300">✓</span>
<span>{feature}</span>
</li>
))}
</ul>

{!activePlan ? (
<button
type="button"
onClick={() => handleSubscribe(plan.name)}
disabled={loadingPlan !== null}
className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
plan.recommended
? "bg-brand-500 text-white hover:bg-brand-400"
: "bg-white/10 text-white hover:bg-white/15"
}`}
>
{loadingPlan === plan.name
? "Activation de l'essai..."
: "Commencer gratuitement"}
</button>
) : (
<a
href={plan.href}
target="_blank"
rel="noopener noreferrer"
className={`mt-8 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
activePlan === plan.name
? "bg-brand-500 text-white hover:bg-brand-400"
: "bg-white/10 text-white hover:bg-white/15"
}`}
>
{activePlan === plan.name
? "Gérer mon abonnement"
: "Choisir cette offre"}
</a>
)}
</div>
))}
</div>

<div className="mt-10 rounded-2xl border border-line bg-surface p-6 text-center">
<h3 className="text-lg font-semibold">
Besoin d'aide pour choisir ?
</h3>

<p className="mt-2 text-sm text-white/60">
Commencez avec l'essai gratuit de 7 jours et choisissez ensuite
l'offre qui correspond le mieux à votre activité.
</p>

<Link
href="/dashboard"
className="mt-5 inline-block rounded-lg border border-line px-5 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
>
Retour au dashboard
</Link>
</div>
</div>
</main>
);
}