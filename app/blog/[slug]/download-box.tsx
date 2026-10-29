"use client"

import { trackEvent } from "../../../lib/analytics"
import type { Template } from "../../../lib/templates"

/** Free download buttons for a template. Plain links to the files, no sign-up. */
export function DownloadBox({ template, showHubLink = false, showPreview = false }: { template: Template; showHubLink?: boolean; showPreview?: boolean }) {
  return (
    <div className="my-8 flex flex-col gap-5 rounded-xl border border-indigo-200 bg-indigo-50 p-5 sm:flex-row" data-testid="download-box">
      {showPreview && (
        <a href={template.guideHref} className="mx-auto block w-40 shrink-0 sm:mx-0 sm:w-44" data-testid="download-preview" aria-label={`${template.title}: ${template.guideLabel}`}>
          <img
            src={template.preview.src}
            alt={template.preview.alt}
            width={template.preview.width}
            height={template.preview.height}
            className="h-auto w-full rounded border border-zinc-200 bg-white shadow"
            loading="lazy"
          />
        </a>
      )}
      <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Free download</p>
      <h3 className="mt-1 text-lg font-bold text-zinc-900">{template.title}</h3>
      <p className="mt-1 text-sm text-zinc-600">{template.description}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {template.files.map((f) => (
          <a
            key={f.href}
            href={f.href}
            download
            onClick={() => trackEvent("cta_click", { location: `template-download-${template.id}-${f.format.toLowerCase().replace(/\s+/g, "-")}`, target: f.href })}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Download {f.format}
            <span className="block text-[11px] font-normal text-indigo-100">{f.note}</span>
          </a>
        ))}
      </div>
      {template.files.some((f) => f.format === "Fillable PDF") && (
        <p className="mt-3 text-xs text-zinc-700">Fillable PDF: open it in a PDF reader such as Adobe Acrobat Reader to type into the blanks. Some phone and browser previews cannot.</p>
      )}
      {showHubLink && (
        <p className="mt-3 text-sm">
          <a href="/free-roofing-templates" className="font-medium text-indigo-600 underline hover:text-indigo-800">See all free roofing templates &rarr;</a>
        </p>
      )}
      <p className="mt-3 text-xs text-zinc-700">No email or sign-up needed. General guidance, not legal advice. Adjust it to your carrier&apos;s, client&apos;s and state&apos;s requirements.</p>
      </div>
    </div>
  )
}
