import { problems as seedProblems } from "@/lib/data";
import {
  getStoredProblemBySlug,
  getStoredProblems,
  upsertStoredProblems,
} from "@/lib/problem-store";
import { calculatePainScore } from "@/lib/scoring";
import type {
  CompetitorGap,
  PainScoreBreakdown,
  Problem,
  ProblemCategory,
  ProblemSource,
  SourcePlatform,
} from "@/lib/types";

type RawSignal = {
  id: string;
  platform: SourcePlatform;
  title: string;
  body: string;
  url: string;
  capturedAt: string;
  author?: string;
  score?: number;
  comments?: number;
  rating?: number;
};

type LiveFetchOptions = {
  refresh?: boolean;
};

type RedditListing = {
  data?: {
    children?: {
      data?: {
        id?: string;
        subreddit?: string;
        title?: string;
        selftext?: string;
        permalink?: string;
        created_utc?: number;
        author?: string;
        score?: number;
        num_comments?: number;
      };
    }[];
  };
};

type AppleReviewFeed = {
  feed?: {
    entry?:
      | {
          id?: { label?: string };
          title?: { label?: string };
          content?: { label?: string };
          updated?: { label?: string };
          author?: { name?: { label?: string } };
          link?: { attributes?: { href?: string } };
          "im:rating"?: { label?: string };
        }[]
      | {
          id?: { label?: string };
          title?: { label?: string };
          content?: { label?: string };
          updated?: { label?: string };
          author?: { name?: { label?: string } };
          link?: { attributes?: { href?: string } };
          "im:rating"?: { label?: string };
        };
  };
};

type HackerNewsItem = {
  id?: number;
  deleted?: boolean;
  dead?: boolean;
  type?: string;
  by?: string;
  time?: number;
  title?: string;
  text?: string;
  score?: number;
  descendants?: number;
};

