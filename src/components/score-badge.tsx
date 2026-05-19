import { Badge } from "@/components/ui/badge";
import { scoreTone } from "@/lib/scoring";

export function ScoreBadge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const className =
    tone === "critical"
      ? "border-red-500/35 bg-red-500/12 text-red-700 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-100"
      : tone === "high"
        ? "border-amber-500/35 bg-amber-400/14 text-amber-800 dark:border-amber-300/40 dark:bg-amber-400/15 dark:text-amber-100"
        : tone === "warm"
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={className}>
      Pain {score}
    </Badge>
  );
}
