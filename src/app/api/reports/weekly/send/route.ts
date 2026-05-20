import { NextResponse } from "next/server";
import { sendWeeklyProblemReport } from "@/lib/weekly-report-email";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured." },
        { status: 503 },
      );
    }

    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await sendWeeklyProblemReport({ onlySubscribers: true });
    return NextResponse.json({
      id: result.id,
      recipients: result.recipients,
      problemCount: result.problemCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Weekly report email could not be sent.",
      },
      { status: 503 },
    );
  }
}
