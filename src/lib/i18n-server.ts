import { cookies } from "next/headers";
import {
  dictionaries,
  localeCookieName,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value);
}

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
