/** Document types and their available formats/templates. */

export interface DocFormat {
  id: string;
  label: string;
  /** Short hint shown to the student. */
  hint: string;
  /** Extra guidance handed to the writer model. */
  brief: string;
}

export interface DocType {
  id: string;
  label: string;
  description: string;
  formats: DocFormat[];
}

export const DOC_TYPES: DocType[] = [
  {
    id: "research_paper",
    label: "Research Paper",
    description:
      "A full conference or journal paper written from your project: abstract, methodology, results and references.",
    formats: [
      {
        id: "ieee",
        label: "IEEE Conference (two-column)",
        hint: "Most common for engineering conferences",
        brief:
          "Use \\documentclass[conference]{IEEEtran} with two-column layout, IEEEkeywords, and IEEE-style numbered references.",
      },
      {
        id: "acm",
        label: "ACM (acmart, sigconf)",
        hint: "ACM conferences and workshops",
        brief:
          "Use \\documentclass[sigconf]{acmart} with CCS concepts, keywords and ACM reference format.",
      },
      {
        id: "springer_lncs",
        label: "Springer LNCS",
        hint: "Springer proceedings",
        brief:
          "Use \\documentclass{llncs} with \\institute, abstract and keywords, and splncs04-style references.",
      },
      {
        id: "elsevier",
        label: "Elsevier (elsarticle)",
        hint: "Journal submissions",
        brief:
          "Use \\documentclass[preprint,12pt]{elsarticle} with frontmatter, highlights and elsarticle-num references.",
      },
      {
        id: "apa_university",
        label: "University / APA report style",
        hint: "Single column, APA 7 citations",
        brief:
          "Use \\documentclass[12pt]{article} with 1-inch margins, double spacing and APA 7th edition in-text citations plus a References list.",
      },
    ],
  },
  {
    id: "literature_review",
    label: "Literature Review",
    description:
      "A structured survey of the work around your topic, grouped into themes with a comparison table and research gaps.",
    formats: [
      {
        id: "thematic",
        label: "Thematic review",
        hint: "Grouped by theme, with gaps",
        brief:
          "Use \\documentclass[12pt]{article}. Organise the body into thematic subsections, include a comparison table of the reviewed works and an explicit research-gap section.",
      },
      {
        id: "systematic_prisma",
        label: "Systematic (PRISMA)",
        hint: "Search protocol + inclusion criteria",
        brief:
          "Follow PRISMA: research questions, search strategy, inclusion/exclusion criteria, study selection counts, synthesis and limitations.",
      },
      {
        id: "ieee_survey",
        label: "IEEE survey paper",
        hint: "Two-column survey",
        brief:
          "Use \\documentclass[journal]{IEEEtran} for a survey with taxonomy figure description, comparison tables and open challenges.",
      },
    ],
  },
  {
    id: "project_report",
    label: "Project Report",
    description:
      "The classic college submission: introduction, system design, implementation, testing, results and conclusion.",
    formats: [
      {
        id: "university_report",
        label: "University thesis style",
        hint: "Chapters, front matter, appendix",
        brief:
          "Use \\documentclass[12pt,a4paper]{report} with title page, certificate/declaration placeholders, acknowledgements, table of contents and numbered chapters.",
      },
      {
        id: "concise_report",
        label: "Concise report",
        hint: "Short 8-12 page format",
        brief:
          "Use \\documentclass[11pt]{article}, a compact structure with numbered sections and no chapter-level front matter.",
      },
    ],
  },
  {
    id: "synopsis",
    label: "Synopsis / Proposal",
    description:
      "A short proposal for approval: problem, objectives, methodology, expected outcome and timeline.",
    formats: [
      {
        id: "standard_synopsis",
        label: "Standard synopsis",
        hint: "4-6 pages",
        brief:
          "Use \\documentclass[12pt]{article}. Sections: Title, Introduction, Literature Survey, Problem Statement, Objectives, Proposed Methodology, Expected Outcome, Timeline (table), References.",
      },
      {
        id: "grant_style",
        label: "Grant / funding proposal",
        hint: "Impact + budget focus",
        brief:
          "Structure for a funding body: significance, innovation, approach, deliverables, milestones table, budget justification and team roles.",
      },
    ],
  },
];

export const findDocType = (id: string) => DOC_TYPES.find((t) => t.id === id) ?? null;
