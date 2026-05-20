import { getLiveProblems } from "@/lib/ingestion";
import { analyzeProblem, type ProblemAnalysisResult } from "@/lib/problem-analysis";
import { getPrisma } from "@/lib/prisma";

type BrevoResponse = {
  messageId?: string;
  code?: string;
  message?: string;
};

type SendWeeklyReportOptions = {
  to?: string;
  onlySubscribers?: boolean;
};

function parseSender(value?: string) {
  const fallback = {
    email: "abfb39001@smtp-brevo.com",
    name: "Unsolved AI",
  };

  if (!value) return fallback;

  const match = value.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1]?.trim() || fallback.name,
      email: match[2]?.trim() || fallback.email,
    };
  }

  return {
    email: value.trim(),
    name: fallback.name,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getReportRecipients(explicitRecipient?: string) {
  const recipients = (explicitRecipient ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  return [...new Set(recipients)];
}

async function getSubscribedRecipients() {
  const users = await getPrisma().user.findMany({
    where: {
      emailService: "ENABLED",
    },
    select: {
      email: true,
    },
  });

  return users.map((user) => user.email).filter(Boolean);
}

export async function getWeeklyReportProblems() {
  return (await getLiveProblems())
    .slice()
    .sort((a, b) => b.painScore - a.painScore)
    .slice(0, 5);
}

export function renderWeeklyReportHtml(items: ProblemAnalysisResult[]) {
  const problemBlocks = items
    .map((item, index) => {
      const firstSolution =
        item.analysis.solutionIdeas[0] ??
        "Dar kapsamlı bir MVP ile problemi doğrula.";
      const secondSolution = item.analysis.solutionIdeas[1];

      return `
        <section style="padding: 18px 0; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 6px; color: #0ea5a4; font-size: 13px; font-weight: 700;">
            ${index + 1}. Problem skoru: ${item.problem.painScore}
          </p>
          <h2 style="font-size: 20px; margin: 0 0 8px;">${escapeHtml(item.problem.title)}</h2>
          <p style="margin: 0 0 12px; color: #475569;">${escapeHtml(item.analysis.turkishSummary)}</p>
          <p style="margin: 0; color: #0f172a;"><strong>Çözüm özeti:</strong> ${escapeHtml(firstSolution)}</p>
          ${
            secondSolution
              ? `<p style="margin: 6px 0 0; color: #0f172a;">${escapeHtml(secondSolution)}</p>`
              : ""
          }
        </section>
      `;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 720px;">
      <p style="font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #0ea5a4;">
        Unsolved AI weekly digest
      </p>
      <h1 style="font-size: 30px; margin: 0 0 12px;">Bu haftanın en güçlü 5 problem sinyali</h1>
      <p style="margin: 0 0 22px; color: #475569;">
        Aşağıdaki özetler canlı kaynak sinyallerinden seçildi ve Türkçe analiz modeliyle kısa çözüm önerilerine dönüştürüldü.
      </p>
      ${problemBlocks}
      <p style="margin-top: 28px; color: #64748b; font-size: 13px;">
        Bu e-posta Unsolved AI haftalık problem özeti akışı üzerinden gönderildi.
      </p>
    </div>
  `;
}

export async function sendWeeklyProblemReport({
  to,
  onlySubscribers = false,
}: SendWeeklyReportOptions = {}) {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = parseSender(process.env.REPORTS_FROM_EMAIL);
  const recipients = onlySubscribers
    ? await getSubscribedRecipients()
    : getReportRecipients(to);

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  if (!process.env.BYTEPLUS_ARK_API_KEY) {
    throw new Error("BYTEPLUS_ARK_API_KEY is required to generate weekly analysis.");
  }

  if (recipients.length === 0) {
    throw new Error(
      onlySubscribers
        ? "No users are subscribed to the weekly email service."
        : "A report recipient is required.",
    );
  }

  const problems = await getWeeklyReportProblems();

  if (problems.length === 0) {
    throw new Error("No problems are available for the weekly report.");
  }

  const analyzedProblems = await Promise.all(
    problems.map((problem) => analyzeProblem(problem)),
  );

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: recipients.map((email) => ({ email })),
      subject: "Unsolved AI - Haftalık 5 problem özeti",
      htmlContent: renderWeeklyReportHtml(analyzedProblems),
    }),
  });
  const data = (await response.json().catch(() => ({}))) as BrevoResponse;

  if (!response.ok) {
    throw new Error(
      data.message ??
        data.code ??
        "Brevo could not send the weekly report email.",
    );
  }

  return {
    id: data.messageId,
    recipients,
    problemCount: analyzedProblems.length,
  };
}
