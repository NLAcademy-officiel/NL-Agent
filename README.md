# NL Agent

**NL Agent** est un SaaS destiné aux entreprises pour créer un agent commercial IA capable de :

- répondre aux prospects,
- présenter les produits et services de l'entreprise,
- qualifier les prospects,
- traiter les objections courantes,
- effectuer des relances assistées,
- gérer les conversations,
- fournir des statistiques commerciales.

## Statut du projet — Phase 1 : fondation

Ce dépôt contient uniquement le **squelette professionnel** de l'application. Aucune
fonctionnalité métier réelle n'est encore branchée :

- ❌ Pas de base de données PostgreSQL connectée (le schéma Prisma est un placeholder de
  vérification uniquement).
- ❌ Pas de logique d'authentification réelle (les pages `/auth/login` et `/auth/register`
  sont des interfaces statiques).
- ❌ Pas d'intégration IA.
- ❌ Pas d'intégration Chariow.
- ❌ Pas de système de paiement / facturation.
- ❌ Aucune clé API ou secret réel dans le code — voir `.env.example`.

✅ Ce qui est en place : structure Next.js (App Router) propre et évolutive, TypeScript strict,
Tailwind CSS, ESLint, un système de composants UI réutilisables, les layouts principaux
(marketing, auth, dashboard, admin) et une navigation de base, responsive ordinateur/mobile.

## Stack technique

| Domaine | Choix |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript (strict) |
| Style | Tailwind CSS |
| Base de données (prévue) | PostgreSQL + Prisma |
| Déploiement cible | Vercel |
| Lint | ESLint (config `next/core-web-vitals`) |

## Structure du projet

```
app/
  (marketing)/        Pages publiques (accueil) — layout avec header/footer marketing
    layout.tsx
    page.tsx
  auth/                Authentification — layout centré, sans logique branchée
    layout.tsx
    login/page.tsx
    register/page.tsx
  onboarding/          Écran de bienvenue post-inscription (placeholder)
    page.tsx
  dashboard/           Espace client — layout avec sidebar + topbar
    layout.tsx
    page.tsx
  admin/               Espace équipe NL Agent — layout avec sidebar dédiée
    layout.tsx
    page.tsx
  api/
    health/route.ts    Route de vérification (aucun secret, aucune dépendance externe)
  layout.tsx           Layout racine (police, styles globaux)
  globals.css

components/
  ui/                  Composants réutilisables (Button, Input, Label, Card, Badge)
  marketing/           Header/footer du site public
  dashboard/           Sidebar/topbar de l'espace client
  admin/               Sidebar de l'espace admin
  chat/                Réservé à l'interface de conversation (Phase suivante)
  billing/             Réservé à l'interface de facturation (Phase suivante)

lib/
  auth/                Réservé à la logique d'authentification (README explicatif)
  ai/                  Réservé à l'intégration IA (README explicatif)
  database/            Réservé au client Prisma et aux accès données (README explicatif)
  knowledge/           Réservé à la base de connaissances des agents (README explicatif)
  crm/                 Réservé à la gestion des prospects (README explicatif)
  analytics/           Réservé aux statistiques commerciales (README explicatif)
  billing/             Réservé à la facturation (README explicatif)
  chariow/             Réservé à l'intégration Chariow (README explicatif)
  security/            Réservé aux utilitaires de sécurité (README explicatif)
  utils.ts             Utilitaire cn() pour la fusion de classes Tailwind (fonctionnel)

prisma/
  schema.prisma        Schéma minimal de vérification (aucun modèle métier)

public/                Assets statiques
```

Chaque sous-dossier de `lib/` contient un `README.md` expliquant son rôle futur et son statut
actuel (« non implémenté »), pour que la structure reste lisible et évolutive sans faire croire
à des fonctionnalités qui n'existent pas encore.

## Installation

### Prérequis

- Node.js ≥ 18.18
- npm (ou pnpm/yarn si vous préférez, en adaptant les commandes)

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'environnement d'exemple
cp .env.example .env.local
# puis renseigner vos propres valeurs (aucun secret réel n'est fourni)

# 3. Lancer le serveur de développement
npm run dev
```

L'application est alors disponible sur [http://localhost:3000](http://localhost:3000).

### Autres commandes utiles

```bash
npm run build       # build de production
npm run start        # démarrer le build de production
npm run lint          # vérifier le code avec ESLint
npm run typecheck     # vérifier les types TypeScript
npm run prisma:generate  # générer le client Prisma (une fois DATABASE_URL renseigné)
```

## Pages disponibles (Phase 1)

| Route | Description |
|---|---|
| `/` | Page d'accueil marketing |
| `/auth/login` | Connexion (formulaire statique) |
| `/auth/register` | Inscription (formulaire statique) |
| `/onboarding` | Écran de bienvenue (placeholder) |
| `/dashboard` | Tableau de bord client (données factices) |
| `/admin` | Tableau de bord administrateur (données factices) |
| `/api/health` | Route de vérification technique |

> Les liens de navigation du dashboard et de l'admin (Conversations, Prospects, Statistiques,
> Organisations, etc.) pointent vers des routes qui seront créées dans les phases suivantes —
> ils font partie de l'arborescence de navigation prévue mais ne sont pas encore implémentés.

## Prochaines étapes (hors périmètre de cette Phase 1)

1. **Base de données** : définir le schéma Prisma métier (User, Organization, Agent,
   Conversation, Message, Lead, Subscription...) et connecter une base PostgreSQL réelle.
2. **Authentification** : brancher une solution réelle (Auth.js ou équivalent), sessions,
   gestion des rôles (utilisateur / admin).
3. **Agent IA** : connecter un fournisseur IA, construire la logique de réponse, qualification,
   traitement des objections, à partir de la base de connaissances de chaque entreprise.
4. **CRM & conversations** : pages `/dashboard/conversations`, `/dashboard/leads`, avec données
   réelles.
5. **Statistiques** : implémenter `lib/analytics` et les graphiques du dashboard.
6. **Facturation** : intégrer un système de paiement/abonnement et `lib/chariow` si retenu.
7. **Onboarding guidé** : transformer `/onboarding` en parcours de configuration de l'agent.

## Sécurité

Aucune clé API, secret ou identifiant réel n'est présent dans ce dépôt. Le fichier
`.env.example` ne contient que des valeurs d'exemple ; copiez-le en `.env.local` (ignoré par
Git) pour vos valeurs réelles.
