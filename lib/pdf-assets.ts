/**
 * A report is evidence sent to an adjuster, so one that is quietly missing its photos is worse than no report.
 * While building the PDF the page counts every picture it asked for and could not get; this turns that count into
 * a plain message, or null when nothing is missing.
 */
export type MissingPdfAssets = { photos: number; logo: boolean; diagram: boolean }

/**
 * A PDF or CSV that fails for a reason we did not anticipate must say so, never fail silently or look like it worked.
 * The message names the failure and the next step only: no error text, stack trace or customer data.
 */
export function describeExportFailure(kind: "pdf" | "csv"): string {
  const what = kind === "pdf" ? "The PDF" : "The CSV"
  return `${what} could not be created, so no file was saved. Try again in a moment. If it keeps happening, email support@supplementsnap.io.`
}

export const noMissingPdfAssets = (): MissingPdfAssets => ({ photos: 0, logo: false, diagram: false })

export function describeMissingPdfAssets(missing: MissingPdfAssets, action: "download" | "email"): string | null {
  const parts: string[] = []
  if (missing.photos > 0) parts.push(missing.photos === 1 ? "1 photo" : `${missing.photos} photos`)
  if (missing.diagram) parts.push("the roof diagram")
  if (missing.logo) parts.push("your company logo")
  if (parts.length === 0) return null
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
  const outcome = action === "email" ? "Nothing was sent." : "No file was saved."
  return `The report was not created because ${list} could not be loaded. ${outcome} Check your connection and try again in a moment.`
}
