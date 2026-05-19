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
import { getLiveProblems } from "@/lib/ingestion";

export default async function DashboardPage() {
  const [user, liveProblems] = await Promise.all([
    getCurrentUser(),
    getLiveProblems(),
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
                Sign in to use your founder workspace
              </CardTitle>
              <CardDescription className="text-base">
                Saved problems and validations are stored in Supabase through
                Prisma once you are signed in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!authConfigured ? (
          <Card className="border-amber-300/30 bg-amber-400/10">
            <CardHeader>
              <CardTitle>Auth environment is not configured yet</CardTitle>
              <CardDescription className="text-base">
                Fill `DATABASE_URL` and `AUTH_SECRET` in `.env`, then run
                `npm run db:push` to persist accounts in Supabase.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Founder workspace</p>
            <h1 className="mt-2 text-4xl font-semibold">
              Track the markets {user?.name ? `${user.name} may enter` : "you may enter"}
            </h1>
          </div>
          <Button>
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={BookmarkCheck}
            label="Saved problems"
            value={String(saved.length)}
            hint="This workspace"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Validator pool"
            value={String(totalValidators)}
            hint="Across saved markets"
          />
          <MetricCard
            icon={Bell}
            label="Alerts"
            value="7"
            hint="New evidence this week"
          />
        </div>

        {user ? <AccountSettingsPanel user={user} /> : null}

        <Card className="bg-card/82">
          <CardHeader>
            <CardTitle>Validated problem watchlist</CardTitle>
            <CardDescription>
              Seed data mirrors the future authenticated founder dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Validators</TableHead>
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
                      <ScoreBadge score={problem.painScore} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{problem.status}</Badge>
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
