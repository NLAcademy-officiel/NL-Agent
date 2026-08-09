import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Créer un compte",
};

export default function RegisterPage() {
  return (
    <Card>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Créer un compte</h1>
        <p className="mt-1 text-sm text-white/60">
          Créez votre espace NL Agent pour votre entreprise.
        </p>
      </div>

      {/*
        Formulaire statique — Phase 1.
        Aucune logique d'inscription n'est branchée à ce stade
        (voir lib/auth/README.md). L'action réelle sera ajoutée en Phase 2.
      */}
      <form className="space-y-5">
        <div>
          <Label htmlFor="company">Nom de l&apos;entreprise</Label>
          <Input id="company" name="company" type="text" placeholder="Votre entreprise" required />
        </div>
        <div>
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input id="email" name="email" type="email" placeholder="vous@entreprise.com" required />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>
        <Button type="submit" className="w-full">
          Créer mon compte
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Déjà un compte ?{" "}
        <Link href="/auth/login" className="text-brand-400 hover:text-brand-300">
          Se connecter
        </Link>
      </p>
    </Card>
  );
}
