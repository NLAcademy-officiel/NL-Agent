import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <Card>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Connexion</h1>
        <p className="mt-1 text-sm text-white/60">
          Connectez-vous à votre espace NL Agent.
        </p>
      </div>

      {/*
        Formulaire statique — Phase 1.
        Aucune logique d'authentification n'est branchée à ce stade
        (voir lib/auth/README.md). L'action réelle sera ajoutée en Phase 2.
      */}
      <form className="space-y-5">
        <div>
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input id="email" name="email" type="email" placeholder="vous@entreprise.com" required />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Pas encore de compte ?{" "}
        <Link href="/auth/register" className="text-brand-400 hover:text-brand-300">
          Créer un compte
        </Link>
      </p>
    </Card>
  );
}
