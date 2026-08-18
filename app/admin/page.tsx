import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
title: "Administration | NL Agent",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
const cookieStore = cookies();
const token = cookieStore.get("nl_agent_session")?.value;

if (!token) {
redirect("/auth/login");
}

const session = await getSession(token);

if (!session) {
redirect("/auth/login");
}

// Seuls OWNER et ADMIN peuvent accéder à l'administration
if (session.role !== "OWNER" && session.role !== "ADMIN") {
redirect("/dashboard");
}

const [
organizations,
users,
activeSubscriptions,
trials,
conversations,
prospects,
agents,
payments,
latestSubscriptions,
latestUsers,
latestOrganizations,
] = await Promise.all([
prisma.organization.count(),

prisma.user.count(),

prisma.chariowSubscription.count({
where: {
status: "ACTIVE",
},
}),

prisma.chariowSubscription.count({
where: {
status: "TRIAL",
},
}),

prisma.conversation.count(),

prisma.lead.count(),

prisma.agent.count(),

prisma.paymentProof.count(),

prisma.chariowSubscription.findMany({
orderBy: {
createdAt: "desc",
},
take: 5,
include: {
organization: {
select: {
name: true,
},
},
},
}),

prisma.user.findMany({
orderBy: {
createdAt: "desc",
},
take: 5,
select: {
id: true,
name: true,
email: true,
role: true,
createdAt: true,
organization: {
select: {
name: true,
},
},
},
}),

prisma.organization.findMany({
orderBy: {
createdAt: "desc",
},
take: 5,
select: {
id: true,
name: true,
slug: true,
createdAt: true,
},
}),
]);

return (
<>
<DashboardTopbar title="Administration" />

<main className="p-6">
<div className="mb-8">
<div className="flex flex-wrap items-center gap-3">
<Badge variant="neutral">Administration NL Agent</Badge>

<span className="text-sm text-white/50">
Accès : {session.role}
</span>
</div>

<h1 className="mt-4 text-2xl font-semibold text-white">
Vue globale de NL Agent
</h1>

<p className="mt-2 max-w-3xl text-sm text-white/60">
Supervisez les utilisateurs, organisations, abonnements,
conversations, prospects, agents IA et paiements de toute
l&apos;application NL Agent.
</p>
</div>

{/* STATISTIQUES PRINCIPALES */}

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
<AdminCard
title="Organisations"
value={organizations}
description="Organisations enregistrées"
/>

<AdminCard
title="Utilisateurs"
value={users}
description="Comptes utilisateurs"
/>

<AdminCard
title="Abonnements actifs"
value={activeSubscriptions}
description="Abonnements actuellement actifs"
/>

<AdminCard
title="Essais gratuits"
value={trials}
description="Abonnements en période d'essai"
/>

<AdminCard
title="Conversations"
value={conversations}
description="Conversations enregistrées"
/>

<AdminCard
title="Prospects"
value={prospects}
description="Prospects enregistrés"
/>

<AdminCard
title="Agents IA"
value={agents}
description="Agents créés"
/>

<AdminCard
title="Paiements enregistrés"
value={payments}
description="Preuves de paiement"
/>
</div>

{/* DERNIERS ABONNEMENTS */}

<section className="mt-8">
<Card>
<CardHeader>
<CardTitle>Derniers abonnements</CardTitle>
</CardHeader>

<CardContent>
{latestSubscriptions.length === 0 ? (
<p className="text-sm text-white/50">
Aucun abonnement enregistré.
</p>
) : (
<div className="space-y-4">
{latestSubscriptions.map((subscription) => (
<div
key={subscription.id}
className="flex flex-col gap-2 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
>
<div>
<p className="font-medium text-white">
{subscription.planName || "Plan non renseigné"}
</p>

<p className="text-sm text-white/50">
{subscription.organization.name}
</p>
</div>

<div className="flex items-center gap-3">
<Badge variant="neutral">
{subscription.status}
</Badge>

<span className="text-xs text-white/40">
{formatDate(subscription.createdAt)}
</span>
</div>
</div>
))}
</div>
)}
</CardContent>
</Card>
</section>

{/* DERNIERS UTILISATEURS */}

<section className="mt-6">
<Card>
<CardHeader>
<CardTitle>Derniers utilisateurs</CardTitle>
</CardHeader>

<CardContent>
{latestUsers.length === 0 ? (
<p className="text-sm text-white/50">
Aucun utilisateur enregistré.
</p>
) : (
<div className="space-y-4">
{latestUsers.map((user) => (
<div
key={user.id}
className="flex flex-col gap-2 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
>
<div>
<p className="font-medium text-white">
{user.name || "Utilisateur sans nom"}
</p>

<p className="text-sm text-white/50">
{user.email}
</p>

<p className="text-xs text-white/40">
{user.organization.name}
</p>
</div>

<div className="flex items-center gap-3">
<Badge variant="neutral">
{user.role}
</Badge>

<span className="text-xs text-white/40">
{formatDate(user.createdAt)}
</span>
</div>
</div>
))}
</div>
)}
</CardContent>
</Card>
</section>

{/* DERNIÈRES ORGANISATIONS */}

<section className="mt-6">
<Card>
<CardHeader>
<CardTitle>Dernières organisations</CardTitle>
</CardHeader>

<CardContent>
{latestOrganizations.length === 0 ? (
<p className="text-sm text-white/50">
Aucune organisation enregistrée.
</p>
) : (
<div className="space-y-4">
{latestOrganizations.map((organization) => (
<div
key={organization.id}
className="flex flex-col gap-2 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
>
<div>
<p className="font-medium text-white">
{organization.name}
</p>

<p className="text-sm text-white/50">
{organization.slug}
</p>
</div>

<span className="text-xs text-white/40">
{formatDate(organization.createdAt)}
</span>
</div>
))}
</div>
)}
</CardContent>
</Card>
</section>
</main>
</>
);
}

function AdminCard({
title,
value,
description,
}: {
title: string;
value: number;
description: string;
}) {
return (
<Card>
<CardContent className="p-5">
<p className="text-sm text-white/50">{title}</p>

<p className="mt-2 text-3xl font-bold text-white">
{value}
</p>

<p className="mt-2 text-xs text-white/40">
{description}
</p>
</CardContent>
</Card>
);
}

function formatDate(date: Date) {
return new Intl.DateTimeFormat("fr-FR", {
day: "2-digit",
month: "2-digit",
year: "numeric",
}).format(date);
}
