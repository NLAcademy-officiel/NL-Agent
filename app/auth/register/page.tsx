"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible de créer le compte.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError(
        "Impossible de contacter le serveur. Vérifiez votre connexion."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">
          Créer un compte
        </h1>

        <p className="mt-1 text-sm text-white/60">
          Créez votre espace NL Agent pour votre entreprise.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="company">Nom de l&apos;entreprise</Label>
          <Input
            id="company"
            name="company"
            type="text"
            placeholder="Votre entreprise"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="vous@entreprise.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Création en cours..." : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Déjà un compte ?{" "}
        <Link
          href="/auth/login"
          className="text-brand-400 hover:text-brand-300"
        >
          Se connecter
        </Link>
      </p>
    </Card>
  );
}
