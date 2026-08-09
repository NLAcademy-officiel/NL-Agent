import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Bienvenue",
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <Card className="max-w-lg text-center">
        <CardHeader>
          <CardTitle>Bienvenue sur NL Agent</CardTitle>
          <CardDescription>
            La configuration guidée de votre agent commercial sera disponible ici dans une prochaine phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button className="w-full">Accéder au tableau de bord</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