const DEFAULT_REDDIT_SUBREDDITS = [
  "SaaS",
  "startups",
  "ProductManagement",
  "smallbusiness",
  "freelance",
];
const configuredRedditSubreddits =
  process.env.REDDIT_SUBREDDITS?.split(",")
    .map((subreddit) => subreddit.trim().replace(/^r\//i, ""))
    .filter(Boolean) ?? [];
const REDDIT_SUBREDDITS =
  configuredRedditSubreddits.length > 0
    ? configuredRedditSubreddits
    : DEFAULT_REDDIT_SUBREDDITS;
const APPLE_REVIEW_APP_IDS = ["6448311069", "618783545", "1232780281"];
const APPLE_COUNTRY = process.env.APPLE_RSS_COUNTRY ?? "us";
const USER_AGENT =
  process.env.REDDIT_USER_AGENT ?? "UnsolvedMVP/0.1 by local-dev";
const configuredRedditMaxAgeDays = Number(process.env.REDDIT_MAX_AGE_DAYS ?? 365);
const REDDIT_MAX_AGE_DAYS =
  Number.isFinite(configuredRedditMaxAgeDays) && configuredRedditMaxAgeDays > 0
    ? configuredRedditMaxAgeDays
    : 365;
const REDDIT_SEARCH_TERMS = [
  '"I wish"',
  '"is there a tool"',
  '"looking for a tool"',
  '"how do you deal with"',
  '"frustrated with"',
  '"manual process"',
  '"doesn\'t work"',
];
const REDDIT_SEARCH_QUERY = `(${REDDIT_SEARCH_TERMS.join(" OR ")})`;
const HACKER_NEWS_API_BASE = "https://hacker-news.firebaseio.com/v0";
const configuredHackerNewsStoryLimit = Number(
  process.env.HACKER_NEWS_STORY_LIMIT ?? 60,
);
const HACKER_NEWS_STORY_LIMIT =
  Number.isFinite(configuredHackerNewsStoryLimit) &&
  configuredHackerNewsStoryLimit > 0
    ? Math.min(120, configuredHackerNewsStoryLimit)
    : 60;

const painTerms = [
  "frustrated",
  "pain",
  "annoying",
  "broken",
  "slow",
  "confusing",
  "expensive",
  "missing",
  "manual",
  "hate",
  "wish",
  "problem",
  "bug",
  "terrible",
  "hard",
  "difficult",
  "can't",
  "cannot",
  "doesn't",
  "waste",
];

const payTerms = [
  "pay",
  "paid",
  "premium",
  "subscribe",
  "subscription",
  "buy",
  "price",
  "worth",
  "invoice",
  "billing",
  "budget",
  "cost",
  "charge",
];

const featureTerms = ["wish", "need", "feature", "request", "missing", "would love"];
const bugTerms = ["bug", "broken", "crash", "error", "doesn't work", "fail"];
const redditPainPatterns = [
  /\bi\s+(?:wish|hate|need|struggle|keep having|waste|spend|can't|cannot)\b/i,
  /\b(?:is there|anyone know)\s+(?:a|an|any)?\s*.{0,60}\b(?:tool|app|software|saas|solution)\b/i,
  /\blooking for\s+(?:a|an|any)?\s*.{0,60}\b(?:tool|app|software|saas|solution)\b/i,
  /\bhow do you\s+(?:handle|manage|deal with|track|automate|solve)\b/i,
  /\bhow to\s+(?:handle|manage|deal with|track|automate|solve)\b/i,
  /\b(?:manual|manually)\s+\w*.{0,40}\b(?:process|workflow|workaround|spreadsheet|task)\b/i,
  /\b(?:frustrated|annoying|broken|confusing|expensive|too much time|waste of time|without spending)\b/i,
];
const redditPromotionPatterns = [
  /\b(?:i|we)(?:'|’)?(?:ve)?\s+.{0,24}\b(?:built|building|made|launched|created|sold|shipped|rebuilt)\b/i,
  /\b(?:built|building|shipping)\s+(?:a|an|my|our)?\s*.{0,40}\b(?:saas|startup|product|app|tool)\b/i,
  /\b(?:my|our)\s+(?:saas|startup|product|app|tool)\b/i,
  /\b(?:waitlist|beta|launch|launched|mvp|roast|feedback|growth|visitors|paying customers?)\b/i,
  /\b(?:appsumo|marketing spend|cold outreach|affiliate program|founder journey|build in public)\b/i,
  /\b(?:looking for beta users|companion app|runs locally|from your iphone|in minutes)\b/i,
];
const redditMetaPatterns = [
  /\b(?:what problems need solving|problem ideas?|validate my idea|honest opinions?|should i continue)\b/i,
  /\b(?:will not promote|not promote|outside perspective|do people want this)\b/i,
  /\b(?:here(?:'|’)s how|how i found|nobody tells you|finally got our first)\b/i,
  /\b(?:build in public|founder journey|lessons learned|case study)\b/i,
  /\b(?:saved me from|how to prevent it|i keep meeting founders|most saas churn)\b/i,
];
const hackerNewsMetaPatterns = [
  /\b(?:who is hiring|who wants to be hired|freelancer seeking freelancer)\b/i,
  /\b(?:launch hn|show hn|tell hn)\b/i,
];
const strongPainPatterns = [
  /\b(?:can't|cannot|impossible|blocked|stuck|drowning|overwhelmed|waste of time)\b/i,
  /\b(?:throw you under the bus|toxic|undervaluing|delays|backlog|broken)\b/i,
  /\b(?:manual workaround|spreadsheets?|legacy systems?|surprise bill)\b/i,
];
const solutionSeekingPatterns = [
  /\b(?:is there|looking for|anyone know)\s+(?:a|an|any)?\s*.{0,60}\b(?:tool|app|software|saas|solution|platform)\b/i,
  /\bhow (?:do you|to|can (?:i|we|you))\s+(?:handle|manage|deal with|track|automate|solve|evaluate)\b/i,
  /\b(?:need|wish|would pay for|willing to pay|budget|without spending)\b/i,
];

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function truncate(value: string, length = 220) {
  const text = compactText(value);
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function keywordScore(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0);
}

function patternScore(text: string, patterns: RegExp[]) {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

function scoreSignalStrength(text: string, terms: string[]) {
  const lower = text.toLowerCase();

  return terms.reduce((score, term) => {
    const pattern = new RegExp(
      term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "g",
    );

    return score + (lower.match(pattern)?.length ?? 0);
  }, 0);
}

function classifySignal(text: string): ProblemCategory {
  const lower = text.toLowerCase();

  if (keywordScore(lower, bugTerms) >= 1) return "Bug";
  if (keywordScore(lower, featureTerms) >= 1) return "Feature Request";
  if (keywordScore(lower, painTerms) >= 2) return "Experience Gap";

  return "Experience Gap";
}

function inferTags(text: string) {
  const lower = text.toLowerCase();
  const tags = new Set<string>();

  if (lower.includes("billing") || lower.includes("invoice")) tags.add("billing");
  if (lower.includes("ai") || lower.includes("bot")) tags.add("ai");
  if (lower.includes("support") || lower.includes("ticket")) tags.add("support");
  if (lower.includes("analytics") || lower.includes("dashboard")) tags.add("analytics");
  if (lower.includes("api") || lower.includes("developer")) tags.add("developer tools");
  if (lower.includes("security") || lower.includes("permission")) tags.add("security");
  if (lower.includes("mobile") || lower.includes("app")) tags.add("mobile");

  if (tags.size === 0) tags.add("saas");

  return Array.from(tags).slice(0, 4);
}

function scoreBreakdown(signal: RawSignal): PainScoreBreakdown {
  const text = `${signal.title} ${signal.body}`;
  const lower = text.toLowerCase();
  const painHits = scoreSignalStrength(text, painTerms);
  const payHits = scoreSignalStrength(text, payTerms);
  const strongPainHits = patternScore(text, strongPainPatterns);
  const solutionIntentHits = patternScore(text, solutionSeekingPatterns);
  const buyingContext =
    solutionIntentHits > 0 ||
    /\b(?:tool|app|software|saas|platform|vendor|subscription|billing|client|customer|workflow)\b/i.test(
      text,
    );
  const commentCount = Math.max(0, signal.comments ?? 0);
  const voteScore = Math.max(0, signal.score ?? 0);
  const socialBoost =
    signal.platform === "Reddit" || signal.platform === "HackerNews"
      ? Math.min(34, Math.sqrt(commentCount) * 3.4) +
        Math.min(18, Math.log10(voteScore + 1) * 9)
      : 0;
  const lengthBoost = Math.min(12, compactText(text).length / 120);
  const lowRatingBoost =
    signal.rating && signal.rating <= 3 ? (4 - signal.rating) * 18 : 0;
  const dollarBoost = lower.includes("$") ? 14 : 0;
  const willingnessBase = buyingContext ? 10 : 4;
  const willingnessMultiplier = buyingContext ? 12 : 6;

  return {
    frequency: Math.min(
      100,
      10 + socialBoost + solutionIntentHits * 8 + lengthBoost,
    ),
    emotionalIntensity: Math.min(
      100,
      12 +
        painHits * 6 +
        strongPainHits * 14 +
        solutionIntentHits * 6 +
        lowRatingBoost,
    ),
    willingnessToPay: Math.min(
      100,
      willingnessBase +
        payHits * willingnessMultiplier +
        solutionIntentHits * 10 +
        (buyingContext ? dollarBoost : dollarBoost / 2) +
        Math.min(16, strongPainHits * 6),
    ),
  };
}

function competitorGaps(tags: string[]): CompetitorGap[] {
  if (tags.includes("billing")) {
    return [
      {
        tool: "Stripe Billing",
        gap: "Live data signal suggests customers still need clearer billing explanations.",
        complaintTheme: "Billing transparency",
      },
      {
        tool: "Chargebee",
        gap: "Users appear to want simpler previews and customer-safe messaging.",
        complaintTheme: "Invoice confidence",
      },
    ];
  }

  if (tags.includes("support") || tags.includes("ai")) {
    return [
      {
        tool: "Intercom",
        gap: "Live complaints suggest handoff and context quality remain differentiators.",
        complaintTheme: "Support continuity",
      },
      {
        tool: "Zendesk",
        gap: "Users still ask for more action-ready summaries and automation clarity.",
        complaintTheme: "Agent workflow",
      },
    ];
  }

  return [
    {
      tool: "Existing SaaS tools",
      gap: "Current tools appear to leave repeated workflow friction unresolved.",
      complaintTheme: "Experience gap",
    },
    {
      tool: "Manual workaround",
      gap: "Users are compensating with spreadsheets, support threads, or custom processes.",
      complaintTheme: "Manual operations",
    },
  ];
}

function signalToProblem(signal: RawSignal, index: number): Problem {
  const text = `${signal.title}. ${signal.body}`;
  const tags = inferTags(text);
  const breakdown = scoreBreakdown(signal);
  const painScore = calculatePainScore(breakdown);
  const source: ProblemSource = {
    id: `live-source-${signal.id}`,
    platform: signal.platform,
    author: signal.author ? "anonymous_public_user" : "public_source",
    excerpt: truncate(signal.body || signal.title),
    url: signal.url,
    capturedAt: signal.capturedAt,
  };

  return {
    id: `live-${signal.platform.toLowerCase().replace(/\s+/g, "-")}-${signal.id}`,
    slug: `${slugify(signal.title)}-${index + 1}`,
    title: truncate(signal.title, 96),
    sector: tags.includes("developer tools")
      ? "Developer Tools"
      : tags.includes("mobile")
        ? "Mobile Apps"
        : "SaaS",
    category: classifySignal(text),
    status: painScore >= 60 ? "validated" : "rising",
    summary: truncate(signal.body || signal.title, 150),
    aiSummary: `Live heuristic summary: this ${signal.platform} signal repeats a concrete customer pain around ${tags.join(", ")}. It should be reviewed against more sources before product commitment.`,
    painScore,
    scoreBreakdown: breakdown,
    validationCount: Math.max(8, Math.round((signal.comments ?? 0) + painScore / 3)),
    lastSeenAt: signal.capturedAt,
    sourceCount: Math.max(1, signal.comments ?? 1),
    sourcePlatforms: [signal.platform],
    trend: [
      { label: "Now -4w", score: Math.max(12, painScore - 18), mentions: 6 },
      { label: "Now -3w", score: Math.max(14, painScore - 13), mentions: 10 },
      { label: "Now -2w", score: Math.max(16, painScore - 8), mentions: 15 },
      { label: "Now -1w", score: Math.max(18, painScore - 4), mentions: 19 },
      { label: "Live", score: painScore, mentions: Math.max(22, signal.comments ?? 12) },
    ],
    sources: [source],
    competitors: competitorGaps(tags),
    opportunity: `Investigate a narrow product wedge for ${tags.join(", ")} using this live source plus additional validation interviews.`,
    tags,
  };
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  options: LiveFetchOptions = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    ...(options.refresh ? { cache: "no-store" as const } : { next: { revalidate: 900 } }),
  });

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} for ${url}`);
  }

  return response.json() as Promise<T>;
}

function isUsefulRedditSignal(title: string, body: string) {
  const text = compactText(`${title} ${body}`);
  if (text.length < 40) return false;

  const intentScore = patternScore(text, redditPainPatterns);
  const painScore =
    keywordScore(text, painTerms) + keywordScore(text, featureTerms) + intentScore * 2;
  const promotionScore = patternScore(text, redditPromotionPatterns);
  const metaScore = patternScore(text, redditMetaPatterns);

  if (metaScore > 0) return false;
  if (promotionScore >= 3) return false;
  if (promotionScore > 0 && intentScore === 0) return false;
  if (promotionScore >= 2 && intentScore < 3) return false;
  if (promotionScore >= 2 && painScore < 5) return false;
  if (painScore < 3) return false;

  return true;
}

function isUsefulHackerNewsSignal(title: string, body: string) {
  const text = compactText(`${title} ${body}`);
  if (text.length < 28) return false;
  if (patternScore(text, hackerNewsMetaPatterns) > 0) return false;

  const normalizedTitle = title.replace(/^Ask HN:\s*/i, "");
  const intentScore = patternScore(text, redditPainPatterns);
  const painScore =
    keywordScore(text, painTerms) +
    keywordScore(text, featureTerms) +
    intentScore * 2;

  if (/^Ask HN:/i.test(title) && patternScore(normalizedTitle, redditPainPatterns) > 0) {
    return true;
  }

  return painScore >= 3 && intentScore > 0;
}

async function fetchRedditSignals(options: LiveFetchOptions = {}) {
  const seen = new Set<string>();
  const newestAllowedCreatedAt =
    Date.now() - REDDIT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const feeds = await Promise.allSettled(
    REDDIT_SUBREDDITS.map((subreddit) => {
      const params = new URLSearchParams({
        q: REDDIT_SEARCH_QUERY,
        restrict_sr: "1",
        sort: "new",
        t: "year",
        limit: "25",
        raw_json: "1",
      });

      return fetchJson<RedditListing>(
        `https://www.reddit.com/r/${subreddit}/search.json?${params.toString()}`,
        { headers: { "User-Agent": USER_AGENT } },
        options,
      );
    }),
  );

  return feeds.flatMap((result) => {
    if (result.status !== "fulfilled") return [];

    return (
      result.value.data?.children
        ?.map((child): RawSignal | null => {
          const data = child.data;
          if (!data?.id || !data.title) return null;
          if (seen.has(data.id)) return null;
          const capturedAt = new Date((data.created_utc ?? Date.now() / 1000) * 1000);
          if (capturedAt.getTime() < newestAllowedCreatedAt) return null;

          const body = compactText(data.selftext ?? "");
          if (!isUsefulRedditSignal(data.title, body)) return null;

          seen.add(data.id);

          return {
            id: data.id,
            platform: "Reddit",
            title: data.title,
            body,
            author: data.author,
            score: data.score,
            comments: data.num_comments,
            capturedAt: capturedAt.toISOString(),
            url: `https://www.reddit.com${data.permalink ?? ""}`,
          };
        })
        .filter((signal): signal is RawSignal => Boolean(signal)) ?? []
    );
  });
}

async function fetchHackerNewsSignals(options: LiveFetchOptions = {}) {
  const ids = await fetchJson<number[]>(
    `${HACKER_NEWS_API_BASE}/askstories.json`,
    undefined,
    options,
  );

  const itemResults = await Promise.allSettled(
    ids.slice(0, HACKER_NEWS_STORY_LIMIT).map((id) =>
      fetchJson<HackerNewsItem>(
        `${HACKER_NEWS_API_BASE}/item/${id}.json`,
        undefined,
        options,
      ),
    ),
  );

  return itemResults.flatMap((result): RawSignal[] => {
    if (result.status !== "fulfilled") return [];

    const item = result.value;
    if (
      !item.id ||
      item.deleted ||
      item.dead ||
      item.type !== "story" ||
      !item.title
    ) {
      return [];
    }

    const title = decodeHtml(item.title);
    const body = compactText(decodeHtml(item.text ?? ""));

    if (!isUsefulHackerNewsSignal(title, body)) return [];

    return [
      {
        id: String(item.id),
        platform: "HackerNews",
        title,
        body: body || title,
        author: item.by,
        score: item.score,
        comments: item.descendants,
        capturedAt: new Date((item.time ?? Date.now() / 1000) * 1000).toISOString(),
        url: `https://news.ycombinator.com/item?id=${item.id}`,
      },
    ];
  });
}

async function fetchAppleReviewSignals(options: LiveFetchOptions = {}) {
  const feeds = await Promise.allSettled(
    APPLE_REVIEW_APP_IDS.map((id) =>
      fetchJson<AppleReviewFeed>(
        `https://itunes.apple.com/${APPLE_COUNTRY}/rss/customerreviews/id=${id}/sortBy=mostRecent/json`,
        undefined,
        options,
      ),
    ),
  );

  return feeds.flatMap((result) => {
    if (result.status !== "fulfilled") return [];
    const entries = result.value.feed?.entry;
    const normalizedEntries = Array.isArray(entries) ? entries : entries ? [entries] : [];

    return normalizedEntries
      .map((entry): RawSignal | null => {
        const title = entry.title?.label;
        const body = entry.content?.label;
        const id = entry.id?.label;
        if (!title || !body || !id) return null;

        return {
          id,
          platform: "App Store",
          title,
          body,
          author: entry.author?.name?.label,
          rating: Number(entry["im:rating"]?.label ?? 5),
          capturedAt: entry.updated?.label
            ? new Date(entry.updated.label).toISOString()
            : new Date().toISOString(),
          url: entry.link?.attributes?.href ?? "https://apps.apple.com",
        };
      })
      .filter((signal): signal is RawSignal => Boolean(signal))
      .filter((signal) => (signal.rating ?? 5) <= 4 || keywordScore(`${signal.title} ${signal.body}`, painTerms) > 0)
      .slice(0, 8);
  });
}

function dedupeProblems(problems: Problem[]) {
  const seen = new Map<string, Problem>();

  for (const problem of problems) {
    const key = problem.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .slice(0, 80);

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, problem);
      continue;
    }

    const lastSeenAt =
      new Date(problem.lastSeenAt).getTime() > new Date(existing.lastSeenAt).getTime()
        ? problem.lastSeenAt
        : existing.lastSeenAt;

    seen.set(key, {
      ...existing,
      painScore: Math.max(existing.painScore, problem.painScore),
      validationCount: Math.max(existing.validationCount, problem.validationCount),
      lastSeenAt,
      sourceCount: existing.sourceCount + problem.sourceCount,
      sourcePlatforms: Array.from(
        new Set([...existing.sourcePlatforms, ...problem.sourcePlatforms]),
      ),
      sources: [...existing.sources, ...problem.sources],
      tags: Array.from(new Set([...existing.tags, ...problem.tags])).slice(0, 4),
    });
  }

  return Array.from(seen.values());
}

