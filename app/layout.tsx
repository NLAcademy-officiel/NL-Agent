import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NL Agent — Votre agent commercial IA",
    template: "%s · NL Agent",
  },
  description:
    "NL Agent permet aux entreprises de créer un agent IA commercial : réponses aux prospects, présentation des offres, qualification, relances et statistiques commerciales.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body>{children}</body>
    </html>
  );
}
