import { AlertTriangle, Bot, Database, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDictionary } from "@/lib/i18n-server";
import { translateStatus } from "@/lib/i18n-labels";
import { pipelineStatuses, problems } from "@/lib/data";

export default async function AdminPage() {
  const dictionary = await getDictionary();
  const weights = [
    { label: dictionary.admin.weights.frequency, value: 35 },
    { label: dictionary.admin.weights.emotionalIntensity, value: 45 },
    { label: dictionary.admin.weights.willingnessToPay, value: 20 },
  ];
  const warningCount = pipelineStatuses.filter(
    (status) => status.status !== "healthy",
  ).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm text-muted-foreground">{dictionary.admin.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-semibold">
            {dictionary.admin.title}
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={Database}
            label={dictionary.admin.rawSignals}
            value="644"
            hint={dictionary.admin.rawSignalsHint}
          />
          <MetricCard
            icon={Bot}
            label={dictionary.admin.llmClusters}
            value={String(problems.length)}
            hint={dictionary.admin.llmClustersHint}
          />
          <MetricCard
            icon={AlertTriangle}
            label={dictionary.admin.warnings}
            value={String(warningCount)}
            hint={dictionary.admin.warningsHint}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="bg-card/82">
            <CardHeader>
              <CardTitle>{dictionary.admin.serviceStatus}</CardTitle>
              <CardDescription>
                {dictionary.admin.serviceDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dictionary.admin.service}</TableHead>
                    <TableHead>{dictionary.admin.status}</TableHead>
                    <TableHead>{dictionary.admin.success}</TableHead>
                    <TableHead>{dictionary.admin.latency}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pipelineStatuses.map((status) => (
                    <TableRow key={status.name}>
                      <TableCell className="font-medium">{status.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status.status === "healthy" ? "secondary" : "outline"
                          }
                        >
                          {translateStatus(status.status, dictionary.common)}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-36">
                        <div className="flex items-center gap-3">
                          <Progress value={status.successRate} />
                          <span className="font-mono text-xs">
                            {status.successRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {status.latency}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-card/82">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="size-5 text-primary" aria-hidden />
                {dictionary.admin.weightsTitle}
              </CardTitle>
              <CardDescription>
                {dictionary.admin.weightsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {weights.map((weight) => (
                <div key={weight.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{weight.label}</span>
                    <span className="font-mono">{weight.value}%</span>
                  </div>
                  <Progress value={weight.value} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
