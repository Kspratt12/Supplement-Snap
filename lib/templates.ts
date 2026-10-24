/**
 * Free downloadable templates. The files live in public/downloads and are built
 * by scripts/build-templates.mjs. The article download boxes, the templates
 * page and the tests all read from this list, so a file cannot be linked in one
 * place and missing in another.
 */

export interface TemplateFile {
  format: "PDF" | "Word" | "Excel"
  href: string
  /** What the visitor gets, in a few words. */
  note: string
}

export interface Template {
  id: string
  title: string
  description: string
  /** The guide that explains how to use it. */
  guideHref: string
  guideLabel: string
  files: TemplateFile[]
}

export const TEMPLATES: Template[] = [
  {
    id: "roofing-estimate-template",
    title: "Roofing estimate template",
    description: "Company details, scope of work, line items, other charges, terms and a signature line. Totals calculate in the Excel version.",
    guideHref: "/blog/roofing-estimate-template",
    guideLabel: "How to fill it in",
    files: [
      { format: "PDF", href: "/downloads/roofing-estimate-template.pdf", note: "Print and fill in by hand" },
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
    files: [
      { format: "PDF", href: "/downloads/roofing-supplement-template.pdf", note: "Print and fill in by hand" },
      { format: "Word", href: "/downloads/roofing-supplement-template.docx", note: "Edit on your computer" },
    ],
  },
  {
    id: "roof-damage-report-template",
    title: "Roof damage report template",
    description: "Job details, roof summary, numbered findings, recommendations, a photo index and a photo checklist.",
    guideHref: "/blog/roof-damage-report-template",
    guideLabel: "How to write each section",
    files: [
      { format: "PDF", href: "/downloads/roof-damage-report-template.pdf", note: "Print and fill in by hand" },
      { format: "Word", href: "/downloads/roof-damage-report-template.docx", note: "Edit on your computer" },
    ],
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
