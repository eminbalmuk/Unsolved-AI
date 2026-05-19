"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import type { ValidationState } from "@/lib/types";

export function ValidateButton({
  problemId,
  initialCount,
  dictionary,
}: {
  problemId: string;
  initialCount: number;
  dictionary: Dictionary["validation"];
}) {
  const router = useRouter();
  const [state, setState] = useState<ValidationState>({
    problemId,
    userHasValidated: false,
    validationCount: initialCount,
    threshold: 50,
  });
  const [isPending, startTransition] = useTransition();

  function validate() {
    if (state.userHasValidated) return;

    setState((current) => ({
      ...current,
      userHasValidated: true,
      validationCount: current.validationCount + 1,
    }));

    startTransition(async () => {
      const response = await fetch(`/api/problems/${problemId}/validate`, {
        method: "POST",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.ok) {
        const nextState = (await response.json()) as ValidationState;
        setState(nextState);
      }
    });
  }

  const isSaturated = state.validationCount >= state.threshold;

  return (
    <div className="space-y-3">
      <Button
        onClick={validate}
        disabled={state.userHasValidated || isPending}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <CheckCircle2 className="size-4" aria-hidden />
        )}
        {state.userHasValidated ? dictionary.validated : dictionary.willSolve}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {dictionary.trackingPrefix}
        {state.validationCount} {dictionary.trackingSuffix}
      </p>
      {isSaturated ? (
        <p className="rounded-md border border-amber-500/35 bg-amber-400/12 p-3 text-sm text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
          {dictionary.saturated}
        </p>
      ) : null}
    </div>
  );
}
