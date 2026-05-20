import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendWeeklyProblemReport } from "@/lib/weekly-report-email";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in before sending a report email." },
      { status: 401 },
    );
  }

  if (user.emailService !== "ENABLED") {
    return NextResponse.json(
      { error: "Enable the weekly email service before sending a report." },
      { status: 403 },
    );
  }

  try {
    const result = await sendWeeklyProblemReport({
      to: user.email,
    });
    return NextResponse.json({
      id: result.id,
      to: result.recipients.join(", "),
      problemCount: result.problemCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Brevo could not send the weekly report email.",
      },
      { status: 503 },
    );
  }
}
