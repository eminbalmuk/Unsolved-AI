"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, Loader2, MailCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";

export function ReportEmailTestButton({
  dictionary,
  initialSubscribed,
  disabled,
}: {
  dictionary: Dictionary["reports"];
  initialSubscribed: boolean;
  disabled?: boolean;
}) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubscriptionPending, startSubscriptionTransition] = useTransition();

  function updateSubscription(enabled: boolean) {
    setMessage(null);
    setError(null);

    startSubscriptionTransition(async () => {
      const response = await fetch("/api/reports/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        emailService?: "DISABLED" | "ENABLED";
      };

      if (!response.ok) {
        setError(data.error ?? dictionary.subscriptionError);
        return;
      }

      const nextSubscribed = data.emailService === "ENABLED";
      setIsSubscribed(nextSubscribed);
      setMessage(
        nextSubscribed
          ? dictionary.subscriptionEnabled
          : dictionary.subscriptionDisabled,
      );
    });
  }

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
        variant={isSubscribed ? "outline" : "default"}
        disabled={disabled || isSubscriptionPending}
        onClick={() => updateSubscription(!isSubscribed)}
      >
        {isSubscriptionPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : isSubscribed ? (
          <BellOff className="size-4" aria-hidden />
        ) : (
          <Bell className="size-4" aria-hidden />
        )}
        {isSubscriptionPending
          ? dictionary.subscriptionSaving
          : isSubscribed
            ? dictionary.unsubscribeEmail
            : dictionary.subscribeEmail}
      </Button>
      <Button
        type="button"
        className="w-full"
        variant="secondary"
        disabled={disabled || !isSubscribed || isPending}
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
