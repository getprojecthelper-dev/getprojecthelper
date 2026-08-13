import type { DocAuthor, DocSection } from "@/lib/documents.functions";

const ROMAN: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function roman(n: number) {
  let out = "";
  let rest = n;
  for (const [value, sign] of ROMAN) {
    while (rest >= value) {
      out += sign;
      rest -= value;
    }
  }
  return out;
}

/** Strips any numbering the writer already put in the heading ("3.", "III.", "A."). */
const cleanHeading = (h: string) =>
  h.replace(/^\s*(?:[0-9]+|[IVXLC]+|[A-Z])[.)]\s*/i, "").trim();

const isFrontMatter = (h: string) => /abstract|index terms|keywords?/i.test(h);

/** Splits a body into paragraphs and inline "A. Subheading" lines. */
function blocks(body: string) {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function PaperSheet({
  title,
  authors,
  keywords,
  sections,
}: {
  title: string;
  authors: DocAuthor[];
  keywords?: string;
  sections: DocSection[];
}) {
  const front = sections.filter((s) => isFrontMatter(s.heading));
  const body = sections.filter((s) => !isFrontMatter(s.heading));
  const abstract = front.find((s) => /abstract/i.test(s.heading));
  const terms =
    front.find((s) => /index terms|keywords?/i.test(s.heading))?.body?.trim() || keywords || "";

  return (
    <div className="paper-sheet mx-auto w-full max-w-[8.5in] px-[0.62in] py-[0.7in] shadow-panel">
      <h2
        className="mb-3 text-center leading-tight"
        style={{ fontSize: "20pt", fontWeight: 400 }}
      >
        {title}
      </h2>

      {authors.length ? (
        <div className="mb-4 flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
          {authors.map((a, i) => (
            <div key={i} style={{ fontSize: "10pt", lineHeight: 1.25 }}>
              <div>{a.name}</div>
              {a.affiliation ? <div>{a.affiliation}</div> : null}
              {a.role && a.role !== "Author" ? <div>{a.role}</div> : null}
              {a.email ? (
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "9pt" }}>
                  {a.email}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="paper-columns">
        {abstract ? (
          <p className="mb-2" style={{ fontWeight: 700, fontStyle: "italic" }}>
            <span>Abstract—</span>
            {abstract.body.trim()}
          </p>
        ) : null}
        {terms ? (
          <p className="mb-3" style={{ fontWeight: 700, fontStyle: "italic" }}>
            <span>Index Terms—</span>
            {terms}
          </p>
        ) : null}

        {body.map((section, i) => (
          <section key={i}>
            <h3 className="paper-heading">
              {roman(i + 1)}. {cleanHeading(section.heading)}
            </h3>
            {blocks(section.body).map((para, j) => {
              const sub = /^([A-Z])[.)]\s+(.{2,80})$/.exec(para);
              if (sub) {
                return (
                  <h4 key={j} className="paper-subheading">
                    {sub[1]}. {sub[2]}
                  </h4>
                );
              }
              return (
                <p key={j} style={{ textIndent: "0.2in", margin: "0 0 4pt" }}>
                  {para}
                </p>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