export async function getLiveSignals(options: LiveFetchOptions = {}) {
  const [reddit, hackerNews, apple] = await Promise.allSettled([
    fetchRedditSignals(options),
    fetchHackerNewsSignals(options),
    fetchAppleReviewSignals(options),
  ]);

  return [
    ...(reddit.status === "fulfilled" ? reddit.value : []),
    ...(hackerNews.status === "fulfilled" ? hackerNews.value : []),
    ...(apple.status === "fulfilled" ? apple.value : []),
  ];
}

export async function getLiveProblems(options: LiveFetchOptions = {}) {
  if (!options.refresh) {
    const storedProblems = await getStoredProblems();
    if (storedProblems && storedProblems.length > 0) {
      return storedProblems;
    }
  }

  const signals = await getLiveSignals(options);

  if (signals.length === 0) {
    const storedProblems = await getStoredProblems();
    if (storedProblems && storedProblems.length > 0) {
      return storedProblems;
    }

    return seedProblems;
  }

  const liveProblems = dedupeProblems(
    signals
      .map(signalToProblem)
      .sort((a, b) => b.painScore - a.painScore),
  ).slice(0, 96);

  if (liveProblems.length > 0) {
    await upsertStoredProblems(liveProblems);
    return liveProblems;
  }

  const storedProblems = await getStoredProblems();
  return storedProblems && storedProblems.length > 0 ? storedProblems : seedProblems;
}

export async function getLiveProblemBySlug(slug: string) {
  const storedProblem = await getStoredProblemBySlug(slug);
  if (storedProblem) return storedProblem;

  const liveProblem = (await getLiveProblems()).find(
    (problem) => problem.slug === slug || problem.id === slug,
  );

  return liveProblem ?? seedProblems.find((problem) => problem.slug === slug || problem.id === slug);
}

export async function getHotLiveProblem() {
  const liveProblems = await getLiveProblems();
  return liveProblems.slice().sort((a, b) => b.painScore - a.painScore)[0];
}
