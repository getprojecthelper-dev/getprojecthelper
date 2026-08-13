/**
 * Verifies AI-suggested research papers against OpenAlex so we never hand the
 * student a dead link, and scores them for topical relevance so only papers
 * that actually relate to the project idea are shown.
 */

export interface VerifiablePaper {
  title: string;
  authors: string;
  year: string;
  venue: string;
  url: string;
  pdf_url: string | null;
  downloadable: boolean;
  summary: string;
  relevance: string;
}

export interface PaperTopic {
  title: string;
  description: string;
  domain: string;
}

const STOP_WORDS = new Set([
  "the","a","an","and","or","of","for","with","using","based","system","project","to","in","on",
  "by","from","that","this","it","is","are","be","as","at","into","via","new","study","approach",
  "application","applications","model","models","build","building","create","web","app",
]);

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function keywords(text: string): string[] {
  return Array.from(
    new Set(
      normalise(text)
        .split(" ")
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w)),
    ),
  );
}

function titlesMatch(a: string, b: string) {
  const left = normalise(a);
  const right = normalise(b);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const leftWords = new Set(left.split(" "));
  const rightWords = right.split(" ");
  const overlap = rightWords.filter((w) => leftWords.has(w)).length;
  return overlap / Math.max(rightWords.length, 1) >= 0.7;
}

interface OpenAlexWork {
  title?: string | null;
  display_name?: string | null;
  doi?: string | null;
  publication_year?: number | null;
  cited_by_count?: number | null;
  authorships?: Array<{ author?: { display_name?: string | null } | null }> | null;
  concepts?: Array<{ display_name?: string | null }> | null;
  keywords?: Array<{ display_name?: string | null }> | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  best_oa_location?: { pdf_url?: string | null; landing_page_url?: string | null } | null;
  open_access?: { is_oa?: boolean; oa_url?: string | null } | null;
}

async function openAlex(query: string, perPage: number): Promise<OpenAlexWork[]> {
  const endpoint = `https://api.openalex.org/works?search=${encodeURIComponent(
    query,
  )}&per_page=${perPage}&mailto=support@projecthelper.app`;
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", "User-Agent": "ProjectHelper/1.0" },
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { results?: OpenAlexWork[] };
    return body.results ?? [];
  } catch {
    return [];
  }
}

async function lookup(title: string): Promise<OpenAlexWork | null> {
  const results = await openAlex(title, 3);
  return results.find((work) => titlesMatch(work.display_name ?? work.title ?? "", title)) ?? null;
}

function workText(work: OpenAlexWork): string {
  const abstract = work.abstract_inverted_index
    ? Object.keys(work.abstract_inverted_index).slice(0, 220).join(" ")
    : "";
  const concepts = (work.concepts ?? []).map((c) => c?.display_name ?? "").join(" ");
  const kw = (work.keywords ?? []).map((k) => k?.display_name ?? "").join(" ");
  return `${work.display_name ?? work.title ?? ""} ${concepts} ${kw} ${abstract}`;
}

/** 0-1 share of the project's distinctive keywords that the paper mentions. */
function relevanceScore(work: OpenAlexWork, topicWords: string[]): number {
  if (topicWords.length === 0) return 1;
  const haystack = normalise(workText(work));
  const hits = topicWords.filter((w) => haystack.includes(w)).length;
  return hits / topicWords.length;
}

function toPaper(work: OpenAlexWork, base: Partial<VerifiablePaper>): VerifiablePaper | null {
  const landing =
    (work.doi ? work.doi : null) ??
    work.primary_location?.landing_page_url ??
    work.best_oa_location?.landing_page_url ??
    work.open_access?.oa_url ??
    null;
  if (!landing) return null;

  const pdf =
    work.best_oa_location?.pdf_url ??
    work.primary_location?.pdf_url ??
    (work.open_access?.oa_url?.endsWith(".pdf") ? work.open_access.oa_url : null) ??
    null;

  const authors = (work.authorships ?? [])
    .map((a) => a?.author?.display_name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  const title = work.display_name ?? work.title ?? base.title ?? "";
  if (!title) return null;

  return {
    title,
    authors: authors || base.authors || "Unknown authors",
    year: work.publication_year ? String(work.publication_year) : (base.year ?? ""),
    venue: work.primary_location?.source?.display_name ?? base.venue ?? "",
    url: landing,
    pdf_url: pdf,
    downloadable: Boolean(pdf),
    summary:
      base.summary ||
      "Peer-reviewed work matched to your project topic from the OpenAlex research index.",
    relevance: base.relevance || "Covers methods and results directly related to your project idea.",
  };
}

/**
 * Returns only papers that resolve to a real record AND are topically relevant.
 * When too few AI suggestions survive, tops up with a direct OpenAlex search
 * on the project topic so the student always sees on-topic work.
 */
export async function verifyPapers(
  papers: VerifiablePaper[],
  topic?: PaperTopic,
): Promise<VerifiablePaper[]> {
  const topicWords = topic
    ? keywords(`${topic.title} ${topic.description} ${topic.domain}`).slice(0, 12)
    : [];
  const threshold = topicWords.length >= 6 ? 0.25 : 0.15;

  const checked = await Promise.all(
    papers.map(async (paper) => {
      const work = await lookup(paper.title);
      if (!work) return null;
      const score = relevanceScore(work, topicWords);
      if (topicWords.length > 0 && score < threshold) return null;
      const built = toPaper(work, paper);
      return built ? { paper: built, score, cites: work.cited_by_count ?? 0 } : null;
    }),
  );

  const scored = checked.filter(
    (entry): entry is { paper: VerifiablePaper; score: number; cites: number } => entry !== null,
  );

  if (topic && scored.length < 6) {
    const query = [topic.title, ...keywords(topic.description).slice(0, 6)].join(" ");
    const extras = await openAlex(query, 16);
    for (const work of extras) {
      const score = relevanceScore(work, topicWords);
      if (topicWords.length > 0 && score < threshold) continue;
      const built = toPaper(work, {});
      if (built) scored.push({ paper: built, score, cites: work.cited_by_count ?? 0 });
    }
  }

  scored.sort((a, b) => b.score - a.score || b.cites - a.cites);

  const seen = new Set<string>();
  const out: VerifiablePaper[] = [];
  for (const { paper } of scored) {
    const key = paper.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(paper);
    if (out.length >= 12) break;
  }
  return out;
}
