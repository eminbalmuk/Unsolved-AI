import { AppShell } from "@/components/app-shell";
import { LandingPage } from "@/components/landing-page";
import { getDictionary } from "@/lib/i18n-server";
import { getLiveProblems } from "@/lib/ingestion";

export const revalidate = 900;

export default async function Home() {
  const [problems, dictionary] = await Promise.all([
    getLiveProblems(),
    getDictionary(),
  ]);
  const liveSignals = problems.reduce(
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
  const risingPainScore =
    problems.length > 0
      ? Math.max(...problems.map((problem) => problem.painScore))
      : 0;
  const marketLanes = new Set(problems.map((problem) => problem.sector)).size;

  return (
    <AppShell>
      <LandingPage
        dictionary={dictionary.landing}
        stats={{
          liveSignals,
          marketLanes,
          averagePainScore,
          risingPainScore,
        }}
      />
    </AppShell>
  );
}
