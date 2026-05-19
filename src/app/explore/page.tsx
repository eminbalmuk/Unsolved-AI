import Image from "next/image";
import { Activity, DatabaseZap, Radar, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DiscoveryFeed } from "@/components/discovery-feed";
import { MetricCard } from "@/components/metric-card";
import { getDictionary } from "@/lib/i18n-server";
import { getHotLiveProblem, getLiveProblems } from "@/lib/ingestion";

export const revalidate = 900;

export default async function ExplorePage() {
  const [problems, hotProblem] = await Promise.all([
    getLiveProblems(),
    getHotLiveProblem(),
  ]);
  const dictionary = await getDictionary();
  const signalCount = problems.reduce(
    (total, problem) => total + problem.sourceCount,
    0,
  );
  const averagePainScore =
    problems.length > 0
      ? Math.round(
          problems.reduce((total, problem) => total + problem.painScore, 0) /
            problems.length,
        )
      : 0;

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-problem-radar.webp"
            alt="Abstract problem signal radar"
            fill
            priority
            className="object-cover opacity-65"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklch,var(--background)_82%,transparent)_42%,color-mix(in_oklch,var(--background)_44%,transparent)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--background)_0%,transparent_40%)]" />
        </div>

        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="max-w-3xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-base text-muted-foreground backdrop-blur">
              <Sparkles className="size-4 text-primary" aria-hidden />
              {dictionary.explore.liveRefresh}
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-6xl font-semibold leading-[1.02] md:text-8xl">
                {dictionary.explore.headline}
              </h1>
              <p className="max-w-3xl text-2xl leading-10 text-muted-foreground">
                {dictionary.explore.subhead}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                icon={Radar}
                label={dictionary.explore.hotProblems}
                value={String(problems.length)}
                hint={dictionary.explore.liveSources}
              />
              <MetricCard
                icon={DatabaseZap}
                label={dictionary.explore.signals}
                value={signalCount.toLocaleString("en")}
                hint={dictionary.explore.publicSignals}
              />
              <MetricCard
                icon={Activity}
                label={dictionary.explore.averagePain}
                value={String(averagePainScore)}
                hint={dictionary.explore.weightedScore}
              />
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative overflow-hidden rounded-lg border bg-card/70 p-4 backdrop-blur surface-glow">
              <Image
                src="/images/explora-kanban-board.webp"
                alt="Abstract Explora kanban board"
                width={760}
                height={520}
                className="aspect-[4/3] rounded-md object-cover"
                priority
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-md border bg-background/82 p-4 backdrop-blur">
                <p className="text-base font-medium">
                  {dictionary.explore.liveOpportunity}
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                  {hotProblem.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DiscoveryFeed problems={problems} dictionary={dictionary.discovery} />
    </AppShell>
  );
}
