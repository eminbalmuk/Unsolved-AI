import Link from "next/link";
import { Clock3, FileText, LockKeyhole, MailCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { ReportEmailTestButton } from "@/components/report-email-test-button";
import { ScoreBadge } from "@/components/score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { getLiveProblems } from "@/lib/ingestion";

export default async function ReportsPage() {
  const [user, dictionary, problems] = await Promise.all([
    getCurrentUser(),
    getDictionary(),
    getLiveProblems(),
  ]);
  const authConfigured = isAuthConfigured();
  const weeklyProblems = problems
    .slice()
    .sort((a, b) => b.painScore - a.painScore)
    .slice(0, 5);
  const totalSources = weeklyProblems.reduce(
    (total, problem) => total + problem.sourceCount,
    0,
  );

  return (
    <AppShell>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <Card className="bg-card/82">
            <CardHeader>
              <CardTitle>{dictionary.reports.setupTitle}</CardTitle>
              <CardDescription>
                {dictionary.reports.setupDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportEmailTestButton
                dictionary={dictionary.reports}
                initialSubscribed={user?.emailService === "ENABLED"}
                disabled={!user}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <MetricCard
              icon={MailCheck}
              label={dictionary.reports.delivery}
              value="09:00"
              hint={dictionary.reports.everyMonday}
            />
            <MetricCard
              icon={FileText}
              label={dictionary.reports.topProblems}
              value={String(weeklyProblems.length)}
              hint={dictionary.reports.includedInEmail}
            />
            <MetricCard
              icon={Clock3}
              label={dictionary.reports.sourceSignals}
              value={String(totalSources)}
              hint={dictionary.reports.sourceSignalsHint}
            />
          </div>
        </aside>

        <section className="space-y-6">
          {authConfigured && !user ? (
            <Card className="bg-card/82">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LockKeyhole className="size-5 text-primary" aria-hidden />
                  {dictionary.reports.signInTitle}
                </CardTitle>
                <CardDescription className="text-base">
                  {dictionary.reports.signInDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/login">{dictionary.common.signIn}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div>
            <p className="text-sm text-muted-foreground">
              {dictionary.reports.previewEyebrow}
            </p>
            <h1 className="mt-2 text-4xl font-semibold">
              {dictionary.reports.weeklyDigestTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-muted-foreground">
              {dictionary.reports.weeklyDigestText}
            </p>
          </div>

          <Card className="bg-card/82">
            <CardHeader>
              <CardTitle>{dictionary.reports.highestScored}</CardTitle>
              <CardDescription>
                {dictionary.reports.highestScoredDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {weeklyProblems.map((problem, index) => (
                <Link
                  key={problem.id}
                  href={`/problems/${problem.slug}`}
                  className="block rounded-md border p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        {problem.sourcePlatforms.map((platform) => (
                          <Badge key={platform} variant="secondary">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      <h2 className="mt-3 text-xl font-semibold">
                        {problem.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-base leading-7 text-muted-foreground">
                        {problem.summary}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <ScoreBadge
                        score={problem.painScore}
                        label={dictionary.common.scorePrefix}
                      />
                      <span className="font-mono text-sm text-muted-foreground">
                        {problem.validationCount} {dictionary.common.validators}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
