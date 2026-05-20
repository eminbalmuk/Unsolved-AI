import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getDatabaseUrl } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";

export const SESSION_COOKIE = "unsolved_session";
export const SUPABASE_ACCESS_COOKIE = "unsolved_sb_access";
export const SUPABASE_REFRESH_COOKIE = "unsolved_sb_refresh";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  emailService: "DISABLED" | "ENABLED";
  role: string;
  plan: string;
};

type SessionPayload = {
  userId: string;
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    company?: string;
  };
};

type SupabaseSessionResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: SupabaseAuthUser;
  error?: string;
  error_description?: string;
  msg?: string;
};

function getSupabaseAuthConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return {
    url: url.replace(/\/$/, ""),
    anonKey,
  };
}

function getSupabaseError(data: SupabaseSessionResponse) {
  return (
    data.error_description ??
    data.error ??
    data.msg ??
    "Supabase authentication failed."
  );
}

async function verifySupabasePassword(email: string, password: string) {
  const config = getSupabaseAuthConfig();
  if (!config) throw new Error("Supabase Auth is not configured.");

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const data = (await response.json()) as SupabaseSessionResponse;

  if (!response.ok || !data.user) {
    throw new Error("Current password is incorrect.");
  }

  return data;
}

async function refreshSupabaseSession(refreshToken: string) {
  const config = getSupabaseAuthConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  const data = (await response.json()) as SupabaseSessionResponse;

  if (!response.ok || !data.access_token || !data.user) return null;

  await syncSupabaseUser(data.user);

  return data.user;
}

async function syncSupabaseUser(user: SupabaseAuthUser) {
  if (!isDatabaseConfigured() || !user.email) return;

  try {
    await getPrisma().user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.user_metadata?.name ?? null,
        company: user.user_metadata?.company ?? null,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? null,
        company: user.user_metadata?.company ?? null,
        passwordHash: "supabase-auth",
      },
    });
  } catch {
    // Auth must keep working even if the optional Prisma mirror is unavailable.
  }
}

