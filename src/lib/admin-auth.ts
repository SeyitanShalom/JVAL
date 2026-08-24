import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "jval_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_DEV_EMAIL = "admin@johnventsapexleague.com";
const DEFAULT_DEV_PASSWORD = "admin123";
const DEFAULT_DEV_SECRET = "jval-local-admin-session-secret";

type AdminSession = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

export type LoginResult = {
  ok: boolean;
  error?: string;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET is required in production.");
  }

  return DEFAULT_DEV_SECRET;
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getConfiguredEmail() {
  return process.env.ADMIN_EMAIL ?? DEFAULT_DEV_EMAIL;
}

function getConfiguredPassword() {
  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return DEFAULT_DEV_PASSWORD;
}

function hashPassword(password: string) {
  return createHmac("sha256", getSessionSecret()).update(password).digest("hex");
}

export function createPasswordHash(password: string) {
  return hashPassword(password);
}

export function verifyAdminCredentials(email: string, password: string) {
  const configuredEmail = getConfiguredEmail();
  const configuredPassword = getConfiguredPassword();
  const configuredPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!safeEquals(email.trim().toLowerCase(), configuredEmail.toLowerCase())) {
    return false;
  }

  if (configuredPasswordHash) {
    return safeEquals(hashPassword(password), configuredPasswordHash);
  }

  if (!configuredPassword) {
    return false;
  }

  return safeEquals(password, configuredPassword);
}

function encodeSession(session: AdminSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

function decodeSession(value?: string) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !safeEquals(signPayload(payload), signature)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;

    if (session.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function setAdminSession(email: string) {
  const now = Math.floor(Date.now() / 1000);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, encodeSession({ email, issuedAt: now, expiresAt: now + SESSION_TTL_SECONDS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/admin",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export function getDevAdminHint() {
  if (process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH || process.env.NODE_ENV === "production") {
    return null;
  }

  return {
    email: DEFAULT_DEV_EMAIL,
    password: DEFAULT_DEV_PASSWORD,
  };
}
