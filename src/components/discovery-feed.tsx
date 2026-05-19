"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowUpDown,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Filter,
  Flame,
  Radio,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/score-badge";
import { TrendChart } from "@/components/charts";
import { formatDateLabel } from "@/lib/scoring";
import type { Problem, SourcePlatform } from "@/lib/types";

type SortMode = "pain" | "new" | "validated";
type TimeWindow = "today" | "3d" | "7d" | "30d" | "all";
type SourceFilter = "all" | SourcePlatform;

type BoardColumn = {
  id: string;
  title: string;
  description: string;
  accent: string;
  problems: Problem[];
};

type ProblemsResponse = {
  problems: Problem[];
  refreshedAt: string;
  refreshMode: "live" | "cached";
};

const timeWindowOptions: { value: TimeWindow; label: string }[] = [
  { value: "today", label: "Bugün" },
  { value: "3d", label: "Son 3 gün" },
  { value: "7d", label: "Son 1 hafta" },
  { value: "30d", label: "Son 1 ay" },
  { value: "all", label: "Tümü" },
];

const sourceFilterOptions: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "Tüm kaynaklar" },
  { value: "Reddit", label: "Sadece Reddit" },
  { value: "HackerNews", label: "Sadece HackerNews" },
  { value: "App Store", label: "Sadece App Store" },
];

