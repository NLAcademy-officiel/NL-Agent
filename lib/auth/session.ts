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

export async function createSession(
  payload: SessionPayload
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  return token;
}

export async function getSession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (
      typeof payload.userId !== "string" ||
      typeof payload.organizationId !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role as SessionPayload["role"],
    };
  } catch {
    return null;
  }
}
