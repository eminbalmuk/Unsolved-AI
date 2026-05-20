import { NextResponse } from "next/server";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { weeklyReport } from "@/lib/data";

type ResendResponse = {
  id?: string;
  name?: string;
  message?: string;
  error?: string;
};

function renderReportHtml() {
  const topProblems = weeklyReport.topProblems
    .map(
      (problem) => `
        <li style="margin: 0 0 12px;">
          <strong>${problem.title}</strong>
          <span style="color:#64748b;"> - Pain ${problem.painScore}, ${problem.validationCount} validators</span>
        </li>
      `,
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 680px;">
      <p style="font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #0ea5a4;">
        Unsolved weekly report preview
      </p>
      <h1 style="font-size: 28px; margin: 0 0 12px;">Market signals for ${weeklyReport.company}</h1>
      <p style="margin: 0 0 20px; color: #475569;">
        This is a test report sent through Resend's sandbox sender.
      </p>
      <h2 style="font-size: 18px; margin: 24px 0 10px;">Highest scored problems</h2>
      <ul style="padding-left: 20px; margin: 0;">${topProblems}</ul>
      <p style="margin-top: 28px; color: #64748b; font-size: 13px;">
        When you add a verified domain, this same flow can send real scheduled reports to users.
      </p>
    </div>
  `;
}

export async function POST() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORTS_FROM_EMAIL ?? "Unsolved <onboarding@resend.dev>";
  const user = await getCurrentUser();

  const requiresSignedInUser =
    isAuthConfigured() && process.env.NODE_ENV === "production";

  if (requiresSignedInUser && !user) {
    return NextResponse.json(
      { error: "Please sign in before sending a report email." },
      { status: 401 },
    );
  }

  const to = process.env.REPORTS_TEST_EMAIL ?? user?.email;

  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured." },
      { status: 503 },
    );
  }

  if (!to) {
    return NextResponse.json(
      {
        error:
          "REPORTS_TEST_EMAIL is not configured. With onboarding@resend.dev, use the email address attached to your Resend account.",
      },
      { status: 503 },
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Unsolved weekly report preview - ${weeklyReport.company}`,
      html: renderReportHtml(),
    }),
  });
  const data = (await response.json().catch(() => ({}))) as ResendResponse;

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          data.message ??
          data.error ??
          "Resend could not send the test report email.",
      },
      { status: response.status },
    );
  }

  return NextResponse.json({ id: data.id, to });
}
