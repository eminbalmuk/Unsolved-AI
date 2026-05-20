import Link from "next/link";
import { Building2, FileText, KeyRound, LockKeyhole, MailCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ReportBarChart } from "@/components/charts";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { weeklyReport } from "@/lib/data";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";

export default async function ReportsPage() {
  const [user, dictionary] = await Promise.all([
    getCurrentUser(),
    getDictionary(),
  ]);
  const authConfigured = isAuthConfigured();

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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">{dictionary.reports.company}</Label>
                <Input id="company" defaultValue={weeklyReport.company} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">{dictionary.reports.sector}</Label>
                <Input id="sector" defaultValue={weeklyReport.sector} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitors">{dictionary.reports.competitors}</Label>
                <Textarea
                  id="competitors"
                  defaultValue="Intercom, Stripe Billing, Amplitude"
                />
              </div>
              <ReportEmailTestButton dictionary={dictionary.reports} />
            </CardContent>
          </Card>

          <MetricCard
            icon={KeyRound}
            label={dictionary.reports.apiAccess}
            value={dictionary.reports.ready}
            hint={dictionary.reports.enterpriseStub}
          />
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
              {dictionary.reports.marketSignalsFor} {weeklyReport.company}
            </h1>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={Building2}
              label={dictionary.reports.trackedSector}
              value="B2B"
              hint={dictionary.reports.saasOnlyMvp}
            />
            <MetricCard
              icon={FileText}
              label={dictionary.reports.topProblems}
              value="5"
              hint={dictionary.reports.includedInPdf}
            />
            <MetricCard
              icon={MailCheck}
              label={dictionary.reports.delivery}
              value="09:00"
              hint={dictionary.reports.everyMonday}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <Card className="bg-card/82">
              <CardHeader>
                <CardTitle>{dictionary.reports.trendTitle}</CardTitle>
                <CardDescription>
                  {dictionary.reports.trendDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportBarChart data={weeklyReport.trendDelta} />
              </CardContent>
            </Card>

            <Card className="bg-card/82">
              <CardHeader>
                <CardTitle>{dictionary.reports.competitorSummary}</CardTitle>
                <CardDescription>
                  {dictionary.reports.competitorDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {weeklyReport.competitorSignals.map((signal) => (
                  <div key={signal.competitor} className="rounded-md border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{signal.competitor}</span>
                      <Badge variant="outline">{signal.mentions}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {signal.signal}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/82">
            <CardHeader>
              <CardTitle>{dictionary.reports.highestScored}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {weeklyReport.topProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{problem.title}</span>
                  <div className="flex items-center gap-3">
                    <ScoreBadge
                      score={problem.painScore}
                      label={dictionary.common.scorePrefix}
                    />
                    <span className="font-mono text-sm text-muted-foreground">
                      {problem.validationCount} {dictionary.common.validators}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
