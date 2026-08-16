import { SignJWT, jwtVerify } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
throw new Error("AUTH_SECRET is not configured");
}

const secretKey = new TextEncoder().encode(AUTH_SECRET);

const SESSION_COOKIE = "nl_agent_session";

export type SessionPayload = {
userId: string;
organizationId: string;
role: "OWNER" | "ADMIN" | "MEMBER";
};

export async function createSession(payload: SessionPayload) {
return new SignJWT(payload)
.setProtectedHeader({ alg: "HS256" })
.setIssuedAt()
.setExpirationTime("7d")
.sign(secretKey);
}

export async function getSession(token?: string) {
if (!token) {
return null;
}

try {
const { payload } = await jwtVerify(token, secretKey);

return {
userId: String(payload.userId),
organizationId: String(payload.organizationId),
role: payload.role as "OWNER" | "ADMIN" | "MEMBER",
};
} catch (error) {
console.error("Session verification error:", error);
return null;
}
}

export function getSessionCookieName() {
return SESSION_COOKIE;
}