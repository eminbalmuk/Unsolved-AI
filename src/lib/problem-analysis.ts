import { getLiveProblemBySlug } from "@/lib/ingestion";
import { getStoredAnalysis, saveStoredAnalysis } from "@/lib/problem-store";
import type { Problem, ProblemAnalysis } from "@/lib/types";

type BytePlusChatResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message?: string;
  };
};

export type ProblemAnalysisResult = {
  problem: Problem;
  analysis: ProblemAnalysis;
  analyzedAt: string;
  model: string;
  cached: boolean;
};

const DEFAULT_ENDPOINT =
  "https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions";
const DEFAULT_MODEL = "deepseek-v3-2-251201";

function compact(value: string, maxLength: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildProblemContext(problem: Problem) {
  const sourceEvidence = problem.sources
    .slice(0, 4)
    .map(
      (source, index) =>
        `${index + 1}. ${source.platform}: ${compact(source.excerpt, 320)}`,
    )
    .join("\n");

  const competitorGaps = problem.competitors
    .slice(0, 4)
    .map(
      (competitor, index) =>
        `${index + 1}. ${competitor.tool}: ${compact(competitor.gap, 180)}`,
    )
    .join("\n");

  return `
Problem başlığı: ${compact(problem.title, 160)}
Sektör: ${problem.sector}
Kategori: ${problem.category}
Pain Score: ${problem.painScore}
Skor kırılımı: frequency=${problem.scoreBreakdown.frequency}, emotionalIntensity=${problem.scoreBreakdown.emotionalIntensity}, willingnessToPay=${problem.scoreBreakdown.willingnessToPay}
Kısa açıklama: ${compact(problem.summary, 360)}
Mevcut heuristic analiz: ${compact(problem.aiSummary, 360)}
Kaynak kanıtları:
${sourceEvidence || "Kaynak kanıtı yok."}
Rakip/boşluk sinyalleri:
${competitorGaps || "Rakip boşluğu yok."}
Etiketler: ${problem.tags.join(", ")}
`.trim();
}

function extractJson(content: string): ProblemAnalysis {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON.");
  }

  const parsed = JSON.parse(trimmed.slice(start, end + 1)) as Partial<ProblemAnalysis>;

  return {
    turkishSummary: String(parsed.turkishSummary ?? "").trim(),
    painDrivers: Array.isArray(parsed.painDrivers)
      ? parsed.painDrivers.map(String).slice(0, 4)
      : [],
    solutionIdeas: Array.isArray(parsed.solutionIdeas)
      ? parsed.solutionIdeas.map(String).slice(0, 5)
      : [],
    mvpSteps: Array.isArray(parsed.mvpSteps)
      ? parsed.mvpSteps.map(String).slice(0, 4)
      : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String).slice(0, 4) : [],
  };
}

export async function analyzeProblem(problem: Problem): Promise<ProblemAnalysisResult> {
  const cachedAnalysis = await getStoredAnalysis(problem.id);
  if (cachedAnalysis) {
    return {
      problem,
      analysis: cachedAnalysis.analysis,
      analyzedAt: cachedAnalysis.analyzedAt,
      model: cachedAnalysis.model,
      cached: true,
    };
  }

  const apiKey = process.env.BYTEPLUS_ARK_API_KEY;

  if (!apiKey) {
    throw new Error(
      "BYTEPLUS_ARK_API_KEY is not configured. Add it to .env to run Turkish analysis.",
    );
  }

  const endpoint = process.env.BYTEPLUS_ARK_API_URL ?? DEFAULT_ENDPOINT;
  const model = process.env.BYTEPLUS_ARK_MODEL ?? DEFAULT_MODEL;

  const systemPrompt = [
    "Sen kıdemli bir SaaS pazar analistisin.",
    "Türkçe yaz. Kısa, uygulanabilir ve kanıta bağlı ol.",
    "Çıktı tokenını düşük tut: tekrar yok, süs yok, markdown yok.",
    'Yalnızca şu minified JSON şemasını döndür: {"turkishSummary":"<=70 kelime","painDrivers":["max4, kısa"],"solutionIdeas":["max5, kısa"],"mvpSteps":["max4, kısa"],"risks":["max4, kısa"]}',
  ].join(" ");

  const userPrompt = [
    "Aşağıdaki forum/kaynak sinyallerini analiz et.",
    "Önce problemi Türkçe özetle.",
    "Sonra bu problem için uygulanabilir çözüm yöntemi önerileri üret.",
    "Öneriler SaaS MVP mantığında dar, test edilebilir ve teknik olarak yapılabilir olsun.",
    "Bağlam:",
    buildProblemContext(problem),
  ].join("\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 520,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as BytePlusChatResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ?? `Analysis provider returned HTTP ${response.status}.`,
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Analysis provider returned an empty response.");
  }

  const analysis = extractJson(content);
  const savedAnalysis = await saveStoredAnalysis(problem, analysis, model);

  return {
    problem,
    analysis: savedAnalysis?.analysis ?? analysis,
    analyzedAt: savedAnalysis?.analyzedAt ?? new Date().toISOString(),
    model,
    cached: false,
  };
}

export async function analyzeProblemBySlugOrId(id: string) {
  const cachedAnalysis = await getStoredAnalysis(id);
  const problem = await getLiveProblemBySlug(id);

  if (!problem) {
    return null;
  }

  if (cachedAnalysis) {
    return {
      problem,
      analysis: cachedAnalysis.analysis,
      analyzedAt: cachedAnalysis.analyzedAt,
      model: cachedAnalysis.model,
      cached: true,
    };
  }

  return analyzeProblem(problem);
}
