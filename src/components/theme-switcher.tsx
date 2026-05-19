"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";

export function ThemeSwitcher({
  theme,
  dictionary,
}: {
  theme: Theme;
  dictionary: Dictionary["common"];
}) {
  const router = useRouter();

  async function setTheme(nextTheme: Theme) {
    await fetch("/api/preferences/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card/70 p-1">
      <Button
        type="button"
        size="icon-xs"
        variant={theme === "light" ? "default" : "ghost"}
        aria-label={dictionary.lightTheme}
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
      >
        <Sun className="size-3.5" aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon-xs"
        variant={theme === "dark" ? "default" : "ghost"}
        aria-label={dictionary.darkTheme}
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
      >
        <Moon className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
