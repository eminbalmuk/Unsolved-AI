"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  async function setLocale(nextLocale: Locale) {
    await fetch("/api/preferences/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card/70 p-1">
      {(["tr", "en"] as const).map((option) => (
        <Button
          key={option}
          type="button"
          size="xs"
          variant={locale === option ? "default" : "ghost"}
          className="px-2 font-mono text-xs"
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
        >
          {option.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
