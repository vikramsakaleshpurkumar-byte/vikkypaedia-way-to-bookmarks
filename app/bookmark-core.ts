export type BookmarkIntent =
  | "learn"
  | "decide"
  | "try"
  | "visit"
  | "cite"
  | "keep";

export type BookmarkItem = {
  id: string;
  url: string;
  title: string;
  domain: string;
  folder: string;
  addedAt: string;
  intent: BookmarkIntent;
  tags: string[];
  note: string;
};

const DAY = 86_400_000;

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (_, entity: string) => {
      if (entity.startsWith("#x"))
        return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      if (entity.startsWith("#"))
        return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      return named[entity.toLowerCase()] || `&${entity};`;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function stableId(url: string, index: number) {
  let hash = 2166136261;
  for (const character of `${url}:${index}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `bm-${(hash >>> 0).toString(36)}`;
}

function safeDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown source";
  }
}

function inferIntent(text: string): BookmarkIntent {
  const value = text.toLowerCase();
  if (/\b(paper|research|study|guide|course|learn|tutorial|book)\b/.test(value))
    return "learn";
  if (/\b(compare|review|pricing|versus|decision|buy|product)\b/.test(value))
    return "decide";
  if (/\b(tool|recipe|how to|template|exercise|workout|try)\b/.test(value))
    return "try";
  if (/\b(travel|hotel|restaurant|place|museum|visit|trip)\b/.test(value))
    return "visit";
  if (/\b(reference|evidence|citation|report|statistics)\b/.test(value))
    return "cite";
  return "keep";
}

function inferTags(text: string) {
  const candidates = [
    "ai",
    "research",
    "health",
    "design",
    "productivity",
    "travel",
    "writing",
    "business",
    "learning",
    "technology",
  ];
  const value = text.toLowerCase();
  const tags = candidates.filter((candidate) => value.includes(candidate));
  return tags.length ? tags.slice(0, 3) : ["uncategorized"];
}

function attributes(value: string) {
  const result: Record<string, string> = {};
  value.replace(
    /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
    (_, key: string, double: string, single: string, bare: string) => {
      result[key.toUpperCase()] = double ?? single ?? bare ?? "";
      return "";
    },
  );
  return result;
}

export function parseNetscapeBookmarks(html: string): BookmarkItem[] {
  const tokens =
    html.match(/<H3\b[^>]*>[\s\S]*?<\/H3>|<A\b[^>]*>[\s\S]*?<\/A>|<\/?DL\b[^>]*>/gi) ||
    [];
  const folderStack: string[] = [];
  let pendingFolder = "";
  const items: BookmarkItem[] = [];

  for (const token of tokens) {
    if (/^<H3/i.test(token)) {
      pendingFolder = decodeHtml(token);
      continue;
    }
    if (/^<DL/i.test(token)) {
      folderStack.push(pendingFolder);
      pendingFolder = "";
      continue;
    }
    if (/^<\/DL/i.test(token)) {
      folderStack.pop();
      continue;
    }
    const opening = token.match(/^<A\b([^>]*)>/i);
    if (!opening) continue;
    const attrs = attributes(opening[1]);
    const url = decodeHtml(attrs.HREF || "");
    if (!/^https?:\/\//i.test(url)) continue;
    const title = decodeHtml(token.replace(/^<A\b[^>]*>/i, ""));
    const epoch = Number(attrs.ADD_DATE || 0);
    const addedAt =
      epoch > 0
        ? new Date(epoch * 1000).toISOString()
        : new Date(Date.now() - items.length * DAY).toISOString();
    const folder = folderStack.filter(Boolean).join(" / ");
    const searchable = `${title} ${url} ${folder}`;
    items.push({
      id: stableId(url, items.length),
      url,
      title: title || safeDomain(url),
      domain: safeDomain(url),
      folder,
      addedAt,
      intent: inferIntent(searchable),
      tags: inferTags(searchable),
      note: folder ? `Filed under ${folder}` : "",
    });
  }
  return items;
}

export function canonicalUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ].forEach((key) => url.searchParams.delete(key));
    url.hostname = url.hostname.replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function findDuplicateGroups(items: BookmarkItem[]) {
  const groups = new Map<string, BookmarkItem[]>();
  for (const item of items) {
    const key = canonicalUrl(item.url);
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

export function findForgotten(
  items: BookmarkItem[],
  now = new Date("2026-07-24T12:00:00+05:30"),
) {
  const threshold = now.getTime() - 365 * DAY;
  return items
    .filter((item) => new Date(item.addedAt).getTime() < threshold)
    .sort(
      (a, b) =>
        new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime(),
    );
}

const QUERY_EXPANSIONS: Record<string, string[]> = {
  learn: ["guide", "course", "tutorial", "paper", "research", "book"],
  decide: ["compare", "review", "pricing", "buy", "product"],
  trip: ["travel", "visit", "hotel", "restaurant", "museum"],
  make: ["tool", "template", "how", "recipe", "try"],
  evidence: ["research", "paper", "study", "report", "cite"],
  meeting: ["collaboration", "team", "agenda", "productivity"],
};
const QUERY_STOPWORDS = new Set([
  "about",
  "article",
  "better",
  "find",
  "from",
  "that",
  "the",
  "this",
  "what",
  "with",
]);

export function searchBookmarks(items: BookmarkItem[], query: string) {
  const trimmed = query.toLowerCase().trim();
  if (!trimmed) return items;
  const rawTokens = trimmed
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1 && !QUERY_STOPWORDS.has(token));
  const expandedTokens = rawTokens.flatMap(
    (token) => QUERY_EXPANSIONS[token] || [],
  );

  return items
    .map((item) => {
      const title = item.title.toLowerCase();
      const note = item.note.toLowerCase();
      const folder = item.folder.toLowerCase();
      const domain = item.domain.toLowerCase();
      const tags = item.tags.join(" ").toLowerCase();
      let score = title.includes(trimmed) ? 12 : 0;
      let rawCoverage = 0;
      for (const token of rawTokens) {
        let matched = false;
        if (title.includes(token)) score += 7;
        if (tags.includes(token)) score += 4;
        if (folder.includes(token)) score += 3;
        if (note.includes(token)) score += 5;
        if (domain.includes(token)) score += 2;
        if (item.intent.includes(token)) score += 6;
        matched =
          title.includes(token) ||
          tags.includes(token) ||
          folder.includes(token) ||
          note.includes(token) ||
          domain.includes(token) ||
          item.intent.includes(token);
        if (matched) rawCoverage += 1;
      }
      for (const token of expandedTokens) {
        if (title.includes(token)) score += 2;
        if (tags.includes(token)) score += 1;
        if (folder.includes(token)) score += 1;
        if (note.includes(token)) score += 1;
        if (item.intent.includes(token)) score += 1;
      }
      score += rawCoverage * 10;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.item.addedAt).getTime() -
          new Date(a.item.addedAt).getTime(),
    )
    .map(({ item }) => item);
}

export function buildActionPack(items: BookmarkItem[]) {
  const intents = new Set(items.map((item) => item.intent));
  const dominant =
    intents.has("decide")
      ? "decision"
      : intents.has("learn")
        ? "learning"
        : intents.has("visit")
          ? "plan"
          : "working";
  return {
    title: `A ${dominant} pack from your saves`,
    summary: items.length
      ? `These ${items.length} sources are now a small working set instead of a forgotten pile.`
      : "Choose a few sources to begin.",
    steps: [
      `Skim the ${items.length} sources and mark the strongest two.`,
      "Write one sentence about what each source changes or confirms.",
      dominant === "decision"
        ? "Compare the strongest options against three criteria that matter to you."
        : dominant === "learning"
          ? "Order the sources from foundation to practical application."
          : "Turn the useful ideas into one concrete next action.",
    ],
  };
}

function sample(
  id: string,
  title: string,
  url: string,
  addedAt: string,
  intent: BookmarkIntent,
  tags: string[],
  note: string,
): BookmarkItem {
  return {
    id,
    title,
    url,
    domain: safeDomain(url),
    folder: tags[0] || "",
    addedAt,
    intent,
    tags,
    note,
  };
}

export const sampleBookmarks: BookmarkItem[] = [
  sample("sample-1", "The maker's schedule, manager's schedule", "https://paulgraham.com/makersschedule.html", "2022-03-14T10:00:00Z", "learn", ["productivity", "writing"], "A useful explanation of why meetings fragment deep work."),
  sample("sample-2", "How to run a premortem", "https://hbr.org/2007/09/performing-a-project-premortem", "2023-01-09T10:00:00Z", "try", ["business", "productivity"], "Try this before committing to a large project."),
  sample("sample-3", "The future of personal knowledge tools", "https://www.nngroup.com/articles/knowledge-management/", "2024-05-22T10:00:00Z", "learn", ["design", "technology"], "Research for a better personal memory system."),
  sample("sample-4", "A practical guide to spaced repetition", "https://gwern.net/spaced-repetition", "2021-08-03T10:00:00Z", "try", ["learning", "research"], "Could become a weekly learning habit."),
  sample("sample-5", "Compare local-first software principles", "https://www.inkandswitch.com/local-first/", "2020-11-18T10:00:00Z", "decide", ["technology", "research"], "Evidence for choosing a privacy-first architecture."),
  sample("sample-6", "Designing calm technology", "https://calmtech.com/", "2025-09-12T10:00:00Z", "learn", ["design", "technology"], "How resurfacing can feel helpful rather than noisy."),
  sample("sample-7", "Local-first software principles — tracked link", "https://www.inkandswitch.com/local-first/?utm_source=newsletter", "2023-06-01T10:00:00Z", "cite", ["technology", "research"], "Saved twice from a newsletter."),
  sample("sample-8", "A weekend architecture walk in Ahmedabad", "https://en.wikipedia.org/wiki/Architecture_of_Ahmedabad", "2022-12-02T10:00:00Z", "visit", ["travel", "design"], "Possible places for a thoughtful weekend itinerary."),
  sample("sample-9", "Shape Up: stop running in circles", "https://basecamp.com/shapeup", "2026-02-14T10:00:00Z", "try", ["business", "productivity"], "A calmer alternative for planning product work."),
  sample("sample-10", "Writing is thinking", "https://fs.blog/writing-is-thinking/", "2024-02-18T10:00:00Z", "keep", ["writing", "learning"], "A reminder to write before reaching for more information."),
];
