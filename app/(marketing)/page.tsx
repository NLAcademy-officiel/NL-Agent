import Link from "next/link";
import NLAssistantWidget from "@/components/chat/NLAssistantWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FONCTIONNALITES = [
  {
    titre: "Réponses aux prospects",
    desc: "L'agent répond instantanément aux questions des prospects, à toute heure, sur vos canaux de conversation.",
  },
  {
    titre: "Présentation des offres",
    desc: "Il présente vos produits et services à partir de la base de connaissances de votre entreprise.",
  },
  {
    titre: "Qualification des prospects",
    desc: "Il identifie les prospects les plus prometteurs selon des critères que vous définissez.",
  },
  {
    titre: "Traitement des objections",
    desc: "Il répond aux objections courantes avec les arguments et le ton propres à votre entreprise.",
  },
  {
    titre: "Relances assistées",
    desc: "Il vous aide à relancer les prospects qui n'ont pas répondu, au bon moment.",
  },
  {
    titre: "Statistiques commerciales",
    desc: "Un tableau de bord suit les conversations, la qualification et les tendances de votre pipeline.",
  },
];

const ETAPES = [
  { n: "01", titre: "Créer votre agent", desc: "Configurez le ton, les offres et la base de connaissances de votre agent IA." },
  { n: "02", titre: "Connecter vos canaux", desc: "Reliez l'agent aux canaux où vos prospects vous contactent." },
  { n: "03", titre: "Suivre les résultats", desc: "Analysez les conversations et les statistiques depuis votre dashboard." },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <Badge variant="neutral" className="mx-auto w-fit">SaaS pour entreprises</Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Votre agent commercial IA, disponible 24h/24 pour vos prospects
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            NL Agent aide les entreprises à répondre aux prospects, présenter leurs offres, qualifier les leads,
            traiter les objections et suivre leurs performances commerciales — le tout piloté depuis un seul
            tableau de bord.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg">Créer mon agent IA</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="secondary">Se connecter</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-14 max-w-2xl">
            <Badge variant="neutral">Fonctionnalités</Badge>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">Tout ce qu'il faut pour épauler vos commerciaux</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FONCTIONNALITES.map((f) => (
              <Card key={f.titre}>
                <CardHeader>
                  <CardTitle>{f.titre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{f.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-14 max-w-2xl">
            <Badge variant="neutral">Comment ça marche</Badge>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">Trois étapes pour démarrer</h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {ETAPES.map((e) => (
              <div key={e.n} className="border-t border-line pt-6">
                <span className="text-sm font-mono text-brand-400">{e.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{e.titre}</h3>
                <p className="mt-2 text-sm text-white/60">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
<section id="tarifs" className="border-b border-line">
<div className="mx-auto max-w-6xl px-6 py-24">
<div className="text-center">
<Badge variant="neutral" className="mx-auto w-fit">
Tarifs
</Badge>

<h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
Choisissez votre formule NL Agent
</h2>

<p className="mx-auto mt-4 max-w-2xl text-white/60">
Des abonnements mensuels simples et adaptés à votre activité.
Commencez avec la formule qui correspond le mieux à vos besoins.
</p>
</div>

<div className="mt-12 grid gap-6 md:grid-cols-3">
<div className="flex flex-col rounded-2xl border border-line bg-surface p-6">
<h3 className="text-xl font-semibold">
NL Agent Starter
</h3>

<p className="mt-2 text-sm text-white/60">
Pour les indépendants et petites activités qui souhaitent
automatiser leur relation avec leurs prospects.
</p>

<div className="mt-6">
<span className="text-3xl font-bold">
Starter
</span>
<span className="ml-2 text-sm text-white/50">
/ mois
</span>
</div>

<ul className="mt-6 space-y-3 text-sm text-white/70">
<li>✓ Agent commercial IA</li>
<li>✓ Qualification des prospects</li>
<li>✓ Gestion des conversations</li>
<li>✓ Tableau de bord</li>
</ul>

<a
href="https://next-level-academy.mychariow.shop/prd_k4merxkk/checkout"
target="_blank"
rel="noopener noreferrer"
className="mt-8 inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
>
Choisir Starter
</a>
</div>

<div className="relative flex flex-col rounded-2xl border border-brand-500 bg-brand-500/10 p-6">
<div className="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
Recommandé
</div>

<h3 className="text-xl font-semibold">
NL Agent Business
</h3>

<p className="mt-2 text-sm text-white/60">
Pour les entreprises qui veulent automatiser davantage leur
acquisition et leur suivi commercial.
</p>

<div className="mt-6">
<span className="text-3xl font-bold">
Business
</span>
<span className="ml-2 text-sm text-white/50">
/ mois
</span>
</div>

<ul className="mt-6 space-y-3 text-sm text-white/70">
<li>✓ Tout le contenu de Starter</li>
<li>✓ Qualification avancée</li>
<li>✓ Gestion des prospects</li>
<li>✓ Statistiques commerciales</li>
<li>✓ Automatisations</li>
</ul>

<a
href="https://next-level-academy.mychariow.shop/prd_64bi5h5w/checkout"
target="_blank"
rel="noopener noreferrer"
className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
>
Choisir Business
</a>
</div>

<div className="flex flex-col rounded-2xl border border-line bg-surface p-6">
<h3 className="text-xl font-semibold">
NL Agent Pro
</h3>

<p className="mt-2 text-sm text-white/60">
Pour les entreprises qui souhaitent une solution plus complète
pour leur développement commercial.
</p>

<div className="mt-6">
<span className="text-3xl font-bold">
Pro
</span>
<span className="ml-2 text-sm text-white/50">
/ mois
</span>
</div>

<ul className="mt-6 space-y-3 text-sm text-white/70">
<li>✓ Tout le contenu de Business</li>
<li>✓ Fonctionnalités avancées</li>
<li>✓ Automatisation commerciale</li>
<li>✓ Suivi des performances</li>
<li>✓ Solution évolutive</li>
</ul>

<a
href="https://next-level-academy.mychariow.shop/prd_krai669t/checkout"
target="_blank"
rel="noopener noreferrer"
className="mt-8 inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
>
Choisir Pro
</a>
</div>
</div>

<p className="mt-8 text-center text-xs text-white/40">
Abonnement mensuel. Vous pouvez choisir la formule adaptée à vos besoins.
</p>
</div>
</section>
      <NLAssistantWidget />
    </>
  );
}
