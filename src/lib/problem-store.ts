import { getPrisma } from "@/lib/prisma";
import { getDatabaseUrl } from "@/lib/env";
import type { Problem, ProblemAnalysis, ProblemSource } from "@/lib/types";

type StoredProblem = {
  id: string;
  slug: string;
  title: string;
  sector: string;
  category: string;
  status: string;
  summary: string;
  aiSummary: string;
  painScore: number;
  frequency: number;
  emotionalScore: number;
  willingnessPay: number;
  validationCount: number;
  lastSeenAt: Date;
  sourceCount: number;
  sourcePlatforms: string[];
  trend: unknown;
  competitors: unknown;
  opportunity: string;
  tags: string[];
  sources: {
    id: string;
    platform: string;
    author: string;
    excerpt: string;
    url: string;
    capturedAt: Date;
  }[];
};

type StoredAnalysis = {
  turkishSummary: string;
  painDrivers: string[];
  solutionIdeas: string[];
  mvpSteps: string[];
  risks: string[];
  model: string;
  createdAt: Date;
};

function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function toDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toProblem(record: StoredProblem): Problem {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    sector: record.sector as Problem["sector"],
    category: record.category as Problem["category"],
    status: record.status as Problem["status"],
    summary: record.summary,
    aiSummary: record.aiSummary,
    painScore: record.painScore,
    scoreBreakdown: {
      frequency: record.frequency,
      emotionalIntensity: record.emotionalScore,
      willingnessToPay: record.willingnessPay,
    },
    validationCount: record.validationCount,
    lastSeenAt: record.lastSeenAt.toISOString(),
    sourceCount: record.sourceCount,
    sourcePlatforms: record.sourcePlatforms as Problem["sourcePlatforms"],
    trend: record.trend as Problem["trend"],
    sources: record.sources.map((source): ProblemSource => ({
      id: source.id,
      platform: source.platform as ProblemSource["platform"],
      author: source.author,
      excerpt: source.excerpt,
      url: source.url,
      capturedAt: source.capturedAt.toISOString(),
    })),
    competitors: record.competitors as Problem["competitors"],
    opportunity: record.opportunity,
    tags: record.tags,
  };
}

function problemPayload(problem: Problem) {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    sector: problem.sector,
    category: problem.category,
    status: problem.status,
    summary: problem.summary,
    aiSummary: problem.aiSummary,
    painScore: problem.painScore,
    frequency: Math.round(problem.scoreBreakdown.frequency),
    emotionalScore: Math.round(problem.scoreBreakdown.emotionalIntensity),
    willingnessPay: Math.round(problem.scoreBreakdown.willingnessToPay),
    validationCount: problem.validationCount,
    lastSeenAt: toDate(problem.lastSeenAt),
    sourceCount: problem.sourceCount,
    sourcePlatforms: problem.sourcePlatforms,
    trend: problem.trend,
    competitors: problem.competitors,
    opportunity: problem.opportunity,
    tags: problem.tags,
    refreshedAt: new Date(),
  };
}

export async function getStoredProblems() {
  if (!hasDatabase()) return null;

  try {
    const records = await getPrisma().problemRecord.findMany({
      include: { sources: true },
      orderBy: [{ lastSeenAt: "desc" }, { painScore: "desc" }],
      take: 120,
    });

    return records.map((record) => toProblem(record));
  } catch {
    return null;
  }
}

export async function getStoredProblemBySlug(slugOrId: string) {
  if (!hasDatabase()) return null;

  try {
    const record = await getPrisma().problemRecord.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: { sources: true },
    });

    return record ? toProblem(record) : null;
  } catch {
    return null;
  }
}

export async function upsertStoredProblem(problem: Problem) {
  if (!hasDatabase()) return;

  const prisma = getPrisma();
  const payload = problemPayload(problem);

  await prisma.problemRecord.upsert({
    where: { id: problem.id },
    update: payload,
    create: {
      ...payload,
      firstSeenAt: toDate(problem.lastSeenAt),
    },
  });

  await prisma.problemSourceRecord.deleteMany({
    where: { problemId: problem.id },
  });

  if (problem.sources.length > 0) {
    await prisma.problemSourceRecord.createMany({
      data: problem.sources.map((source) => ({
        id: source.id,
        problemId: problem.id,
        platform: source.platform,
        author: source.author,
        excerpt: source.excerpt,
        url: source.url,
        capturedAt: toDate(source.capturedAt),
      })),
      skipDuplicates: true,
    });
  }
}

export async function upsertStoredProblems(problems: Problem[]) {
  if (!hasDatabase()) return;

  for (const problem of problems) {
    await upsertStoredProblem(problem);
  }
}

export function toProblemAnalysis(record: StoredAnalysis): ProblemAnalysis {
  return {
    turkishSummary: record.turkishSummary,
    painDrivers: record.painDrivers,
    solutionIdeas: record.solutionIdeas,
    mvpSteps: record.mvpSteps,
    risks: record.risks,
  };
}

export async function getStoredAnalysis(slugOrId: string) {
  if (!hasDatabase()) return null;

  try {
    const record = await getPrisma().problemRecord.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: { analysis: true },
    });

    if (!record?.analysis) return null;

    return {
      problemId: record.id,
      analysis: toProblemAnalysis(record.analysis),
      model: record.analysis.model,
      analyzedAt: record.analysis.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveStoredAnalysis(
  problem: Problem,
  analysis: ProblemAnalysis,
  model: string,
) {
  if (!hasDatabase()) return null;

  await upsertStoredProblem(problem);

  const record = await getPrisma().problemAnalysisRecord.upsert({
    where: { problemId: problem.id },
    update: {
      turkishSummary: analysis.turkishSummary,
      painDrivers: analysis.painDrivers,
      solutionIdeas: analysis.solutionIdeas,
      mvpSteps: analysis.mvpSteps,
      risks: analysis.risks,
      model,
    },
    create: {
      problemId: problem.id,
      turkishSummary: analysis.turkishSummary,
      painDrivers: analysis.painDrivers,
      solutionIdeas: analysis.solutionIdeas,
      mvpSteps: analysis.mvpSteps,
      risks: analysis.risks,
      model,
    },
  });

  return {
    problemId: problem.id,
    analysis: toProblemAnalysis(record),
    model: record.model,
    analyzedAt: record.createdAt.toISOString(),
  };
}
