"use client";

import { useState } from "react";
import { Bot, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Dictionary } from "@/lib/i18n";
import type { ProblemAnalysis } from "@/lib/types";

type AnalysisResponse = {
  analysis?: ProblemAnalysis;
  analyzedAt?: string;
  model?: string;
  cached?: boolean;
  error?: string;
};

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-base font-medium">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md border bg-background/45 px-3 py-2 text-sm leading-6 text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProblemAnalysisPanel({
  problemId,
  initialAnalysis = null,
  initialAnalyzedAt = null,
  initialModel = null,
  dictionary,
}: {
  problemId: string;
  initialAnalysis?: ProblemAnalysis | null;
  initialAnalyzedAt?: string | null;
  initialModel?: string | null;
  dictionary: Dictionary["analysis"];
}) {
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(initialAnalysis);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(initialAnalyzedAt);
  const [model, setModel] = useState<string | null>(initialModel);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAnalyze() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/problems/${problemId}/analysis`, {
        method: "POST",
        cache: "no-store",
      });
      const data = (await response.json()) as AnalysisResponse;

      if (!response.ok || !data.analysis) {
        throw new Error(data.error ?? dictionary.unavailable);
      }

      setAnalysis(data.analysis);
      setAnalyzedAt(data.analyzedAt ?? new Date().toISOString());
      setModel(data.model ?? null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : dictionary.unexpectedError,
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="bg-card/82">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="size-5 text-primary" aria-hidden />
              {dictionary.title}
            </CardTitle>
            <CardDescription className="mt-2 text-base leading-7">
              {dictionary.description}
            </CardDescription>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || Boolean(analysis)}
            className="h-11 text-base"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-5" aria-hidden />
            )}
            {analysis
              ? dictionary.saved
              : isLoading
                ? dictionary.loading
                : dictionary.action}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="font-medium text-destructive">
                  {dictionary.failedTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {analysis ? (
          <div className="space-y-5">
            <div className="rounded-md border bg-background/45 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{dictionary.summaryBadge}</Badge>
                {model ? <Badge variant="outline">{model}</Badge> : null}
                <Badge variant="outline">{dictionary.cacheBadge}</Badge>
                {analyzedAt ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("tr", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(analyzedAt))}
                  </span>
                ) : null}
              </div>
              <p className="leading-7 text-muted-foreground">
                {analysis.turkishSummary}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <BulletList
                title={dictionary.painDrivers}
                items={analysis.painDrivers}
              />
              <BulletList
                title={dictionary.solutionIdeas}
                items={analysis.solutionIdeas}
              />
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-2">
              <BulletList title={dictionary.mvpSteps} items={analysis.mvpSteps} />
              <BulletList title={dictionary.risks} items={analysis.risks} />
            </div>
          </div>
        ) : !error ? (
          <div className="rounded-md border border-dashed bg-background/35 p-4 text-base leading-7 text-muted-foreground">
            {dictionary.empty}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
