import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
try {
await prisma.$queryRaw`SELECT 1`;
return NextResponse.json({ ok: true }, { status: 200 });
} catch {
return NextResponse.json({ ok: false }, { status: 500 });
} finally {
await prisma.$disconnect();
}
}
