import { NextResponse } from "next/server";
import { getLiveProblems } from "@/lib/ingestion";

export async function GET() {
  const problems = (await getLiveProblems())
    .slice()
    .sort((a, b) => b.painScore - a.painScore)
    .slice(0, 5)
    .map((problem) => ({
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      summary: problem.summary,
      painScore: problem.painScore,
      sourceCount: problem.sourceCount,
      sourcePlatforms: problem.sourcePlatforms,
      validationCount: problem.validationCount,
    }));

  return NextResponse.json({
    report: {
      cadence: "weekly",
      problemCount: problems.length,
      problems,
    },
  });
}
