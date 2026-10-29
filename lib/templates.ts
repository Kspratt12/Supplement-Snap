/**
 * Free downloadable templates. The files live in public/downloads and are built
 * by scripts/build-templates.mjs. The article download boxes, the templates
 * page and the tests all read from this list, so a file cannot be linked in one
 * place and missing in another.
 */

export interface TemplateFile {
  format: "PDF" | "Fillable PDF" | "Word" | "Excel"
  href: string
  /** What the visitor gets, in a few words. */
  note: string
}

export interface TemplatePreview {
  /** First page of the PDF, made by scripts/render-template-previews.mjs */
  src: string
  alt: string
  width: number
  height: number
}

export interface Template {
  id: string
  title: string
  description: string
  /** The guide that explains how to use it. */
  guideHref: string
  guideLabel: string
  preview: TemplatePreview
  files: TemplateFile[]
}

export const TEMPLATES: Template[] = [
  {
    id: "roofing-estimate-template",
    title: "Roofing estimate template",
    description: "Company details, scope of work, line items, other charges, terms and a signature line. Totals calculate in the Excel version.",
    guideHref: "/blog/roofing-estimate-template",
    guideLabel: "How to fill it in",
    preview: { src: "/templates/previews/roofing-estimate-template-preview.jpg", alt: "First page of the free roofing estimate template (PDF version), a blank form ready to fill in", width: 900, height: 1165 },
    files: [
      { format: "PDF", href: "/downloads/roofing-estimate-template.pdf", note: "Print and fill in by hand" },
      { format: "Fillable PDF", href: "/downloads/roofing-estimate-template-fillable.pdf", note: "Type into it on screen, then save or print" },
      { format: "Word", href: "/downloads/roofing-estimate-template.docx", note: "Edit on your computer" },
      { format: "Excel", href: "/downloads/roofing-estimate-template.xlsx", note: "Amounts and totals calculate for you" },
    ],
  },
  {
    id: "roofing-supplement-template",
    title: "Roofing supplement template",
    description: "The five-part package: cover page, findings summary, findings with photo numbers, line items and sign-off, plus a before-you-send checklist.",
    guideHref: "/blog/roofing-supplement-template",
    guideLabel: "How to use it",
    preview: { src: "/templates/previews/roofing-supplement-template-preview.jpg", alt: "First page of the free roofing supplement template (PDF version), a blank form ready to fill in", width: 900, height: 1165 },
    files: [
      { format: "PDF", href: "/downloads/roofing-supplement-template.pdf", note: "Print and fill in by hand" },
      { format: "Fillable PDF", href: "/downloads/roofing-supplement-template-fillable.pdf", note: "Type into it on screen, then save or print" },
      { format: "Word", href: "/downloads/roofing-supplement-template.docx", note: "Edit on your computer" },
    ],
  },
  {
    id: "roof-damage-report-template",
    title: "Roof damage report template",
    description: "Job details, roof summary, numbered findings, recommendations, a photo index and a photo checklist.",
    guideHref: "/blog/roof-damage-report-template",
    guideLabel: "How to write each section",
    preview: { src: "/templates/previews/roof-damage-report-template-preview.jpg", alt: "First page of the free roof damage report template (PDF version), a blank form ready to fill in", width: 900, height: 1165 },
    files: [
      { format: "PDF", href: "/downloads/roof-damage-report-template.pdf", note: "Print and fill in by hand" },
      { format: "Fillable PDF", href: "/downloads/roof-damage-report-template-fillable.pdf", note: "Type into it on screen, then save or print" },
      { format: "Word", href: "/downloads/roof-damage-report-template.docx", note: "Edit on your computer" },
    ],
  },
  {
    id: "roof-repair-estimate-template",
    title: "Roof repair estimate template",
    description: "For a limited repair rather than a full replacement: the problem, the repair scope, line items, what could change the price, terms and a signature line.",
    guideHref: "/blog/roof-repair-estimate-template",
    guideLabel: "How to fill it in",
    preview: { src: "/templates/previews/roof-repair-estimate-template-preview.jpg", alt: "First page of the free roof repair estimate template (PDF version), a blank form ready to fill in", width: 900, height: 1165 },
    files: [
      { format: "PDF", href: "/downloads/roof-repair-estimate-template.pdf", note: "Print and fill in by hand" },
      { format: "Fillable PDF", href: "/downloads/roof-repair-estimate-template-fillable.pdf", note: "Type into it on screen, then save or print" },
      { format: "Word", href: "/downloads/roof-repair-estimate-template.docx", note: "Edit on your computer" },
    ],
  },
  {
    id: "good-better-best-roofing-proposal-template",
    title: "Good, better, best roofing proposal template",
    description: "Three options side by side with a comparison table, shared scope, terms and a place for the customer to choose and sign.",
    guideHref: "/blog/good-better-best-roofing-proposal-template",
    guideLabel: "How to build the three options",
    preview: { src: "/templates/previews/good-better-best-roofing-proposal-template-preview.jpg", alt: "First page of the free good, better, best roofing proposal template (PDF version), a blank form ready to fill in", width: 900, height: 1165 },
    files: [
      { format: "PDF", href: "/downloads/good-better-best-roofing-proposal-template.pdf", note: "Print and fill in by hand" },
      { format: "Fillable PDF", href: "/downloads/good-better-best-roofing-proposal-template-fillable.pdf", note: "Type into it on screen, then save or print" },
      { format: "Word", href: "/downloads/good-better-best-roofing-proposal-template.docx", note: "Edit on your computer" },
    ],
  },
  {
    id: "roofing-supplement-tracker",
    title: "Roofing supplement tracker",
    description: "One line per supplement: claim, carrier, date sent, follow-up date, status and amount asked, with a weekly checklist.",
    guideHref: "/blog/roofing-supplement-tracker-template",
    guideLabel: "How to keep it up to date",
    preview: { src: "/templates/previews/roofing-supplement-tracker-preview.jpg", alt: "First page of the free roofing supplement tracker (PDF version), a blank form ready to fill in", width: 900, height: 1165 },
    files: [
      { format: "PDF", href: "/downloads/roofing-supplement-tracker.pdf", note: "Print and fill in by hand" },
      { format: "Fillable PDF", href: "/downloads/roofing-supplement-tracker-fillable.pdf", note: "Type into it on screen, then save or print" },
      { format: "Word", href: "/downloads/roofing-supplement-tracker.docx", note: "Edit on your computer" },
    ],
  },
  {
    id: "roof-tear-off-findings-log",
    title: "Roof tear-off findings log",
    description: "A log for the roof: where each finding is, what it is, how much, and which photos show it, with a checklist before you leave.",
    guideHref: "/blog/roof-tear-off-findings-log-template",
    guideLabel: "How to use it on a job",
    preview: { src: "/templates/previews/roof-tear-off-findings-log-preview.jpg", alt: "First page of the free roof tear-off findings log (PDF version), a blank form ready to fill in", width: 900, height: 1165 },
    files: [
      { format: "PDF", href: "/downloads/roof-tear-off-findings-log.pdf", note: "Print and fill in by hand" },
      { format: "Fillable PDF", href: "/downloads/roof-tear-off-findings-log-fillable.pdf", note: "Type into it on screen, then save or print" },
      { format: "Word", href: "/downloads/roof-tear-off-findings-log.docx", note: "Edit on your computer" },
    ],
  },
  {
    id: "roofing-crew-documentation-checklist",
    title: "Roofing crew documentation checklist",
    description: "A one-page routine for before tear-off, during tear-off and before the crew leaves.",
    guideHref: "/blog/roofing-crew-supplement-documentation-sop",
    guideLabel: "How to roll it out to your crew",
    preview: { src: "/templates/previews/roofing-crew-documentation-checklist-preview.jpg", alt: "First page of the free roofing crew documentation checklist (PDF version), a blank form ready to fill in", width: 900, height: 1165 },
    files: [
      { format: "PDF", href: "/downloads/roofing-crew-documentation-checklist.pdf", note: "Print and fill in by hand" },
      { format: "Fillable PDF", href: "/downloads/roofing-crew-documentation-checklist-fillable.pdf", note: "Type into it on screen, then save or print" },
      { format: "Word", href: "/downloads/roofing-crew-documentation-checklist.docx", note: "Edit on your computer" },
    ],
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
