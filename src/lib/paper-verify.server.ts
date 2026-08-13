/**
 * Verifies AI-suggested research papers against OpenAlex so we never hand the
 * student a dead link. Papers we cannot confirm are dropped.
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

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
  authorships?: Array<{ author?: { display_name?: string | null } | null }> | null;
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  best_oa_location?: { pdf_url?: string | null; landing_page_url?: string | null } | null;
  open_access?: { is_oa?: boolean; oa_url?: string | null } | null;
}

async function lookup(title: string): Promise<OpenAlexWork | null> {
  const endpoint = `https://api.openalex.org/works?search=${encodeURIComponent(
    title,
  )}&per_page=3&mailto=support@projecthelper.app`;
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", "User-Agent": "ProjectHelper/1.0" },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { results?: OpenAlexWork[] };
    const results = body.results ?? [];
    return (
      results.find((work) => titlesMatch(work.display_name ?? work.title ?? "", title)) ?? null
    );
  } catch {
    return null;
  }
}

/** Returns only papers that resolve to a real, reachable record. */
export async function verifyPapers(papers: VerifiablePaper[]): Promise<VerifiablePaper[]> {
  const checked = await Promise.all(
    papers.map(async (paper) => {
      const work = await lookup(paper.title);
      if (!work) return null;

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

      return {
        ...paper,
        title: work.display_name ?? work.title ?? paper.title,
        authors: authors || paper.authors,
        year: work.publication_year ? String(work.publication_year) : paper.year,
        venue: work.primary_location?.source?.display_name ?? paper.venue,
        url: landing,
        pdf_url: pdf,
        downloadable: Boolean(pdf),
      } satisfies VerifiablePaper;
    }),
  );

  const seen = new Set<string>();
  return checked.filter((paper): paper is VerifiablePaper => {
    if (!paper) return false;
    if (seen.has(paper.url)) return false;
    seen.add(paper.url);
    return true;
  });
}