function getWindowStart(window: TimeWindow) {
  const now = new Date();

  if (window === "all") return null;

  if (window === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }

  const days = window === "3d" ? 3 : window === "7d" ? 7 : 30;
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

function isInWindow(problem: Problem, window: TimeWindow) {
  const windowStart = getWindowStart(window);
  if (!windowStart) return true;

  const seenAt = new Date(problem.lastSeenAt).getTime();
  return Number.isFinite(seenAt) && seenAt >= windowStart;
}

function sortProblems(problems: Problem[], sort: SortMode) {
  return problems.slice().sort((a, b) => {
    if (sort === "new") {
      return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
    }

    if (sort === "validated") {
      return b.validationCount - a.validationCount;
    }

    return b.painScore - a.painScore;
  });
}

function buildColumns(problems: Problem[], sort: SortMode): BoardColumn[] {
  const newestCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;

  const columns: BoardColumn[] = [
    {
      id: "critical",
      title: "Critical pain",
      description: "High urgency signals with the strongest weighted pain.",
      accent: "bg-red-400",
      problems: problems.filter((problem) => problem.painScore >= 55),
    },
    {
      id: "rising",
      title: "Rising signals",
      description: "Problems gaining traction but still early enough to enter.",
      accent: "bg-primary",
      problems: problems.filter(
        (problem) => problem.painScore < 55 && problem.painScore >= 35,
      ),
    },
    {
      id: "watch",
      title: "Watchlist",
      description: "Lower-score signals worth scanning before they cluster.",
      accent: "bg-sky-300",
      problems: problems.filter((problem) => problem.painScore < 35),
    },
    {
      id: "fresh",
      title: "Fresh evidence",
      description: "Recent public posts and reviews from the last 7 days.",
      accent: "bg-amber-300",
      problems: problems.filter(
        (problem) => new Date(problem.lastSeenAt).getTime() >= newestCutoff,
      ),
    },
    {
      id: "validated",
      title: "Validated interest",
      description: "Cards with stronger social proof or validation count.",
      accent: "bg-emerald-300",
      problems: problems.filter((problem) => problem.validationCount >= 30),
    },
  ];

  return columns.map((column) => ({
    ...column,
    problems: sortProblems(column.problems, sort).slice(0, 12),
  }));
}

function FilterPanel({
  sort,
  onSortChange,
}: {
  sort: SortMode;
  onSortChange: (value: SortMode) => void;
}) {
  return (
    <Card className="bg-card/84">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ArrowUpDown className="size-5 text-primary" aria-hidden />
          Sort board
        </CardTitle>
        <CardDescription className="text-lg leading-7">
          Re-rank every column by the signal that matters right now.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {[
          ["pain", "Highest Pain Score"],
          ["new", "Newest evidence"],
          ["validated", "Most validated"],
        ].map(([value, label]) => (
          <Button
            key={value}
            variant={sort === value ? "default" : "secondary"}
            className="h-12 justify-start text-base"
            onClick={() => onSortChange(value as SortMode)}
          >
            {label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function TimeWindowPanel({
  window,
  onWindowChange,
}: {
  window: TimeWindow;
  onWindowChange: (value: TimeWindow) => void;
}) {
  return (
    <Card className="bg-card/84">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarDays className="size-5 text-primary" aria-hidden />
          Pain window
        </CardTitle>
        <CardDescription className="text-lg leading-7">
          En kritik problemi seçmek için kaynak tarih aralığını daralt.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {timeWindowOptions.map((option) => (
          <Button
            key={option.value}
            variant={window === option.value ? "default" : "secondary"}
            className="h-11 justify-start text-base"
            onClick={() => onWindowChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function SourceFilterPanel({
  source,
  onSourceChange,
}: {
  source: SourceFilter;
  onSourceChange: (value: SourceFilter) => void;
}) {
  return (
    <Card className="bg-card/84">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Radio className="size-5 text-primary" aria-hidden />
          Source
        </CardTitle>
        <CardDescription className="text-lg leading-7">
          Reddit, HackerNews veya App Store sinyallerini ayır.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {sourceFilterOptions.map((option) => (
          <Button
            key={option.value}
            variant={source === option.value ? "default" : "secondary"}
            className="h-11 justify-start text-base"
            onClick={() => onSourceChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function ScoreFilterPanel({
  minScore,
  onMinScoreChange,
}: {
  minScore: number;
  onMinScoreChange: (value: number) => void;
}) {
  return (
    <Card className="bg-card/84">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <SlidersHorizontal className="size-5 text-primary" aria-hidden />
          Score floor
        </CardTitle>
        <CardDescription className="text-lg leading-7">
          En düşük problem skorunu sen belirle.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">0</span>
          <span className="rounded-md bg-primary/12 px-3 py-1 font-mono text-xl font-semibold text-primary">
            {minScore}
          </span>
          <span className="text-sm text-muted-foreground">100</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={minScore}
          onChange={(event) => onMinScoreChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer accent-primary"
          aria-label="Minimum pain score"
        />
        <div className="grid grid-cols-4 gap-2">
          {[0, 30, 50, 70].map((value) => (
            <Button
              key={value}
              variant={minScore === value ? "default" : "secondary"}
              className="h-9 px-2 text-sm"
              onClick={() => onMinScoreChange(value)}
            >
              {value}+
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProblemCard({
  problem,
  index,
}: {
  problem: Problem;
  index: number;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{
        delay: Math.min(index * 0.035, 0.18),
        duration: 0.38,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group"
    >
      <Link href={`/problems/${problem.slug}`} className="block">
        <Card className="overflow-hidden bg-card/88 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-2xl group-hover:shadow-primary/10">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <ScoreBadge score={problem.painScore} />
                <Badge variant="secondary">{problem.category}</Badge>
              </div>
              <span className="rounded-md bg-primary/12 px-3 py-2 font-mono text-3xl font-semibold text-primary">
                {problem.painScore}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-semibold leading-tight">
                {problem.title}
              </h3>
              <p className="mt-3 line-clamp-4 text-lg leading-8 text-muted-foreground">
                {problem.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {problem.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid gap-2 text-base text-muted-foreground">
              <span className="flex items-center gap-2">
                <CalendarClock className="size-4" aria-hidden />
                {formatDateLabel(problem.lastSeenAt)}
              </span>
              <span className="flex items-center gap-2">
                <Users className="size-4" aria-hidden />
                {problem.validationCount} validators
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {problem.sourcePlatforms.map((platform) => (
                  <Badge key={platform} variant="secondary" className="text-xs">
                    {platform}
                  </Badge>
                ))}
              </span>
            </div>

            <div className="flex items-center justify-between border-t pt-4 text-base">
              <span className="text-muted-foreground">
                {problem.sourceCount} public signals
              </span>
              <span className="flex items-center gap-1 font-medium text-primary">
                Inspect
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.article>
  );
}

function BoardColumnCard({ column }: { column: BoardColumn }) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, x: 36 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-[86vw] snap-start rounded-lg border bg-background/48 p-3 backdrop-blur md:min-w-[420px] xl:min-w-[460px]"
    >
      <div className="sticky top-0 z-10 rounded-md border bg-card/92 p-4 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${column.accent}`} />
              <span className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
                {column.id}
              </span>
            </div>
            <h2 className="text-3xl font-semibold">{column.title}</h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              {column.description}
            </p>
          </div>
          <Badge variant="outline" className="text-base">
            {column.problems.length}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {column.problems.length > 0 ? (
          column.problems.map((problem, index) => (
            <ProblemCard
              key={`${column.id}-${problem.id}`}
              problem={problem}
              index={index}
            />
          ))
        ) : (
          <div className="rounded-md border border-dashed bg-background/35 p-5 text-base leading-7 text-muted-foreground">
            Bu tarih aralığında bu şeride düşen yeni sinyal yok.
          </div>
        )}
      </div>
    </motion.section>
  );
}

export function DiscoveryFeed({
  problems,
}: {
  problems: Problem[];
}) {
  const [currentProblems, setCurrentProblems] = useState(problems);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [sort, setSort] = useState<SortMode>("pain");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [minScore, setMinScore] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const response = await fetch("/api/problems?refresh=1", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Live refresh failed.");
      }

      const data = (await response.json()) as ProblemsResponse;
      const nextProblems = data.problems;

      setCurrentProblems(nextProblems);
      setLastRefreshedAt(data.refreshedAt);
    } catch {
      setRefreshError("Live sources could not be refreshed. Showing the latest loaded board.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    return currentProblems.filter((problem) => {
      const matchesWindow = isInWindow(problem, timeWindow);
      const matchesSector =
        sector === "all" || problem.sector.toLowerCase() === sector;
      const matchesSource =
        sourceFilter === "all" || problem.sourcePlatforms.includes(sourceFilter);
      const matchesScore = problem.painScore >= minScore;
      const matchesQuery =
        !query ||
        [problem.title, problem.summary, problem.aiSummary, ...problem.tags]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      return (
        matchesWindow &&
        matchesSector &&
        matchesSource &&
        matchesScore &&
        matchesQuery
      );
    });
  }, [currentProblems, minScore, query, sector, sourceFilter, timeWindow]);

  const columns = useMemo(
    () => buildColumns(filtered, sort),
    [filtered, sort],
  );
  const signalCount = filtered.reduce(
    (total, problem) => total + problem.sourceCount,
    0,
  );
  const selectedHotProblem = useMemo(
    () => sortProblems(filtered, "pain")[0],
    [filtered],
  );
  const activeWindowLabel =
    timeWindowOptions.find((option) => option.value === timeWindow)?.label ?? "Tümü";
  const activeSourceLabel =
    sourceFilterOptions.find((option) => option.value === sourceFilter)?.label ??
    "Tüm kaynaklar";

  return (
    <section className="mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-lg border bg-card/78 p-5 md:p-7">
        <Image
          src="/images/explora-kanban-board.webp"
          alt="Abstract horizontal discovery board"
          fill
          className="-z-10 object-cover opacity-38"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--card)_0%,color-mix(in_oklch,var(--card)_84%,transparent)_55%,color-mix(in_oklch,var(--card)_44%,transparent)_100%)]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-md border bg-primary/10 px-4 py-2 text-base font-medium text-primary">
                <Radio className="size-5 animate-pulse" aria-hidden />
                Live board
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-base">
                {filtered.length} cards
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-base">
                {signalCount} signals
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-base">
                {activeWindowLabel}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-base">
                {activeSourceLabel}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-base">
                Score {minScore}+
              </Badge>
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight md:text-6xl xl:text-7xl">
              Explora board turns live pain into movable market lanes.
            </h1>
            <p className="mt-4 max-w-3xl text-xl leading-9 text-muted-foreground">
              Scan critical pain, fresh public evidence, and validated interest
              as vertical stacks. Swipe horizontally on smaller screens.
            </p>
          </div>

          <Card className="hidden bg-background/72 backdrop-blur xl:block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Flame className="size-5 text-accent" aria-hidden />
                Window critical problem
              </CardTitle>
              <CardDescription className="text-lg leading-7">
                {selectedHotProblem
                  ? selectedHotProblem.title
                  : "Bu aralıkta eşleşen problem yok."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedHotProblem ? (
                <TrendChart problem={selectedHotProblem} />
              ) : (
                <div className="rounded-md border border-dashed bg-background/35 p-4 text-base leading-7 text-muted-foreground">
                  Daha geniş bir tarih aralığı seçerek sinyal havuzunu büyütebilirsin.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-card/84 p-4 md:flex-row md:items-center lg:flex-col lg:items-stretch">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-13 justify-start text-base"
            >
              <RefreshCw
                className={`size-5 ${isRefreshing ? "animate-spin" : ""}`}
                aria-hidden
              />
              {isRefreshing ? "Yenileniyor..." : "Yenile"}
            </Button>
            {lastRefreshedAt ? (
              <p className="text-sm leading-6 text-muted-foreground">
                Son yenileme:{" "}
                {new Intl.DateTimeFormat("tr", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }).format(new Date(lastRefreshedAt))}
              </p>
            ) : null}
            {refreshError ? (
              <p className="text-sm leading-6 text-destructive">{refreshError}</p>
            ) : null}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search live pain..."
                className="h-14 pl-10 text-lg"
              />
            </div>
            <Tabs
              value={sector}
              onValueChange={setSector}
              className="w-full md:w-auto lg:w-full"
            >
              <TabsList className="grid h-12 w-full grid-cols-3">
                <TabsTrigger value="all" className="text-base">
                  All
                </TabsTrigger>
                <TabsTrigger value="saas" className="text-base">
                  SaaS
                </TabsTrigger>
                <TabsTrigger value="developer tools" className="text-base">
                  Dev
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="h-12 text-base lg:hidden">
                  <Filter className="size-5" aria-hidden />
                  Sort
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[340px]">
                <div className="mt-8 space-y-4">
                  <TimeWindowPanel
                    window={timeWindow}
                    onWindowChange={setTimeWindow}
                  />
                  <SourceFilterPanel
                    source={sourceFilter}
                    onSourceChange={setSourceFilter}
                  />
                  <ScoreFilterPanel
                    minScore={minScore}
                    onMinScoreChange={setMinScore}
                  />
                  <FilterPanel sort={sort} onSortChange={setSort} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden lg:block">
            <TimeWindowPanel window={timeWindow} onWindowChange={setTimeWindow} />
          </div>

          <div className="hidden lg:block">
            <SourceFilterPanel
              source={sourceFilter}
              onSourceChange={setSourceFilter}
            />
          </div>

          <div className="hidden lg:block">
            <ScoreFilterPanel
              minScore={minScore}
              onMinScoreChange={setMinScore}
            />
          </div>

          <div className="hidden lg:block">
            <FilterPanel sort={sort} onSortChange={setSort} />
          </div>
        </aside>

        <div className="overflow-hidden rounded-lg border bg-card/40">
          {filtered.length > 0 ? (
            <div className="flex snap-x gap-4 overflow-x-auto scroll-smooth p-4 pb-6">
              {columns.map((column) => (
                <BoardColumnCard key={column.id} column={column} />
              ))}
            </div>
          ) : (
            <div className="p-6">
              <div className="rounded-md border border-dashed bg-background/35 p-8 text-center">
                <p className="text-2xl font-semibold">Bu keşif penceresi boş.</p>
                <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                  Aramayı temizle, skor eşiğini düşür, kaynak/sektör filtresini genişlet veya daha uzun bir tarih aralığı seç.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
