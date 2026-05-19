import type { PainScoreBreakdown } from "@/lib/types";

export function calculatePainScore({
  frequency,
  emotionalIntensity,
  willingnessToPay,
}: PainScoreBreakdown) {
  return Math.round(
    frequency * 0.35 + emotionalIntensity * 0.45 + willingnessToPay * 0.2,
  );
}

export function scoreTone(score: number) {
  if (score >= 60) return "critical";
  if (score >= 45) return "high";
  if (score >= 28) return "warm";
  return "watch";
}

export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