async function getMirroredSessionUser(user: SupabaseAuthUser): Promise<SessionUser> {
  const fallback: SessionUser = {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.name ?? null,
    company: user.user_metadata?.company ?? null,
    emailService: "DISABLED",
    role: "FOUNDER",
    plan: "FREEMIUM",
  };

  if (!isDatabaseConfigured()) return fallback;

  try {
    const dbUser = await getPrisma().user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        emailService: true,
        role: true,
        plan: true,
      },
    });

    return dbUser ?? fallback;
  } catch {
    return fallback;
  }
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());
  const userId = payload.userId;

  return typeof userId === "string" ? userId : null;
}

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(SUPABASE_ACCESS_COOKIE);
  cookieStore.delete(SUPABASE_REFRESH_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const supabaseConfig = getSupabaseAuthConfig();
  const supabaseAccessToken = cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value;
  const supabaseRefreshToken = cookieStore.get(SUPABASE_REFRESH_COOKIE)?.value;

  if (supabaseConfig && supabaseAccessToken) {
    try {
      const response = await fetch(`${supabaseConfig.url}/auth/v1/user`, {
        headers: {
          apikey: supabaseConfig.anonKey,
          Authorization: `Bearer ${supabaseAccessToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const refreshedUser = supabaseRefreshToken
          ? await refreshSupabaseSession(supabaseRefreshToken)
          : null;

        if (!refreshedUser) return null;

        return getMirroredSessionUser(refreshedUser);
      }

      const user = (await response.json()) as SupabaseAuthUser;
      await syncSupabaseUser(user);

      return getMirroredSessionUser(user);
    } catch {
      const refreshedUser = supabaseRefreshToken
        ? await refreshSupabaseSession(supabaseRefreshToken)
        : null;

      if (!refreshedUser) return null;

      return getMirroredSessionUser(refreshedUser);
    }
  }

  if (supabaseConfig && supabaseRefreshToken) {
    const refreshedUser = await refreshSupabaseSession(supabaseRefreshToken);

    if (refreshedUser) {
      return getMirroredSessionUser(refreshedUser);
    }
  }

  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token || !process.env.AUTH_SECRET || !getDatabaseUrl()) {
    return null;
  }

  try {
    const userId = await verifySessionToken(token);
    if (!userId) return null;

    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        emailService: true,
        role: true,
        plan: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export function isAuthConfigured() {
  return Boolean(getSupabaseAuthConfig() || (getDatabaseUrl() && process.env.AUTH_SECRET));
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

export function isSupabaseAuthConfigured() {
  return Boolean(getSupabaseAuthConfig());
}

export async function ensureDatabaseUser(user: SessionUser) {
  if (!isDatabaseConfigured()) return;

  try {
    await getPrisma().user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        company: user.company,
        emailService: user.emailService,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        emailService: user.emailService,
        passwordHash: "supabase-auth",
      },
    });
  } catch {
    // Persistence should not block the user-facing action.
  }
}

export async function setSupabaseSessionCookies(session: SupabaseSessionResponse) {
  if (!session.access_token || !session.refresh_token) return;

  const cookieStore = await cookies();

  cookieStore.set(SUPABASE_ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.expires_in ?? 60 * 60,
  });

  cookieStore.set(SUPABASE_REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function signUpWithSupabase({
  name,
  email,
  password,
  company,
}: {
  name: string;
  email: string;
  password: string;
  company?: string;
}) {
  const config = getSupabaseAuthConfig();
  if (!config) throw new Error("Supabase Auth is not configured.");

  const response = await fetch(`${config.url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      data: { name, company: company || null },
    }),
    cache: "no-store",
  });
  const data = (await response.json()) as SupabaseSessionResponse;

  if (!response.ok) {
    throw new Error(getSupabaseError(data));
  }

  if (data.user) await syncSupabaseUser(data.user);
  await setSupabaseSessionCookies(data);

  return {
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email ?? email,
          name: data.user.user_metadata?.name ?? name,
          company: data.user.user_metadata?.company ?? company ?? null,
          emailService: "DISABLED" as const,
          role: "FOUNDER",
          plan: "FREEMIUM",
        }
      : null,
    requiresEmailConfirmation: !data.access_token,
  };
}

export async function signInWithSupabase({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const config = getSupabaseAuthConfig();
  if (!config) throw new Error("Supabase Auth is not configured.");

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const data = (await response.json()) as SupabaseSessionResponse;

  if (!response.ok || !data.user) {
    throw new Error(getSupabaseError(data));
  }

  await syncSupabaseUser(data.user);
  await setSupabaseSessionCookies(data);

  return {
    id: data.user.id,
    email: data.user.email ?? email,
    name: data.user.user_metadata?.name ?? null,
    company: data.user.user_metadata?.company ?? null,
    emailService: "DISABLED",
    role: "FOUNDER",
    plan: "FREEMIUM",
  };
}

export async function updateSupabaseProfile({
  name,
  company,
}: {
  name: string;
  company?: string | null;
}) {
  const config = getSupabaseAuthConfig();
  if (!config) throw new Error("Supabase Auth is not configured.");

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value;

  if (!accessToken) {
    throw new Error("Supabase session is not available.");
  }

  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ data: { name, company: company || null } }),
    cache: "no-store",
  });
  const data = (await response.json()) as SupabaseAuthUser & SupabaseSessionResponse;

  if (!response.ok) {
    throw new Error(getSupabaseError(data));
  }

  if (data.id) await syncSupabaseUser(data);
}

export async function changeSupabasePassword({
  user,
  currentPassword,
  newPassword,
}: {
  user: SessionUser;
  currentPassword: string;
  newPassword: string;
}) {
  const config = getSupabaseAuthConfig();
  if (!config) throw new Error("Supabase Auth is not configured.");

  const verifiedSession = await verifySupabasePassword(user.email, currentPassword);
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value ?? verifiedSession.access_token;

  if (!accessToken) {
    throw new Error("Supabase session is not available.");
  }

  const response = await fetch(`${config.url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password: newPassword }),
    cache: "no-store",
  });
  const data = (await response.json()) as SupabaseSessionResponse;

  if (!response.ok) {
    throw new Error(getSupabaseError(data));
  }
}

export async function deleteSupabaseAuthUser({
  user,
  password,
}: {
  user: SessionUser;
  password: string;
}) {
  const config = getSupabaseAuthConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!config) throw new Error("Supabase Auth is not configured.");
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required to delete Supabase Auth users.",
    );
  }

  await verifySupabasePassword(user.email, password);

  const response = await fetch(`${config.url}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    let message = "Supabase account could not be deleted.";

    try {
      const data = JSON.parse(text) as SupabaseSessionResponse;
      message = getSupabaseError(data);
    } catch {
      // Keep the generic message when the response is not JSON.
    }

    throw new Error(message);
  }
}
