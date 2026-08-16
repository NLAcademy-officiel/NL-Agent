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

      {/* TARIFS (placeholder) */}
      <section id="tarifs" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <Badge variant="neutral" className="mx-auto w-fit">Tarifs</Badge>
          <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">Des offres bientôt disponibles</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            La grille tarifaire et la facturation seront mises en place dans une phase ultérieure du projet.
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="mx-auto max-w-xl text-3xl font-semibold sm:text-4xl">
            Prêt à donner un agent commercial à votre entreprise ?
          </h2>
          <Link href="/auth/register" className="mt-8 inline-block">
            <Button size="lg">Créer mon compte</Button>
          </Link>
        </div>
      </section>
      <NLAssistantWidget />
    </>
  );
}
