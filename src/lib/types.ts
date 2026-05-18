export type SourcePlatform =
  | "Reddit"
  | "HackerNews"
  | "App Store"
  | "Google Play"
  | "X"
  | "Forum";

export type ProblemCategory =
  | "Feature Request"
  | "Bug"
  | "Experience Gap"
  | "Off-Topic";

export type ProblemStatus = "rising" | "validated" | "saturated";

export type PainScoreBreakdown = {
  frequency: number;
  emotionalIntensity: number;
  willingnessToPay: number;
};

export type ProblemSource = {
  id: string;
  platform: SourcePlatform;
  author: string;
  excerpt: string;
  url: string;
  capturedAt: string;
};

export type CompetitorGap = {
  tool: string;
  gap: string;
  complaintTheme: string;
};

export type Problem = {
  id: string;
  slug: string;
  title: string;
  sector: "SaaS" | "Mobile Apps" | "Developer Tools" | "Operations";
  category: ProblemCategory;
  status: ProblemStatus;
  summary: string;
  aiSummary: string;
  painScore: number;
  scoreBreakdown: PainScoreBreakdown;
  validationCount: number;
  lastSeenAt: string;
  sourceCount: number;
  sourcePlatforms: SourcePlatform[];
  trend: { label: string; score: number; mentions: number }[];
  sources: ProblemSource[];
  competitors: CompetitorGap[];
  opportunity: string;
  tags: string[];
};

export type ValidationState = {
  problemId: string;
  userHasValidated: boolean;
  validationCount: number;
  threshold: number;
};

export type ProblemAnalysis = {
  turkishSummary: string;
  painDrivers: string[];
  solutionIdeas: string[];
  mvpSteps: string[];
  risks: string[];
};

export type WeeklyReport = {
  company: string;
  sector: string;
  generatedAt: string;
  topProblems: Pick<Problem, "id" | "title" | "painScore" | "validationCount">[];
  trendDelta: { label: string; value: number }[];
  competitorSignals: { competitor: string; signal: string; mentions: number }[];
};

export type PipelineStatus = {
  name: string;
  status: "healthy" | "warning" | "paused";
  successRate: number;
  lastRunAt: string;
  latency: string;
};
