import { cookies } from "next/headers";
import { normalizeTheme, themeCookieName, type Theme } from "@/lib/theme";

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  return normalizeTheme(cookieStore.get(themeCookieName)?.value);
}
