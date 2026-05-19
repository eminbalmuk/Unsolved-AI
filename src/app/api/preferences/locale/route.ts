import { NextResponse } from "next/server";
import { localeCookieName, normalizeLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    locale?: string;
  };
  const locale = normalizeLocale(body.locale);
  const response = NextResponse.json({ locale });

  response.cookies.set(localeCookieName, locale, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
