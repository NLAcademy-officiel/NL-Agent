# lib/database

Client Prisma et utilitaires d'accès aux données.

**Statut Phase 1** : non implémenté. `prisma/schema.prisma` contient un
schéma minimal de vérification uniquement. Le client Prisma (`lib/database/client.ts`)
et les modèles métier (User, Organization, Agent, Conversation, Lead...)
seront ajoutés en Phase 2, avec une base PostgreSQL réelle.
