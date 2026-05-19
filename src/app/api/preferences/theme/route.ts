import { NextResponse } from "next/server";
import { normalizeTheme, themeCookieName } from "@/lib/theme";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    theme?: string;
  };
  const theme = normalizeTheme(body.theme);
  const response = NextResponse.json({ theme });

  response.cookies.set(themeCookieName, theme, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
