"use client";

import { useState, useTransition } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";

export function ReportEmailTestButton({
  dictionary,
}: {
  dictionary: Dictionary["reports"];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function sendTestEmail() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/reports/test-email", {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        to?: string;
      };

      if (!response.ok) {
        setError(data.error ?? dictionary.testEmailError);
        return;
      }

      setMessage(
        data.to
          ? `${dictionary.testEmailSent} ${data.to}`
          : dictionary.testEmailSent,
      );
    });
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        className="w-full"
        disabled={isPending}
        onClick={sendTestEmail}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <MailCheck className="size-4" aria-hidden />
        )}
        {isPending ? dictionary.sendingTestEmail : dictionary.sendTestEmail}
      </Button>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
