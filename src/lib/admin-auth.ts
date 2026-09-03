import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  hasAdminPermission,
  isAdminRole,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-permissions";

const ADMIN_COOKIE = "jval_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEFAULT_DEV_ADMIN_EMAIL = "admin@johnventsapexleague.com";
const DEFAULT_DEV_ADMIN_PASSWORD = "admin123";
const DEFAULT_DEV_DEVELOPER_EMAIL = "developer@johnventsapexleague.com";
const DEFAULT_DEV_DEVELOPER_PASSWORD = "developer123";
const DEFAULT_DEV_SECRET = "jval-local-admin-session-secret";

type AdminSession = {
  email: string;
  role: AdminRole;
  issuedAt: number;
  expiresAt: number;
};

type ConfiguredAdminAccount = {
  email: string;
  password?: string | null;
  passwordHash?: string | null;
  role: AdminRole;
};

export type LoginResult = {
  ok: boolean;
  error?: string;
};

export type AdminLoginVerification = Pick<AdminSession, "email" | "role">;

export type DevAdminHint = {
  email: string;
  password: string;
  role: AdminRole;
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

function hasExplicitDeveloperConfig() {
  return Boolean(
    process.env.DEVELOPER_PASSWORD || process.env.DEVELOPER_PASSWORD_HASH,
  );
}

function getConfiguredPassword(envKey: string, devFallback: string | null) {
  const configuredPassword = process.env[envKey];

  if (configuredPassword) {
    return configuredPassword;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return devFallback;
}

function hasCredentials(account: ConfiguredAdminAccount) {
  return Boolean(account.passwordHash || account.password);
}

function getConfiguredAccounts() {
  const accounts: ConfiguredAdminAccount[] = [];
  const developerIsExplicit = hasExplicitDeveloperConfig();

  if (developerIsExplicit) {
    accounts.push({
      email: process.env.DEVELOPER_EMAIL ?? DEFAULT_DEV_DEVELOPER_EMAIL,
      password: getConfiguredPassword("DEVELOPER_PASSWORD", null),
      passwordHash: process.env.DEVELOPER_PASSWORD_HASH,
      role: "developer",
    });
  } else if (process.env.NODE_ENV === "production") {
    accounts.push({
      email: process.env.ADMIN_EMAIL ?? DEFAULT_DEV_ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD ?? null,
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      role: "developer",
    });
  } else {
    accounts.push({
      email: DEFAULT_DEV_DEVELOPER_EMAIL,
      password: DEFAULT_DEV_DEVELOPER_PASSWORD,
      role: "developer",
    });
  }

  if (developerIsExplicit || process.env.NODE_ENV !== "production") {
    accounts.push({
      email: process.env.ADMIN_EMAIL ?? DEFAULT_DEV_ADMIN_EMAIL,
      password: getConfiguredPassword("ADMIN_PASSWORD", DEFAULT_DEV_ADMIN_PASSWORD),
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      role: "admin",
    });
  }

  return accounts.filter(hasCredentials);
}

function hashPassword(password: string) {
  return createHmac("sha256", getSessionSecret()).update(password).digest("hex");
}

export function createPasswordHash(password: string) {
  return hashPassword(password);
}

export function verifyAdminCredentials(
  email: string,
  password: string,
): AdminLoginVerification | null {
  const normalizedEmail = email.trim().toLowerCase();

  for (const account of getConfiguredAccounts()) {
    if (!safeEquals(normalizedEmail, account.email.toLowerCase())) {
      continue;
    }

    if (account.passwordHash && safeEquals(hashPassword(password), account.passwordHash)) {
      return { email: account.email.toLowerCase(), role: account.role };
    }

    if (account.password && safeEquals(password, account.password)) {
      return { email: account.email.toLowerCase(), role: account.role };
    }
  }

  return null;
}

function inferRoleForEmail(email: string): AdminRole {
  return (
    getConfiguredAccounts().find((account) =>
      safeEquals(email.toLowerCase(), account.email.toLowerCase()),
    )?.role ?? "admin"
  );
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
    const rawSession = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: unknown;
      role?: unknown;
      issuedAt?: unknown;
      expiresAt?: unknown;
    };

    if (
      typeof rawSession.email !== "string" ||
      typeof rawSession.issuedAt !== "number" ||
      typeof rawSession.expiresAt !== "number" ||
      rawSession.expiresAt < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      email: rawSession.email,
      issuedAt: rawSession.issuedAt,
      expiresAt: rawSession.expiresAt,
      role: isAdminRole(rawSession.role)
        ? rawSession.role
        : inferRoleForEmail(rawSession.email),
    } satisfies AdminSession;
  } catch {
    return null;
  }
}

export async function setAdminSession(email: string, role: AdminRole) {
  const now = Math.floor(Date.now() / 1000);
  const cookieStore = await cookies();

  cookieStore.set(
    ADMIN_COOKIE,
    encodeSession({ email, role, issuedAt: now, expiresAt: now + SESSION_TTL_SECONDS }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_SECONDS,
      path: "/admin",
    },
  );
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

export async function requireAdminPermission(
  permission: AdminPermission,
  redirectTo = "/admin?error=forbidden",
) {
  const session = await requireAdminSession();

  if (!hasAdminPermission(session.role, permission)) {
    redirect(redirectTo);
  }

  return session;
}

export function getDevAdminHint(): DevAdminHint[] | null {
  if (
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.DEVELOPER_PASSWORD ||
    process.env.DEVELOPER_PASSWORD_HASH ||
    process.env.DEVELOPER_EMAIL ||
    process.env.NODE_ENV === "production"
  ) {
    return null;
  }

  return [
    {
      email: DEFAULT_DEV_DEVELOPER_EMAIL,
      password: DEFAULT_DEV_DEVELOPER_PASSWORD,
      role: "developer",
    },
    {
      email: DEFAULT_DEV_ADMIN_EMAIL,
      password: DEFAULT_DEV_ADMIN_PASSWORD,
      role: "admin",
    },
  ];
}
