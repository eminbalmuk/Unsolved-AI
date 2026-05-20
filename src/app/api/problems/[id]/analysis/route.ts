import { NextResponse } from "next/server";
import { analyzeProblemBySlugOrId } from "@/lib/problem-analysis";
import { getStoredAnalysis } from "@/lib/problem-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const result = await analyzeProblemBySlugOrId(id);

    if (!result) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    return NextResponse.json({
      problemId: result.problem.id,
      analysis: result.analysis,
      analyzedAt: result.analyzedAt,
      model: result.model,
      cached: result.cached,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Turkish analysis could not be completed.";
    const status = message.includes("BYTEPLUS_ARK_API_KEY") ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const cachedAnalysis = await getStoredAnalysis(id);

    if (!cachedAnalysis) {
      return NextResponse.json({ analysis: null }, { status: 404 });
    }

    return NextResponse.json({
      problemId: cachedAnalysis.problemId,
      analysis: cachedAnalysis.analysis,
      analyzedAt: cachedAnalysis.analyzedAt,
      model: cachedAnalysis.model,
      cached: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Turkish analysis could not be completed.",
      },
      { status: 500 },
    );
  }
}
