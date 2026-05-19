export const themeCookieName = "unsolved_theme";

export const themes = ["dark", "light"] as const;

export type Theme = (typeof themes)[number];

export const defaultTheme: Theme = "dark";

export function normalizeTheme(value?: string | null): Theme {
  return value === "light" ? "light" : defaultTheme;
}
