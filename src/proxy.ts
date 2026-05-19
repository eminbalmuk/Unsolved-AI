import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_ACCESS_COOKIE = "unsolved_sb_access";
const SUPABASE_REFRESH_COOKIE = "unsolved_sb_refresh";

type SupabaseSessionResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

function getJwtExpiry(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as {
      exp?: number;
    };

    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

async function refreshSupabaseCookies(request: NextRequest, response: NextResponse) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const refreshToken = request.cookies.get(SUPABASE_REFRESH_COOKIE)?.value;

  if (!url || !anonKey || !refreshToken) return;

  const currentAccessToken = request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value;
  const expiry = currentAccessToken ? getJwtExpiry(currentAccessToken) : null;
  const shouldRefresh = !expiry || expiry - Math.floor(Date.now() / 1000) < 90;

  if (!shouldRefresh) return;

  const refreshResponse = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!refreshResponse.ok) return;

  const session = (await refreshResponse.json()) as SupabaseSessionResponse;
  if (!session.access_token || !session.refresh_token) return;

  response.cookies.set(SUPABASE_ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.expires_in ?? 60 * 60,
  });
  response.cookies.set(SUPABASE_REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  await refreshSupabaseCookies(request, response);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|images).*)"],
};
