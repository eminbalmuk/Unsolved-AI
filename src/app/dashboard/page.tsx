import Link from "next/link";
import { Bell, BookmarkCheck, CheckCircle2, Download, LockKeyhole } from "lucide-react";
import { AccountSettingsPanel } from "@/components/account-settings-panel";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { translateStatus } from "@/lib/i18n-labels";
import { getLiveProblems } from "@/lib/ingestion";

export default async function DashboardPage() {
  const [user, liveProblems, dictionary] = await Promise.all([
    getCurrentUser(),
    getLiveProblems(),
    getDictionary(),
  ]);
  const authConfigured = isAuthConfigured();
  const saved = liveProblems.slice(0, 4);
  const totalValidators = saved.reduce(
    (sum, problem) => sum + problem.validationCount,
    0,
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {authConfigured && !user ? (
          <Card className="bg-card/82">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="size-5 text-primary" aria-hidden />
                {dictionary.dashboard.signInTitle}
              </CardTitle>
              <CardDescription className="text-base">
                {dictionary.dashboard.signInDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login">{dictionary.common.signIn}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!authConfigured ? (
          <Card className="border-amber-300/30 bg-amber-400/10">
            <CardHeader>
              <CardTitle>{dictionary.dashboard.authEnvironmentTitle}</CardTitle>
              <CardDescription className="text-base">
                {dictionary.dashboard.authEnvironmentDescription}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {dictionary.dashboard.workspaceEyebrow}
            </p>
            <h1 className="mt-2 text-4xl font-semibold">
              {user?.name
                ? `${dictionary.dashboard.titleNamedPrefix} ${user.name} ${dictionary.dashboard.titleNamedSuffix}`
                : dictionary.dashboard.titleAnonymous}
            </h1>
          </div>
          <Button>
            <Download className="size-4" aria-hidden />
            {dictionary.dashboard.exportCsv}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={BookmarkCheck}
            label={dictionary.dashboard.savedProblems}
            value={String(saved.length)}
            hint={dictionary.dashboard.thisWorkspace}
          />
          <MetricCard
            icon={CheckCircle2}
            label={dictionary.dashboard.validatorPool}
            value={String(totalValidators)}
            hint={dictionary.dashboard.acrossSavedMarkets}
          />
          <MetricCard
            icon={Bell}
            label={dictionary.dashboard.alerts}
            value="7"
            hint={dictionary.dashboard.newEvidenceThisWeek}
          />
        </div>

        {user ? (
          <AccountSettingsPanel user={user} dictionary={dictionary.account} />
        ) : null}

        <Card className="bg-card/82">
          <CardHeader>
            <CardTitle>{dictionary.dashboard.watchlistTitle}</CardTitle>
            <CardDescription>
              {dictionary.dashboard.watchlistDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.dashboard.tableProblem}</TableHead>
                  <TableHead>{dictionary.dashboard.tableScore}</TableHead>
                  <TableHead>{dictionary.dashboard.tableStatus}</TableHead>
                  <TableHead className="text-right">
                    {dictionary.dashboard.tableValidators}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saved.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell>
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="font-medium hover:text-primary"
                      >
                        {problem.title}
                      </Link>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {problem.tags.join(" / ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ScoreBadge
                        score={problem.painScore}
                        label={dictionary.common.scorePrefix}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {translateStatus(problem.status, dictionary.common)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {problem.validationCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
