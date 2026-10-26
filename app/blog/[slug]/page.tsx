import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteFooter } from "../../../lib/site-footer"
import { NavLinks } from "../../../lib/nav-links"
import { ScrollToTop } from "../../../lib/scroll-to-top"
import { TrackedLink } from "../../../lib/tracked-link"
import { DownloadBox } from "./download-box"
import { getTemplate } from "../../../lib/templates"

type BlogImage = { src: string; alt: string; width?: number; height?: number }
type Visual = { type: "stats" | "steps" | "codes" | "compare" | "checklist" | "timeline" | "calculator" | "tip" | "damage-cards" | "matrix"; data: any }

type Article = {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  publishedDate: string
  highlight?: { label: string; value: string; subtext: string }
  images?: Record<number, BlogImage>
  visuals?: Record<number, Visual>
  midCtaAfter?: number
  /** id from lib/templates.ts: shows a free download box after the first section */
  downloads?: string
  midCtaTitle?: string
  midCtaBody?: string
  midCtaCodes?: boolean
  sections: Array<{ heading: string; content: string }>
  externalLinks?: Array<{ text: string; url: string }>
  updatedDate?: string
  faq?: Array<{ q: string; a: string }>
  related?: string[]
}

/* ── Visual Components ── */

function StatsGrid({ items }: { items: Array<{ label: string; value: string; color?: string }> }) {
  return (
    <div className="my-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
          <p className={`text-2xl font-extrabold ${item.color || "text-indigo-600"}`}>{item.value}</p>
          <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

function StepsFlow({ items }: { items: Array<{ num: string; title: string; desc: string }> }) {
  return (
    <div className="my-8 space-y-4">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
            {item.num}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CodesTable({ items }: { items: Array<{ code: string; desc: string; unit: string; price: string; href?: string }> }) {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200">
            <th className="px-4 py-3 text-left font-semibold text-zinc-900 whitespace-nowrap">Code</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-900">Description</th>
            <th className="px-4 py-3 text-center font-semibold text-zinc-900 whitespace-nowrap">Unit</th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-900 whitespace-nowrap">Avg Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((item, i) => (
            <tr key={i} className="bg-white">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{item.href ? <a href={item.href} className="underline decoration-dotted underline-offset-2 hover:text-indigo-500">{item.code}</a> : item.code}</td>
              <td className="px-4 py-3 text-zinc-600">{item.desc}</td>
              <td className="px-4 py-3 text-center text-zinc-500">{item.unit}</td>
              <td className="px-4 py-3 text-right font-semibold text-zinc-900">{item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompareCard({ before, after }: { before: { label: string; items: string[] }; after: { label: string; items: string[] } }) {
  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          <h3 className="text-sm font-bold text-red-700">{before.label}</h3>
        </div>
        <ul className="mt-3 space-y-2">
          {before.items.map((item, i) => (
            <li key={i} className="text-sm text-red-700">{item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <h3 className="text-sm font-bold text-green-700">{after.label}</h3>
        </div>
        <ul className="mt-3 space-y-2">
          {after.items.map((item, i) => (
            <li key={i} className="text-sm text-green-700">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ChecklistCard({ title, items }: { title: string; items: Array<{ text: string; checked: boolean }> }) {
  return (
    <div className="my-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${item.checked ? "bg-green-100" : "bg-zinc-100"}`}>
              {item.checked ? (
                <svg className="h-3.5 w-3.5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <div className="h-2 w-2 rounded-full bg-zinc-300" />
              )}
            </div>
            <span className={`text-sm ${item.checked ? "text-zinc-900" : "text-zinc-500"}`}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineVisual({ items }: { items: Array<{ time: string; title: string; desc: string; color?: string }> }) {
  return (
    <div className="my-8">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold whitespace-nowrap ${item.color === "green" ? "bg-green-100 text-green-700" : item.color === "red" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>{item.time}</span>
              <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
            </div>
            <p className="text-sm text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalculatorCard({ title, rows, total }: { title: string; rows: Array<{ label: string; value: string }>; total: { label: string; value: string; color?: string } }) {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
      <div className="bg-zinc-50 px-5 py-3 border-b border-zinc-200">
        <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
      </div>
      <div className="divide-y divide-zinc-100">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-3">
            <span className="text-sm text-zinc-600">{row.label}</span>
            <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap">{row.value}</span>
          </div>
        ))}
      </div>
      <div className={`flex items-center justify-between px-5 py-4 ${total.color === "green" ? "bg-green-50" : "bg-indigo-50"}`}>
        <span className={`text-sm font-bold ${total.color === "green" ? "text-green-700" : "text-indigo-700"}`}>{total.label}</span>
        <span className={`text-lg font-extrabold ${total.color === "green" ? "text-green-700" : "text-indigo-700"}`}>{total.value}</span>
      </div>
    </div>
  )
}

function TipBox({ type, title, text }: { type: "tip" | "warning" | "info"; title: string; text: string }) {
  const styles = {
    tip: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-700", title: "text-green-800", text: "text-green-700" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", title: "text-amber-800", text: "text-amber-700" },
    info: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", title: "text-blue-800", text: "text-blue-700" },
  }
  const s = styles[type]
  return (
    <div className={`my-6 rounded-xl border ${s.border} ${s.bg} p-5`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {type === "tip" && <svg className={`h-5 w-5 ${s.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
          {type === "warning" && <svg className={`h-5 w-5 ${s.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          {type === "info" && <svg className={`h-5 w-5 ${s.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        </div>
        <div>
          <h3 className={`text-sm font-bold ${s.title}`}>{title}</h3>
          <p className={`mt-1 text-sm ${s.text}`}>{text}</p>
        </div>
      </div>
    </div>
  )
}

function DamageCards({ items }: { items: Array<{ icon: string; title: string; desc: string; value: string }> }) {
  const iconColors: Record<string, { bg: string; text: string }> = {
    decking: { bg: "bg-amber-50", text: "text-amber-600" },
    flashing: { bg: "bg-red-50", text: "text-red-500" },
    ice: { bg: "bg-blue-50", text: "text-blue-600" },
    pipe: { bg: "bg-purple-50", text: "text-purple-600" },
    drip: { bg: "bg-teal-50", text: "text-teal-600" },
    layers: { bg: "bg-orange-50", text: "text-orange-600" },
    wind: { bg: "bg-cyan-50", text: "text-cyan-600" },
    hail: { bg: "bg-indigo-50", text: "text-indigo-600" },
  }
  return (
    <div className="my-8 grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => {
        const c = iconColors[item.icon] || { bg: "bg-zinc-50", text: "text-zinc-600" }
        return (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg}`}>
                  <svg className={`h-5 w-5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.19A1.5 1.5 0 015.5 10.7V7.8a1.5 1.5 0 01.536-1.15l5.384-3.19a1.5 1.5 0 011.56 0l5.384 3.19A1.5 1.5 0 0118.5 7.8v2.9a1.5 1.5 0 01-.536 1.15l-5.384 3.19a1.5 1.5 0 01-1.56 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
              </div>
              <span className="text-sm font-extrabold text-indigo-600">{item.value}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{item.desc}</p>
          </div>
        )
      })}
    </div>
  )
}

function ComparisonMatrix({ headers, rows, label = "Feature" }: { headers: string[]; rows: Array<{ feature: string; values: Array<boolean | string> }>; label?: string }) {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200">
            <th className="px-4 py-3 text-left font-semibold text-zinc-900">{label}</th>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-center font-semibold text-zinc-900">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row, i) => (
            <tr key={i} className="bg-white">
              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">{row.feature}</td>
              {row.values.map((val, j) => (
                <td key={j} className="px-4 py-3 text-center">
                  {val === true ? (
                    <svg className="mx-auto h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : val === false ? (
                    <span className="text-zinc-300">-</span>
                  ) : (
                    <span className="text-sm text-zinc-700">{val}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VisualBlock({ visual }: { visual: Visual }) {
  switch (visual.type) {
    case "stats": return <StatsGrid items={visual.data} />
    case "steps": return <StepsFlow items={visual.data} />
    case "codes": return <CodesTable items={visual.data} />
    case "compare": return <CompareCard before={visual.data.before} after={visual.data.after} />
    case "checklist": return <ChecklistCard title={visual.data.title} items={visual.data.items} />
    case "timeline": return <TimelineVisual items={visual.data} />
    case "calculator": return <CalculatorCard title={visual.data.title} rows={visual.data.rows} total={visual.data.total} />
    case "tip": return <TipBox type={visual.data.type} title={visual.data.title} text={visual.data.text} />
    case "damage-cards": return <DamageCards items={visual.data} />
    case "matrix": return <ComparisonMatrix headers={visual.data.headers} rows={visual.data.rows} label={visual.data.label} />
    default: return null
  }
}

const ARTICLES: Article[] = [
  {
    slug: "how-to-write-a-roofing-supplement",
    images: { 0: { src: "/blog/how-to-write-a-roofing-supplement/card.png", alt: "Key points from the guide: How to Write a Roofing Supplement That Gets Approved", width: 1200, height: 630 } },
    downloads: "roofing-supplement-template",
    title: "How to Write a Roofing Supplement That Gets Approved",
    metaTitle: "How to Write a Roofing Supplement (Step-by-Step Guide)",
    metaDescription: "Learn how to write a roofing supplement adjusters approve. Step-by-step guide with documentation tips, Xactimate codes and common mistakes to avoid.",
    publishedDate: "2026-01-06",
    externalLinks: [
      { text: "NRCA Roofing Manual: Best Practices", url: "https://www.nrca.net" },
      { text: "Verisk Xactimate Official Site", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    highlight: { label: "Example Recovery Range", value: "$1,500–$3,200", subtext: "Illustrative range, not a guarantee. Results vary by claim." },
    visuals: {
      1: { type: "compare", data: {
        before: { label: "Why Supplements Get Denied", items: ["Blurry or missing photos", "No written narrative", "Submitted weeks late", "Vague descriptions", "No building code references"] },
        after: { label: "What Gets Approved", items: ["Clear photos with context + detail", "Professional damage narrative", "Submitted same day", "Specific measurements and locations", "Building code citations included"] },
      }},
      4: { type: "codes", data: [
        { code: "RFG SHTHN", desc: "Sheathing, plywood/OSB", unit: "SF", price: "$2.18" },
        { code: "RFG RFLT30", desc: "Roofing felt, 30#", unit: "SF", price: "$0.52" },
        { code: "RFG FLSH", desc: "Step/counter flashing", unit: "LF", price: "$8.75" },
        { code: "RFG VENT", desc: "Pipe jack/boot", unit: "EA", price: "$85.00" },
        { code: "RFG DRIP", desc: "Drip edge, aluminum", unit: "LF", price: "$4.25" },
        { code: "RFG I&WS", desc: "Ice & water shield", unit: "SF", price: "$1.85" },
        { code: "RFG TEAR", desc: "Remove additional layer", unit: "SQ", price: "$45.00" },
      ]},
    },
    updatedDate: "2026-10-22",
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["how-to-write-roofing-supplements-faster", "roofing-supplement-mistakes-that-delay-payment", "roofing-supplement-email-to-adjuster", "what-can-you-supplement-on-a-roof-claim", "roofing-supplement-template","roofing-supplement-denied-what-to-do","xactimate-codes-for-roofing-supplements","roofing-photo-documentation-checklist", "best-roofing-supplement-software"],
    faq: [
      {
        "q": "Do I need Xactimate to submit a roofing supplement?",
        "a": "No. You can submit a clear written supplement with photos, measurements and line items. Many contractors still format items the way Xactimate does because adjusters work in that format and it speeds up review."
      },
      {
        "q": "How long does a roofing supplement take to get approved?",
        "a": "It depends on the carrier, the size of the supplement and how complete your documentation is. Complete, well-organized packages are usually reviewed faster than ones that require follow-up questions."
      },
      {
        "q": "Can a homeowner submit a supplement instead of the contractor?",
        "a": "Yes, a homeowner can ask the carrier to review additional damage, but contractors usually submit because they have the photos, measurements and technical detail."
      },
      {
        "q": "What if the insurance company only pays part of my supplement?",
        "a": "Compare the approved items to your request, identify what was cut and why, and respond in writing with the specific photo or measurement that supports each cut item."
      },
      {
        "q": "Can I add a supplement after the job is finished?",
        "a": "It is much harder. The evidence is covered and the adjuster cannot verify it. Document and submit while the damage is still visible."
      }
    ],
    sections: [
      {
        heading: "What is a roofing supplement?",
        content: "A roofing supplement is a request for additional payment beyond the original insurance estimate. When your crew tears off an existing roof and discovers concealed damage (rotted decking, failed flashing, missing ice and water shield, deteriorated pipe boots), that damage wasn't visible during the initial adjuster inspection. The supplement documents this hidden damage and requests the insurance carrier to cover the cost of repairing it.\n\nSupplements are one of the most overlooked revenue opportunities in roofing. Many contractors skip supplements or submit weak documentation that gets denied, even when the hidden damage is real."
      },
      {
        heading: "Why most roofing supplements get denied",
        content: "The number one reason supplements get denied is insufficient documentation. An adjuster who wasn't on your roof needs to see clear evidence of concealed damage. If your supplement is just a line item in Xactimate with no photos, no description of where the damage was found, and no explanation of why it wasn't visible before tear-off, it's going to be denied.\n\nOther common reasons for denial include submitting too late (weeks after the job), using vague descriptions like 'additional work needed,' not referencing building codes that require the repair, and failing to explain why the damage was concealed."
      },
      {
        heading: "Step 1: Document damage during tear-off",
        content: "The most important step happens on the roof during tear-off. When your crew discovers hidden damage, they need to capture it immediately, before it gets covered up by new materials.\n\nFor each finding, document:\n\n• Clear photographs showing the damage in context (wide shot) and up close (detail shot)\n• The exact location on the roof (front slope, back slope, valley, chimney, eave, ridge)\n• The type of damage (rotted decking, corroded flashing, missing ice and water shield, deteriorated pipe boot)\n• A description of the condition (how many sheets of decking, how many linear feet of flashing, etc.)\n• Measurements when possible: square footage of affected area, number of sheets to replace\n\nThis is where most contractors fail. The crew finds damage, maybe takes a blurry photo, texts it to the office, and by the time someone writes up the supplement days later, half the details are lost or forgotten."
      },
      {
        heading: "Step 2: Write a professional supplement narrative",
        content: "The supplement narrative is the written explanation that accompanies your photos and Xactimate line items. This is what the adjuster reads to understand what was found and why it needs to be covered.\n\nA strong supplement narrative should include:\n\n• A statement that the damage was concealed and not visible during the initial inspection\n• A description of when and how the damage was discovered (during tear-off operations)\n• Specific details about the damage: type, location, extent, measurements\n• An explanation of why the repair is necessary (structural integrity, building code compliance, manufacturer warranty requirements)\n• Reference to applicable building codes when relevant (e.g., ice and water shield requirements in valleys and eaves)\n\nAvoid vague language. Instead of 'decking was damaged,' write 'Three sheets of 1/2-inch CDX plywood along the eave edge of the front slope were found to be severely deteriorated from prolonged moisture exposure. The wood was soft and crumbling upon removal of the existing shingles, indicating concealed water damage not visible during the initial inspection.'"
      },
      {
        heading: "Step 3: Map to Xactimate line codes",
        content: "Insurance adjusters work in Xactimate. If you want your supplement approved quickly, submit it in their language. Each type of damage maps to specific Xactimate line codes:\n\n• Decking replacement: RFG SHTHN (sheathing - plywood/OSB)\n• Felt/underlayment: RFG RFLT30 (30# roofing felt)\n• Step flashing: RFG FLSH (flashing - step/counter)\n• Pipe boots: RFG VENT (roof vent - pipe jack)\n• Drip edge: RFG DRIP (drip edge - aluminum)\n• Ice and water shield: RFG I&WS (ice & water membrane)\n• Additional layer removal: RFG TEAR (remove additional layer)\n\nInclude accurate quantities and measurements. A supplement that says '1 SQ of decking' when photos show three full sheets of plywood gets flagged. Be precise."
      },
      {
        heading: "Step 4: Submit with photos and PDF report",
        content: "Package everything into a clean, professional report. The best supplement submissions include:\n\n• A cover page with project name, property address, date, insurance company, and claim number\n• Each finding with its photos, description, and supplement narrative\n• A findings summary table\n• Supporting photos labeled with what they show\n• A certification statement that the damage was concealed and discovered during tear-off\n\nEmail the report directly to the adjuster the same day you find the damage. Speed matters. The sooner you submit, the fresher the documentation, and the faster you get paid."
      },
      {
        heading: "What adjusters look for when they review a supplement",
        content: "An adjuster reviewing a supplement is asking one question: can I verify this without a site visit? Anything that forces a phone call, a second inspection or a manager's sign-off slows the decision down or ends in a denial.\n\nIn practice they check four things:\n\n• The damage is real: Clear photos that show the condition up close and in context.\n• The damage was hidden: Evidence that it could not be seen during the first inspection, usually because shingles or underlayment covered it.\n• The scope is reasonable: Quantities that match the photos and the roof measurements.\n• The item is covered: A line item and a reason that fit the policy and the local building code.\n\nWrite every supplement so those four answers are on the first page. If the adjuster has to hunt for them, the supplement is at risk.",
      },
      {
        heading: "A supplement narrative you can adapt",
        content: "The narrative is the short written explanation that sits beside each photo. It should be factual, specific and free of opinion. A simple structure works well for every finding:\n\n1. What was found: Name the component and the condition, for example rotted OSB decking along the eave.\n2. Where it was found: Slope, area and approximate measurements.\n3. When it was found: During tear-off, after the shingles and underlayment were removed.\n4. Why it matters: Water intrusion, a code requirement or a manufacturer requirement.\n5. What is needed: The repair and the quantity.\n\nExample: During tear-off of the front slope, three sheets of OSB decking along the eave were found soft and deteriorated from prolonged moisture exposure. The damage was concealed beneath the existing shingles and underlayment. The decking cannot hold fasteners and must be replaced before new underlayment is installed. Photos 4 through 7 show the condition.\n\nNotice what is missing: no blame, no guesses about how long the damage existed and no emotional language. Adjusters respond to facts.",
      },
      {
        heading: "Common supplement items and when each one applies",
        content: "Most roofing supplements come from the same short list. Knowing when each item applies keeps you from missing money and from claiming items that do not fit the job.\n\n• Decking replacement: Rotted, delaminated or damaged sheathing found after tear-off.\n• Flashing: Corroded, separated or missing step flashing, counter flashing or valley metal.\n• Ice and water barrier: Required by code in many climates at eaves and valleys, and often missing on older roofs.\n• Pipe jacks and vents: Cracked or failed boots that cannot be reused.\n• Drip edge: Missing or non-compliant drip edge where code requires it.\n• Extra layers: A second layer of shingles that adds tear-off and disposal.\n• Code-required upgrades: Items required by the local building authority, which depend on the policy having the right coverage. See our guide to <a href='/blog/roofing-code-upgrades-ordinance-and-law'>code upgrades and Ordinance and Law coverage</a>.\n\nFor line codes and units, use our <a href='/blog/xactimate-codes-for-roofing-supplements'>Xactimate codes reference</a>.",
      },
      {
        heading: "Supplement, change order or new claim? Know the difference",
        content: "These three terms get mixed up, and using the wrong one causes delays.\n\n• Supplement: A request for additional payment on an existing claim, for damage or costs that were not in the original estimate.\n• Change order: A change to the contract between you and the homeowner. It does not automatically change what the insurance company pays.\n• New claim: A separate loss event. A supplement cannot be used to add unrelated damage from a different storm.\n\nA supplement is tied to the original claim number and the original cause of loss. If the damage you found was caused by something unrelated to the covered event, such as long-term neglect or an old leak, the carrier may not owe it. Document why the hidden damage connects to the covered loss, and be honest about what you cannot prove.",
      },
      {
        heading: "Timing: when to submit and how to follow up",
        content: "Submit the supplement as soon as the damage is documented, ideally the same day. Fresh photos, clear dates and an open job site all help. A supplement sent weeks later looks like an afterthought, and the evidence may already be covered by new underlayment.\n\nAfter you submit:\n\n1. Confirm receipt: Ask for the name of the person handling it and a reference number.\n2. Put dates on everything: Record when you sent it, how, and what was attached.\n3. Follow up in writing: A short email beats a voicemail because it creates a record.\n4. Keep the job moving: Ask what the carrier needs, not just whether it is approved.\n\nResponse times vary by carrier and by claim volume, especially after a major storm, so ask the adjuster what to expect instead of assuming. If a decision stalls, our guide on <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a supplement is denied or ignored</a> covers the escalation steps.",
      },
      {
        heading: "How Supplement Snap automates this process",
        content: "Supplement Snap was built to solve this exact workflow. Your crew captures damage photos during tear-off, tags the damage type and roof area, and adds a voice note describing what they found (works in any language; Spanish voice notes are auto-translated to English).\n\nThe system uses AI to generate a professional supplement narrative from the field data. You can export an Xactimate-formatted CSV with suggested line codes and pricing, and email a complete PDF report to the adjuster, all from the field, the same day.\n\nOne tap from the roof to a professional supplement submission. No more lost photos, forgotten details, or supplements that sit in the office for weeks.\n\nFor a complete list of Xactimate codes to use in your supplements, see our <a href='/blog/xactimate-codes-for-roofing-supplements'>Xactimate codes reference guide</a>."
      },
    ],
  },
  {
    slug: "roofing-supplement-denied-what-to-do",
    images: { 0: { src: "/blog/roofing-supplement-denied-what-to-do/card.png", alt: "Key points from the guide: Roofing Supplement Denied? Here's What to Do Next", width: 1200, height: 630 } },
    downloads: "roofing-supplement-tracker",
    title: "Roofing Supplement Denied? Here's What to Do Next",
    metaTitle: "Roofing Supplement Denied? What to Do Next",
    metaDescription: "Your roofing supplement was denied. Here's what to do next, from re-documenting damage to appeals and preventing future denials.",
    publishedDate: "2026-01-13",
    externalLinks: [
      { text: "National Association of Insurance Commissioners (NAIC)", url: "https://www.naic.org" },
      { text: "NRCA: Contractor Resources", url: "https://www.nrca.net" },
    ],
    highlight: { label: "What Helps Most", value: "Clear photos and notes", subtext: "Reviewers can only act on what the documentation shows" },
    visuals: {
      1: { type: "steps", data: [
        { num: "1", title: "Review the denial reason", desc: "Read the denial letter carefully. The stated reason tells you exactly what to fix." },
        { num: "2", title: "Gather additional evidence", desc: "Pull together clear photos, measurements, and location details for each finding." },
        { num: "3", title: "Write a stronger narrative", desc: "Address the denial reason directly. Be specific, professional, and reference your photos." },
        { num: "4", title: "Resubmit as a complete package", desc: "Send a fresh PDF report with all evidence. Don't just reply to the denial email." },
      ]},
      4: { type: "compare", data: {
        before: { label: "Why It Was Denied", items: ["Blurry photos from camera roll", "No written explanation", "Submitted 3 weeks later", "Generic line items", "No proof damage was concealed"] },
        after: { label: "How to Get It Approved", items: ["Tagged photos with damage type + location", "Professional narrative per finding", "Submitted same day as tear-off", "Correct Xactimate codes + quantities", "Statement that damage was under shingles"] },
      }},
    },
    updatedDate: "2026-10-22",
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["ice-and-water-shield-roofing-supplement", "insurance-lowball-roof-estimate-what-to-do", "roof-claim-appraisal-process", "roofing-supplement-mistakes-that-delay-payment", "roof-claim-reinspection-request", "how-to-write-a-roofing-supplement","roofing-supplement-follow-up-log","roofing-photo-documentation-checklist","roofing-supplement-template", "roofing-supplement-companies-vs-software"],
    faq: [
      {
        "q": "Can I resubmit a denied roofing supplement?",
        "a": "Yes. A strong resubmission answers the stated denial reason directly with new or clearer evidence instead of repeating the original package."
      },
      {
        "q": "How do I appeal a denied roofing supplement?",
        "a": "Respond in writing item by item, attach the supporting photo or measurement for each, and request a reinspection or supervisor review if the dispute is about what the damage looks like."
      },
      {
        "q": "What if the insurance company says the damage is pre-existing?",
        "a": "Document why the condition is consistent with the covered event, compare it to undamaged areas, and ask the adjuster to explain what evidence they used to classify it as pre-existing."
      },
      {
        "q": "Is a public adjuster worth it for a denied supplement?",
        "a": "It can be on larger disputes. Public adjusters generally take a percentage of the recovery, so compare that cost to the amount in dispute."
      },
      {
        "q": "How long do I have to dispute a denial?",
        "a": "It depends on your policy and your state. Check the denial letter and the policy for deadlines as soon as you receive it."
      }
    ],
    sections: [
      {
        heading: "Why your roofing supplement was denied",
        content: "Getting a supplement denied is frustrating, especially when you know the damage is real and the repair was necessary. But understanding why it was denied is the first step to getting it approved on appeal or preventing it from happening on the next job.\n\nThe most common denial reasons are:\n\n• Insufficient documentation: photos are blurry, too few, or don't show the damage clearly\n• Vague or missing narrative: no written explanation of what was found and why it should be covered\n• Late submission: the supplement was filed weeks or months after the work was done\n• Not clearly concealed: the adjuster argues the damage should have been visible during the initial inspection\n• Incorrect Xactimate codes: line items don't match what's standard for the repair\n• Missing building code reference: the repair is required by code but you didn't cite it"
      },
      {
        heading: "Step 1: Review the denial reason",
        content: "Read the denial letter carefully. Insurance companies are required to state why the supplement was denied. The reason tells you exactly what to fix in your appeal.\n\nIf the denial says 'insufficient documentation,' you need better photos and a more detailed narrative. If it says 'pre-existing damage,' you need to explain why the damage was concealed and couldn't have been identified before tear-off. If it says 'not in scope,' you may need to reference building codes that require the repair."
      },
      {
        heading: "Step 2: Gather additional evidence",
        content: "Go back to your documentation. Do you have:\n\n• Clear photos of the damage taken during tear-off?\n• Photos showing the damage was under the existing shingles/materials (proving concealment)?\n• Measurements and quantities?\n• A description of the location on the roof?\n\nIf your original documentation was weak, this is why tools like Supplement Snap exist. They force proper documentation at the point of discovery, so you never end up in this situation."
      },
      {
        heading: "Step 3: Write a stronger narrative",
        content: "Your appeal narrative should directly address the denial reason. If the adjuster said 'insufficient evidence of concealed damage,' your narrative should explain:\n\n• The damage was located beneath existing roofing materials and could not be identified during a standard visual inspection\n• The damage was discovered during tear-off operations on [specific date]\n• Attached photos show the condition of the area after removal of existing materials\n• The repair is necessary to restore the roof system to its pre-loss condition\n\nBe specific, be professional, and reference your photos by number."
      },
      {
        heading: "Step 4: Resubmit with a complete package",
        content: "Resubmit the supplement as a complete package, not just a reply to the denial. Include a fresh PDF report with all photos, narratives, Xactimate line items, and a cover letter referencing the original claim number and explaining why the supplement should be reconsidered.\n\nRequest a re-inspection if the denial was based on the adjuster not seeing the damage. You may also escalate to a supervisor or file a complaint with your state's Department of Insurance if you believe the denial was unjustified."
      },
      {
        heading: "Common denial reasons and the evidence that answers each",
        content: "A denial is rarely random. Carriers usually give one of a handful of reasons, and each one has a matching kind of evidence.\n\n• Damage not related to the covered loss: Show timing, location and condition that tie the damage to the storm or event, and photograph surrounding areas for context.\n• Pre-existing or wear and tear: Explain why the condition is not simple age. Compare to undamaged areas of the same roof where you can.\n• Insufficient documentation: Add clearer photos, measurements and a written narrative for each finding.\n• Item not covered by the policy: Check the policy language and any endorsements before arguing. Some items, such as code upgrades, depend on specific coverage.\n• Quantity disputed: Provide measurements, a sketch or a measurement report that shows how you arrived at the number.\n• Price disputed: Show that the unit price matches the current price list for your area.\n\nRead the denial letter closely and match each stated reason to the right kind of proof. Responding to the real reason is far more effective than resubmitting the same package.",
      },
      {
        heading: "How to request a reinspection",
        content: "When the disagreement is about what the damage looks like, a second look often resolves it faster than letters. Ask for a reinspection in writing and make it easy to say yes.\n\n1. Offer specific times: Propose two or three windows when you or your crew can meet the adjuster on site.\n2. Keep the damage visible: If possible, hold off covering the area until the adjuster has seen it.\n3. Bring a one-page summary: List each disputed item with its photo number and measurement.\n4. Be polite and factual: You are asking for a review, not accusing anyone.\n\nAfter the visit, send a short email confirming what was discussed and what the adjuster agreed to review. That summary becomes part of the claim record.",
      },
      {
        heading: "Escalating when the first response does not resolve it",
        content: "If a denial stands after you have responded with proper evidence, you have several options. The right one depends on the amount at stake and on your state's rules.\n\n• Ask for a supervisor or claims manager: Front-line adjusters often have limited authority. A manager can sometimes approve items they cannot.\n• Invoke the appraisal clause: Many policies include an appraisal process for disputes about the amount of loss. Read the policy for the exact steps and costs.\n• Contact your state department of insurance: Most states accept complaints about claim handling and have timelines carriers must follow.\n• Bring in a public adjuster: A licensed public adjuster works for the policyholder and typically charges a percentage of the recovery.\n• Consult an attorney: For large or clearly mishandled claims, a lawyer who handles insurance disputes can advise on options.\n\nThis is general information, not legal advice. Rules differ by state and by policy, so confirm the details that apply to your situation.",
      },
      {
        heading: "Watch your deadlines",
        content: "Policies and state laws set time limits for reporting, for submitting additional damage and for responding to claim decisions. Missing one can cost you the right to dispute.\n\nAt the start of every dispute:\n\n• Find the dates: Note the date of loss, the date of the denial and any deadline named in the letter.\n• Check the policy: Look for suit limitation and appraisal deadlines.\n• Calendar the follow-ups: Set reminders for your own response and for the date the carrier should reply.\n\nKeep every email, letter and photo. A clean paper trail is your strongest asset in any dispute.",
      },
      {
        heading: "How to prevent supplement denials in the future",
        content: "The best defense against supplement denials is proper documentation captured in real time during tear-off. This means:\n\n• Photograph every finding immediately with multiple angles, context and detail shots\n• Document the location, damage type, and extent before covering it with new materials\n• Write or record a description of what was found (voice notes work great for this)\n• Submit the supplement the same day. Don't wait.\n• Use Xactimate-standard line codes and accurate quantities\n• Reference building codes when the repair is code-required\n\nSupplement Snap automates all of this. Your crew captures damage from the roof, the system generates the documentation, and you email it to the adjuster before the crew leaves the job site.\n\nTo avoid denials in the first place, follow our guide on <a href='/blog/how-to-write-a-roofing-supplement'>how to write a supplement that gets approved</a>."
      },
    ],
  },
  {
    slug: "xactimate-codes-for-roofing-supplements",
    title: "Xactimate Codes for Roofing Supplements: Quick Reference",
    metaTitle: "Xactimate Roofing Supplement List: Codes and Units",
    metaDescription: "Quick-reference Xactimate roofing supplement codes for decking, flashing, ice & water shield, pipe boots and drip edge, with units and proof tips.",
    publishedDate: "2026-01-20",
    externalLinks: [
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
      { text: "NRCA Roofing Standards", url: "https://www.nrca.net" },
    ],
    highlight: { label: "Most Used Code", value: "RFG SHTHN", subtext: "Sheathing replacement. One of the most common supplement line items on tear-offs." },
    midCtaAfter: 0,
    visuals: {
      0: { type: "codes", data: [
        { code: "RFG SHTHN", href: "#decking-and-sheathing-codes", desc: "Sheathing, plywood/OSB, R&R", unit: "SF", price: "$2.18" },
        { code: "RFG RFLT30", href: "#decking-and-sheathing-codes", desc: "Roofing felt, 30#", unit: "SF", price: "$0.52" },
        { code: "RFG FLSH", href: "#flashing-codes", desc: "Step/counter flashing, aluminum", unit: "LF", price: "$8.75" },
        { code: "RFG I&WS", href: "#ice-and-water-shield-codes", desc: "Ice & water shield membrane", unit: "SF", price: "$1.85" },
        { code: "RFG VENT", href: "#vent-and-pipe-boot-codes", desc: "Pipe jack/boot, R&R", unit: "EA", price: "$85.00" },
        { code: "RFG DRIP", href: "#drip-edge-codes", desc: "Drip edge, aluminum, R&R", unit: "LF", price: "$4.25" },
        { code: "RFG TEAR", href: "#additional-layer-removal-codes", desc: "Remove additional layer", unit: "SQ", price: "$45.00" },
        { code: "RFG HAUL", href: "#additional-layer-removal-codes", desc: "Haul debris, additional layer", unit: "SQ", price: "$22.50" },
      ]},
    },
    updatedDate: "2026-10-23",
    related: ["drip-edge-roofing-supplement", "steep-roof-charge-roofing-supplement", "what-can-you-supplement-on-a-roof-claim", "xactimate-roofing-estimate-example","xactimate-roofing-software-explained","xactimate-roofing-estimate-approved","roofing-supplement-template", "best-roofing-supplement-software"],
    faq: [
      {
        "q": "Do I need an Xactimate license to use these codes?",
        "a": "You do not need a license to reference item names in a written supplement, but you need the software to build a native Xactimate estimate. Many contractors submit a clearly formatted document that mirrors Xactimate items."
      },
      {
        "q": "Are Xactimate codes the same everywhere?",
        "a": "Item names are largely consistent, but unit prices come from regional price lists and change over time, so totals differ by location and date."
      },
      {
        "q": "Where do I find the current price list?",
        "a": "The adjuster's estimate shows the price list used for the claim. In Xactimate you select the price list for the project's location and date."
      },
      {
        "q": "Why was my line item rejected even though the code was right?",
        "a": "Usually the quantity or the proof was the problem, not the code. Add a measurement, a labeled photo and a short explanation of why the item applies."
      }
    ],
    sections: [
      {
        heading: "Xactimate roofing supplement list: quick reference",
        content: "This is the short list of line items that come up most often on roofing supplements, with the unit each one is measured in. The prices shown are national-average examples for illustration. Your price list, region and date will differ, so always use the price list named on the adjuster's estimate.\n\nThe sections below explain when each item applies and what proof to attach. If you are assembling a package, run it against the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> before you send it. To see these items laid out in a full package, read the <a href='/blog/xactimate-roofing-estimate-example'>Xactimate roofing estimate example</a>, and for how estimating software and documentation tools fit together, see <a href='/blog/xactimate-roofing-software-explained'>Xactimate roofing software explained</a>.",
      },
      {
        heading: "Why Xactimate codes matter for supplements",
        content: "Insurance adjusters use Xactimate to estimate repair costs. When you submit a supplement using the same line codes and format the adjuster works in, your supplement is easier for the adjuster to review. Approval still depends on the claim, the policy and the carrier.\n\nSubmitting a supplement as a plain-text description forces the adjuster to translate your findings into Xactimate themselves, which means they might use lower-cost codes, miss line items, or simply deny the supplement because it's too much work to process."
      },
      {
        heading: "Decking and sheathing codes",
        content: "When rotted or damaged decking is found during tear-off:\n\n• RFG SHTHN — Sheathing, plywood/OSB, 1/2\" CDX — used for replacing damaged decking. Measured in SF (square feet). National average: ~$2.18/SF\n• RFG RFLT30 — Roofing felt, 30# — underlayment that goes over new decking. Measured in SF. National average: ~$0.52/SF\n\nAlways measure the actual area of damaged decking. Count sheets if possible; a standard sheet is 4x8 (32 SF). Include photos showing the rotted wood with context of where it sits on the roof."
      },
      {
        heading: "Flashing codes",
        content: "For failed or corroded flashing:\n\n• RFG FLSH — Flashing, step/counter, aluminum — remove and replace. Measured in LF (linear feet). National average: ~$8.75/LF\n• RFG FLSHC — Flashing, counter/cap — remove and replace. Measured in LF. National average: ~$6.50/LF\n\nDocument the type of flashing (step, counter, valley), the material (aluminum, galvanized), and the location (chimney, wall, skylight). Photograph both the removed flashing and the area it was protecting."
      },
      {
        heading: "Ice and water shield codes",
        content: "For missing or deteriorated ice and water membrane:\n\n• RFG I&WS — Ice & water shield membrane, install. Measured in SF. National average: ~$1.85/SF\n\nThis is one of the most common supplement items because many older roofs were installed without ice and water shield in areas where current building codes now require it (valleys, eaves, around penetrations). Always reference the applicable building code in your supplement narrative."
      },
      {
        heading: "Vent and pipe boot codes",
        content: "For damaged pipe boots and roof vents:\n\n• RFG VENT — Roof vent, pipe jack/boot, remove and replace. Measured in EA (each). National average: ~$85.00/EA\n\nPipe boots deteriorate over time and are often cracked or separated when discovered during tear-off. Document each pipe boot individually with photos."
      },
      {
        heading: "Drip edge codes",
        content: "For missing or damaged drip edge:\n\n• RFG DRIP — Drip edge, aluminum, remove and replace. Measured in LF (linear feet). National average: ~$4.25/LF\n\nDrip edge is required by many building codes (check your local code) and is a common supplement item when the original installation didn't include it or it has corroded."
      },
      {
        heading: "Additional layer removal codes",
        content: "For roofs with multiple layers:\n\n• RFG TEAR — Remove additional layer of roofing. Measured in SQ (squares, 100 SF). National average: ~$45.00/SQ\n• RFG HAUL — Haul debris, additional roofing layer. Measured in SQ. National average: ~$22.50/SQ\n\nMultiple layers are only discovered during tear-off. Document the number of layers found and photograph the cross-section showing multiple layers of shingles."
      },
      {
        heading: "How to find the right code and unit",
        content: "Codes only help if you pick the right one. In Xactimate, roofing items live in the roofing category, and each item has a description, a unit of measure and a unit price from the price list you are working in.\n\nFollow these habits every time:\n\n1. Search by what the item does: Look for the component and the action, such as remove and replace or install only.\n2. Read the full description: Two items can sound similar but differ in material, size or what is included.\n3. Match the unit: Square feet, linear feet, squares and each are not interchangeable. Your quantity has to use the unit the item uses.\n4. Check the price list: Confirm the price list name and date matches the location and time of the loss.\n\nThe code names and prices shown in this guide are shorthand examples. Always confirm the exact item and price in your own software or with the adjuster.",
      },
      {
        heading: "Codes and items people forget",
        content: "Missing a small item costs little on one job and a lot across a year. These are the ones crews and estimators overlook most often:\n\n• Starter strip: Installed at eaves and rakes on most shingle systems.\n• Ridge and hip cap: Priced separately from field shingles.\n• Underlayment: Felt or synthetic, matched to local code and manufacturer requirements.\n• Drip edge and rake metal: Often required by code and frequently left off.\n• Step flashing and counter flashing: Measured in linear feet along walls and chimneys.\n• Pipe jacks, vents and exhaust caps: Counted individually.\n• Debris removal: Including extra layers.\n• Permits and dumpster fees: Where local rules require them.\n\nWalk this list before you finish any estimate or supplement. It takes a minute and often finds items worth hundreds of dollars.",
      },
      {
        heading: "Understanding unit prices and price lists",
        content: "Unit prices in Xactimate come from regional price lists that are updated regularly. The same item can carry a different price in two nearby cities, and the price for the same city changes over time.\n\nThree practical rules:\n\n• Use the price list tied to the claim: The adjuster's estimate names it. Match it so your numbers can be compared line by line.\n• Do not mix price lists: Combining items from different lists confuses review.\n• Explain exceptions: If a job needs something the price list handles poorly, such as a hard access site, add a short note and a photo instead of silently changing a price.\n\nThe example prices in the table above are national-style averages and will not match your area. Treat them as a sanity check, not a quote.",
      },
      {
        heading: "Pairing codes with the right proof",
        content: "A code tells the adjuster what you want. The proof tells them why. For every code on a supplement, attach at least:\n\n• One photo: Labeled to match the line item, showing the condition.\n• One measurement: Length, area or count, with how you got it.\n• One sentence: Why the item applies to this job.\n\nWhen all three are present, the line item is much easier for the adjuster to verify without a call. For a full workflow, see <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a> and our <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a>.",
      },
      {
        heading: "How Supplement Snap handles Xactimate codes",
        content: "Supplement Snap suggests a matching Xactimate line code, with sub-items and a unit price, for each damage type your crew captures. When you export the Xactimate CSV, each capture produces suggested line items with quantities and national average pricing. Review them against your price list before you send.\n\nFor example, a 'Decking' capture suggests both the sheathing replacement line (RFG SHTHN) and the felt underlayment line (RFG RFLT30). A 'Multiple Layers' capture suggests both the tear-off line (RFG TEAR) and the haul debris line (RFG HAUL).\n\nThis saves your office staff from manually looking up codes and pricing, and helps keep items from being missed in the export.\n\nFor a complete walkthrough of building an Xactimate estimate, see our <a href='/blog/xactimate-roof-estimate-supplements'>Xactimate roof estimate guide</a>."
      },
    ],
  },
  {
    slug: "how-much-do-roofing-supplements-pay",
    title: "How Much Do Roofing Supplements Pay? What Affects the Amount",
    metaTitle: "How Much Do Roofing Supplements Pay? What Affects It",
    metaDescription: "What affects how much a roofing supplement pays, which items are commonly requested, and how to document them so they can be reviewed.",
    publishedDate: "2026-01-27",
    externalLinks: [
      { text: "Insurance Information Institute: Homeowners Claims", url: "https://www.iii.org" },
      { text: "NRCA: Roofing Industry Data", url: "https://www.nrca.net" },
    ],
    highlight: { label: "What Decides the Amount", value: "Varies by claim", subtext: "There is no reliable average. It depends on the claim, the policy, the carrier and what the crew finds" },
    visuals: {
      1: { type: "stats", data: [
        { label: "Decking replacement (3+ sheets)", value: "$200–$600", color: "text-zinc-900" },
        { label: "Step & counter flashing", value: "$300–$800", color: "text-zinc-900" },
        { label: "Ice & water shield", value: "$200–$500", color: "text-zinc-900" },
        { label: "Multiple layer removal", value: "$400–$1,000", color: "text-zinc-900" },
        { label: "Pipe boot replacement", value: "$85–$340", color: "text-zinc-900" },
        { label: "Drip edge (full perimeter)", value: "$150–$400", color: "text-zinc-900" },
      ]},
      6: {"type":"calculator","data":{"title":"Illustrative Supplement Example","rows":[{"label":"Decking replacement (96 SF at $2.50)","value":"$240"},{"label":"Step flashing (20 LF at $9.00)","value":"$180"},{"label":"Ice and water barrier (100 SF at $2.00)","value":"$200"},{"label":"Pipe jacks (3 at $90)","value":"$270"},{"label":"Drip edge (120 LF at $4.50)","value":"$540"}],"total":{"label":"Example supplement total","value":"$1,430","color":"text-green-700"}}},
    },
    updatedDate: "2026-10-22",
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["roofing-overhead-and-profit-claims","roof-replacement-estimate-vs-final-cost","how-to-write-a-roofing-supplement","roofing-supplement-process-explained"],
    faq: [
      {
        "q": "How much does the average roofing supplement pay?",
        "a": "There is no reliable national figure because amounts depend on the roof, the policy and the documentation. Track the supplements on your own jobs to find your real average."
      },
      {
        "q": "What roofing items are most commonly supplemented?",
        "a": "Decking, flashing, ice and water barrier, pipe jacks and vents, drip edge, extra layers and code-required upgrades."
      },
      {
        "q": "Do supplements affect the homeowner's out-of-pocket cost?",
        "a": "They can reduce it. Items the carrier approves are paid under the claim instead of coming out of the homeowner's pocket, subject to the deductible and coverage terms."
      },
      {
        "q": "Are roofing supplements guaranteed to be approved?",
        "a": "No. Approval depends on the evidence, the policy and the carrier's review."
      }
    ],
    sections: [
      {
        heading: "The short answer: it depends on the roof and the paperwork",
        content: "How much a supplement pays depends on the claim, the policy, the carrier and what the crew finds, so there is no reliable average. The amount varies a lot from job to job. This represents hidden damage found during tear-off that wasn't included in the original adjuster estimate.\n\nSome jobs yield more, some less. A simple re-roof on a ranch-style home might only produce $800–$1,200 in supplementable items. A complex roof with multiple penetrations, valleys, and older construction can produce $4,000–$6,000 in supplements."
      },
      {
        heading: "What items contribute to supplement value",
        content: "Items roofers commonly look for, with illustrative price ranges (check your own price list):\n\n• Decking replacement (3+ sheets): $200–$600. This is the most common supplement item.\n• Step and counter flashing (chimney or wall): $300–$800. Often corroded and hidden.\n• Ice and water shield (valleys + eaves): $200–$500. Code-required, often missing on older roofs.\n• Multiple layer removal: $400–$1,000. Only discovered during tear-off.\n• Pipe boot replacement (multiple): $85–$340. Cracked boots are extremely common.\n• Drip edge (full perimeter): $150–$400. Missing on many older homes.\n\nOn a single job, a crew might find several of these items, and the total depends on the quantities and what the carrier accepts."
      },
      {
        heading: "How many jobs have supplementable damage?",
        content: "Many contractors report that hidden damage is common at tear-off, but how often it happens depends on the roof, the region and the carrier. When there is hidden damage, the question is whether your crew documents it.\n\nThe problem isn't finding the damage. The problem is that most crews don't have a system to capture it properly in the moment. By the time someone in the office tries to write up the supplement from memory and a few blurry photos, the opportunity is lost."
      },
      {
        heading: "The math: what supplements mean for your business",
        content: "We cannot tell you what a supplement will add on your jobs, because it depends on the roof, the policy and the carrier. What you can do is work it out from your own records:\n\n• Extra recovered per month = supplements you send in a month x the share that get paid x the average extra on those that are paid\n• Compare that with what you spend on paperwork time and on any software\n\nMany jobs add nothing, and some add a lot. Use your last three months of jobs, not someone else's average. Our ROI calculator does this arithmetic with only the numbers you type in: <a href='/roofing-supplement-roi-calculator'>roofing supplement ROI calculator</a>.\n\nThe point is that the damage you document is money already tied to jobs you are doing, not new customers. Whether it is worth documenting more carefully is something your own numbers will answer.",
      },
      {
        heading: "Why most contractors leave this money on the table",
        content: "The gap between 'finding damage' and 'recovering supplement money' is documentation. Most contractors fall into one of these traps:\n\n• Crew finds damage but doesn't photograph it properly\n• Photos get lost in text messages between crew and office\n• Office doesn't have time to write up supplements for every job\n• Supplement gets submitted weeks later with weak documentation\n• Adjuster denies it due to insufficient evidence\n\nThe solution is capturing documentation at the point of discovery, on the roof, during tear-off, in real time. That's exactly what Supplement Snap was built for."
      },
      {
        heading: "How to read these numbers",
        content: "The ranges on this page are illustrative. Every claim is different, and no article can tell you what your next supplement will pay. What drives the amount is the roof and the paperwork, not a national average.\n\nTreat any published figure, including ours, as a starting point for your own tracking. The most useful number is the one from your own jobs: how many had supplementable damage, what you requested, and what was approved.",
      },
      {
        heading: "A worked example with illustrative numbers",
        content: "To show how small items add up, here is a simple example. The unit prices below are made up for illustration and will differ in your market. The point is the arithmetic, not the prices.\n\nA crew tears off a 28-square roof and finds rotted decking at one eave, a corroded chimney flashing, no ice and water barrier in the main valley, three failed pipe jacks and missing drip edge. None of these were in the first estimate. Written up with photos and measurements, the line items come to about the amount shown below. No single item is large. Together they make a meaningful difference on one job.\n\nNow multiply across a year. If even a share of your tear-offs turn up items like these, the missed revenue becomes a real number.",
      },
      {
        heading: "What makes one supplement larger than another",
        content: "Several factors push a supplement up or down:\n\n• Roof age and condition: Older roofs hide more deterioration.\n• Climate: Cold-weather regions often have ice barrier requirements that older roofs lack.\n• Number of layers: Extra layers add tear-off and disposal.\n• Roof complexity: More valleys, walls and penetrations mean more flashing and accessories.\n• Documentation quality: Items without photos and measurements are the first to be cut.\n• Coverage: Code upgrade items depend on the policy.\n\nNotice that most of these are about completeness. Missing items are usually missing because nobody wrote them down, not because the carrier refused them.",
      },
      {
        heading: "How to estimate your own potential recovery",
        content: "You can build a rough picture of your opportunity in three steps:\n\n1. Count your tear-offs: How many insurance roof replacements did you complete in the last 12 months?\n2. Sample your files: Review 10 recent jobs and note how many had hidden damage that was not in the original estimate.\n3. Total what was missed or left undocumented: Add up what the items would have been worth at your price list.\n\nThat gives you a defensible estimate based on your real jobs. It also shows you which items you miss most, which tells you where to improve your checklist. For items and codes, see our <a href='/blog/xactimate-codes-for-roofing-supplements'>Xactimate codes reference</a>.",
      },
      {
        heading: "How to start recovering supplements today",
        content: "You don't need to change your entire workflow. Start with your next tear-off:\n\n1. When your crew finds hidden damage, have them photograph it and tag what it is\n2. Add a quick voice note describing the damage\n3. Generate an AI supplement narrative from the field data\n4. Email a PDF report to the adjuster before you leave the job site\n\nSupplement Snap handles all four steps. The platform starts at $99/month with a 14-day free trial and pays for itself on the first job with a single approved supplement.\n\nTo understand the full workflow from tear-off to approval, read our <a href='/blog/roofing-supplement-process-explained'>roofing supplement process guide</a>."
      },
    ],
  },
  {
    slug: "roofing-supplement-process-explained",
    downloads: "roofing-supplement-template",
    title: "The Roofing Supplement Process Explained: From Tear-Off to Approval",
    metaTitle: "Roofing Supplement Process: Tear-Off to Approval",
    metaDescription: "Complete guide to the roofing supplement process, from discovering hidden damage during tear-off to getting insurance approval. Written for contractors.",
    publishedDate: "2026-02-03",
    externalLinks: [
      { text: "International Building Code (ICC)", url: "https://www.iccsafe.org" },
      { text: "NRCA: Roofing Manual", url: "https://www.nrca.net" },
    ],
    highlight: { label: "How Often Hidden Damage Appears", value: "Varies", subtext: "It is common at tear-off, but frequency depends on the roof, the region and the carrier" },
    visuals: {
      0: { type: "steps", data: [
        { num: "1", title: "Crew discovers hidden damage", desc: "During tear-off, concealed conditions are exposed: rotted decking, corroded flashing, missing ice & water shield." },
        { num: "2", title: "Document at the point of discovery", desc: "Photograph each finding with context and detail shots. Tag the damage type, roof area, and add field notes." },
        { num: "3", title: "Generate the supplement report", desc: "AI writes a professional narrative. Xactimate line codes and pricing are mapped automatically." },
        { num: "4", title: "Email to the adjuster same day", desc: "Send a branded PDF report directly to the insurance adjuster before the crew leaves the job site." },
        { num: "5", title: "Adjuster reviews and approves", desc: "Clear documentation with photos, narratives, and correct codes leads to faster approvals." },
      ]},
      3: { type: "stats", data: [
        { label: "Adjuster review time", value: "3–14 days" },
        { label: "Approval rate with strong docs", value: "High", color: "text-green-700" },
        { label: "Typical approval timeline", value: "Same week", color: "text-indigo-600" },
      ]},
      6: {"type":"timeline","data":[{"time":"Day 1","title":"Tear-off and discovery","desc":"Hidden damage is found, photographed and measured before it is covered."},{"time":"Same day","title":"Write and send","desc":"The narrative, line items and photos go to the adjuster with a clear summary."},{"time":"Following days","title":"Carrier review","desc":"The adjuster verifies the package and may ask questions or request a visit."},{"time":"After review","title":"Approval or negotiation","desc":"Approved items are paid. Disputed items get a written response with evidence."}]},
    },
    updatedDate: "2026-10-22",
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["how-to-write-roofing-supplements-faster", "how-long-does-a-roofing-supplement-take", "how-to-write-a-roofing-supplement","roofing-photo-documentation-checklist","roofing-supplement-denied-what-to-do","roofing-supplement-template", "roofing-supplement-companies-vs-software"],
    faq: [
      {
        "q": "How long does the roofing supplement process take?",
        "a": "It varies by carrier and claim. The part you control is how fast you document and submit, so do both on the day damage is found."
      },
      {
        "q": "When should a supplement be submitted?",
        "a": "As soon as the hidden damage is documented, ideally the same day and before new materials cover the area."
      },
      {
        "q": "Who submits the supplement, the contractor or the homeowner?",
        "a": "Usually the contractor, since they have the photos, measurements and technical detail."
      },
      {
        "q": "What happens if the adjuster wants to inspect the roof again?",
        "a": "Offer specific times, keep the damage visible if possible and bring a one-page summary of the disputed items."
      }
    ],
    sections: [
      {
        heading: "What happens when your crew finds hidden damage",
        content: "It happens on almost every tear-off. Your crew pulls back the shingles and discovers something the adjuster didn't, and couldn't, see during the initial inspection. Rotted decking along the eave. Corroded step flashing at the chimney. Missing ice and water shield in the valley. A pipe boot that crumbled when they pulled the old shingles off.\n\nThis concealed damage is legitimate additional work that the insurance policy should cover. The process for getting it covered is called a supplement, and it starts the moment your crew discovers the damage."
      },
      {
        heading: "Phase 1: Discovery and documentation",
        content: "The most critical phase happens on the roof. When damage is discovered during tear-off, it needs to be documented immediately, before new materials cover it up.\n\nEffective documentation includes:\n• Multiple photographs per finding (wide context shot + close-up detail)\n• Identification of damage type (decking, flashing, ice & water, pipe boot, drip edge)\n• Location on the roof (front slope, back slope, valley, chimney, eave, ridge)\n• Estimated quantity (number of sheets, linear feet, square footage)\n• Field notes describing the condition\n\nThe biggest mistake contractors make is waiting until they get back to the office to document findings. By then, photos are buried in camera rolls, details are fuzzy, and the urgency is gone."
      },
      {
        heading: "Phase 2: Writing the supplement",
        content: "The supplement is a formal request to the insurance carrier for additional payment. It includes:\n\n• A narrative explaining what was found, where, and why it wasn't visible before tear-off\n• Xactimate line items with the appropriate codes, quantities, and pricing\n• Supporting photographs\n• Reference to applicable building codes (when relevant)\n\nThe narrative is the heart of the supplement. It needs to clearly communicate that the damage was concealed, was discovered during tear-off operations, and requires additional work beyond the original scope to restore the roof system properly.\n\nMany contractors either skip the narrative entirely (just submitting Xactimate line items) or write something so vague that the adjuster can't justify approval. The narrative should be specific, professional, and reference your photographic evidence."
      },
      {
        heading: "Phase 3: Submission to the insurance carrier",
        content: "Submit the supplement to the insurance adjuster as quickly as possible, ideally the same day the damage is found. Speed matters for two reasons:\n\n1. Fresh documentation is more credible. A supplement submitted the same day as the tear-off carries more weight than one submitted three weeks later.\n2. The adjuster may want to re-inspect. If you've already installed new materials over the damage, a re-inspection is impossible.\n\nThe best submission format is a professional PDF report with an attached Xactimate-compatible spreadsheet. Email it directly to the adjuster with the claim number in the subject line."
      },
      {
        heading: "Phase 4: Adjuster review and negotiation",
        content: "After submission, the adjuster reviews your supplement. This can take 3–14 business days depending on the carrier. Possible outcomes:\n\n• Approved in full: the carrier agrees with your findings and adjusts the claim\n• Partially approved: some items approved, others denied or reduced\n• Re-inspection requested: the adjuster wants to see the damage in person\n• Denied: the carrier rejects the supplement (see our guide on what to do when this happens)\n\nIf partially approved, review which items were denied and why. You can resubmit with additional documentation or escalate to a supervisor. If a re-inspection is requested, coordinate with the adjuster and be prepared to show the documented evidence."
      },
      {
        heading: "Who does what in the supplement process",
        content: "A smooth supplement depends on clear handoffs between the people involved.\n\n• The crew: Finds and photographs damage during tear-off, with labels and notes.\n• The project manager or estimator: Measures, writes the narrative and builds the line items.\n• The office: Assembles the package, sends it and tracks the response.\n• The adjuster: Reviews the package, may visit and decides what is approved.\n• The homeowner: Stays informed and may need to sign documents.\n\nMost delays come from a handoff that fails, usually photos that never reach the office or notes that no one recorded. Fixing that handoff is often the biggest improvement a roofing company can make.",
      },
      {
        heading: "What a realistic timeline looks like",
        content: "Timelines vary by carrier, claim volume and the size of the supplement, so use the steps below as a rough order of events and not a promise. What you control is the first half: documenting and sending quickly.\n\nThe longer you wait to send, the harder verification becomes, and the more the job moves on without you. The sooner the package reaches the adjuster, the sooner questions can be answered while the damage is still visible.",
      },
      {
        heading: "What to have ready before you call the adjuster",
        content: "A short phone call goes much better when you are prepared. Have these in front of you:\n\n• The claim number and policy holder name\n• The date of loss and the date of tear-off\n• A one-page list of findings with photo numbers\n• Measurements and quantities for each item\n• Any code references you rely on\n• The email address the carrier wants documents sent to\n\nAfter the call, send a short email summarizing what was agreed. That record protects you if details are disputed later.",
      },
      {
        heading: "Where time gets lost, and how to get it back",
        content: "Four steps eat most of the time:\n\n1. Photos stuck on phones: Fix this by uploading from the roof, not at the end of the day.\n2. Writing from memory: Fix this by capturing a short note with every photo.\n3. Formatting: Fix this with a consistent template for narratives and reports. See our <a href='/blog/roofing-supplement-template'>supplement template</a>.\n4. Chasing the carrier: Fix this with dated written follow-ups.\n\nIf you improve only one thing, make it the first: getting labeled photos off the roof and to the office the same day.",
      },
      {
        heading: "How Supplement Snap streamlines the entire process",
        content: "Supplement Snap was designed around this exact workflow:\n\n• Phase 1 (Discovery): Your crew captures photos, tags damage type and roof area, adds voice notes, all from the roof during tear-off\n• Phase 2 (Writing): AI generates professional supplement narratives from the field data. Xactimate CSV export with correct line codes and pricing.\n• Phase 3 (Submission): One-click PDF report generation and email to the adjuster, same day, from the field\n• Phase 4 (Tracking): Claim pipeline tracks each project from In Progress through Submitted to Approved\n\nThe entire process that used to take days of office work now happens in minutes, right from the job site.\n\nFor detailed tips on writing the actual supplement document, see <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a>."
      },
    ],
  },
  {
    slug: "roof-tear-off-cost",
    title: "Roof Tear-Off Cost in 2026: What Contractors and Homeowners Should Know",
    metaTitle: "Roof Tear-Off Cost in 2026: By Size, Material and Pitch",
    metaDescription: "What does a roof tear-off cost in 2026? Costs by roof size, material, pitch and layers, plus hidden costs found at tear-off and how supplements recover them.",
    publishedDate: "2026-02-10",
    externalLinks: [
      { text: "RSMeans Construction Cost Data", url: "https://www.rsmeans.com" },
      { text: "NRCA: Roofing Tear-Off Guidelines", url: "https://www.nrca.net" },
      { text: "EPA: Roofing Material Disposal", url: "https://www.epa.gov/smm/best-practices-reducing-reusing-and-recycling-construction-and-demolition-materials" },
    ],
    highlight: { label: "What Sets the Price", value: "Varies by region", subtext: "Layers, roof size, access and disposal all change tear-off cost, so get local quotes" },
    images: {
      1: { src: "/blog/roof-tear-off-cost/tear-off-in-progress.jpg", width: 1024, height: 683, alt: "Roof mid-tear-off showing exposed decking and damaged shingles being removed" },
      3: { src: "/blog/roof-tear-off-cost/hidden-damage-found.jpg", width: 1400, height: 934, alt: "Rotted roof decking discovered during tear-off requiring supplement documentation" },
    },
    related: ["how-to-document-multiple-roof-layers-during-tear-off", "roof-debris-removal-dumpster-insurance-claim", "roof-tear-off-findings-log-template", "roof-tear-off-vs-overlay", "roofing-overhead-and-profit-claims","how-much-do-roofing-supplements-pay","roof-replacement-estimate-vs-final-cost","roofing-code-upgrades-ordinance-and-law"],
    sections: [
      {
        heading: "What is a roof tear-off and why does cost matter?",
        content: "A roof tear-off is the process of removing all existing roofing materials down to the deck before installing a new roof system. Unlike a roof-over (where new shingles are layered on top of old ones), a tear-off gives contractors and homeowners a clean slate and a clear view of the decking and underlayment underneath.\n\nRoof tear-off cost matters for two audiences. For homeowners, it is often the single largest line item on a roofing estimate and directly affects out-of-pocket expense or insurance claim value. For contractors, understanding real-world tear-off costs is essential for writing accurate bids, setting proper expectations, and identifying where supplement revenue hides.\n\nIn 2026, tear-off costs have risen compared to prior years due to increased labor rates, disposal fee hikes at many landfills, and material price volatility. Whether you are a homeowner evaluating quotes or a contractor building estimates, having current numbers prevents surprises and protects margins."
      },
      {
        heading: "Average roof tear-off cost by roof size",
        content: "Roof tear-off cost is most commonly measured per roofing square (one square equals 100 square feet). In 2026, national averages for a single-layer asphalt shingle tear-off look like this:\n\n• 1,000 SF roof (10 squares): $1,000–$1,800 total\n• 1,500 SF roof (15 squares): $1,500–$2,700 total\n• 2,000 SF roof (20 squares): $2,000–$3,600 total\n• 2,500 SF roof (25 squares): $2,500–$4,500 total\n• 3,000 SF roof (30 squares): $3,000–$5,400 total\n\nThese ranges reflect a per-square cost of roughly $100–$180 for a standard single-layer asphalt shingle tear-off, including labor, debris removal, and dump fees. Keep in mind that these numbers cover tear-off only and do not include the cost of the new roof installation.\n\nRegional variation is significant. Markets with higher labor costs (Northeast, West Coast, major metro areas) land at the upper end, while the Southeast and Midwest tend to fall at the lower end. Rural areas sometimes see lower labor rates but higher haul-off costs because the landfill or transfer station is farther away."
      },
      {
        heading: "Factors that affect roof tear-off cost",
        content: "No two tear-offs cost the same. Several variables push the price up or down significantly:\n\n• Number of layers: This is the biggest cost multiplier. A second layer of shingles can add $50–$100 per square to the tear-off cost because of the additional labor and disposal weight. A third layer (which some older homes still have) adds even more and often requires extra dump fees due to sheer volume. Many insurance estimates only account for a single layer because the adjuster cannot see beneath the surface during initial inspection.\n• Roofing material: Asphalt shingles are the easiest and cheapest to remove. Wood shake tear-offs run $150–$250 per square because shake is heavier, harder to strip, and creates more debris. Tile roofs (clay or concrete) are the most expensive at $200–$400 per square due to extreme weight (a single square of concrete tile can weigh over 900 pounds) and the need for specialized equipment to lower material safely.\n• Roof pitch: A walkable roof (6/12 pitch or less) keeps tear-off costs at the baseline. Once pitch exceeds 8/12, crews need additional safety equipment (harnesses, roof jacks, toe boards) and move more slowly, adding 15–30% to labor costs. Extremely steep roofs (12/12 and above) can nearly double labor time.\n• Roof access and height: A single-story ranch with a driveway next to the roof line is the easiest scenario. Multi-story homes, properties with limited ground access, landscaping that needs protection, or structures where the dumpster cannot be placed close to the building all increase cost because debris must be carried farther or lowered by hand.\n• Roof complexity: A simple gable roof tears off quickly. Add dormers, valleys, hips, skylights, chimneys, multiple penetrations, and satellite dishes, and the crew spends significantly more time working around obstacles. Each penetration also increases the likelihood of finding hidden damage beneath flashing."
      },
      {
        heading: "Hidden costs discovered during tear-off",
        content: "Here is where roof tear-off cost gets unpredictable, and this is where contractors leave the most money on the table. Once the existing roofing material comes off, the crew often discovers damage that was completely invisible during the initial inspection:\n\n• Rotted or deteriorated decking: Water intrusion over years softens plywood or OSB sheathing. Replacing damaged decking adds $2.00–$2.50 per square foot ($64–$80 per standard 4x8 sheet). It is not unusual to find 3–10 sheets of bad decking on a single job.\n\n• Failed or missing flashing: Step flashing at chimneys, counter flashing along walls, and valley flashing can be corroded, improperly installed, or completely absent. Replacing step flashing runs $8–$12 per linear foot, and most chimney reflashing jobs total $300–$800.\n\n• Missing ice and water shield: Many older roofs were installed before current building codes required ice and water membrane in valleys, at eaves, and around penetrations. Installing it during the reroof is code-required in most jurisdictions and adds $1.50–$2.00 per square foot.\n\n• Deteriorated pipe boots: Rubber pipe boots crack and separate after 10–15 years. Replacing each one costs $75–$100 including materials and labor.\n\n• Additional layer discovery: The adjuster estimated a single-layer tear-off, but the crew finds two or even three layers once they start pulling material. Each additional layer adds labor, time, and dump fees.\n\nThese hidden costs can add $1,500–$5,000 or more to the actual cost of the job. For insurance claims, this is the gap between what the adjuster originally approved and what the job actually requires."
      },
      {
        heading: "How insurance estimates handle tear-off cost",
        content: "On an insurance claim, the adjuster writes an estimate based on what they can see during a visual inspection, typically from a ladder or by walking the roof surface. The tear-off line item in the original estimate covers removing the visible roofing material. It does not cover what is hidden underneath.\n\nThis is by design. Insurance policies cover the cost to restore the property to its pre-loss condition, but the adjuster can only estimate what is visible. Concealed damage (rotted decking under shingles, corroded flashing behind step metal, a second layer of roofing hidden under the top layer) cannot be assessed until the roof is actually torn off.\n\nThe mechanism for recovering these hidden costs is the supplement. A supplement is a formal request to the insurance carrier to adjust the claim upward based on damage discovered during tear-off. It is a standard part of the insurance restoration process, and adjusters expect them on jobs where concealed damage is found.\n\nThe key to getting supplements approved is documentation. The carrier needs clear photographic evidence that the damage was hidden, that it was discovered during tear-off, and that the repair is necessary. Without documentation, the contractor absorbs the cost, and that directly erodes the profit margin on the job.\n\nFor homeowners, understanding the supplement process matters because it means their out-of-pocket cost should not increase when hidden damage is found. The insurance policy covers concealed damage; the contractor just needs to document it and submit the supplement."
      },
      {
        heading: "How to reduce tear-off cost without cutting corners",
        content: "For contractors looking to keep tear-off costs manageable while maintaining quality:\n\n• Optimize dumpster placement: Getting the dumpster as close to the roof edge as possible saves enormous labor time. Crews throw debris directly into the container instead of carrying it across the yard. On multi-story homes, consider using a roofing conveyor or chute.\n• Use proper tear-off tools: Shingle shovels, tear-off spades, and power tools like roofing tear-off machines on large commercial jobs speed up the process significantly. A well-equipped crew can tear off 25–35 squares per day on a standard residential roof.\n• Schedule dump runs strategically: Some landfills charge by weight, others by load. Know your local dump fee structure and time your haul-offs accordingly. Overloading a single dumpster may cost less than two partially filled ones.\n• Train crews on damage identification: Every minute of tear-off is an opportunity to spot supplementable damage. Crews that know what to look for, and how to flag it, turn tear-off into a revenue-generating activity instead of pure cost.\n\nFor homeowners evaluating contractor quotes, be wary of bids that seem unusually low on tear-off. A lowball tear-off number often means the contractor is cutting corners on cleanup, skipping proper deck inspection, or planning to hit you with change orders once the roof is open."
      },
      {
        heading: "Recovering hidden tear-off costs with supplements",
        content: "The single biggest financial opportunity during a roof tear-off is capturing and recovering the cost of concealed damage through supplements. On an insurance reroof, contractors who document hidden damage properly have a better chance of being paid for work the first estimate missed.\n\nThe challenge has always been the documentation workflow. Your crew is on the roof, moving fast, focused on getting the tear-off done and new materials installed. Stopping to take detailed photos, write notes, and measure damaged areas slows down production. And if documentation happens after the fact, back at the office from memory, it is usually incomplete.\n\nThis is exactly the problem Supplement Snap was built to solve. During tear-off, your crew captures damage photos directly in the app, tags the damage type and roof location, and adds a quick voice note describing what they found. The system generates a professional supplement narrative using AI, suggests matching Xactimate line codes for each finding, and produces a PDF report you can email to the adjuster the same day.\n\nThe result: hidden tear-off costs that used to eat into your margin become documented, submitted, and recovered. Instead of absorbing $2,000 in rotted decking and missing flashing, you turn it into a supplement that gets approved and paid. For contractors doing 10 or more insurance jobs per month, proper tear-off documentation can mean the difference between a tight year and a highly profitable one.\n\nFor more on why the initial estimate rarely matches the final cost, read <a href='/blog/roof-replacement-estimate-vs-final-cost'>roof replacement estimate vs final cost</a>."
      },
    ],
  },
  {
    slug: "best-roof-estimating-software",
    title: "7 Best Roof Estimating Software Options in 2026 (Compared)",
    metaTitle: "7 Best Roof Estimating Software Options (2026)",
    metaDescription: "Seven roof estimating tools compared for 2026: Roofr, EagleView, RoofSnap, Hover, Xactimate, AccuLynx and JobNimbus. What each does and who it fits.",
    publishedDate: "2026-02-17",
    updatedDate: "2026-10-26",
    externalLinks: [
      { text: "Verisk Xactimate", url: "https://www.verisk.com/insurance/products/xactimate/" },
      { text: "EagleView Roof Measurement", url: "https://www.eagleview.com" },
      { text: "Roofr", url: "https://roofr.com" },
      { text: "RoofSnap", url: "https://roofsnap.com" },
      { text: "Hover", url: "https://hover.to" },
      { text: "AccuLynx", url: "https://acculynx.com" },
      { text: "JobNimbus", url: "https://www.jobnimbus.com" },
    ],
    highlight: { label: "How to pick", value: "Start with your job type", subtext: "Retail re-roofs and insurance claims need different tools. Pick the category first, then compare products." },
    images: {
      2: { src: "/blog/best-roof-estimating-software/satellite-roof-measurement.png", width: 1344, height: 768, alt: "Satellite roof measurement showing 3D roof model with panel dimensions and pitch data" },
      8: { src: "/blog/best-roof-estimating-software/supplement-snap-capture.png", width: 1200, height: 628, alt: "Supplement Snap field capture screen showing roof damage being documented during tear-off" },
    },
    visuals: {
      0: { type: "matrix", data: {
        label: "Tool",
        headers: ["Best known for", "Good fit when"],
        rows: [
          { feature: "1. Roofr", values: ["Measurement reports, instant estimates, proposals and a CRM together", "You run a small residential retail crew and want one tool to quote and close"] },
          { feature: "2. EagleView", values: ["Aerial roof measurement reports", "You need measurements an insurer or supplier will recognize"] },
          { feature: "3. RoofSnap", values: ["Measuring, drawing and estimating a roof", "You want to draw and price the roof yourself from aerial data"] },
          { feature: "4. Hover", values: ["Measurements built from phone photos of the property", "You are measuring the whole exterior, not only the roof"] },
          { feature: "5. Xactimate", values: ["The estimating format insurers use", "You work insurance claims and must match the carrier's estimate"] },
          { feature: "6. AccuLynx", values: ["Running a roofing business from lead to job", "You have a crew and office and want a full job-management system"] },
          { feature: "7. JobNimbus", values: ["CRM, estimates and project tracking", "You want a straightforward pipeline with estimates built in"] },
        ],
      }},
      9: { type: "checklist", data: { title: "Questions to ask before you pay for estimating software", items: [
        { text: "Does it cover the jobs I actually do: retail, insurance or both?", checked: true },
        { text: "Will the carrier or supplier accept its measurements and estimates?", checked: true },
        { text: "Can my crew and office both use it on a phone?", checked: true },
        { text: "What does it really cost at my number of jobs per month?", checked: true },
        { text: "Can I export my data if I leave?", checked: true },
        { text: "Did I test it on one real job before committing?", checked: true },
      ]}},
      10: { type: "tip", data: { type: "info", title: "Verify before you buy", text: "Features, plans and prices change often, and any comparison page, including this one, can be out of date. We have left prices out on purpose. Confirm current details on each vendor's site and run one real roof through a trial first." } },
    },
    related: ["best-roofing-crm", "roofing-software-comparison", "best-roofing-supplement-software", "xactimate-roofing-software-explained"],
    faq: [
      { q: "What is the best software for roof estimating?", a: "There is no single best one. Roofr and RoofSnap suit contractors who want to measure and quote retail roofs quickly. Xactimate is the format insurers use, so it matters for insurance claims. AccuLynx and JobNimbus run the wider business and include estimating. Choose by the kind of jobs you do, then test one real roof in a trial." },
      { q: "What is the best app for calculating roofing costs?", a: "For a fast number, a measurement-plus-estimate tool such as Roofr or RoofSnap lets you pull a roof's size and turn it into a priced quote. A basic roof calculator is fine for a rough homeowner-level figure, but a contractor quote needs real measurements, your material prices and your labor. Test any app against a roof you have already priced by hand." },
      { q: "What is the 25% rule for roofing?", a: "It is an older building-code rule of thumb: if more than about 25% of a roof is repaired or replaced in a set period, some jurisdictions required the whole roof to be brought up to current code. Many places have changed or dropped it, so the rule varies by location. Ask your local building department what applies to your job. This is general information, not legal advice." },
      { q: "Do I need Xactimate to estimate roofs?", a: "Not for retail jobs paid by homeowners. If you work insurance claims, you will almost always need to read and match Xactimate estimates, because adjusters and carriers use that format. Many contractors use a separate tool for measuring and quoting and keep Xactimate for claim work." },
      { q: "Is there free roof estimating software?", a: "Some vendors offer free trials, free plans for part of their product or free tools such as basic calculators. What is included changes, so check each vendor's current plan page. Free options are most useful for testing the workflow before you commit to a paid plan." },
      { q: "How much does roof estimating software cost?", a: "It varies a lot. Some tools charge per measurement report, some charge a monthly subscription and some bundle estimating inside a larger business platform. Ask each vendor for current pricing and work out the cost at your own monthly job count." },
    ],
    sections: [
      {
        heading: "The short answer: seven tools, and who each one fits",
        content: "The best roof estimating software depends on what kind of jobs you run. A small crew quoting retail re-roofs needs fast measurements and a clean proposal. An insurance restoration contractor also needs to match the estimating format carriers use. A larger company may want estimating inside a full job-management system.\n\nThe table below lists seven options in no particular order. No vendor paid to be on this list. We have left prices out because they change often and we cannot verify them for you.\n\nDisclosure: we make Supplement Snap, which is not an estimating tool. It documents hidden damage for supplements, and we explain where it fits near the end so you can decide whether you need it.",
      },
      {
        heading: "1. Roofr: measurements, estimates and proposals in one place",
        content: "Roofr combines aerial roof measurement reports with an instant estimator, customer proposals and a CRM. For a small residential crew, that means one place to measure a roof, price it and send a proposal.\n\n• Good fit when: You mostly do residential retail roofs and want to measure, quote and follow up from one system.\n• Watch for: Insurance-claim work needs the carrier's estimating format on top, so check how it handles that.\n• Cost: Check Roofr's current plans, including whether a free or entry tier covers what you need.\n\nIt appears often in AI summaries and roundups of small-contractor roofing software, which is a reasonable sign it is worth a trial, not proof it is right for you.",
      },
      {
        heading: "2. EagleView: aerial roof measurement reports",
        content: "EagleView is one of the best-known names in aerial roof measurement. You order a report for an address and get the roof's size, pitch, edges and related details without climbing the roof.\n\n• Good fit when: You want measurements that suppliers and insurers already recognize, or you measure many roofs and want to skip site visits for estimates.\n• Watch for: A measurement report is not an estimate by itself. You still price the job in your own system. Confirm with the carrier which measurements they accept on a claim.\n• Cost: Check EagleView's current pricing, which depends on how you order.\n\nImagery can be older than a recent storm or addition, so verify against the roof when it matters.",
      },
      {
        heading: "3. RoofSnap: draw, measure and estimate the roof",
        content: "RoofSnap pairs aerial measurements with a drawing and estimating tool. You can build the roof diagram, calculate materials and produce a proposal, and it also supports taking payments.\n\n• Good fit when: You like to draw and adjust the roof yourself and want measurement, estimating and payments in one product.\n• Watch for: Compare how it fits your workflow if you also need a full CRM or job scheduling.\n• Cost: Check RoofSnap's current plans.\n\nIt is a common pick for residential contractors who want control over how the roof is drawn before the quote goes out.",
      },
      {
        heading: "4. Hover: measurements from phone photos",
        content: "Hover builds a measured 3D model of a property from photos taken with a phone. It covers the roof and other parts of the exterior, such as siding and windows.\n\n• Good fit when: You quote exteriors and want roof and siding measurements from one set of photos.\n• Watch for: Quality depends on the photos, so follow the capture instructions. It is a measurement tool, so you still price the job elsewhere.\n• Cost: Check Hover's current pricing.\n\nIt is a different approach from aerial reports: someone has to be at the property to take the photos, but you are not relying on aerial imagery.",
      },
      {
        heading: "5. Xactimate: the estimating format insurers use",
        content: "Xactimate, made by Verisk, is the estimating software most carriers and adjusters use. It builds an estimate from line items with quantities, units and regional pricing. If you work insurance claims, you will read Xactimate estimates all the time.\n\n• Good fit when: You handle claims and need to match, review or supplement an adjuster's estimate line by line.\n• Watch for: It takes time to learn, and it prices the work. It does not capture or organize photos and notes from the roof.\n• Cost: Check Verisk's current licensing.\n\nFor the basics, see the <a href='/blog/xactimate-roofing-software-explained'>explainer on what Xactimate does and does not do</a>.",
      },
      {
        heading: "6. AccuLynx: a full roofing business platform",
        content: "AccuLynx is a business-management platform built for roofing contractors. It aims to cover the path from lead to job, including estimating, documents, scheduling, and workflow features for insurance work.\n\n• Good fit when: You have a crew and an office and want one system to run the business, not only to estimate.\n• Watch for: A broad platform takes longer to set up and is more than a solo roofer may need. Ask how deep its insurance and supplement features go for your process.\n• Cost: Check AccuLynx's current pricing.\n\nIf you are comparing business platforms, our <a href='/blog/best-roofing-crm'>list of the best roofing CRMs</a> covers it alongside the others.",
      },
      {
        heading: "7. JobNimbus: CRM with estimates and project tracking",
        content: "JobNimbus is a roofing and contractor CRM with a visual pipeline, estimates, e-signatures and project tracking, plus a mobile app. It is often chosen for being straightforward to set up.\n\n• Good fit when: You want to organize leads and jobs with estimating built in, without a long setup.\n• Watch for: Confirm which measurement and supplier integrations are available today, and how it handles insurance-claim workflow.\n• Cost: Check JobNimbus's current plans.\n\nIt is a business tool first and an estimator second, which is fine if your main problem is keeping jobs and customers organized.",
      },
      {
        heading: "Where Supplement Snap fits (it does not replace an estimator)",
        content: "None of the tools above is built to capture what your crew finds after tear-off. Supplement Snap is. Crews photograph hidden damage on the roof, add a note or a voice recording, and draft the written description for review. A PDF report can then be emailed to the adjuster. Team plans add an Xactimate-style CSV export, which is a starting list you review and price yourself.\n\nIt does not measure roofs or price jobs, so use it next to your estimating tool, not instead of it. You can try it on your own job with a free project, and see what the output looks like in the <a href='/roofing-supplement-report-example'>sample supplement report</a>. For a broader comparison of this category, see <a href='/blog/best-roofing-supplement-software'>best roofing supplement software</a>.",
      },
      {
        heading: "How to choose and test fairly",
        content: "Decide with a real job, not a rankings page. Pick one roof you already priced, run it through a trial of two or three tools, and compare the time it takes and how close the numbers land to yours. Ask how each one handles insurance work if that is part of your business.\n\nOne caution: roundups from vendors tend to favor the publisher's own product, and this one is no exception, which is why we have kept it to descriptions you can check yourself.",
      },
      {
        heading: "Also worth a look",
        content: "A few more names come up in this search, and which fits depends on your work:\n\n• Leap: sales, estimating and customer tools aimed at home-improvement contractors.\n• GAF QuickMeasure: measurement reports from a shingle manufacturer, often discussed alongside EagleView.\n• Estimating Edge: takeoff software that is usually discussed for commercial roofing.\n• CompanyCam: job photos for many trades. It organizes pictures, but it is not an estimator. See <a href='/blog/companycam-alternative-roofing-supplements'>photo apps vs. supplement tools</a>.\n\nFor how estimating, CRM and supplement tools fit together, read <a href='/blog/roofing-software-comparison'>roofing software for contractors compared</a>.",
      },
    ],
  },
  {
    slug: "hail-damage-roof-inspection",
    title: "Hail Damage Roof Inspection: What Gets Missed and How to Document It",
    metaTitle: "Hail Damage Roof Inspection Checklist",
    metaDescription: "Hail damage roof inspection checklist: what to look for on shingles, vents and flashing, what gets missed, and how to document it with photos.",
    publishedDate: "2026-02-24",
    externalLinks: [
      { text: "NOAA Storm Prediction Center", url: "https://www.spc.noaa.gov" },
      { text: "IBHS: Hail Damage Research", url: "https://ibhs.org" },
      { text: "NRCA: Storm Damage Resources", url: "https://www.nrca.net" },
    ],
    highlight: { label: "Storm Season Tip", value: "Document every job", subtext: "Busy weeks are when documentation gets skipped and hidden damage goes unrecorded" },
    images: {
      1: { src: "/blog/hail-damage-roof-inspection/hail-damaged-shingles.jpg", width: 1200, height: 630, alt: "Close-up of hail-damaged roof shingles showing circular impact marks and granule loss" },
      3: { src: "/blog/hail-damage-roof-inspection/hidden-hail-damage.jpg", width: 1280, height: 720, alt: "Cracked pipe boot found during hail damage roof tear-off inspection" },
    },
    related: ["how-insurance-adjusters-determine-roof-damage","hail-damage-roof-insurance-claim-documentation","roofing-photo-documentation-checklist","roof-inspection-report"],
    sections: [
      {
        heading: "Understanding hail damage on a roof",
        content: "Hail damage to a roof is not always obvious. While large hailstones (1.5 inches and above) can crack shingles, dent metal, and shatter tile in ways that are visible from the ground, the majority of hail damage is subtle. It shows up as bruised or fractured shingle granules, small dents in soft metals, hairline cracks in vent housings, and compromised seals around penetrations.\n\nThe damage matters because it shortens the remaining life of the roof system. A shingle that has lost its granule layer in a hail impact zone will deteriorate faster from UV exposure. A dented gutter may not flow properly. A cracked pipe boot will eventually leak. A dimpled ridge cap may allow moisture underneath.\n\nFor roofing contractors working in storm-prone markets, hail damage roof inspection is one of the most important skills to develop, not just for identifying damage that justifies a claim, but for documenting damage thoroughly enough that the insurance carrier approves the full scope of repair. The initial adjuster inspection catches some of the damage, but it frequently misses components that are harder to see or harder to access. Those missed items become supplement opportunities during and after tear-off."
      },
      {
        heading: "Types of hail damage by roofing component",
        content: "Hail does not just damage shingles. A thorough hail damage roof inspection evaluates every component of the roof system:\n\n• Asphalt shingles: Hail impacts displace granules and fracture the fiberglass mat underneath. Fresh hail hits feel soft or spongy when pressed with a finger because the mat is bruised beneath the surface. The exposed area oxidizes faster and leads to premature failure. Damage patterns are typically random across the roof surface but concentrated on slopes facing the storm direction.\n• Ridge caps: Ridge cap shingles sit at the highest point of the roof and take the most direct hits. They are thinner than field shingles in many installations and crack more easily. Damaged ridge caps allow moisture to enter along the ridge line, one of the worst places for a leak.\n• Metal flashing: Step flashing, counter flashing, valley metal, and chimney caps are all susceptible to denting. While a dent in metal flashing may seem cosmetic, it can compromise the overlap and seal between flashing pieces, creating a path for water intrusion. Galvanized and aluminum flashing dent more visibly than copper.\n• Roof vents and exhaust caps: Metal roof vents, turbine vents, ridge vents with metal housings, and exhaust caps are common hail targets. Dents in these components can impair function (turbine vents that no longer spin freely) or create openings for moisture.\n• Pipe boots: The rubber collar around plumbing vent pipes is vulnerable to hail impact, especially on older roofs where the rubber has already begun to dry and crack. A hail strike on an aging pipe boot can split it open immediately.\n• Gutters and downspouts: Aluminum gutters dent readily in hail. While gutter damage alone may not warrant a roof claim, documenting it supports the overall evidence of hail impact on the property and strengthens the claim for roof damage.\n• Skylights: Plastic dome skylights can crack or craze from hail impact. Glass skylights may chip. Even if the skylight still functions, the damage can lead to leaks over time and should be included in the claim.\n• Siding and paint: While not part of the roof, hail damage to siding, window trim, and painted surfaces on the windward side of the building corroborates the hail event and supports the roof claim."
      },
      {
        heading: "What adjusters commonly miss during initial inspection",
        content: "Insurance adjusters are under pressure to inspect properties quickly. In active storm seasons, a single adjuster may inspect 5–10 properties per day. This time pressure, combined with access limitations, means certain types of hail damage are routinely missed during the initial inspection:\n\n• Steep or hard-to-access slopes: Adjusters may only walk accessible slopes and extrapolate damage to the rest of the roof. Damage patterns from hail vary significantly by slope direction relative to the storm, meaning the slopes the adjuster skipped may have more, or different, damage than the ones inspected.\n\n• Soft metal components: Small dents in flashing, vent caps, and exhaust housings are easy to overlook, especially when the adjuster is focused on counting shingle hits. These components are often not individually listed in the initial estimate.\n\n• Pipe boots and rubber seals: Adjusters may not inspect every pipe boot closely enough to see hairline cracks or impact marks in the rubber collar. On a roof with 6–8 plumbing vents, this can mean hundreds of dollars in missed line items.\n\n• Starter strip and drip edge: Damage at the eave line (where starter shingles and drip edge metal sit) is often missed because these components are partially hidden by the gutter. Hail that dents gutters almost certainly also impacts the drip edge and starter course directly above.\n\n• Ridge cap granule loss: Adjusters may count shingle hits on the field of the roof but not closely examine the ridge caps, which are often the most heavily damaged component due to their exposed position.\n\n• Collateral damage from the hail event: Wind-driven rain during a hailstorm can force water into areas that were already compromised. The resulting moisture damage to underlayment or decking may not be visible until tear-off.\n\nEach of these missed items is a legitimate supplement once the roof is being replaced and the damage can be properly documented."
      },
      {
        heading: "Hidden hail damage found during tear-off",
        content: "The most significant hail damage discoveries happen during tear-off, when the existing roofing materials are removed and the underlying structure is exposed for the first time since the last installation. This is where supplement value concentrates:\n\n• Bruised or cracked underlayment: Hail impacts can bruise or puncture felt paper and synthetic underlayment beneath the shingles. This damage is completely invisible from the surface but compromises the secondary water barrier. Replacing damaged underlayment is necessary and supplementable.\n• Decking damage from impact: On older roofs with thinner decking, large hail can fracture or delaminate OSB and plywood sheathing. The impact force transfers through the shingle and underlayment, creating soft spots in the deck that are only discoverable when the crew walks the bare decking during tear-off.\n• Concealed flashing failures: Hail impact on step flashing can crack the sealant between flashing pieces and the wall surface. Counter flashing may be dislodged from its mortar joint by a combination of hail impact and thermal cycling. These failures are hidden behind existing roofing material and only become visible during tear-off.\n• Multiple layers concealing older damage: Some roofs have a second layer of shingles installed over the original. The hail damage claim is for the top layer, but once tear-off begins and both layers are removed, the crew may discover that the original layer also had unaddressed damage, or that the decking beneath both layers has deteriorated.\n• Ice and water shield that was never installed: When the existing roof was installed (possibly 15 or 20 years ago), ice and water shield may not have been required or was simply skipped. Current building codes in most jurisdictions require it in valleys, at eaves, and around penetrations. This code-required upgrade is a standard supplement item on hail damage re-roofs.\n\nEvery one of these findings represents additional cost that the original adjuster estimate did not, and could not, include. Documenting them properly is the key to recovering that cost through the supplement process."
      },
      {
        heading: "How to document hail damage for supplements",
        content: "Documentation quality is the single biggest factor in whether a hail damage supplement gets approved or denied. Adjusters need to see clear evidence that the damage exists, that it was concealed, and that the repair is necessary. Here is how to document hail damage findings effectively:\n\nBefore tear-off, document the visible damage:\n\n• Photograph hail hits on shingles with chalk circles marking each impact (the industry standard technique). Include both wide shots showing the pattern across the slope and close-ups of individual hits.\n• Photograph all collateral damage (gutters, vents, flashing, skylights, siding) to establish the severity and direction of the hail event.\n• Note the slope direction (north, south, east, west) for each set of photos. Hail damage patterns correlate with storm direction, and adjusters check for this consistency.\n• Document the size of hail impacts by placing a coin, ruler, or hail gauge next to damage for scale.\n\nDuring tear-off, document the concealed damage:\n\n• Photograph each finding immediately when discovered, before new materials cover it.\n• Take context shots showing where the damage sits on the roof (wide angle) and detail shots showing the damage itself (close-up).\n• Tag each finding by type (decking, flashing, underlayment, pipe boot, ice and water shield) so the supplement can be organized by category.\n• Record measurements: how many sheets of decking, how many linear feet of flashing, how many square feet of underlayment.\n• Add voice notes or written descriptions explaining what was found and why it was not visible before tear-off.\n\nAfter documentation, build the supplement package:\n\n• Write a professional narrative for each finding explaining the damage, its location, how it was discovered, and why repair is necessary.\n• Match each finding to a suitable Xactimate line code with measured quantities.\n• Compile everything into a clean PDF report with labeled photos, narratives, and a findings summary.\n• Submit to the adjuster the same day, while the documentation is fresh and the evidence is current."
      },
      {
        heading: "Preparing for storm season: systems that scale",
        content: "Hail season is concentrated but intense. When a major storm hits a metro area, restoration contractors may go from 5 jobs in the pipeline to 50 almost overnight. The contractors who recover the most supplement revenue during storm season are not the ones with the biggest crews. They are the ones with systems that scale.\n\nA scalable supplement documentation system has these characteristics:\n\n• Field crews can capture documentation independently without waiting for a project manager to be on-site. The crew lead opens the app, photographs the damage, tags it, and adds notes. No bottleneck.\n\n• Documentation is organized automatically by project, damage type, and roof area. When 30 jobs are running simultaneously, you cannot afford to sort through camera rolls looking for which photos belong to which property.\n\n• Supplement narratives are generated consistently. Writing unique narratives for 30 supplements per week is not sustainable manually. AI-generated narratives from field data ensure every supplement has professional documentation regardless of volume.\n\n• Xactimate exports are automatic. Manually building line items for each supplement is the office bottleneck that kills turnaround time during storm season. Automated mapping from damage type to Xactimate codes eliminates this step.\n\n• Reports can be emailed to adjusters directly from the platform. When you are managing 50 active claims, the ability to generate and send a report in one click instead of assembling PDFs manually saves hours per day.\n\nContractors who handled storm season in 2025 without a system like this know the pain: lost photos, delayed supplements, denied claims, and thousands of dollars in supplement revenue that evaporated because the documentation was not there."
      },
      {
        heading: "Turning hail damage documentation into recovered revenue",
        content: "Every hail damage re-roof has hidden findings. Rotted decking under a failed pipe boot. Flashing that cracked when the hailstone hit it. Underlayment that was punctured by the impact force. Ice and water shield that was never installed in the first place. The damage is there on almost every job. The question is whether it gets documented and submitted.\n\nHail damage supplements vary widely by roof and claim. On a busy storm season with 20 insurance re-roofs in a single month, that represents $30,000–$64,000 in additional revenue. Over a full season, proper supplement documentation can add six figures to a restoration contractor's top line.\n\nSupplement Snap was purpose-built for this workflow. Your crew captures hail damage findings during tear-off: photos tagged by damage type and roof location, voice notes in English or Spanish describing what they found. The platform's AI generates professional supplement narratives from the field data. Xactimate-ready CSV exports map each finding to the correct line codes with quantities and pricing. A branded PDF report is generated and emailed to the adjuster the same day.\n\nThe result is a supplement process that scales with storm volume. Whether you are running 5 hail damage jobs or 50, every finding gets documented, every supplement gets submitted, and every dollar of hidden damage gets recovered. That is the difference between a storm season that stretches your operation thin and one that drives your most profitable quarter of the year.\n\nFor a broader guide on all types of storm damage, see <a href='/blog/storm-damage-roof-repair'>storm damage roof repair guide</a>."
      },
    ],
  },
  {
    slug: "roofing-software-comparison",
    title: "Roofing Software Comparison: CRM vs. Estimating vs. Supplement Tools",
    metaTitle: "Roofing Software for Contractors Compared (2026)",
    metaDescription: "Roofing software for contractors compared: CRM, estimating and supplement tools. What each does, when you need it, and where the gaps are.",
    publishedDate: "2026-03-03",
    externalLinks: [
      { text: "NRCA: Technology in Roofing", url: "https://www.nrca.net" },
      { text: "Verisk Xactimate", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    highlight: { label: "Work It Out Yourself", value: "Use your own numbers", subtext: "Jobs per month x share with hidden damage x what you recover. Our ROI calculator does the arithmetic." },
    images: {
      0: { src: "/blog/roofing-software-comparison/Roofers-on-a-job.jpg", width: 1400, height: 933, alt: "Roofing crew working on a roof tear-off job site documenting hidden damage for supplements" },
      3: { src: "/blog/roofing-software-comparison/supplement-snap-dashboard.png", width: 2553, height: 1226, alt: "Supplement Snap dashboard showing roofing projects, capture counts, claim pipeline, and activity stats" },
    },
    related: ["companycam-alternative-roofing-supplements","best-roof-estimating-software","best-roofing-crm","roofing-supplement-process-explained"],
    sections: [
      {
        heading: "The three categories of roofing software",
        content: "If you run a roofing company in 2026, you have more software options than ever. But most of it falls into three distinct categories, each solving a different part of your business:\n\n• CRM (Customer Relationship Management): manages your leads, appointments, follow-ups, and sales pipeline\n• Estimating software: helps you measure roofs, calculate materials, and produce quotes\n• Supplement tools: document hidden damage found during tear-off and generate insurance supplement reports\n\nEach category solves a real problem. But most roofing contractors invest heavily in one or two of these categories while completely ignoring the third, and that blind spot is costing them thousands of dollars per job.\n\nUnderstanding what each type of software actually does, where they overlap, and where the gaps are is the first step to building a tech stack that doesn't leave money on the table."
      },
      {
        heading: "CRM software: managing leads and customers",
        content: "Roofing CRMs are the most widely adopted category of software in the industry. Popular options include JobNimbus, AccuLynx, Leap, RoofLink, and HailTrace. These platforms focus on the sales and project management side of your business.\n\nWhat a roofing CRM typically does:\n\n• Tracks leads from first contact through closed sale\n• Manages appointments and follow-ups with automated reminders\n• Stores customer information, property details, and insurance claim data\n• Provides a pipeline view showing where each job stands\n• Handles contracts, change orders, and digital signatures\n• Coordinates production scheduling and crew assignments\n• Sends automated text and email updates to homeowners\n• Generates reports on close rates, revenue, and sales rep performance\n\nA good CRM is essential once you're doing more than a handful of jobs per month. Without one, leads fall through the cracks, follow-ups get missed, and you lose track of where each project stands. Most established roofing companies already have a CRM, and for good reason. It directly impacts how many leads you convert into signed contracts.\n\nHowever, a CRM does not help you recover more money on the jobs you've already sold. It manages the customer relationship, not the technical documentation needed to maximize claim value."
      },
      {
        heading: "Estimating software: measuring and quoting",
        content: "Estimating tools help you produce accurate measurements and material calculations before the job starts. The most common tools in this space include EagleView, GAF QuickMeasure, Hover, RoofSnap, and iRoofing.\n\nWhat estimating software typically does:\n\n• Generates roof measurements from satellite imagery or drone photos\n• Calculates squares, waste factor, ridge length, valley length, hip length, and eave length\n• Produces material lists for ordering\n• Creates professional estimates and proposals for homeowners\n• Integrates with supplier pricing for accurate material costs\n• Some tools include labor cost calculators based on roof complexity\n\nEstimating software saves significant time compared to hand-measuring every roof, and the accuracy of satellite measurement tools has improved dramatically. For insurance work, tools like EagleView provide reports that adjusters recognize and accept.\n\nThe limitation of estimating software is that it captures the roof as it appears from the outside, before tear-off. It tells you the dimensions, pitch, and features of the roof. It does not capture what's hiding underneath the shingles. Rotted decking, corroded flashing, missing ice and water shield, deteriorated pipe boots. None of this shows up in a satellite measurement or a pre-job inspection."
      },
      {
        heading: "Supplement tools: capturing hidden revenue",
        content: "Supplement tools are the newest and least adopted category of roofing software. They focus on a specific problem: documenting concealed damage found during tear-off and converting that documentation into insurance supplement requests.\n\nWhat a supplement tool typically does:\n\n• Enables field crews to capture and tag damage photos during tear-off\n• Records voice notes and field observations in real time\n• Generates professional supplement narratives explaining what was found\n• Maps damage to Xactimate line codes with correct quantities and pricing\n• Exports Xactimate-compatible CSV files for adjuster submission\n• Produces PDF reports with photos, narratives, and findings summaries\n• Tracks supplement status from submission through approval\n\nThe core value proposition is simple: on an insurance tear-off, your crew may discover hidden damage that wasn't included in the original adjuster estimate, and documenting it is what lets you request payment. A supplement tool ensures that damage gets documented properly and submitted to the carrier for additional payment.\n\nWithout a supplement tool, that documentation process relies on crew members texting blurry photos to the office, someone writing up the supplement days later from incomplete information, and hoping the adjuster approves it despite the weak evidence."
      },
      {
        heading: "The gap most contractors don't see",
        content: "Here's the pattern across the roofing industry: almost every established contractor has a CRM. Most have some form of estimating tool. But very few have a dedicated supplement tool.\n\nThis creates a predictable revenue leak. Consider a typical insurance job:\n\n• The CRM tracks the lead from door knock to signed contract, working perfectly\n• The estimating tool produces accurate measurements and a material order, working perfectly\n• The crew tears off the roof and finds rotted decking, failed flashing, and missing ice and water shield\n• Nobody has a system to document the hidden damage properly\n• The supplement either doesn't happen, or it gets submitted with a blurry photo and a one-line description\n• The adjuster denies it or the office never bothers submitting it\n• Money that could have been documented on a job you already did goes unrecovered\n\nThis can happen job after job, because the damage is only visible for a short time and nobody has a system to capture it. How much it costs a given company depends on how often hidden damage turns up on its roofs and what the carrier pays.\n\nContractors often spend a lot on software to close more deals but little on tools to document what they find on jobs they have already won. Whether a supplement tool is worth it depends on your own numbers."
      },
      {
        heading: "Overlap and integration between the three categories",
        content: "There's some overlap between these categories, but less than you might expect:\n\n• Some CRMs include basic estimating features, but they rarely match the accuracy of dedicated measurement tools\n• Some estimating platforms include CRM-like features for managing jobs, but they lack the depth of a dedicated CRM\n• A few CRMs have started adding 'supplement tracking' features, but these are typically just status fields. They don't help with the actual documentation, narrative generation, or Xactimate export\n\nThe reality is that each category solves a fundamentally different problem at a different stage of the job:\n\n• CRM: pre-sale through project completion (customer-facing)\n• Estimating: pre-job measurement and quoting (planning-focused)\n• Supplement: during and after tear-off (revenue recovery)\n\nThe most productive roofing operations use all three categories in combination. The CRM manages the customer relationship and project pipeline. The estimating tool produces accurate measurements and material orders. The supplement tool captures hidden damage during tear-off and recovers additional revenue.\n\nWhen evaluating any roofing software, ask yourself: does this tool help me close more deals, plan jobs more accurately, or recover more revenue from jobs I'm already doing? If you're strong on the first two but have nothing for the third, you've identified your biggest opportunity."
      },
      {
        heading: "Why supplement documentation should be your next investment",
        content: "If you already have a CRM and an estimating tool, the highest-ROI addition to your tech stack is a supplement documentation platform. The logic is straightforward: a supplement tool costs a fixed amount each month, while the value comes from getting paid for hidden damage that would otherwise go undocumented. How much that is depends on the claim, the carrier and what your crew finds, so judge it against your own jobs.\n\nThe key is choosing a tool that actually solves the documentation problem, not just a status tracker. You need something your crew can use on the roof during tear-off to capture photos, tag damage types, record voice notes, and generate professional reports before they leave the job site.\n\nSupplement Snap was built specifically for this workflow. Your crew captures damage findings from the roof with tagged photos and voice notes. The AI generates professional supplement narratives. You can export an Xactimate-style CSV on the Team and Pro plans and email a PDF report to the adjuster the same day. It fills the gap that your CRM and estimating tool were never designed to address, and it can pay for itself if it helps you recover items that would otherwise go unpaid.\n\nStop investing only in software that helps you win jobs. Start investing in software that helps you get paid fully for the jobs you've already won.\n\nFor a deep dive into CRM options specifically, check out <a href='/blog/best-roofing-crm'>best roofing CRM</a>."
      },
    ],
  },
  {
    slug: "xactimate-roof-estimate-supplements",
    title: "How to Build an Xactimate Roof Estimate for Insurance Supplements",
    metaTitle: "Xactimate Roof Estimates for Insurance Supplements",
    metaDescription: "How to build an Xactimate roof estimate for insurance supplements: key line codes, pricing benchmarks and the common mistakes that get supplements denied.",
    publishedDate: "2026-03-07",
    externalLinks: [
      { text: "Verisk Xactimate Official Documentation", url: "https://www.verisk.com/insurance/products/xactimate/" },
      { text: "International Building Code (ICC)", url: "https://www.iccsafe.org" },
    ],
    highlight: { label: "Illustrative Example", value: "Sample only", subtext: "The totals on this page are made-up examples to show the format, not typical results" },
    images: {
      0: { src: "/blog/xactimate-roof-estimate-supplements/xactimate.jpg", width: 1280, height: 685, alt: "Xactimate roofing estimate software interface showing line codes and pricing for insurance claims" },
      5: { src: "/blog/xactimate-roof-estimate-supplements/supplement-snap-export.png", width: 2555, height: 1227, alt: "Supplement Snap project report showing $1,300 estimated supplement value with Xactimate line codes and CSV export option" },
    },
    related: ["xactimate-roofing-estimate-approved","xactimate-codes-for-roofing-supplements","roofing-supplement-template","how-to-write-a-roofing-supplement"],
    sections: [
      {
        heading: "What is Xactimate and why does it matter for roofing supplements?",
        content: "Xactimate is the insurance industry's standard software for estimating property damage repair costs. Developed by Verisk, it is used by the vast majority of insurance carriers, independent adjusters, and third-party administrators to write estimates for roofing claims. When an adjuster inspects storm damage on a roof, they enter their findings into Xactimate using standardized line codes, unit prices, and quantities to produce the claim estimate.\n\nFor roofing contractors, Xactimate matters because it is the language adjusters speak. When you submit a supplement (a request for additional payment for hidden damage found during tear-off), the adjuster needs to process that request within Xactimate. If your supplement is written in Xactimate's format with the correct line codes and pricing, the adjuster can review and approve it quickly. If your supplement is a vague description with a few photos and no reference to Xactimate codes, the adjuster has to do extra work to translate your findings, which often results in lower approvals, longer processing times, or outright denials.\n\nYou don't need to own an Xactimate license to submit supplements in Xactimate format. What you need is knowledge of the relevant line codes, current unit pricing, and how to structure your findings so the adjuster can process them efficiently."
      },
      {
        heading: "How adjusters use Xactimate to write roof estimates",
        content: "Understanding how adjusters use Xactimate helps you write better supplements. When an adjuster inspects a roof for storm damage, they follow a systematic process:\n\n1. They measure the roof or use a measurement report (EagleView, Hover, etc.)\n2. They inspect the roof surface for hail impacts, wind damage, or other covered perils\n3. They enter their findings into Xactimate as line items, each with a specific code, quantity, and unit price\n4. Xactimate calculates overhead and profit (O&P) on top of the line items, typically 10% overhead and 10% profit\n5. The software generates a detailed estimate that becomes the basis for the claim payment\n\nThe adjuster's Xactimate estimate only includes what they could see during their inspection. They walked the roof, noted visible damage, and wrote line items for the repairs they observed. They did not tear off the shingles. They did not inspect the decking underneath. They did not check the condition of the flashing behind the step metal or the integrity of the ice and water shield in the valleys.\n\nThis is exactly why supplements exist. The adjuster's estimate is based on a surface inspection. Your supplement adds the concealed damage that only becomes visible during tear-off. The more closely your supplement mirrors the adjuster's Xactimate format, the easier it is for them to approve the additional items."
      },
      {
        heading: "Essential Xactimate line codes for roofing supplements",
        content: "Every supplement item maps to a specific Xactimate line code. Here are the most common codes you'll use, along with current national average pricing. Note that Xactimate prices vary by region and are updated quarterly, so always check current pricing for your area.\n\n• RFG SHTHN — Sheathing, plywood/OSB, remove and replace. The code for replacing rotted or damaged roof decking. Unit: SF (square feet). National average: approximately $2.18/SF. A standard 4x8 sheet is 32 SF, so one sheet runs roughly $70. This is the single most common supplement line item.\n\n• RFG FLSH — Flashing, step/counter, aluminum, remove and replace. Used for corroded or damaged step flashing at chimneys, walls, and dormers. Unit: LF (linear feet). National average: approximately $8.75/LF.\n\n• RFG I&WS — Ice and water shield membrane, install. Used when ice and water shield is missing in code-required areas or has deteriorated. Unit: SF. National average: approximately $1.85/SF. This item often requires a building code reference in your narrative.\n\n• RFG VENT — Roof vent, pipe jack/boot, remove and replace. Used for cracked or deteriorated pipe boots. Unit: EA (each). National average: approximately $85/EA.\n\n• RFG DRIP — Drip edge, aluminum, remove and replace. Used when drip edge is missing or damaged. Unit: LF. National average: approximately $4.25/LF.\n\n• RFG TEAR — Remove additional layer of roofing. Used when a second or third layer is discovered during tear-off. Unit: SQ (100 SF). National average: approximately $45/SQ."
      },
      {
        heading: "Building a supplement estimate in Xactimate format",
        content: "You don't need to own Xactimate to submit a professional supplement. What you need is a structured document that mirrors the Xactimate format so the adjuster can process it quickly.\n\nFor each finding, include these elements:\n\n• Line code: the Xactimate code (e.g., RFG SHTHN)\n• Description: the standard Xactimate description (e.g., 'Sheathing - plywood/OSB - R&R')\n• Quantity: the measured amount in the correct unit (e.g., 96 SF)\n• Unit: SF, LF, EA, or SQ as appropriate\n• Unit price: current Xactimate pricing for your region\n• Line total: quantity multiplied by unit price\n\nHere's what a sample supplement estimate looks like:\n\nRFG SHTHN — Sheathing, plywood/OSB, R&R — 96 SF × $2.18 = $209.28\nRFG FLSH — Step flashing, aluminum, R&R — 24 LF × $8.75 = $210.00\nRFG I&WS — Ice & water shield, install — 180 SF × $1.85 = $333.00\nRFG VENT — Pipe boot, R&R — 3 EA × $85.00 = $255.00\nRFG DRIP — Drip edge, aluminum, R&R — 45 LF × $4.25 = $191.25\nSubtotal: $1,198.53\nO&P (20%): $239.71\nTotal Supplement: $1,438.24\n\nThis level of specificity makes it easy for the adjuster to review and approve. Compare this to a supplement that just says 'additional decking and flashing needed - $1,500.' Which version gets approved faster?"
      },
      {
        heading: "Pricing benchmarks and regional variations",
        content: "Xactimate pricing is not fixed nationally. Verisk updates pricing quarterly based on regional labor rates and material costs. Prices are set by zip code, so a contractor in Dallas will see different unit prices than one in Minneapolis.\n\nApproximate national average ranges for the most common supplement items (as of early 2026):\n\n• RFG SHTHN (decking): $2.00–$2.50/SF depending on region\n• RFG FLSH (step flashing): $7.50–$10.00/LF\n• RFG I&WS (ice & water shield): $1.60–$2.20/SF\n• RFG VENT (pipe boot): $75–$100/EA\n• RFG DRIP (drip edge): $3.75–$5.00/LF\n• RFG TEAR (additional layer removal): $38–$55/SQ\n\nWhen submitting a supplement, use the pricing for your specific region. If you price above the Xactimate rate for your zip code, the adjuster will adjust it down. If you price below, you're leaving money on the table.\n\nAlso keep in mind that overhead and profit (O&P) is a separate discussion. Most insurance claims include 10% overhead and 10% profit on top of the line item totals. If the original claim includes O&P, your supplement should also include it."
      },
      {
        heading: "Mistakes that get Xactimate supplements denied",
        content: "Even with the right line codes and pricing, supplements get denied for avoidable mistakes:\n\n• Wrong quantities: Claiming 5 sheets of decking when your photos only show 2 damaged areas. Adjusters cross-reference your quantities against the photos. Always measure carefully and photograph every area you're claiming.\n\n• Missing documentation: Submitting line items without supporting photos or a narrative. The adjuster needs to justify the additional payment to their supervisor. Give them the evidence they need.\n\n• Using incorrect codes: Selecting the wrong Xactimate code changes the unit price and signals you don't know what you're doing. Know your codes.\n\n• Not explaining concealment: Your narrative must clearly state that the damage was concealed beneath existing roofing materials and was discovered during tear-off operations. Without this, the adjuster may argue it should have been caught during the initial inspection.\n\n• Late submission: Submitting a supplement three weeks after tear-off raises questions. Why did it take so long? Has the damage been covered by new materials? Submit the same day whenever possible.\n\n• Inflated pricing: Submitting prices above the current Xactimate rate for your region signals you're padding the estimate and makes the adjuster scrutinize every line item."
      },
      {
        heading: "How Supplement Snap generates Xactimate-ready exports",
        content: "Building an Xactimate-formatted supplement manually for every job takes time: looking up line codes, checking pricing, formatting the estimate, writing the narrative, organizing photos. It's the kind of work that either falls on your office staff or doesn't get done at all.\n\nSupplement Snap automates this process. Your crew captures damage findings during tear-off: photos tagged by damage type, roof area selected, and a voice note describing what they found. Voice notes work in any language, so Spanish-speaking crews describe findings naturally and the system auto-translates to English.\n\nFrom that field data, Supplement Snap suggests a matching Xactimate line code, with sub-items, for each finding. A 'Decking' finding generates RFG SHTHN with the measured square footage. A 'Flashing' finding generates RFG FLSH with the linear footage. Each line item includes current unit pricing.\n\nYou can export the complete supplement as an Xactimate-compatible CSV that the adjuster can import directly into their system. You also get a professional PDF report with photos, AI-generated narratives, a findings summary, and the complete line item breakdown, ready to email to the adjuster the same day.\n\nThe result is a supplement that speaks the adjuster's language, includes the evidence they need, and arrives the same day the damage was found. That combination (correct format, strong documentation, fast submission) is what gets supplements approved.\n\nNeed the full code list? See our <a href='/blog/xactimate-codes-for-roofing-supplements'>complete Xactimate codes reference</a>."
      },
    ],
  },
  {
    slug: "roof-replacement-estimate-vs-final-cost",
    title: "Roof Replacement Estimate vs. Final Cost: Why Supplements Close the Gap",
    metaTitle: "Roof Replacement Estimate vs. Final Cost: The Gap",
    metaDescription: "Why the first roof replacement estimate is lower than the final cost, what adjuster inspections miss, and how supplements bridge the gap.",
    publishedDate: "2026-03-10",
    externalLinks: [
      { text: "Insurance Information Institute", url: "https://www.iii.org" },
      { text: "NRCA: Roof Replacement Standards", url: "https://www.nrca.net" },
      { text: "Verisk Property Estimating", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    highlight: { label: "What Changes the Final Cost", value: "Hidden damage", subtext: "Decking, flashing and extra layers are found at tear-off and are not in the first estimate" },
    images: {
      5: { src: "/blog/roof-replacement-estimate-vs-final-cost/supplement-snap-project-value.png", width: 2533, height: 812, alt: "Supplement Snap app showing project with $1,300 estimated supplement value and damage capture workflow" },
    },
    related: ["roofing-permit-fees-insurance-claim", "insurance-lowball-roof-estimate-what-to-do", "roof-tear-off-cost","roofing-code-upgrades-ordinance-and-law","roofing-overhead-and-profit-claims","how-to-write-a-roofing-supplement"],
    sections: [
      {
        heading: "Why the initial estimate is always lower than the final cost",
        content: "If you've been in the roofing business for any length of time, you already know this: the insurance adjuster's initial estimate almost never covers the full cost of replacing the roof. The estimate comes in at $9,500, but by the time your crew finishes the job, the actual cost is $12,000 or more.\n\nThis gap between the initial estimate and the final cost isn't a mistake, and it isn't the adjuster being dishonest. It's a structural reality of how insurance roof inspections work. The adjuster inspects the roof from the surface. They walk it, note visible damage, and write an estimate based on what they can see. They don't tear off the shingles. They don't inspect the decking underneath. They don't check whether the flashing behind the chimney has corroded or whether the ice and water shield in the valleys has deteriorated.\n\nThe initial estimate covers the visible scope. The actual job includes everything hidden underneath. That's where the gap comes from, and it's why supplements exist: to close it."
      },
      {
        heading: "What gets missed in adjuster inspections",
        content: "Insurance adjusters are not trying to shortchange you. They're writing an estimate based on a surface-level inspection, and there's a long list of items that cannot be assessed without removing the existing roofing materials.\n\nThe most commonly missed items include:\n\n• Rotted decking: Plywood or OSB that has deteriorated from years of moisture penetration. The shingles on top may look fine, but the wood underneath is soft, spongy, or crumbling. Damaged decking is a common hidden cost, and the amount depends on how many sheets are affected and on local material and labor prices.\n\n• Failed step and counter flashing: Metal flashing at chimneys, walls, and dormers corrodes over time behind the shingles, invisible from the surface. Replacing flashing at a single chimney can add $200–$500.\n\n• Missing or deteriorated ice and water shield: Many older roofs were installed before current building codes required ice and water shield in valleys, at eaves, and around penetrations. This can add $200–$500 depending on coverage area.\n\n• Cracked pipe boots: Rubber gaskets around plumbing vents crack and split with age. Each pipe boot is a small cost, but they add up across a roof.\n\n• Additional layers of roofing: The original estimate may have been written for a single-layer tear-off. Additional layer removal on a 25-square roof adds $950–$1,375.\n\n• Missing drip edge: Older homes often lack drip edge entirely. Full perimeter replacement runs $150–$400."
      },
      {
        heading: "The real numbers: estimate vs. actual cost",
        content: "Let's put real numbers to this. Consider a typical 25-square residential roof replacement on a home built in the early 2000s with storm damage.\n\nThe adjuster's initial estimate:\n\n• Tear-off (1 layer): $1,125\n• New architectural shingles: $4,500\n• Felt underlayment: $625\n• Ridge cap: $375\n• Pipe boot replacement (1 visible): $85\n• Haul debris: $562\n• O&P (20%): $1,454\n• Total initial estimate: $8,726\n\nWhat the crew finds during tear-off:\n\n• 3 sheets of rotted decking along the eave: $209\n• Corroded step flashing at the chimney (24 LF): $210\n• Missing ice and water shield in both valleys (180 SF): $333\n• 2 additional cracked pipe boots: $170\n• Missing drip edge along the rakes (45 LF): $191\n• O&P on additional items (20%): $223\n• Total hidden damage: $1,336\n\nThe actual cost is now $10,062, a gap of $1,336. On more complex roofs with multiple penetrations, steep pitches, or older construction, this gap can easily reach $2,500–$4,000.\n\nMultiply that across every insurance job you do. If hidden damage regularly goes undocumented across many insurance roofs, that is work you do without being paid for it, unless you submit supplements."
      },
      {
        heading: "How supplements bridge the gap",
        content: "A supplement is the formal mechanism for closing the gap between the initial estimate and the actual cost. It's a documented request to the insurance carrier saying: your adjuster estimated the visible damage accurately, but our crew found additional concealed damage during tear-off that needs to be covered.\n\nA well-documented supplement includes:\n\n• Photographs of each concealed damage finding, taken during tear-off before new materials cover it up\n• A professional narrative explaining what was found, where it was located, why it was concealed, and why the repair is necessary\n• Xactimate line items with the correct codes, quantities, and current pricing\n• Building code references where applicable\n\nWhen submitted with good documentation, supplements are easier to review, though the carrier makes the decision. Adjusters expect them because they know their surface inspection doesn't catch everything. The key word is 'properly.' A supplement with clear photos, a detailed narrative, and accurate Xactimate formatting gets approved. A supplement with a blurry photo and 'found some bad decking' gets denied.\n\nThe difference between contractors who consistently recover supplement revenue and those who don't comes down to documentation quality and submission speed."
      },
      {
        heading: "Real scenarios: estimate vs. final with supplements",
        content: "Three scenarios based on common job types:\n\nScenario 1: Simple ranch home, 20 squares\n• Initial estimate: $7,200\n• Hidden damage: 2 sheets rotted decking, 2 cracked pipe boots, missing drip edge on front eave\n• Supplement value: $680 + O&P = $816\n• Final cost with supplement: $8,016\n• Revenue recovered: 11% above initial estimate\n\nScenario 2: Two-story colonial, 30 squares, chimney and dormers\n• Initial estimate: $12,800\n• Hidden damage: 4 sheets rotted decking, corroded step flashing at chimney and 2 dormers, missing ice and water shield in valleys, 3 cracked pipe boots\n• Supplement value: $2,180 + O&P = $2,616\n• Final cost with supplement: $15,416\n• Revenue recovered: 20% above initial estimate\n\nScenario 3: Complex multi-level, 35 squares, multiple layers\n• Initial estimate: $14,500\n• Hidden damage: 6 sheets rotted decking, second layer of shingles, deteriorated ice and water shield, corroded flashing at 2 walls, 4 cracked pipe boots, missing drip edge full perimeter\n• Supplement value: $4,340 + O&P = $5,208\n• Final cost with supplement: $19,708\n• Revenue recovered: 36% above initial estimate\n\nIn every scenario, the supplement represents real work the contractor has to do regardless. The only question is whether they get paid for it."
      },
      {
        heading: "How to systematically capture the difference on every job",
        content: "Recovering supplement revenue can't happen only when someone in the office remembers. It needs to be a systematic part of your production workflow.\n\nHere's what a systematic supplement process looks like:\n\n• Train every crew to recognize and document hidden damage during tear-off: rotted decking, corroded flashing, deteriorated pipe boots\n• Establish a documentation protocol: when damage is found, stop and photograph it before covering it with new materials. Wide-angle context shot and close-up detail shot.\n• Use a tool that makes documentation fast and easy. If it takes 20 minutes per finding, your crew won't do it. If it takes 30 seconds to snap a photo and tag the damage type, they'll do it every time.\n• Generate the supplement report the same day. Don't let findings sit in someone's camera roll for a week.\n• Track supplement status for every job: submitted, pending, approved, denied. Follow up weekly.\n\nContractors who build documentation into their standard workflow are better placed to request payment for hidden damage. Those who treat it as an afterthought recover on maybe 10–20%."
      },
      {
        heading: "Close the gap with Supplement Snap",
        content: "Supplement Snap was built to make this systematic approach effortless. During tear-off, the crew opens the app and captures each finding: a photo tagged with the damage type and roof area, plus an optional voice note. Voice notes work in any language. Spanish-speaking crews describe findings in Spanish and the system auto-translates to English.\n\nFrom that field data, Supplement Snap generates everything you need:\n\n• A professional supplement narrative for each finding, written in the language adjusters expect\n• Xactimate line items with correct codes, quantities, and current regional pricing\n• An Xactimate-compatible CSV export the adjuster can import directly\n• A branded PDF report with photos, narratives, findings summary, and line items, ready to email\n\nThe entire process from capturing damage on the roof to emailing a complete supplement report takes minutes, not days. Your crew does what they're already doing (finding damage during tear-off) and Supplement Snap turns those findings into revenue.\n\nThe gap between the initial estimate and the final cost will always exist. The question is whether you have a system to capture it. With Supplement Snap, every hidden finding becomes a documented, submitted, trackable supplement, and you get paid for the work you're actually doing.\n\nCurious about actual supplement values? See <a href='/blog/how-much-do-roofing-supplements-pay'>how much roofing supplements pay</a>."
      },
    ],
  },
  {
    slug: "storm-damage-roof-repair-near-me",
    title: "Storm Damage Roof Repair Near Me: How Contractors Win Local Storm Jobs",
    metaTitle: "Storm Damage Roof Repair Near Me: Win Local Jobs",
    metaDescription: "How roofing contractors can win local storm damage repair searches: lead generation, insurance claim workflows and beating storm chasers.",
    publishedDate: "2026-03-14",
    externalLinks: [
      { text: "Better Business Bureau: Contractor Lookup", url: "https://www.bbb.org" },
      { text: "NRCA: Find a Contractor", url: "https://www.nrca.net" },
      { text: "NOAA Storm Events Database", url: "https://www.ncdc.noaa.gov/stormevents/" },
    ],
    highlight: { label: "Storm Season Tip", value: "Same-Day Documentation", subtext: "Contractors who document damage during tear-off have stronger support for their supplements" },
    images: {
      0: { src: "/blog/storm-damage-roof-repair-near-me/contractor-homeowner.jpg", width: 848, height: 564, alt: "Roofing contractor discussing storm damage repair options with a homeowner" },
    },
    visuals: {
      1: { type: "checklist", data: {
        title: "What to Look For in a Storm Damage Contractor",
        items: [
          { text: "Licensed and insured in your state with verifiable credentials", checked: true },
          { text: "Established local presence (office, yard, or warehouse nearby)", checked: true },
          { text: "Manufacturer certifications (GAF, Owens Corning, CertainTeed)", checked: true },
          { text: "Experience filing insurance supplements for concealed damage", checked: true },
          { text: "Willing to meet your adjuster on-site for re-inspection", checked: true },
          { text: "Provides written scope of work before starting the job", checked: true },
          { text: "Uses Xactimate-standard pricing and line codes", checked: true },
          { text: "Offers a workmanship warranty (minimum 5 years)", checked: true },
          { text: "Has verifiable reviews on Google, BBB, or Angi", checked: true },
          { text: "Does NOT require large upfront deposits before work begins", checked: false },
        ],
      }},
      2: { type: "tip", data: {
        type: "warning",
        title: "Storm Chaser Red Flags",
        text: "Be cautious of contractors who show up uninvited after a storm, pressure you to sign immediately, ask for full payment upfront, cannot provide a local address, or offer to \"cover your deductible.\" Covering a homeowner's deductible is insurance fraud in most states. Legitimate contractors will never suggest it.",
      }},
      3: { type: "steps", data: [
        { num: "1", title: "File your insurance claim", desc: "Contact your insurance company within 24-48 hours of the storm. They will assign an adjuster and open a claim." },
        { num: "2", title: "Schedule a contractor inspection", desc: "Have a licensed storm damage contractor inspect your roof independently. They should document all visible damage with photos." },
        { num: "3", title: "Meet the adjuster on-site", desc: "A good contractor will meet the adjuster during the inspection to ensure all visible damage is captured in the initial estimate." },
        { num: "4", title: "Review the initial estimate", desc: "The adjuster writes an Xactimate estimate covering visible damage. Review it with your contractor to understand the scope." },
        { num: "5", title: "Approve the scope and schedule repairs", desc: "Once the claim is approved, sign a contract with your chosen contractor. Work should begin within 1-4 weeks depending on storm volume." },
        { num: "6", title: "Tear-off and hidden damage discovery", desc: "During tear-off, the crew documents concealed damage (rotted decking, failed flashing, deteriorated pipe boots) for a supplement." },
        { num: "7", title: "Supplement submission and approval", desc: "Your contractor submits a supplement to the insurance company with photos, narratives, and Xactimate line items for the hidden damage." },
        { num: "8", title: "Final inspection and completion", desc: "After repairs are complete, the contractor does a final walkthrough. You receive warranty documentation and final paperwork." },
      ]},
      5: { type: "calculator", data: {
        title: "Example Storm Damage Repair Cost Breakdown (Illustrative, Not a Quote)",
        rows: [
          { label: "Tear-off and disposal (25 SQ avg)", value: "$1,125 - $1,875" },
          { label: "New architectural shingles (25 SQ)", value: "$4,500 - $6,250" },
          { label: "Underlayment and starter strip", value: "$625 - $950" },
          { label: "Ridge cap and ventilation", value: "$375 - $800" },
          { label: "Pipe boots (3-5 typical)", value: "$255 - $425" },
          { label: "Drip edge replacement", value: "$150 - $400" },
          { label: "Common supplement items (decking, flashing, I&WS)", value: "$800 - $2,500" },
        ],
        total: { label: "Example Total (before O&P). Prices vary by region and date", value: "$7,830 - $13,200", color: "text-indigo-600" },
      }},
    },
    sections: [
      {
        heading: "What qualifies as storm damage on a roof?",
        content: "Storm damage to a roof can come from wind, hail, fallen trees, flying debris, or heavy rain that exploits existing vulnerabilities. Each type of storm leaves a different signature on your roofing materials, and understanding what to look for is the first step toward getting a proper repair.\n\nWind damage typically shows up as lifted, creased, or missing shingles. During high winds, the edges and ridge line of the roof take the most force, so you'll often see damage concentrated along the perimeter and at the peak. In severe cases, entire sections of shingles can be peeled back, exposing the underlayment or decking beneath.\n\nHail damage is harder to spot from the ground. Hail impacts create small dents or bruises on asphalt shingles, knocking loose the protective granules. These impacts weaken the shingle's ability to shed water, leading to premature failure. A trained inspector can identify hail hits by their circular pattern and the exposed black substrate where granules have been displaced.\n\nFalling branches and debris cause obvious puncture damage, but they can also crack decking, bend flashing, and dislodge ridge caps. Even if the visible damage looks minor, the underlying structure may have taken a significant hit.\n\nHeavy rain and ice dams don't always damage the roof surface directly, but they can drive water into areas where flashing has failed, where ice and water shield is missing, or where previous repairs were done poorly. The resulting water damage to decking and rafters often isn't visible until tear-off.\n\nIf you've experienced a significant storm, don't assume your roof is fine just because you don't see missing shingles from the ground. Many types of storm damage are only visible from the roof surface, and concealed damage beneath the shingles may not become apparent until a contractor begins the repair."
      },
      {
        heading: "How to find a qualified storm damage contractor near you",
        content: "Searching for \"storm damage roof repair near me\" will return dozens of results, and after a major storm, your phone may ring with contractors offering free inspections. The challenge is separating qualified local professionals from out-of-town storm chasers who follow weather events from state to state.\n\nStart with these verification steps:\n\n• Check licensing: Every state has different contractor licensing requirements. Verify the contractor's license number through your state's licensing board website. If they can't provide a license number, move on.\n\n• Confirm insurance: Ask for a certificate of insurance showing both general liability and workers' compensation coverage. Call the insurance company listed on the certificate to confirm the policy is active. If a worker is injured on your property and the contractor doesn't carry workers' comp, you could be liable.\n\n• Look for a local presence: A contractor with a local office, warehouse, or yard has a stake in the community. They'll be around to honor warranties and address issues. A contractor operating out of a hotel room two states away may not be.\n\n• Check references and reviews: Look at Google reviews, Better Business Bureau ratings, and Angi profiles. Pay attention to how the contractor responds to negative reviews. Ask for references from recent storm damage jobs in your area.\n\n• Verify manufacturer certifications: Certifications from shingle manufacturers (GAF Master Elite, Owens Corning Platinum, CertainTeed SELECT ShingleMaster) indicate the contractor has met training and performance standards. These certifications also provide extended warranty options for your new roof.\n\n• Ask about supplement experience: This is a detail many homeowners overlook. A contractor experienced with insurance supplements understands how to document concealed damage properly and recover the full cost of repairs from your insurance company. This means you're less likely to face unexpected out-of-pocket costs."
      },
      {
        heading: "Red flags: how to spot storm chasers and avoid scams",
        content: "Storm chasers are contractors (or people posing as contractors) who travel to areas hit by severe weather, knock on doors, and offer quick roof repairs. Some are legitimate businesses working outside their home market. Many are not. Here's how to protect yourself.\n\nDoor-to-door solicitation right after a storm is the most common storm chaser tactic. A person shows up at your door, says they noticed damage on your roof, and offers a free inspection. They may even climb onto your roof uninvited. While some legitimate companies do canvass after storms, be cautious of anyone who pressures you to sign a contract on the spot.\n\nHigh-pressure sales tactics are a major warning sign. If someone tells you the damage will get worse if you don't act today, that the insurance company will deny your claim if you wait, or that they can only offer this price right now, they're trying to prevent you from doing your due diligence. A legitimate contractor will give you time to verify their credentials and get competing estimates.\n\nRequesting full payment upfront (or even a large deposit) before any work begins is a red flag. Standard practice in the industry is to collect a deposit of no more than 10-20% at contract signing, with the balance due upon completion. Some storm chasers collect full payment and never return.\n\nOffering to \"cover your deductible\" or \"waive your deductible\" is not a favor. It is insurance fraud in most states. The contractor inflates the claim amount to absorb the deductible, which is illegal. If a contractor makes this offer, they are telling you they are willing to commit fraud on your behalf. Walk away.\n\nNo local address or verifiable history is a clear indicator. Ask for a physical business address (not a P.O. box). Search for the company name plus the city to see if they have an established presence. Check how long their website has been active. Storm chasers often set up temporary websites and Google Business profiles for each market they enter.\n\nIf you've already signed a contract with a company you now suspect is illegitimate, check your state's contractor cancellation laws. Many states allow a 3-day right of rescission for home improvement contracts signed at your residence."
      },
      {
        heading: "How the insurance claim process works for storm damage repairs",
        content: "Understanding the insurance claim process helps you work effectively with both your insurance company and your contractor. Here is the typical timeline from storm to completed repair.\n\nStep 1: File the claim promptly. Contact your insurance company within 24-48 hours of the storm. Most policies have time limits for reporting damage, and delays can complicate your claim. Your insurer will assign a claim number and schedule an adjuster visit.\n\nStep 2: Get an independent contractor inspection. Before the adjuster arrives, have a qualified contractor inspect your roof. They should document all visible damage with photos and provide you with a written assessment. This gives you a baseline to compare against the adjuster's findings.\n\nStep 3: The adjuster inspection. The insurance adjuster will visit your property, inspect the roof, and write an initial estimate using Xactimate. A good practice is to have your contractor present during this inspection so they can point out damage the adjuster might miss. The adjuster's estimate covers only what they can see from the surface.\n\nStep 4: Review the initial estimate. Your contractor should review the adjuster's Xactimate estimate with you. They can identify items that may have been missed or undervalued. If significant visible damage was overlooked, your contractor can request a re-inspection before work begins.\n\nStep 5: Authorize repairs and begin work. Once you're satisfied with the scope, sign a contract with your chosen contractor and schedule the work. Your insurance company issues the first payment (minus your deductible), often held in escrow if you have a mortgage.\n\nStep 6: Tear-off reveals hidden damage. This is the critical phase. When the crew removes the existing roofing materials, they frequently discover concealed damage: rotted decking, corroded flashing, deteriorated pipe boots, missing ice and water shield. This damage was invisible during both your contractor's inspection and the adjuster's visit.\n\nStep 7: Your contractor submits a supplement. The supplement is a formal request for additional insurance payment to cover the concealed damage. It includes photos taken during tear-off, a professional narrative, and Xactimate line items. A well-documented supplement submitted promptly is easier to review, though the carrier makes the decision.\n\nStep 8: Supplement approval and final payment. The insurance company reviews the supplement, may request additional information or a re-inspection, and issues additional payment for approved items. The entire process from claim filing to final supplement approval typically takes 4-8 weeks."
      },
      {
        heading: "Questions to ask before hiring a storm damage contractor",
        content: "Before you sign a contract, ask these questions. The answers will tell you whether the contractor is qualified, experienced, and trustworthy.\n\n• \"Can I see your license and insurance certificate?\" Any legitimate contractor will have these ready. If they hesitate, make excuses, or say they'll send it later, that's a red flag.\n\n• \"How long have you been operating in this area?\" Local experience matters. A contractor who has worked in your region for years understands local building codes, common roofing issues for your climate, and has relationships with local suppliers and inspectors.\n\n• \"Will you meet my adjuster on-site?\" A contractor willing to be present during the adjuster's inspection is confident in their work and invested in making sure the claim captures all the damage.\n\n• \"How do you handle hidden damage found during tear-off?\" This is a critical question. The answer should involve documentation (photos, narratives), Xactimate-formatted supplements, and prompt submission to the insurance company. If the contractor says they'll \"just add it to the final bill\" or looks confused by the question, they may not have experience with the supplement process.\n\n• \"What does your warranty cover?\" Get the warranty details in writing. Understand what's covered (workmanship, materials, or both), for how long, and what would void the warranty.\n\n• \"Can you provide references from recent storm damage jobs?\" Call the references. Ask if the work was completed on time, if the contractor handled the insurance process smoothly, and if there were any issues after completion.\n\n• \"What is your payment schedule?\" Expect a small deposit at signing (10-20%), with the balance due upon satisfactory completion. Never pay the full amount before work is finished."
      },
      {
        heading: "What the repair process looks like and what to expect with costs",
        content: "A typical storm damage roof repair follows a predictable sequence, though the timeline can stretch during peak storm season when contractors are in high demand.\n\nThe contractor begins with material delivery, usually 1-3 days before the scheduled start date. Shingle bundles, underlayment rolls, flashing, and accessories are staged in your driveway or yard.\n\nOn the day of repair, the crew arrives early (typically 7-8 AM) and begins by protecting your landscaping and siding with tarps and boards. Tear-off starts at the ridge and works downward, with old shingles and underlayment stripped to the decking. This is when concealed damage is discovered and documented.\n\nAfter tear-off and documentation, the crew makes necessary repairs (replacing decking, installing flashing, adding ice and water shield), then installs new underlayment, shingles, and accessories. A typical single-layer residential roof takes 1-2 days to complete.\n\nRegarding costs, most storm damage roof repairs are covered by homeowner's insurance minus your deductible. The deductible is your out-of-pocket responsibility and typically ranges from $500 to $2,500 depending on your policy. Some policies have separate wind/hail deductibles that may be calculated as a percentage of your coverage (commonly 1-2% of your dwelling coverage).\n\nThe total cost of a storm damage roof replacement varies significantly based on roof size, pitch, complexity, material choice, and regional labor rates. For a typical 25-square residential roof with architectural shingles, the total repair cost (including common supplement items) generally falls between $8,000 and $14,000 before overhead and profit.\n\nThe supplement portion of the cost, covering hidden damage discovered during tear-off, typically adds $800 to $2,500 to the initial estimate. This is additional insurance coverage, not an additional cost to you. A contractor who documents and submits supplements properly ensures the insurance company pays for the full scope of necessary repairs, which protects you from being asked to cover the difference out of pocket."
      },
      {
        heading: "How good contractors document damage for insurance (and how Supplement Snap helps)",
        content: "The quality of damage documentation separates contractors who recover full insurance value from those who leave thousands of dollars on the table. For homeowners, this matters because thorough documentation means your insurance company pays for all necessary repairs. For contractors, this is the single biggest lever for revenue recovery on insurance jobs.\n\nGood documentation during tear-off includes:\n\n• Wide-angle photos showing the damage in context (where on the roof it is located)\n• Close-up photos showing the damage in detail (the condition of the affected material)\n• A description of each finding: what was found, where, what condition it was in, and why it was concealed\n• Accurate measurements: square footage of damaged decking, linear footage of failed flashing, count of deteriorated pipe boots\n• Xactimate line codes mapped to each finding with correct quantities and current regional pricing\n\nThe challenge is that this documentation needs to happen on the roof, during active tear-off, with a crew that's focused on getting the job done. Most contractors lose critical documentation because the crew takes a few blurry photos on a personal phone, texts them to the office days later, and by the time someone writes up the supplement, the details are incomplete.\n\nSupplement Snap solves this by putting the documentation tool directly in the crew's hands during tear-off. The crew member taps to capture a photo, selects the damage type (decking, flashing, pipe boot, ice and water shield), chooses the roof area, and records a quick voice note describing what they found. Voice notes work in any language, so Spanish-speaking crews describe findings naturally and the system auto-translates to English.\n\nFrom that field data captured in real time, Supplement Snap generates the complete supplement package: AI-written professional narratives, Xactimate line items with correct codes and pricing, an exportable CSV, and a branded PDF report ready to email to the adjuster. The supplement gets submitted the same day the damage is found, while the evidence is fresh and the adjuster can verify it.\n\nFor homeowners, this means your contractor captures every legitimate finding and submits proper documentation so your insurance covers the full repair. For contractors, this means systematic supplement recovery on every insurance job, turning what used to be an afterthought into a reliable revenue stream.\n\nFor hail specifically, see our <a href='/blog/hail-damage-roof-inspection'>hail damage inspection guide</a>."
      },
    ],
  },
  {
    slug: "best-roofing-crm",
    title: "7 Best Roofing CRMs in 2026 (Compared by Who They Fit)",
    metaTitle: "7 Best Roofing CRM Software Options (2026)",
    metaDescription: "Seven roofing CRMs compared for 2026: JobNimbus, AccuLynx, Roofr, Leap, RoofLink, ServiceTitan and a general CRM. Who each fits and what to check.",
    publishedDate: "2026-03-17",
    updatedDate: "2026-10-26",
    externalLinks: [
      { text: "JobNimbus", url: "https://www.jobnimbus.com" },
      { text: "AccuLynx", url: "https://acculynx.com" },
      { text: "Roofr", url: "https://roofr.com" },
      { text: "Leap", url: "https://leaptodigital.com" },
      { text: "RoofLink", url: "https://rooflink.com" },
      { text: "ServiceTitan", url: "https://www.servicetitan.com" },
      { text: "NRCA: Technology Resources", url: "https://www.nrca.net" },
    ],
    highlight: { label: "Pick by company size", value: "Match the tool to your crew", subtext: "A solo roofer and a 20-person company need very different CRMs. Test one real job before you commit." },
    images: {
      0: { src: "/blog/best-roofing-crm/roofing-office.jpg", width: 1200, height: 800, alt: "Roofing contractor using CRM software on a computer screen" },
    },
    visuals: {
      0: { type: "matrix", data: {
        label: "CRM",
        headers: ["Best known for", "Good fit when"],
        rows: [
          { feature: "1. JobNimbus", values: ["A straightforward roofing CRM with a visual pipeline", "You want quick setup and a clean pipeline for leads and jobs"] },
          { feature: "2. AccuLynx", values: ["A broad roofing business-management platform", "You have a crew and office and want one system for the whole job"] },
          { feature: "3. Roofr", values: ["Measurements, estimates and proposals with a CRM", "You are a small residential crew that quotes and closes retail jobs"] },
          { feature: "4. Leap", values: ["Sales and customer tools for home-improvement contractors", "Your priority is the sales process and customer experience"] },
          { feature: "5. RoofLink", values: ["Roofing-specific CRM and project management", "You want a roofing-focused system and will compare it to the bigger names"] },
          { feature: "6. ServiceTitan", values: ["A large home-services platform", "You are a larger operation that needs enterprise-style tools"] },
          { feature: "7. A general CRM", values: ["Flexible contact and pipeline tracking (for example HubSpot)", "You are small and want to start cheaply, accepting manual setup"] },
        ],
      }},
      8: { type: "compare", data: {
        before: { label: "What a CRM usually does", items: ["Tracks leads from first contact to close", "Builds estimates and proposals", "Schedules crews and jobs", "Stores customer records and documents", "Reports on your sales pipeline"] },
        after: { label: "What many CRMs leave to other tools", items: ["Documenting hidden damage at tear-off", "Writing supplement descriptions from field notes", "Building a report for the insurance adjuster", "Matching findings to estimating line items", "Tracking what each supplement recovered"] },
      }},
      9: { type: "checklist", data: { title: "Questions to ask before you pick a CRM", items: [
        { text: "Will my crew actually use it on a phone, with gloves and sun glare?", checked: true },
        { text: "Does it match how I sell: retail, insurance or both?", checked: true },
        { text: "What does it cost at my real number of users?", checked: true },
        { text: "Can I export my customers and jobs if I leave?", checked: true },
        { text: "How long does setup take, and who helps?", checked: true },
        { text: "Did I run one real job through a trial first?", checked: true },
      ]}},
      10: { type: "tip", data: { type: "info", title: "Verify before you buy", text: "Features, plans and prices change often, and any comparison page, including this one, can be out of date. We left prices and feature checklists out on purpose, because we cannot confirm them for you. Check each vendor's site and run a trial." } },
    },
    related: ["best-roof-estimating-software", "roofing-software-comparison", "best-roofing-supplement-software", "companycam-alternative-roofing-supplements"],
    faq: [
      { q: "What is the best CRM for a roofing company?", a: "There is no single best one. JobNimbus is often chosen for simple setup, AccuLynx for a broader business platform, Roofr for small residential crews that want measurements and proposals together, and ServiceTitan by larger operations. Pick by your crew size and how you sell, then trial one real job." },
      { q: "What is the best affordable CRM for a solo roofing business?", a: "A solo roofer often does best with the lightest tool that tracks leads and sends proposals, either a roofing tool with a small plan or a general CRM. Compare current plan prices, check for free tiers or trials, and avoid paying for features you will not use in your first year." },
      { q: "What is a CRM for a roofing company?", a: "A CRM keeps track of every homeowner from the first call through the finished job: leads, appointments, estimates, contracts and follow-ups. It replaces spreadsheets, sticky notes and scattered texts. Many roofing CRMs also include estimating, scheduling and document storage." },
      { q: "Do roofing CRMs help with insurance supplements?", a: "Some include claim-tracking features, and how deep they go varies by product. Many contractors pair a CRM with a separate tool for documenting hidden damage and building the adjuster report. Ask each vendor how it handles supplements on a real job." },
      { q: "Should I use a general CRM like HubSpot for roofing?", a: "You can. A general CRM is flexible and can be inexpensive to start, but you set up the roofing pipeline, templates and automations yourself. A roofing-specific CRM saves setup time but may cost more. Choose based on how much setup you are willing to do." },
    ],
    sections: [
      {
        heading: "The short answer: seven CRMs, and who each one fits",
        content: "The best roofing CRM depends on your company size and how you sell. A small residential crew needs fast quoting and simple follow-up. A company with an office and several crews needs scheduling, documents and reporting. An insurance-heavy contractor also needs to track claims.\n\nThe table lists seven options in no particular order. No vendor paid to be on this list, and we left out prices and feature checkmarks because they change and we cannot verify them for you.\n\nDisclosure: we make Supplement Snap, which is not a CRM. We explain how it fits next to one near the end.",
      },
      {
        heading: "1. JobNimbus: a straightforward roofing CRM",
        content: "JobNimbus is a CRM and project-management tool used by roofing and other contractors. It is known for a visual pipeline, estimates, e-signatures and a mobile app, and it is often chosen because setup is straightforward.\n\n• Good fit when: You want an organized pipeline for leads and jobs without a long setup.\n• Watch for: Confirm which integrations are current, and ask how it handles insurance-claim workflow if that is part of your business.\n• Cost: Check JobNimbus's current plans.",
      },
      {
        heading: "2. AccuLynx: a broad business-management platform",
        content: "AccuLynx is built specifically for roofing contractors and aims to cover the whole path from lead to completed job, including estimating, documents, scheduling and workflow features for insurance work.\n\n• Good fit when: You have an office and crews and want a single system for the business.\n• Watch for: A broad platform can take longer to learn and may be more than a small crew needs. Ask how deep its claim and supplement features go for your process.\n• Cost: Check AccuLynx's current pricing.",
      },
      {
        heading: "3. Roofr: measurements, proposals and a CRM together",
        content: "Roofr combines aerial roof measurements, instant estimates and proposals with a CRM. That makes it attractive to small residential crews that want to measure, quote and follow up in one place. We cover its estimating side in our list of the <a href='/blog/best-roof-estimating-software'>best roof estimating software</a>.\n\n• Good fit when: You run residential retail jobs and want quoting and customer tracking together.\n• Watch for: If you work insurance claims, check how it handles the carrier's estimating format.\n• Cost: Check Roofr's current plans, including any free tier.",
      },
      {
        heading: "4. Leap: sales and customer tools for contractors",
        content: "Leap offers sales and customer-experience tools for home-improvement contractors, including roofing. It leans toward the sales process: proposals, presentations, customer communication and financing options.\n\n• Good fit when: Your biggest gap is closing deals and giving homeowners a clear, professional buying experience.\n• Watch for: Confirm how much of production and job management it covers, and what you would still run elsewhere.\n• Cost: Check Leap's current pricing.",
      },
      {
        heading: "5. RoofLink: a roofing-focused CRM",
        content: "RoofLink is a CRM and project-management system aimed at roofing contractors. It is a smaller name than some of the others here, which can mean a more focused product, and it is worth comparing in a trial.\n\n• Good fit when: You want a roofing-specific system and are willing to compare a few options side by side.\n• Watch for: Check current features, integrations and the support you would get, since these change.\n• Cost: Check RoofLink's current pricing.",
      },
      {
        heading: "6. ServiceTitan: a large home-services platform",
        content: "ServiceTitan is a large home-services platform used mainly by bigger operations across trades. It brings dispatching, booking, invoicing and reporting in one system.\n\n• Good fit when: You are a larger company that needs enterprise-style tools and has someone to set them up.\n• Watch for: It can be more than a small roofing crew needs. Ask how well it fits roofing and insurance work specifically.\n• Cost: Check ServiceTitan's current pricing, which is typically quote-based.",
      },
      {
        heading: "7. A general CRM such as HubSpot: flexible and cheap to start",
        content: "A general-purpose CRM, such as HubSpot or Salesforce, tracks contacts, deals and follow-ups, and you can shape it into a roofing pipeline. Some offer free or low-cost starting plans.\n\n• Good fit when: You are small, comfortable setting things up, and want to start without a big monthly bill.\n• Watch for: There are no roofing templates built in. You build the stages, reminders and documents yourself, and estimates usually live in another tool.\n• Cost: Check current plans and what is limited on the free or entry tier.",
      },
      {
        heading: "What a CRM does not cover: the field documentation gap",
        content: "A CRM manages the customer journey. On an insurance job, another piece of work happens after tear-off: documenting damage that was hidden under the old roof, writing it up and sending the adjuster a clear report. Many CRMs store photos, but photos alone are not a supplement package.\n\nSupplement Snap is built for that step. Crews photograph the damage on the roof, add a note or voice recording, and review the drafted descriptions. A PDF report can be emailed to the adjuster, and Team plans add an Xactimate-style CSV export that you review and price yourself. It is not a CRM and does not replace one, so use it next to the system you choose. Try it with a free project and see the <a href='/roofing-supplement-report-example'>sample supplement report</a>.\n\nSee also <a href='/blog/best-roofing-supplement-software'>best roofing supplement software</a> and <a href='/blog/roofing-software-comparison'>roofing software for contractors compared</a>.",
      },
      {
        heading: "How to choose and test fairly",
        content: "Pick one real job and run it through a trial of two or three CRMs. Add the lead, build the estimate, schedule the work and store the documents. Then ask your crew lead to try it on a phone. The one that your crew will actually use is usually the right choice.\n\nA caution about roundups: vendor-written lists tend to favor the publisher's product, including ours, which is why this one sticks to descriptions you can check yourself.",
      },
      {
        heading: "Also worth a look",
        content: "Other names come up in roofing software searches. Which fits depends on your work:\n\n• Jobber and similar field-service tools: simple scheduling and invoicing for small crews.\n• Buildertrend and similar construction tools: project management for larger builds and remodels.\n• CompanyCam: job photos for many trades, not a CRM. See <a href='/blog/companycam-alternative-roofing-supplements'>photo apps vs. supplement tools</a>.",
      },
    ],
  },
  {
    slug: "storm-damage-roof-repair",
    title: "Storm Damage Roof Repair: What Contractors Need to Know in 2026",
    metaTitle: "Storm Damage Roof Repair: Contractor Guide (2026)",
    metaDescription: "Complete guide to storm damage roof repair for contractors: identify wind, hail and debris damage, handle insurance claims and maximize recovery on every job.",
    publishedDate: "2026-03-20",
    externalLinks: [
      { text: "NOAA Storm Prediction Center", url: "https://www.spc.noaa.gov" },
      { text: "NRCA: Storm Damage Resources", url: "https://www.nrca.net" },
      { text: "Insurance Information Institute", url: "https://www.iii.org" },
    ],
    highlight: { label: "Storm Damage", value: "Hail and wind", subtext: "The two storm types most often behind insurance roof claims" },
    images: {
      1: { src: "/blog/storm-damage-roof-repair/storm-roof.jpg", width: 1200, height: 800, alt: "Roof with visible storm damage showing wind-lifted and missing shingles" },
    },
    visuals: {
      0: { type: "damage-cards", data: [
        { icon: "wind", title: "Wind Damage", desc: "Lifted, creased, or missing shingles caused by high winds. Often starts at edges and ridgelines where uplift pressure is greatest.", value: "58 mph+" },
        { icon: "hail", title: "Hail Damage", desc: "Bruised or fractured shingles with exposed fiberglass mat. May appear as dark spots, dents, or granule displacement on impact zones.", value: "1\" dia+" },
        { icon: "decking", title: "Debris Impact", desc: "Punctured or cracked roofing materials from fallen tree limbs, branches, and airborne objects during severe storms.", value: "Varies" },
        { icon: "ice", title: "Water Intrusion", desc: "Moisture penetration through compromised flashings, damaged shingles, or failed ice and water shield. Often causes concealed decking rot.", value: "Hidden" },
        { icon: "flashing", title: "Flashing Failure", desc: "Bent, displaced, or separated flashings around chimneys, walls, and penetrations caused by wind uplift and thermal cycling during storms.", value: "$8-12/LF" },
        { icon: "drip", title: "Drip Edge Damage", desc: "Bent or detached drip edge along eaves and rakes, often caused by wind-driven debris or ice damming after winter storms.", value: "$4-6/LF" },
      ]},
      2: { type: "timeline", data: [
        { time: "Day 1", title: "Storm event occurs", desc: "Document the storm date and severity. Save weather reports, hail maps, and any alerts for the area. This establishes the loss date for the claim.", color: "red" },
        { time: "Day 2-3", title: "Initial property inspection", desc: "Inspect the roof for visible storm damage. Photograph all findings with wide shots for context and close-ups for detail. Note every damaged component." },
        { time: "Day 5-7", title: "Insurance claim filed", desc: "Help the homeowner file the claim with their carrier. Include your inspection report and photos. The carrier assigns an adjuster and a claim number." },
        { time: "Wk 2-3", title: "Adjuster inspection", desc: "The insurance adjuster inspects the property and writes the initial estimate. Be present if possible to point out damage they might miss." },
        { time: "Wk 3-5", title: "Tear-off reveals hidden damage", desc: "During tear-off, your crew discovers concealed damage: rotted decking, failed underlayment, corroded flashing. Document everything immediately.", color: "red" },
        { time: "Wk 3-5", title: "Supplement submitted", desc: "Submit a professional supplement with photos, narratives, and Xactimate line items for all hidden damage found during tear-off.", color: "green" },
        { time: "Wk 5-8", title: "Supplement approved and paid", desc: "The adjuster reviews and approves the supplement. Payment is issued to cover the additional cost of hidden damage repairs.", color: "green" },
      ]},
      3: { type: "calculator", data: {
        title: "Storm Damage Revenue Per Job (Example: 30 SQ Roof)",
        rows: [
          { label: "Initial insurance estimate (shingles, felt, labor)", value: "$12,500" },
          { label: "Decking replacement (8 sheets discovered at tear-off)", value: "+$1,400" },
          { label: "Ice and water shield (valleys + eaves, code required)", value: "+$680" },
          { label: "Step flashing replacement (chimney + sidewall)", value: "+$520" },
          { label: "Pipe boot replacement (3 deteriorated boots)", value: "+$255" },
          { label: "Drip edge replacement (full perimeter)", value: "+$340" },
        ],
        total: { label: "Total Job Revenue With Supplement", value: "$15,695", color: "green" },
      }},
      5: { type: "tip", data: { type: "tip", title: "Pro Tip: Seasonal Storm Preparation", text: "Build your storm response system before storm season hits. Train crews on damage documentation, pre-load your supplement workflow, and establish relationships with adjusters in your area. Responding quickly after a storm can help, since homeowners often contact several roofers." } },
    },
    related: ["storm-damage-roof-repair-near-me","roof-damage-repair-guide","hail-damage-roof-inspection","roofing-code-upgrades-ordinance-and-law"],
    sections: [
      {
        heading: "Understanding storm damage roof repair",
        content: "Storm damage roof repair is one of the highest-volume, highest-revenue segments in residential roofing. Every year, severe weather events across the United States generate more than $15 billion in insurance payouts for roof damage alone. For contractors who understand how to identify storm damage, document it properly, and navigate the insurance claims process, storm season represents a massive business opportunity.\n\nBut storm damage roofing is fundamentally different from retail roofing. The customer is not paying out of pocket. The insurance company is funding the repair based on their adjuster's estimate. That means your revenue depends not just on the quality of your work, but on the quality of your documentation. Miss a finding during inspection, fail to photograph hidden damage during tear-off, or submit a weak supplement, and you leave money on the table.\n\nThis guide covers the types of storm damage you will encounter, how insurance claims work for storm damage repairs, what hidden damage looks like during tear-off, and how to maximize your recovery on every storm job."
      },
      {
        heading: "Types of storm damage to roofing systems",
        content: "Storm damage to roofing systems falls into several categories, each with distinct visual indicators and documentation requirements. Understanding these categories is critical for thorough inspections and complete insurance claims.\n\n• Wind damage is the most common form of storm damage. High winds create uplift pressure that lifts shingle tabs, breaks the seal strip bond, and in severe cases tears shingles completely off the roof. Wind damage typically starts at the most vulnerable points: ridgelines, eaves, rakes, and corners where uplift forces are strongest. Look for creased shingles, lifted tabs, missing shingles, and exposed underlayment or decking.\n• Hail damage varies depending on hail size, wind speed, roof age, and shingle type. Hailstones 1 inch in diameter or larger typically cause functional damage to asphalt shingles. Signs include random dents or bruises in the shingle surface, displaced granules exposing the fiberglass mat, fractures in the shingle, and dents in soft metals like flashing, vents, and gutters. Hail damage is often subtle and requires a trained eye to distinguish from normal wear.\n• Debris impact damage results from tree limbs, branches, and airborne objects striking the roof during storms. This can range from minor granule loss to punctured shingles and cracked decking. Debris impacts are usually obvious but the full extent of damage beneath the impact point may not be visible until tear-off.\n• Water intrusion damage occurs when storm damage compromises the roof's water-shedding system. Damaged shingles, displaced flashing, and failed sealants allow water to penetrate the roofing system. Over time, this causes decking rot, mold growth, and insulation damage. Water intrusion damage is almost always concealed and is one of the most common supplement items discovered during tear-off."
      },
      {
        heading: "How insurance claims work for storm damage",
        content: "The insurance claims process for storm damage roof repair follows a predictable sequence, but each stage presents opportunities for contractors who are prepared.\n\nThe process begins when the homeowner files a claim with their insurance carrier after a storm event. The carrier assigns a claim number and schedules an adjuster to inspect the property. As the contractor, your role at this stage is to perform your own inspection, document all visible damage, and provide the homeowner with a professional inspection report they can share with their adjuster.\n\nWhen the adjuster arrives, they inspect the property and write an initial estimate using Xactimate. This estimate covers only the damage visible during their inspection. If you can be present during the adjuster's inspection, do it. Walk the roof with them, point out damage they might miss, and make sure they document every affected component.\n\nThe initial estimate rarely covers the full cost of the repair. Why? Because the adjuster inspects the roof from the surface. They cannot see what is under the shingles. Rotted decking, failed underlayment, corroded flashing, deteriorated pipe boots: these are all concealed by the existing roofing materials and only become visible during tear-off.\n\nThis is where supplements come in. When your crew tears off the existing roof and discovers hidden damage, you document it and submit a supplement to the insurance company requesting additional payment. The supplement includes photos, a written narrative describing the damage, and Xactimate line items with the correct codes and quantities.\n\nA well-documented supplement is almost always approved because the damage is real, verifiable, and was concealed before tear-off. "
      },
      {
        heading: "Hidden damage found during tear-off after storms",
        content: "Hidden damage is the single biggest revenue opportunity in storm damage roof repair. Hidden damage is common at tear-off, though how often it happens depends on the roof, the region and the carrier. This is not fraud or exaggeration. It is the reality of roofing: you cannot see what is under the shingles until you remove them.\n\nThe most common types of hidden damage found during tear-off include:\n\n• Rotted or deteriorated decking: Plywood or OSB sheathing that has absorbed moisture through damaged shingles. The wood is soft, spongy, or crumbling. This requires full sheet replacement before new roofing materials can be installed.\n\n• Failed or missing underlayment: Roofing felt or synthetic underlayment that has deteriorated, torn, or was never installed properly. Building codes require underlayment, so replacement is mandatory.\n\n• Corroded or damaged step flashing: Step flashing along chimneys and sidewalls that has rusted through, bent, or separated from the wall. Water follows the flashing path, so failed flashing almost always means water damage to the wall sheathing behind it.\n\n• Deteriorated pipe boots: Rubber pipe boot seals that have cracked, split, or pulled away from the pipe. Failed pipe boots are one of the most common leak sources and are almost always concealed beneath the shingle layer.\n\n• Missing or inadequate ice and water shield: In cold climates, building codes require ice and water shield in valleys, at eaves, and around penetrations. Many older roofs were installed before these requirements existed, and replacement is required by current code.\n\n• Additional layers of roofing: Some roofs have a second or even third layer of shingles installed over the original. The additional layer must be removed, and the extra labor and disposal costs should be covered by the insurance claim.\n\nEach of these findings is a legitimate supplement item. The key is documenting them properly at the moment of discovery."
      },
      {
        heading: "Documentation requirements for storm damage claims",
        content: "Documentation is what separates contractors who recover $1,500 or more per job in supplements from those who recover nothing. The adjuster reviewing your supplement was not on your roof. They need to see clear, compelling evidence of concealed damage.\n\nFor every finding, your documentation should include:\n\n• Wide-angle context photos showing where on the roof the damage is located\n• Close-up detail photos showing the specific condition of the damaged material\n• Measurements: square footage of affected decking, linear feet of damaged flashing, number of failed pipe boots\n• A written narrative explaining what was found, where it was found, when it was discovered (during tear-off), and why it was not visible during the initial inspection\n• The corresponding Xactimate line codes with accurate quantities and current pricing\n\nThe narrative is especially important. A photo of rotted decking is good. A photo of rotted decking with a narrative stating 'During tear-off operations on March 15, 2026, three sheets of 1/2-inch CDX plywood along the eave edge of the front slope were found to be severely deteriorated from prolonged moisture exposure. The damage was concealed beneath the existing shingle layer and was not visible during the initial inspection.' That gets approved.\n\nTimeliness also matters. Submit your supplement the same day you discover the damage, or within 24 to 48 hours at most. Supplements submitted weeks after the job raise red flags with adjusters and are far more likely to be denied or questioned."
      },
      {
        heading: "How to maximize recovery on storm damage jobs",
        content: "Maximizing recovery on storm damage roof repair is not about inflating claims. It is about being thorough, accurate, and professional in your documentation so that every legitimate finding is captured, submitted, and paid.\n\nHere are the practices that separate top-performing storm damage contractors from the rest:\n\n• Train your crews to stop and document: When the crew finds hidden damage during tear-off, they need to pause and capture it before it gets covered by new materials. Five minutes of documentation can mean hundreds or thousands of dollars in supplement revenue.\n\n• Use a systematic approach: Don't rely on memory or random photos. Use a consistent process for every finding: tag the damage type, record the roof area, take context and detail photos, and add a description.\n\n• Know your Xactimate codes: Submit supplements in the language adjusters speak. Use the correct line codes, proper units (SF for decking, LF for flashing, EA for pipe boots), and current regional pricing.\n\n• Reference building codes: When a repair is required by current building code (ice and water shield in valleys, proper flashing at penetrations), cite the code. This makes it much harder for the adjuster to deny the line item.\n\n• Submit complete packages: Don't send a bare Xactimate estimate. Include a professional PDF report with photos, narratives, a findings summary, and the Xactimate line items. The easier you make the adjuster's job, the faster you get approved.\n\n• Track your supplements: Know which supplements are pending, which have been approved, and which need follow-up. A supplement that sits unanswered for 30 days is money you are not collecting."
      },
      {
        heading: "Streamlining storm damage documentation with Supplement Snap",
        content: "Storm damage roof repair is a volume business. During peak storm season, you may have dozens of jobs in progress simultaneously, each with its own hidden damage findings, supplement documentation, and insurance communication. Managing this manually with camera rolls, text messages, and spreadsheets is not scalable.\n\nSupplement Snap was designed for exactly this scenario. During tear-off, your crew opens the app and captures each finding in seconds: a photo tagged with the damage type (decking, flashing, pipe boot, ice and water shield) and the roof area (front slope, back slope, valley, chimney). They can add a voice note describing the damage in any language, and the system auto-translates Spanish voice notes to English.\n\nFrom those field captures, Supplement Snap generates a professional supplement package:\n\n• AI-written damage narratives in the language adjusters expect\n• Xactimate line items with correct codes, quantities, and current regional pricing\n• An Xactimate-compatible CSV the adjuster can import directly into their system\n• A branded PDF report with photos, narratives, and a findings summary, ready to email\n\nThe entire process from discovering hidden damage on the roof to sending a complete supplement to the adjuster takes minutes. Your crew documents as they work, and Supplement Snap handles the rest. On storm damage jobs where speed and volume matter most, that efficiency is the difference between recovering thousands in supplements and leaving money on every roof.\n\nFor a complete contractor guide to all damage types, see <a href='/blog/roof-damage-repair-guide'>roof damage repair guide</a>."
      },
    ],
  },
  {
    slug: "roof-damage-repair-guide",
    title: "Roof Damage Repair: Contractor Guide to Identifying, Documenting, and Getting Paid",
    metaTitle: "Roof Damage Repair Guide: Document and Get Paid",
    metaDescription: "Contractor guide to roof damage repair: identify damage types, document findings for insurance, decide repair vs replace and recover full value.",
    publishedDate: "2026-03-24",
    externalLinks: [
      { text: "NRCA: Roof Repair Standards", url: "https://www.nrca.net" },
      { text: "International Building Code (ICC)", url: "https://www.iccsafe.org" },
    ],
    highlight: { label: "Hidden Damage", value: "Common", subtext: "Tear-offs often reveal damage that was not in the original estimate, though how often varies" },
    images: {
      1: { src: "/blog/roof-damage-repair-guide/damaged-roof.jpg", width: 1200, height: 800, alt: "Close-up of damaged roof showing cracked shingles, water stains, and deteriorated decking" },
    },
    visuals: {
      0: { type: "damage-cards", data: [
        { icon: "hail", title: "Storm Damage", desc: "Wind, hail, and debris damage from severe weather events. Usually covered by homeowner's insurance when properly documented.", value: "Insurance" },
        { icon: "decking", title: "Age-Related Wear", desc: "Curling shingles, granule loss, cracked tiles, and brittle materials from years of UV exposure and thermal cycling.", value: "15-30 yrs" },
        { icon: "ice", title: "Water Damage", desc: "Leaks, moisture intrusion, decking rot, and mold caused by failed flashings, ice dams, or compromised shingles.", value: "Hidden" },
        { icon: "flashing", title: "Flashing Failure", desc: "Corroded, separated, or improperly installed flashings around chimneys, walls, valleys, and penetrations.", value: "$8-15/LF" },
        { icon: "pipe", title: "Pipe Boot Failure", desc: "Cracked rubber seals around plumbing vents that allow water to enter around the pipe penetration.", value: "$85-150/EA" },
        { icon: "layers", title: "Multiple Layers", desc: "Second or third layer of shingles installed over the original, adding weight and hiding underlying problems.", value: "$45/SQ" },
      ]},
      2: { type: "compare", data: {
        before: { label: "When to Repair", items: ["Damage is localized to one area", "Roof is less than 10-12 years old", "Less than 30% of roof surface is affected", "Structural decking is still sound", "No active leaks or interior damage", "Budget is limited and damage is minor"] },
        after: { label: "When to Replace", items: ["Damage is widespread across multiple slopes", "Roof is 15+ years old with general wear", "More than 30% of roof surface is compromised", "Decking damage is found in multiple areas", "Active leaks or interior water damage present", "Insurance is covering a full replacement"] },
      }},
      3: { type: "calculator", data: {
        title: "Example Roof Damage Repair Cost Breakdown (Illustrative, Not a Quote)",
        rows: [
          { label: "Shingle replacement (localized, 5 SQ area)", value: "$1,200-$2,000" },
          { label: "Decking replacement (4-8 sheets of plywood)", value: "$700-$1,400" },
          { label: "Flashing repair/replacement (chimney + sidewall)", value: "$400-$800" },
          { label: "Pipe boot replacement (2-4 boots)", value: "$170-$600" },
          { label: "Ice and water shield (valleys + eaves)", value: "$500-$900" },
          { label: "Full tear-off and replacement (30 SQ)", value: "$10,000-$18,000" },
        ],
        total: { label: "Hidden-damage items (varies by claim)", value: "Varies", color: "green" },
      }},
      5: { type: "checklist", data: {
        title: "Insurance Documentation Checklist",
        items: [
          { text: "Property address, claim number, and policy information", checked: true },
          { text: "Date of loss (storm date) and date of inspection", checked: true },
          { text: "Wide-angle photos of each damage area for context", checked: true },
          { text: "Close-up detail photos of specific damage", checked: true },
          { text: "Measurements: square footage, linear feet, quantities", checked: true },
          { text: "Written damage narrative for each finding", checked: true },
          { text: "Xactimate line codes with correct units and pricing", checked: false },
          { text: "Building code references where applicable", checked: false },
          { text: "Statement that damage was concealed before tear-off", checked: false },
          { text: "Professional PDF report submitted to adjuster", checked: false },
        ],
      }},
    },
    related: ["storm-damage-roof-repair-near-me","storm-damage-roof-repair","roof-inspection-report","roofing-photo-documentation-checklist"],
    sections: [
      {
        heading: "What is roof damage repair?",
        content: "Roof damage repair encompasses any work needed to restore a roofing system that has been compromised by storms, age, water intrusion, structural movement, or other causes. For contractors, understanding the full scope of roof damage repair is essential because it directly affects how you estimate jobs, communicate with homeowners, and interact with insurance companies.\n\nRoof damage can be visible or hidden. Visible damage includes missing shingles, obvious leaks, and cracked tiles that anyone can see from the ground. Hidden damage is concealed beneath the roofing surface and is only discovered during a detailed inspection or during tear-off. This hidden damage is where most contractors leave money on the table, because it represents legitimate repair costs that were not included in the original estimate.\n\nWhether you are a contractor bidding a job, a homeowner evaluating repair options, or a roofing company managing insurance claims, this guide covers what you need to know about roof damage repair: the types of damage, how to assess them, when to repair versus replace, how insurance claims work, and how to document hidden damage for supplement recovery."
      },
      {
        heading: "Types of roof damage",
        content: "Roof damage falls into several categories, and most damaged roofs have problems from more than one category. Understanding each type helps you perform thorough inspections and write complete estimates.\n\n• Storm damage is the most common trigger for insurance-funded roof repairs. Wind lifts, creases, and tears shingles. Hail bruises shingle surfaces and displaces granules. Falling debris punctures materials and cracks decking. Storm damage is typically sudden and traceable to a specific weather event, which is important for insurance claims.\n• Age-related deterioration happens gradually over 15 to 30 years. Asphalt shingles curl at the edges, lose granules, become brittle, and eventually crack. Tile roofs develop hairline fractures. Metal roofs corrode at seams and fastener points. Age-related damage is generally not covered by insurance unless a storm event accelerates the deterioration.\n• Water damage results from any breach in the roofing system that allows moisture intrusion. This could be a failed pipe boot, corroded flashing, cracked sealant, or ice damming. Water damage is insidious because it often goes undetected for months or years, causing rotted decking, mold growth, and damaged insulation before anyone notices a visible leak.\n• Structural damage includes sagging roof decks, broken trusses, and shifted framing. This is less common but far more serious, often requiring engineering evaluation. Structural issues may result from overloading (heavy snow or multiple shingle layers), water damage that weakened framing members, or original construction defects.\n• Flashing failures occur at the most vulnerable points of any roof: the intersections. Wherever the roof meets a wall, chimney, valley, pipe, or vent, flashing creates the water-tight transition. When flashing corrodes, separates, or was never installed correctly, water finds its way in. Flashing failure is one of the most common supplement findings during tear-off."
      },
      {
        heading: "Repair vs. replace: making the right decision",
        content: "One of the most important decisions in roof damage repair is whether to repair the existing roof or replace it entirely. This decision affects the homeowner's cost, the insurance payout, and the scope of your project.\n\nRepair makes sense when the damage is localized, the roof is relatively young (under 10 to 12 years), and the majority of the roofing system is still functional. A few missing shingles from a windstorm, a single area of hail damage, or a localized leak from a failed pipe boot can all be repaired without tearing off the entire roof.\n\nReplacement is the right call when damage is widespread, the roof has reached or exceeded its expected lifespan, or the cost of repairs approaches 30 to 40 percent of replacement cost. Insurance companies typically authorize a full replacement when the adjuster determines that the damage affects enough of the roof surface that a repair would not restore the system to its pre-loss condition.\n\nThe gray area between repair and replacement is where thorough documentation matters most. If you inspect a roof and find scattered hail damage across all slopes, missing shingles on multiple elevations, and compromised flashings at every penetration, your documentation needs to tell that story clearly. The adjuster will authorize a replacement only if the evidence supports it.\n\nFor insurance claims, keep in mind that the repair versus replace decision is ultimately made by the insurance company based on their adjuster's findings. Your job is to provide thorough, accurate documentation of every damaged component so the adjuster has complete information to make that determination."
      },
      {
        heading: "How insurance claims work for roof damage repair",
        content: "Insurance claims are a critical part of roof damage repair because most significant roof repairs are funded by homeowner's insurance policies. Understanding this process helps you serve your customers better and ensures you get paid for all the work you perform.\n\nThe process typically follows these steps:\n\n• The homeowner discovers or suspects roof damage and files a claim with their insurance carrier. The carrier assigns a claim number and schedules an adjuster.\n\n• The insurance adjuster inspects the property and writes an initial estimate in Xactimate. This estimate covers the damage visible during their inspection.\n\n• The contractor reviews the adjuster's estimate and, if hired, begins the repair or replacement work.\n\n• During tear-off, the crew discovers hidden damage that was not visible during the adjuster's surface inspection. This is extremely common. Hidden damage is common at tear-off, though how often it happens depends on the roof, the region and the carrier.\n\n• The contractor documents the hidden damage and submits a supplement to the insurance company. The supplement includes photos, a written narrative, and Xactimate line items for the additional work.\n\n• The insurance company reviews the supplement and, if properly documented, approves additional payment to cover the hidden damage repairs.\n\nThe supplement step is where most contractors either thrive or leave significant money on the table. A contractor who documents every hidden finding and submits professional supplements has a better chance of being paid for it than one who skips supplementing or submits weak documentation."
      },
      {
        heading: "Hidden damage discovered during repairs",
        content: "Hidden damage is the most significant and most overlooked aspect of roof damage repair. When you tear off existing roofing materials, you expose everything that was concealed beneath the surface. And in the majority of cases, what you find changes the scope and cost of the repair.\n\nThe most common hidden damage findings include:\n\n• Rotted decking: Water that penetrated through damaged shingles or failed flashings has soaked into the plywood or OSB sheathing. The wood is soft, discolored, and structurally compromised. You cannot install new roofing over rotted decking. It must be cut out and replaced with new sheathing.\n\n• Deteriorated underlayment: The roofing felt or synthetic underlayment has torn, bunched, or disintegrated. In some cases, especially on older roofs, underlayment was never installed properly or is missing entirely in critical areas.\n\n• Failed flashing: Step flashing along chimneys and walls has corroded through. Valley flashing is bent or punctured. Counter flashing has separated from masonry. These failures are hidden beneath shingle courses and are not detectable from a surface inspection.\n\n• Damaged pipe boots: The rubber gaskets around plumbing vent pipes have cracked, split, or pulled away. These are technically visible from above, but the extent of damage (including water staining and rot around the penetration) is only apparent during tear-off.\n\n• Missing ice and water shield: Building codes require self-adhering ice and water membrane in valleys, at eaves (in cold climates), and around penetrations. Many roofs installed before current code requirements lack this protection. During a re-roof, installation is required by code.\n\nEvery one of these findings represents a legitimate cost that should be covered by the insurance claim. The key to recovering that cost is documentation: clear photos, detailed narratives, and accurate Xactimate line items submitted promptly after discovery."
      },
      {
        heading: "Cost breakdown by damage type",
        content: "Understanding the cost of common roof damage repairs helps contractors estimate accurately and helps homeowners set realistic expectations. These figures represent typical costs for a residential asphalt shingle roof and will vary by region, material, and roof complexity.\n\nShingle replacement for a localized area (5 to 10 squares) typically runs $1,200 to $2,000 including materials, labor, and disposal. A full tear-off and replacement on a 30-square roof ranges from $10,000 to $18,000 depending on material grade, roof pitch, and local labor rates.\n\nDecking replacement costs $2.00 to $3.50 per square foot for plywood or OSB sheathing, including labor. A typical storm damage job might require 4 to 8 sheets of decking replacement, adding $700 to $1,400 to the project.\n\nFlashing repair and replacement varies by type and location. Step flashing along a chimney or sidewall runs $8 to $15 per linear foot. Valley flashing replacement costs $10 to $18 per linear foot. Counter flashing at masonry walls is $12 to $20 per linear foot.\n\nPipe boot replacement costs $85 to $150 per boot depending on size and type. Most residential roofs have 2 to 4 pipe penetrations. Replacing all boots during a re-roof is standard practice and a common supplement item.\n\nIce and water shield installation costs $1.50 to $2.50 per square foot for the membrane plus labor. On a 30-square roof, valleys and eave areas might require 300 to 500 square feet of ice and water shield, adding $500 to $900 to the project.\n\nDrip edge replacement runs $4 to $6 per linear foot. A typical residential roof has 150 to 250 linear feet of eave and rake edge, totaling $600 to $1,500 for full perimeter replacement."
      },
      {
        heading: "Documenting roof damage repair with Supplement Snap",
        content: "The gap between what an insurance estimate covers and what the repair actually costs is real, and it exists on virtually every job. Closing that gap requires systematic documentation of hidden damage, professional supplement narratives, and accurate Xactimate coding. Doing this manually for every job is time-consuming and error-prone.\n\nSupplement Snap streamlines the entire documentation workflow for roof damage repair. During tear-off, your crew captures each finding directly in the app: a photo tagged with the damage type and roof area, plus an optional voice note in any language. Spanish-speaking crews describe findings in their native language and the system translates to English automatically.\n\nFrom those field captures, Supplement Snap generates:\n\n• Professional damage narratives written in the clear, specific language adjusters require\n• Xactimate line items with correct codes, proper units, and current regional pricing\n• An Xactimate-compatible CSV export the adjuster can import into their system\n• A branded PDF report with photos, narratives, and a complete findings summary\n\nThe result is a complete, professional supplement package ready to send to the adjuster within minutes of discovering hidden damage. No more lost photos, forgotten findings, or supplements that sit unfinished for weeks. Every hidden finding becomes a documented, submitted supplement, and you get paid for every repair you perform.\n\nNeed to write an inspection report? See our <a href='/blog/roof-inspection-report'>roof inspection report guide</a>."
      },
    ],
  },
  {
    slug: "roof-inspection-report",
    title: "Roof Inspection Report: What to Include and How to Write One",
    metaTitle: "How to Write a Roof Inspection Report (2026 Guide)",
    metaDescription: "How to write a professional roof inspection report that gets claims approved: what to document, report structure, common mistakes and software tools.",
    publishedDate: "2026-03-27",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA: Roof Inspection Guidelines", url: "https://www.nrca.net" },
      { text: "ASTM Roofing Standards", url: "https://www.astm.org" },
    ],
    highlight: { label: "Easier to Review", value: "Tagged and explained", subtext: "Reports with tagged photos, plain narratives and line items are easier for a reviewer to follow" },
    images: {
      0: { src: "/blog/roof-inspection-report/roof-inspection.jpg", width: 1024, height: 1536, alt: "Contractor inspecting a roof and documenting damage with a phone" },
    },
    visuals: {
      1: { type: "checklist", data: {
        title: "Roof Inspection Report Essentials",
        items: [
          { text: "Property address, owner name, and date of inspection", checked: true },
          { text: "Roof measurements: total area, slope lengths, pitch", checked: true },
          { text: "Roofing material type, brand (if identifiable), and estimated age", checked: true },
          { text: "Wide-angle overview photos of each roof slope", checked: true },
          { text: "Close-up photos of every damage finding", checked: true },
          { text: "Damage descriptions with type, location, and severity", checked: true },
          { text: "Flashing condition at all penetrations and intersections", checked: true },
          { text: "Gutter, soffit, and fascia condition", checked: false },
          { text: "Interior inspection for leaks, stains, and daylight", checked: false },
          { text: "Overall condition rating and repair recommendation", checked: false },
          { text: "Xactimate line codes and pricing (for insurance reports)", checked: false },
          { text: "Inspector name, company, license number, and signature", checked: false },
        ],
      }},
      2: { type: "steps", data: [
        { num: "1", title: "Gather property information", desc: "Record the property address, homeowner name, insurance company, claim number (if applicable), and date of inspection. Get roof measurements from satellite tools or field measurements." },
        { num: "2", title: "Inspect and photograph systematically", desc: "Walk every slope, valley, ridge, eave, and penetration. Take wide-angle context shots of each area, then close-up detail shots of every finding. Use a consistent pattern so nothing gets missed." },
        { num: "3", title: "Document each finding", desc: "For every damage finding, record the damage type, specific location on the roof, severity, and measurements. Tag photos with what they show so you can match them to descriptions later." },
        { num: "4", title: "Write damage descriptions", desc: "For each finding, write a clear, specific description. State what the damage is, where it is located, the likely cause, and the recommended repair. Avoid vague language." },
        { num: "5", title: "Add Xactimate codes (for insurance)", desc: "If the report supports an insurance claim, map each finding to the correct Xactimate line code with proper units and quantities. This makes the adjuster's job easier and speeds up approval." },
        { num: "6", title: "Compile and deliver the report", desc: "Assemble everything into a clean, professional PDF. Include a cover page, findings summary, individual finding pages with photos and descriptions, and your recommendation. Email it to the client or adjuster." },
      ]},
      3: { type: "compare", data: {
        before: { label: "Weak Inspection Report", items: ["Camera roll photos with no labels", "No written descriptions of damage", "Missing measurements and quantities", "No roof diagram or location references", "Submitted as loose photos via text message", "No Xactimate codes or pricing"] },
        after: { label: "Strong Inspection Report", items: ["Tagged photos with damage type and roof area", "Detailed narrative for each finding", "Accurate measurements and quantities included", "Findings mapped to specific roof locations", "Professional branded PDF delivered same day", "Xactimate line codes with current pricing"] },
      }},
      5: { type: "tip", data: { type: "warning", title: "Common Mistake: Relying on Memory", text: "The number one mistake contractors make is inspecting the roof, taking a few photos, and then trying to write the report days later from memory. By the time you sit down to write, you have forgotten which photo goes with which finding, you cannot remember exact locations, and the report ends up vague and unconvincing. Document everything on the roof, in real time, while you are looking at it." } },
    },
    related: ["roof-damage-report-template","roof-inspection-report-software","roofing-photo-documentation-checklist","hail-damage-roof-inspection"],
    sections: [
      {
        heading: "What is a roof inspection report?",
        content: "A roof inspection report is a formal document that records the current condition of a roofing system. It details the materials, measurements, condition, and any damage or deficiencies found during the inspection. A well-written roof inspection report serves as the foundation for repair estimates, insurance claims, real estate transactions, and maintenance planning.\n\nFor contractors, the roof inspection report is one of the most important documents you produce. It is the evidence that supports your repair recommendation, your insurance supplement, or your bid for the job. A strong report builds credibility with homeowners, earns trust from insurance adjusters, and differentiates you from competitors who show up with a clipboard and a verbal estimate.\n\nFor homeowners, the inspection report provides clarity about the condition of their roof, what needs attention, and what it will cost. For insurance adjusters, the report provides the documentation they need to process claims efficiently. For real estate buyers, it provides an objective assessment of one of the most expensive components of the property.\n\nRegardless of who the audience is, a roof inspection report must be thorough, specific, well-organized, and supported by photographic evidence. Vague reports with blurry photos and generic descriptions fail everyone involved."
      },
      {
        heading: "What to include in a roof inspection report",
        content: "A complete roof inspection report should include the following elements, organized in a logical structure that makes it easy for the reader to understand the condition of the roof and the recommended actions.\n\n• Property and inspection information: Start with the basics. Property address, homeowner name, date of inspection, inspector name and company, and any relevant claim or policy numbers. This establishes context and traceability.\n• Roof system overview: Document the roofing material (asphalt shingles, tile, metal, flat membrane), estimated age, total roof area in squares, roof pitch, number of slopes, and general configuration. Note any features like skylights, solar panels, chimneys, sidewalls, or unusual penetrations.\n• Photographic documentation: This is the backbone of any inspection report. Include:\n\n• Wide-angle overview photos of each roof slope, showing the general condition\n• Close-up detail photos of every specific damage finding\n• Photos of all flashings, penetrations, valleys, ridges, and eaves\n• Photos of gutters, downspouts, soffits, and fascia\n• Interior photos if accessible (attic inspection for leaks, stains, daylight penetration)\n\n• Damage findings: For each finding, provide the damage type (hail, wind, age, water), specific location on the roof (front slope near ridge, left valley, chimney south side), severity (minor, moderate, severe), measurements or quantities where applicable, and a written description of the condition.\n• Repair recommendation: Based on your findings, state whether the roof needs localized repair, partial replacement, or full replacement. Explain your reasoning. If the roof is a candidate for an insurance claim, note the suspected cause of damage (storm, hail, wind) and recommend the homeowner file a claim.\n• Xactimate coding (for insurance reports): If the report supports an insurance claim or supplement, include the relevant Xactimate line codes, units, quantities, and pricing for each recommended repair item."
      },
      {
        heading: "How to write a roof inspection report step by step",
        content: "Writing a strong roof inspection report follows a systematic process. If you build good habits here, every report you produce will be professional, thorough, and persuasive.\n\nStart by gathering property information before you get on the roof. Record the address, homeowner contact information, insurance claim number if applicable, and get roof measurements. Satellite measurement tools can provide accurate dimensions, or you can measure in the field.\n\nOn the roof, inspect systematically. Walk every slope from ridge to eave. Inspect every valley, every penetration, every flashing intersection. Check the ridge cap, the starter strip at the eaves, and the condition of drip edge and gutters. Use a consistent pattern so you never skip an area.\n\nAs you inspect, photograph and document each finding in real time. Take a wide-angle shot showing the general area, then a close-up of the specific damage. Record the damage type, location, and severity while you are looking at it. Do not rely on memory. Do not plan to \"write it up later.\" The best reports are documented on the roof, in the moment.\n\nBack at the office (or better yet, directly from the field), compile your findings into a structured report. Group findings by roof area or by damage type. Write a clear description for each finding that explains what was found, where it was found, the probable cause, and the recommended repair.\n\nIf the report is for an insurance claim, add Xactimate line codes for each repair item. Map your findings to the correct codes, include accurate quantities, and use current pricing. This step is what transforms a basic inspection report into an insurance-ready document that adjusters can process quickly.\n\nFinish with a summary and recommendation. State the overall condition of the roof, summarize the key findings, and clearly recommend the appropriate course of action."
      },
      {
        heading: "Report format and structure",
        content: "The format and structure of your roof inspection report matters more than most contractors realize. A well-organized report communicates professionalism and makes it easy for the reader to find the information they need.\n\n• Cover page: Include your company name and logo, the property address, date of inspection, and the purpose of the report (storm damage assessment, annual inspection, pre-purchase evaluation, supplement documentation).\n• Executive summary: A one-paragraph overview of the roof's condition and your primary recommendation. This is for readers who want the bottom line before diving into details.\n• Roof system details: A section covering material type, estimated age, total area, pitch, configuration, and notable features. This provides context for the findings that follow.\n• Findings section: The core of the report. Each finding gets its own entry with photos, a written description, location, severity, and recommended repair. Number your findings for easy reference.\n• Findings summary table: A table listing all findings at a glance with finding number, description, location, severity, and estimated cost or Xactimate code. This gives the reader a quick overview of all issues.\n• Recommendation: Your professional assessment of whether the roof needs repair, partial replacement, or full replacement, with supporting reasoning.\n• Appendix (optional): Additional photos, measurement diagrams, code references, or manufacturer specifications that support your findings.\n\nKeep the report clean and easy to read. Use consistent formatting, clear headings, and high-quality photos. Avoid walls of text. Break information into digestible sections. The goal is a document that a homeowner, adjuster, or real estate agent can pick up and immediately understand the condition of the roof."
      },
      {
        heading: "Common mistakes in roof inspection reports",
        content: "Even experienced contractors make mistakes in their inspection reports that weaken the document and reduce their chances of getting claims approved or winning jobs. Here are the most common problems and how to avoid them.\n\n• Vague descriptions: Writing \"shingles are damaged\" tells the reader nothing useful. Instead, write \"Three-tab asphalt shingles on the front (south-facing) slope show hail impact damage with displaced granules and exposed fiberglass mat. Damage is scattered across approximately 60% of the slope surface.\"\n• Insufficient photos: Two or three photos of a 30-square roof is not enough. A thorough report includes at minimum one overview photo per slope, one close-up per finding, and photos of all flashings and penetrations. For a typical residential roof, that means 20 to 40 photos.\n• Missing measurements: Findings without measurements cannot be priced accurately. If you report damaged decking, how many square feet? If flashing needs replacement, how many linear feet? Numbers matter.\n• No location references: Stating that damage was found \"on the roof\" is not helpful. Specify the slope (front, back, left, right), the area (near ridge, mid-slope, at eave), and the proximity to features (adjacent to chimney, in the main valley, along the rake edge).\n• Delayed documentation: Writing the report three days after the inspection from memory guarantees that details will be wrong or missing. Document in real time on the roof.\n• Missing code references: When a repair is required by building code, citing the specific code strengthens your case significantly. For example, referencing the requirement for ice and water shield in valleys and at eaves per the International Building Code makes it much harder for an adjuster to deny that line item.\n• No Xactimate coding: For insurance reports, submitting findings without Xactimate codes forces the adjuster to do the coding themselves. This slows down approval and increases the chance they will use lower pricing or miss items."
      },
      {
        heading: "How software automates roof inspection reports",
        content: "The traditional approach to roof inspection reports involves taking photos on a phone, scribbling notes on paper or a notepad app, and then spending hours at a desk assembling everything into a document. This manual process is slow, error-prone, and does not scale when you have multiple inspections per day.\n\nModern inspection software changes this by moving the documentation process to the roof. Instead of taking random photos and hoping you remember the details later, you capture findings in a structured format while you are looking at the damage.\n\nSupplement Snap takes this a step further for contractors focused on insurance work and supplement recovery. During the inspection or tear-off, your crew captures each finding in the app: a photo tagged with the damage type (decking, flashing, pipe boot, ice and water shield) and the roof area (front slope, valley, chimney). They can add a voice note describing the finding in any language.\n\nFrom those structured field captures, Supplement Snap generates:\n\n• Professional damage narratives written in the specific, detailed language that adjusters require for claim processing\n• Xactimate line items with correct codes, accurate quantities, and current regional pricing\n• An Xactimate-compatible CSV export the adjuster can import directly into their estimating system\n• A complete, branded PDF report with cover page, findings summary, individual finding pages, and all supporting photos\n\nThe result is a professional roof inspection report produced in minutes instead of hours. Everything is captured in real time on the roof, so nothing gets lost or forgotten. The report goes to the adjuster or homeowner the same day, while the inspection is fresh. For contractors who perform multiple inspections per week, this automation is the difference between thorough documentation on every job and cutting corners because there is not enough time to write proper reports.\n\nOnce damage is documented, the next step is writing the supplement. See <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a>."
      },
      {
        heading: "Roof inspection report vs roof condition report",
        content: "People search for both names, and they are often used for the same kind of document: a written record of what a roof looks like at a point in time, with photos and notes. Some organizations use roof condition report for a short summary of age, materials and visible condition, and roof inspection report for the more detailed version with measurements and findings. There is no single standard, so ask whoever requested it, such as an insurer, a lender, a buyer or a property manager, what format and detail they expect.",
      },
    ],
    faq: [
      {
        q: "What is a roof inspection report?",
        a: "A written record of a roof's condition, including materials, measurements, visible damage or wear, and photos, used for repairs, insurance claims, sales and maintenance planning.",
      },
      {
        q: "Is a roof condition report the same as a roof inspection report?",
        a: "The terms overlap and are often used interchangeably. Some use condition report for a shorter summary and inspection report for a detailed one, so ask the person requesting it what they expect.",
      },
      {
        q: "What should a roof inspection report include?",
        a: "Property and inspection details, roof type and materials, measurements and pitch, findings by roof area with photos, a plain description of each issue, and recommendations tied to the findings.",
      },
      {
        q: "How do you write a roof inspection report for an insurance claim?",
        a: "Keep it factual and specific: location, what you observed, quantity, and photo references for each finding, with no guesses about cause or coverage. See our guides on documenting hail and wind damage for what carriers look for.",
      },
      {
        q: "Can software create a roof inspection report?",
        a: "Yes. Many tools let you capture photos and notes on the roof and export a report. Check what each one actually produces, and review any drafted wording before you send it.",
      },
    ],
  },
  {
    slug: "xactimate-roofing-estimate-approved",
    images: { 0: { src: "/blog/xactimate-roofing-estimate-approved/card.png", alt: "Key points from the guide: How to Write an Xactimate Roofing Estimate That Actually Gets Approved", width: 1200, height: 630 } },
    title: "How to Write an Xactimate Roofing Estimate That Actually Gets Approved",
    metaTitle: "Xactimate Roofing Estimate: How to Get It Approved",
    metaDescription: "How to write an Xactimate roofing estimate adjusters approve: accurate measurements, complete line items, waste and pitch charges, O&P and photo proof.",
    publishedDate: "2026-10-22",
    externalLinks: [
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
      { text: "NRCA Roofing Manual and Standards", url: "https://www.nrca.net" },
    ],
    highlight: { label: "Before You Submit", value: "12 Checks", subtext: "The review checklist at the end of this guide catches the most common reasons roof estimates get cut" },
    visuals: {
      1: { type: "compare", data: {
        before: { label: "Estimates That Get Reduced", items: ["Roof area guessed from the ground", "Pitch and height not recorded", "Missing starter, drip edge, ridge cap", "Round-number quantities with no source", "No photos tied to line items"] },
        after: { label: "Estimates That Get Approved", items: ["Measurement report or taped dimensions attached", "Pitch, stories and access noted per slope", "Every roof component itemized", "Quantities traceable to measurements", "Each line item backed by a labeled photo"] },
      }},
      2: { type: "steps", data: [
        { num: "1", title: "Set up the claim", desc: "Enter the loss date, price list and property details so unit prices match the right region and quarter." },
        { num: "2", title: "Add the roof sketch", desc: "Draw each slope or import a measurement report so area, ridge, hip, valley, rake and eave lengths come from real numbers." },
        { num: "3", title: "Choose the shingle line items", desc: "Pick the tear-off and install items for the shingle type actually on the roof, then add waste." },
        { num: "4", title: "Add the accessories", desc: "Starter, drip edge, ridge cap, underlayment, ice and water barrier, vents, pipe jacks and flashing." },
        { num: "5", title: "Apply charges and O&P", desc: "Add pitch and height charges where they apply, plus overhead and profit when the job qualifies." },
        { num: "6", title: "Attach photos and notes", desc: "Tie each item to a labeled photo so the adjuster can verify it without calling you." },
      ]},
      4: { type: "tip", data: {
        type: "warning",
        title: "Do not round up quantities without a reason",
        text: "Adjusters compare your quantities to the measurements. If you claim 28 squares and the report shows 24.6 plus waste, expect a call or a cut. Show the math and the waste percentage you used.",
      }},
      6: { type: "checklist", data: {
        title: "Photo Checklist for an Xactimate Roof Estimate",
        items: [
          { text: "Each slope from a distance with the slope labeled (front, rear, left, right)", checked: true },
          { text: "Pitch confirmed with a gauge or level in frame", checked: true },
          { text: "Close-ups of each damage type with a chalk circle or marker", checked: true },
          { text: "Existing drip edge, starter, ridge cap and flashing condition", checked: true },
          { text: "Pipe jacks, vents and chimney details", checked: true },
          { text: "Number of stories and any access limits (steep, tall, no driveway)", checked: true },
          { text: "Hidden damage found at tear-off, photographed before it is covered", checked: true },
        ],
      }},
      7: { type: "checklist", data: {
        title: "12-Point Review Before You Submit",
        items: [
          { text: "Roof measurements match the attached report or your taped dimensions", checked: true },
          { text: "Waste percentage is stated and appropriate for the roof shape", checked: true },
          { text: "Tear-off and install both included for every layer", checked: true },
          { text: "Starter strip, drip edge and ridge cap are itemized", checked: true },
          { text: "Underlayment and ice and water barrier match local code", checked: true },
          { text: "Pipe jacks, vents and flashing are counted individually", checked: true },
          { text: "Pitch and height charges applied where they truly apply", checked: true },
          { text: "Debris haul-off and any permit costs included", checked: true },
          { text: "Overhead and profit requested when multiple trades are involved", checked: true },
          { text: "Every line item has at least one labeled photo", checked: true },
          { text: "Code citations attached for any upgrade items", checked: true },
          { text: "Claim number, loss date and price list are correct on every page", checked: true },
        ],
      }},
    },
    updatedDate: "2026-10-22",
    related: ["xactimate-codes-for-roofing-supplements","roofing-overhead-and-profit-claims","roofing-photo-documentation-checklist","xactimate-roof-estimate-supplements"],
    faq: [
      {
        "q": "What is an Xactimate roofing estimate?",
        "a": "It is a repair or replacement estimate for a roof built in Xactimate, using standard line items, units and regional unit prices that insurance carriers recognize."
      },
      {
        "q": "Why do adjusters reduce roofing estimates?",
        "a": "Common reasons are unverified quantities, missing photos, items that do not match the policy and charges that were not explained."
      },
      {
        "q": "Do I need a measurement report to write a roof estimate?",
        "a": "It is not required, but a satellite or drone report makes your quantities easier to verify, and taped dimensions can confirm it."
      },
      {
        "q": "What is the difference between an estimate and a supplement?",
        "a": "The estimate covers visible, known work. A supplement covers additional damage or items found later or left out."
      }
    ],
    sections: [
      {
        heading: "What does an approved Xactimate roofing estimate actually look like?",
        content: "An approved estimate is one the adjuster can verify quickly and has no reason to cut. It does not mean the highest number. It means every line item ties back to a measurement, a photo or a building code, so the adjuster can say yes without a long back-and-forth.\n\nMost reductions are not about the carrier being unfair. They happen because something on the estimate could not be verified in a few minutes: a quantity with no source, a charge with no explanation, or a component that was never mentioned. Your job is to remove those gaps before you submit.\n\nThis guide covers the estimate you write for the claim itself. If you are adding items after tear-off, read <a href='/blog/xactimate-roof-estimate-supplements'>how to build an Xactimate roof estimate for insurance supplements</a> and keep the <a href='/blog/xactimate-codes-for-roofing-supplements'>Xactimate codes reference</a> open while you work.",
      },
      {
        heading: "Start with measurements the adjuster can trust",
        content: "Every number on a roof estimate starts with measurements. If those are weak, everything built on them is easy to challenge.\n\nUse a satellite or drone measurement report when you can, and confirm it with a few taped dimensions on the roof. Record these for each slope:\n\n• Area in squares\n• Pitch (rise over 12 inches of run)\n• Eave, rake, ridge, hip and valley lengths\n• Number of stories and any access problems\n\nAttach the report or your field notes to the estimate. When the adjuster can see where each quantity came from, there is much less to argue about.",
      },
      {
        heading: "Build the estimate in the order adjusters read it",
        content: "Adjusters review estimates top to bottom, usually slope by slope or trade by trade. A clean structure makes your estimate easier to approve because it matches how they check their own work.\n\nA reliable order is: claim setup, roof sketch, main shingle items, accessories, charges, then overhead and profit. Document each step as you go so nothing depends on memory later.",
      },
      {
        heading: "Line items that get left off roof estimates",
        content: "Missing items are the most common source of lost revenue. A shingle line alone does not describe a roof replacement. Check that these are on your estimate when they apply to the job:\n\n• Starter strip: Installed along eaves and rakes on most shingle systems\n• Drip edge: Often required by code, and frequently missing from first estimates\n• Ridge and hip cap: Priced separately from field shingles\n• Underlayment: Felt or synthetic, matched to the manufacturer and local code\n• Ice and water barrier: Required in many climates at eaves and valleys\n• Pipe jacks and vents: Count every one and itemize them\n• Step flashing and counter flashing: Measured in linear feet at walls and chimneys\n• Debris haul-off: Including extra layers when there are two roofs on the house\n\nThe Xactimate item names and codes for these are in our <a href='/blog/xactimate-codes-for-roofing-supplements'>codes reference</a>. Always confirm the exact item and unit price against your own price list, since codes and pricing change by region and by quarter.",
      },
      {
        heading: "Waste, pitch and height: where estimates get challenged",
        content: "Three adjustments cause more disagreement than any others.\n\nWaste: Shingle waste depends on roof shape. A simple gable roof wastes less than a cut-up hip roof with many valleys. State the percentage you used and be ready to explain it. A single blanket number applied to every roof looks careless.\n\nPitch: Steeper roofs take more labor and carry extra charges in Xactimate. Record the pitch for every slope with a gauge in the photo, not just an estimate from the ground.\n\nHeight: Roofs on taller homes can qualify for an additional charge for the added difficulty. Note the number of stories and photograph the home from the street so the adjuster can see it.",
      },
      {
        heading: "Overhead and profit: ask for it when it applies",
        content: "Overhead and profit, usually shortened to O&P, covers the general contractor's cost of coordinating a job. It is commonly requested when a repair involves several trades, such as roofing plus gutters, siding, drywall or paint.\n\nCarriers often resist O&P, so do not tack it on without support. List the trades involved, show that a general contractor is needed to coordinate them, and cite your policy language and state rules where they apply. Rules vary, so check what your state and the policy allow.",
      },
      {
        heading: "Photos and notes that prove every line item",
        content: "The estimate says what you want paid. The photos prove why. Every significant line item should have at least one labeled photo, and the labels should match the line item names so the adjuster can connect them instantly.\n\nTake photos before anything is removed or covered, and keep the originals. Metadata such as time and location helps establish when and where the photo was taken. Our guide to <a href='/blog/hail-damage-roof-inspection'>hail damage roof inspections</a> explains what to capture on the roof, and the <a href='/blog/roof-inspection-report'>roof inspection report guide</a> covers how to organize it.",
      },
      {
        heading: "Review your estimate before you submit it",
        content: "A five-minute review catches mistakes that cost you days later. Read the estimate as if you were the adjuster looking for a reason to question it, then work through the checklist below.\n\nIf you find a gap, fix it now. Once the estimate is submitted, every correction becomes a supplement and a new round of review.",
      },
      {
        heading: "What to do when your estimate is cut anyway",
        content: "Even a strong estimate can come back reduced. Do not accept the first number without reading the reasons. Compare the carrier's version to yours line by line and identify exactly what changed: quantities, items removed, or charges disallowed.\n\nRespond in writing, item by item, and attach the photo or measurement that answers each cut. Our guide on <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a roofing supplement is denied</a> walks through the appeal process, and <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a> shows how to document additional damage found during tear-off.",
      },
      {
        heading: "A simple worked example of the process",
        content: "Here is how the steps fit together on a straightforward asphalt shingle replacement. The quantities are illustrative.\n\nYou measure a gable roof at 28 squares on a 6/12 pitch. You note two stories on the street side and photograph each slope. You choose the tear-off and install items for the shingle type on the roof, then apply a waste percentage appropriate for a simple gable roof. You add starter, ridge cap, drip edge, underlayment and ice and water barrier at the eaves and valleys, count the pipe jacks and vents, and add step flashing along the chimney. Then you apply any pitch or height charge that fits, attach the measurement report and photos, and review the checklist.\n\nNothing in that list is exotic. A good estimate is a complete and traceable version of ordinary work.",
      },
      {
        heading: "Estimate versus supplement: what goes where",
        content: "The estimate covers what is visible and known when the roof is inspected. The supplement covers what is found later or was left out.\n\n• Put in the estimate: Measured area, shingle type, standard accessories, known code requirements and visible damage.\n• Save for the supplement: Hidden damage found at tear-off, such as rotted decking, and items that could not be seen from the surface.\n\nA thorough estimate means a smaller, easier supplement. If you want the supplement side, read <a href='/blog/xactimate-roof-estimate-supplements'>how to build an Xactimate roof estimate for supplements</a>.",
      },
      {
        heading: "Matching, repairability and discontinued shingles",
        content: "When only part of a roof is damaged, a common question is whether the carrier must replace more than the damaged area so the roof matches. The answer depends on the policy and on the rules in your state, and these disputes are common.\n\nIf matching is an issue on your job:\n\n• Document the shingle: Take photos of the product, the exposure and any markings, and note whether it is still manufactured.\n• Document the condition: Record brittleness, age and any repair attempts, and describe how you tested repairability.\n• Check the rules: Look at the policy and your state's guidance before you argue the point.\n\nKeep the discussion factual. Photos and manufacturer information carry far more weight than opinion.",
      },
      {
        heading: "How carriers review roof estimates",
        content: "Carriers often use a mix of desk review, measurement reports and photo review. Understanding that helps you write estimates that pass quickly.\n\n• Desk review: A reviewer checks your numbers against the measurement report and standard pricing.\n• Photo review: A reviewer looks for a photo behind each major line item.\n• Exception review: Anything unusual gets extra scrutiny and may be sent to a supervisor.\n\nThe lesson is consistent across all three. Make every number traceable, every item visible in a photo and every exception explained in a sentence.",
      },
      {
        heading: "How Supplement Snap helps you build estimates adjusters approve",
        content: "Most estimate disputes come down to documentation. Photos are scattered across phones, notes get lost and nobody remembers which picture shows which damage.\n\nSupplement Snap lets your crew capture photos from the roof, attach notes to each finding, and organize everything by project. It generates a supplement narrative and a PDF report you can send to the adjuster, so the evidence that supports your estimate is ready when the adjuster asks for it.",
      },
    ],
  },
  {
    "slug": "roofing-supplement-template",
    images: { 0: { src: "/blog/roofing-supplement-template/card.png", alt: "Key points from the guide: Roofing Supplement Template: Format, Checklist and Example", width: 1200, height: 630 } },
    "title": "Roofing Supplement Template: Format, Checklist and Example",
    "metaTitle": "Roofing Supplement Template and Checklist (Free Format)",
    "metaDescription": "A roofing supplement template you can copy: cover page, findings format, narrative wording, line items and a pre-submission checklist adjusters respond to.",
    "publishedDate": "2026-10-22",
    "midCtaAfter": 1,
    "midCtaTitle": "Capture this on the roof, not from memory.",
    "midCtaBody": "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    "downloads": "roofing-supplement-template",
    "related": [
      "roofing-supplement-email-to-adjuster", 
      "how-to-write-a-roofing-supplement",
      "roofing-photo-documentation-checklist",
      "xactimate-codes-for-roofing-supplements",
      "roofing-supplement-denied-what-to-do"
    , "best-roofing-supplement-software", "roofing-estimate-template"],
    "externalLinks": [
      {
        "text": "Verisk Xactimate Product Page",
        "url": "https://www.verisk.com/insurance/products/xactimate/"
      },
      {
        "text": "NRCA Roofing Manual and Standards",
        "url": "https://www.nrca.net"
      }
    ],
    "highlight": {
      "label": "What This Template Covers",
      "value": "5 Parts",
      "subtext": "Cover page, findings, narratives, line items and a submission checklist"
    },
    "visuals": {
      "1": {
        "type": "steps",
        "data": [
          {
            "num": "1",
            "title": "Cover page",
            "desc": "Project, address, claim number, carrier, adjuster, date of loss and inspection date."
          },
          {
            "num": "2",
            "title": "Findings summary",
            "desc": "A numbered list of every item with its location and photo numbers."
          },
          {
            "num": "3",
            "title": "Narratives and photos",
            "desc": "One short narrative and one or more labeled photos for each finding."
          },
          {
            "num": "4",
            "title": "Line items",
            "desc": "Item, quantity, unit and price, in the format the adjuster works in."
          },
          {
            "num": "5",
            "title": "Certification and contact",
            "desc": "A short statement and who to call with questions."
          }
        ]
      },
      "4": {
        "type": "checklist",
        "data": {
          "title": "Before You Send the Supplement",
          "items": [
            {
              "text": "Claim number, policy holder and date of loss are on every page",
              "checked": true
            },
            {
              "text": "Every finding has at least one labeled photo",
              "checked": true
            },
            {
              "text": "Quantities match your measurements or measurement report",
              "checked": true
            },
            {
              "text": "Each narrative says what, where, when, why and what is needed",
              "checked": true
            },
            {
              "text": "Code or manufacturer references are attached where you rely on them",
              "checked": true
            },
            {
              "text": "The PDF opens cleanly and photos are legible",
              "checked": true
            },
            {
              "text": "You know who received it and when you will follow up",
              "checked": true
            }
          ]
        }
      }
    },
    "sections": [
      {
        "heading": "Why a template saves you time and gets better results",
        "content": "Every supplement answers the same questions, so there is no reason to start from a blank page. A consistent template gets you three things.\n\nSpeed: Your office fills in blanks instead of composing from scratch. Consistency: The adjuster learns where to find everything, so reviews go faster. Fewer mistakes: A fixed structure makes missing items obvious.\n\nThe format below works for most residential roofing supplements. Adjust it to your carrier's requests and your state's rules. For the thinking behind it, read <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a>."
      },
      {
        "heading": "The five parts of a supplement package",
        "content": "A complete package has five parts. Keep each one short and scannable.\n\n1. Cover page: Everything an adjuster needs to file it correctly, in one place.\n2. Findings summary: A short numbered list of each item and where it is.\n3. Narratives and photos: One finding per block, with the narrative beside its photos.\n4. Line items: A simple table of item, quantity, unit and price.\n5. Certification and contact: A short sign-off and a direct way to reach you.\n\nSend it as a single PDF when you can, so nothing gets separated."
      },
      {
        "heading": "Cover page: what to include",
        "content": "Put these on the first page so the adjuster can match the document to the claim immediately:\n\n• Project name and property address\n• Policy holder name\n• Claim number and carrier\n• Adjuster name, email and phone\n• Date of loss, date of tear-off and date documented\n• Your company name and a contact person\n\nA missing claim number is one of the most common reasons a package gets misfiled or delayed."
      },
      {
        "heading": "Findings format you can copy",
        "content": "Use the same block for every finding. Replace the bracketed text:\n\n• Finding: [Component], [location, for example front slope eave]\n• Condition: [What you observed, in one or two plain sentences]\n• When found: [During tear-off, after shingles and underlayment were removed]\n• Why it matters: [Water intrusion, code requirement or manufacturer requirement]\n• Needed: [Repair and quantity]\n• Photos: [Photo numbers]\n\nExample: Finding: Decking, front slope eave. Condition: Three sheets of OSB soft and deteriorated from moisture. When found: During tear-off. Why it matters: Cannot hold fasteners. Needed: Replace three sheets. Photos: 4, 5, 6.\n\nKeep wording neutral and factual. Avoid guessing at causes you cannot prove."
      },
      {
        "heading": "Line items and quantities",
        "content": "List each item with its quantity and unit, in the format your adjuster uses. A simple layout is enough:\n\n• Item description\n• Quantity and unit\n• Unit price from the price list on the claim\n• Total\n\nIf you build estimates in Xactimate, mirror its item names. If you do not, a clear table with measurements still works. Our <a href='/blog/xactimate-codes-for-roofing-supplements'>Xactimate codes reference</a> lists common items, and the units to use.\n\nShow how you got each quantity, even if it is only a line such as 12 feet by 8 feet equals 96 square feet."
      },
      {
        "heading": "Sending it and following up",
        "content": "Send the package by email with a clear subject line that includes the claim number and the words supplement request. In the body, list the number of findings, the total requested and what you attached.\n\nThen follow up in writing. A short note a few days later asking whether the adjuster needs anything else keeps the file moving. If you need more guidance on disputes, see <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a supplement is denied</a>.\n\nThis template is a starting point. It is general guidance, not legal advice, and your carrier may require its own forms."
      }
    ],
    "faq": [
      {
        "q": "What should a roofing supplement include?",
        "a": "A cover page with claim details, a findings summary, a narrative and photos for each finding, line items with quantities and units, and a short certification and contact section."
      },
      {
        "q": "Is there a standard roofing supplement format?",
        "a": "There is no single legal standard. Carriers differ, so use a clear consistent format and adjust to what your adjuster asks for."
      },
      {
        "q": "How long should a supplement narrative be?",
        "a": "A few sentences per finding is usually enough. Say what was found, where, when, why it matters and what is needed."
      },
      {
        "q": "Should I send photos inside the PDF or separately?",
        "a": "Embedding labeled photos in a single PDF keeps everything together. Some carriers also ask for original files, so keep them available."
      }
    ]
  },
  {
    "slug": "roofing-photo-documentation-checklist",
    images: { 0: { src: "/blog/roofing-photo-documentation-checklist/card.png", alt: "Key points from the guide: Roofing Photo Documentation Checklist: What to Photograph at Tear-Off", width: 1200, height: 630 } },
    downloads: "roofing-crew-documentation-checklist",
    "title": "Roofing Photo Documentation Checklist: What to Photograph at Tear-Off",
    "metaTitle": "Roofing Photo Documentation Checklist for Insurance Claims",
    "metaDescription": "What roofers should photograph at inspection and tear-off for insurance claims: required shots, hidden damage, labels and a checklist adjusters accept.",
    "publishedDate": "2026-10-22",
    "midCtaAfter": 1,
    "midCtaTitle": "Capture this on the roof, not from memory.",
    "midCtaBody": "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    "related": [
      "roofing-supplement-template",
      "hail-damage-roof-inspection",
      "how-to-write-a-roofing-supplement",
      "roof-inspection-report"
    , "best-app-to-document-roof-damage-for-insurance"],
    "externalLinks": [
      {
        "text": "NRCA Roofing Manual and Standards",
        "url": "https://www.nrca.net"
      }
    ],
    "highlight": {
      "label": "Photos Per Finding",
      "value": "3 Views",
      "subtext": "Wide for location, medium for context, close-up for detail"
    },
    "visuals": {
      "2": {
        "type": "checklist",
        "data": {
          "title": "Photos to Capture on Every Roof",
          "items": [
            {
              "text": "Front, rear, left and right of the house from the ground",
              "checked": true
            },
            {
              "text": "Each roof slope, labeled",
              "checked": true
            },
            {
              "text": "Pitch confirmed with a gauge or level in frame",
              "checked": true
            },
            {
              "text": "Eaves, rakes, ridges, hips and valleys",
              "checked": true
            },
            {
              "text": "Every penetration: pipes, vents, chimneys, skylights",
              "checked": true
            },
            {
              "text": "Existing flashing, drip edge and starter condition",
              "checked": true
            },
            {
              "text": "Number of shingle layers at an exposed edge",
              "checked": true
            },
            {
              "text": "Gutters, downspouts and any collateral damage",
              "checked": true
            }
          ]
        }
      },
      "4": {
        "type": "tip",
        "data": {
          "type": "tip",
          "title": "Shoot three views of every finding",
          "text": "Take one wide photo that shows where it is, one medium photo that shows the area around it, and one close-up that shows the condition. Adjusters trust a finding more when they can see all three."
        }
      }
    },
    "sections": [
      {
        "heading": "Why photos decide whether a roofing claim item is paid",
        "content": "An adjuster who was not on your roof relies on your photos to understand it. If an item is not in a photo, it is very hard to get paid for. If it is in a photo but unclear, it invites a question or a denial.\n\nGood photo documentation does three jobs. It proves the damage exists, it proves where and when it was found, and it connects each photo to a line item. Do those three things consistently and most supplement disputes get easier."
      },
      {
        "heading": "The basics: photograph before anything is removed",
        "content": "Start every job with photos of the roof as it is. These are the pictures that show condition before work begins and they cannot be retaken later.\n\n• The house from four sides\n• Every slope from a distance and up close\n• Pitch with a gauge or level in the frame\n• Existing flashing, vents, drip edge and ridge\n• Visible damage such as impacts, lifted shingles or granule loss\n\nThen walk the interior of the attic or ceilings if you have access and the homeowner agrees. Stains and wet spots show up in different places than roof damage."
      },
      {
        "heading": "The core checklist",
        "content": "Use the checklist below on every roof. Print it, or keep it in your phone. The goal is a repeatable routine that crews can follow without thinking.\n\nOnce you have the baseline shots, add finding-specific photos as you go. Keep every photo in the order taken, because the sequence helps an adjuster follow the story."
      },
      {
        "heading": "Hidden damage found at tear-off",
        "content": "This is where supplements are won or lost. The moment shingles and underlayment come off, photograph what is underneath before anything gets covered.\n\n• Decking: Photograph soft, stained, cracked or delaminated sheathing. Include a tape measure or a marked area for scale.\n• Flashing: Show corrosion, separation and gaps from the front and from the side.\n• Ice and water barrier: Show the bare deck at eaves and valleys where barrier is missing.\n• Penetrations: Show cracked boots, rusted vents and failed seals.\n• Extra layers: Show an edge with two layers of old shingles.\n\nAdd a chalk circle or marker around each problem and photograph it again. A circled problem is easier to understand than a close-up of a texture."
      },
      {
        "heading": "Label, number and organize",
        "content": "A pile of unlabeled photos forces the adjuster to guess. A short label makes each one useful.\n\nFor each finding, record:\n\n• What it is, such as rotted decking\n• Where it is, such as front slope eave\n• When it was found, such as during tear-off\n• Which line item it supports\n\nUpload from the roof or the truck instead of waiting until the end of the day. Photos stuck on phones are the most common reason supplements go out late. <a href='/blog/roofing-supplement-template'>Our supplement template</a> shows how to lay out labeled photos in a package."
      },
      {
        "heading": "Metadata, originals and honesty",
        "content": "Photos usually carry the date, time and sometimes location, which helps show when and where they were taken. Compressing or editing a photo can strip that information, so keep the original files.\n\nNever alter a photo to make damage look worse, and do not claim damage you did not find. Accurate documentation protects your credibility and your license. If you are unsure whether something is damage, photograph it and note that it needs review.\n\nFor what to look for on a storm-damaged roof, see our guide to <a href='/blog/hail-damage-roof-inspection'>hail damage roof inspection</a>."
      }
    ],
    "faq": [
      {
        "q": "How many photos should I take on a roofing job?",
        "a": "As many as it takes to show every slope, every penetration and every finding in three views. For most residential roofs that is dozens of photos, not a handful."
      },
      {
        "q": "What photos do insurance adjusters want for a roof claim?",
        "a": "Overall photos of each slope, close-ups of damage, pitch, penetrations, flashing and drip edge, and any hidden damage found at tear-off, all clearly labeled."
      },
      {
        "q": "Should I photograph the roof before tear-off?",
        "a": "Yes. Pre-work photos show original condition and cannot be retaken after materials are removed."
      },
      {
        "q": "Do photos need to be geotagged?",
        "a": "Not always, but date and location metadata help show when and where a photo was taken. Keep the original files."
      }
    ]
  },
  {
    "slug": "roofing-overhead-and-profit-claims",
    "title": "Overhead and Profit on Roofing Claims: When You Can Charge O&P",
    "metaTitle": "Overhead and Profit (O&P) on Roofing Insurance Claims",
    "metaDescription": "How overhead and profit works on roofing claims: when O&P applies, how to document multiple trades, what carriers push back on and how to respond.",
    "publishedDate": "2026-10-22",
    "midCtaAfter": 1,
    "midCtaTitle": "Capture this on the roof, not from memory.",
    "midCtaBody": "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    "related": [
      "xactimate-roofing-estimate-approved",
      "how-much-do-roofing-supplements-pay",
      "roofing-supplement-denied-what-to-do",
      "how-to-write-a-roofing-supplement"
    ],
    "externalLinks": [
      {
        "text": "Verisk Xactimate Product Page",
        "url": "https://www.verisk.com/insurance/products/xactimate/"
      },
      {
        "text": "NRCA Roofing Manual and Standards",
        "url": "https://www.nrca.net"
      }
    ],
    "highlight": {
      "label": "Commonly Discussed Rate",
      "value": "10 + 10",
      "subtext": "Ten percent overhead plus ten percent profit is a common starting point, but rules vary"
    },
    "visuals": {
      "2": {
        "type": "compare",
        "data": {
          "before": {
            "label": "O&P Is Usually Questioned When",
            "items": [
              "Only one trade is involved",
              "No explanation of coordination",
              "No general contractor role shown",
              "Requested as a flat add-on"
            ]
          },
          "after": {
            "label": "O&P Is Easier to Support When",
            "items": [
              "Several trades are needed",
              "Each trade is listed with scope",
              "A general contractor coordinates the work",
              "Policy and state rules are cited"
            ]
          }
        }
      },
      "4": {
        "type": "tip",
        "data": {
          "type": "warning",
          "title": "Rules vary by state and policy",
          "text": "Whether and when O&P is owed depends on the policy language and on state rules and case law. Check both before you argue the point, and consider advice from a licensed professional on large disputes."
        }
      }
    },
    "sections": [
      {
        "heading": "What overhead and profit means on a claim",
        "content": "Overhead covers the general contractor's cost of running a job: coordinating trades, scheduling, supervising, insurance, office staff and similar business costs. Profit is the margin for taking on the risk of the project. In an insurance estimate, both are usually added as percentages on top of the direct costs of labor and materials.\n\nO&P matters because it can be a meaningful part of a claim, and because it is one of the items carriers most often question. Getting it right starts with understanding when it applies."
      },
      {
        "heading": "When O&P is typically requested",
        "content": "O&P is most often requested when a repair needs a general contractor to coordinate several trades. A roof replacement that also needs gutters, siding, paint, drywall or electrical work is a typical example.\n\nIt is commonly discussed as a 10 percent overhead and 10 percent profit combination, but that figure is a convention and not a rule. The right amount for your claim depends on the policy, the carrier and your state. A single-trade roof replacement with no coordination is much harder to justify."
      },
      {
        "heading": "How carriers push back, and what supports your request",
        "content": "Carriers push back on O&P for predictable reasons. The comparison below shows what raises questions and what makes a request easier to support.\n\nA good O&P request does four things: it lists the trades involved, it shows why a general contractor is needed to coordinate them, it ties the request to policy language, and it stays consistent with how you priced the rest of the job."
      },
      {
        "heading": "How to document an O&P request",
        "content": "Treat O&P like any other line item: it needs proof.\n\n1. List the trades: Roofing, gutters, siding, interior repairs and anything else on the scope.\n2. Show the coordination: Note scheduling, permits, inspections and supervision your company handles.\n3. Quote the policy: Point to the language that covers general contractor overhead and profit.\n4. Keep the math clear: Show the base amount and the percentages applied.\n5. Respond in writing: If the carrier disputes it, answer with specifics instead of repeating the request.\n\nKeep your tone factual. Carriers respond better to organized support than to demands."
      },
      {
        "heading": "Mistakes that cost contractors O&P",
        "content": "A few habits make O&P harder to win.\n\n• Adding it at the end: Requesting it without any supporting explanation.\n• Ignoring the policy: Assuming it applies without checking the language.\n• Inconsistent pricing: Padding line items and also asking for O&P.\n• No record of coordination: Failing to show who managed the trades.\n\nWhen you document the full scope well, as covered in our guide on <a href='/blog/xactimate-roofing-estimate-approved'>writing an Xactimate roofing estimate that gets approved</a>, O&P becomes part of a professional package instead of an afterthought."
      }
    ],
    "faq": [
      {
        "q": "What does O&P mean in roofing insurance?",
        "a": "O&P stands for overhead and profit. It is the general contractor's cost of coordinating a job plus a profit margin, usually added as percentages to the direct costs."
      },
      {
        "q": "Is O&P always paid on a roofing claim?",
        "a": "No. It depends on the policy, the carrier and your state, and it is most often supported when several trades are involved."
      },
      {
        "q": "What is the 10 and 10 rule?",
        "a": "It is a common convention of 10 percent overhead and 10 percent profit. It is not a universal rule, and carriers and states treat it differently."
      },
      {
        "q": "Can a roofing-only job include O&P?",
        "a": "It is harder to justify when only one trade is involved and no coordination is needed. Check your policy and local rules."
      }
    ]
  },
  {
    "slug": "roofing-code-upgrades-ordinance-and-law",
    "title": "Code Upgrades in Roofing Claims: Ordinance and Law Coverage Explained",
    "metaTitle": "Roofing Code Upgrades and Ordinance and Law Coverage",
    "metaDescription": "How code upgrades work in roofing claims: what Ordinance and Law coverage is, which roof items it can cover, and how to document them for adjusters.",
    "publishedDate": "2026-10-22",
    "midCtaAfter": 1,
    "midCtaTitle": "Capture this on the roof, not from memory.",
    "midCtaBody": "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    "related": [
      "what-is-the-25-percent-rule-for-roofing",
      "xactimate-codes-for-roofing-supplements",
      "roofing-photo-documentation-checklist",
      "roof-replacement-estimate-vs-final-cost"
    ],
    "externalLinks": [
      {
        "text": "International Code Council",
        "url": "https://www.iccsafe.org"
      },
      {
        "text": "NRCA Roofing Manual and Standards",
        "url": "https://www.nrca.net"
      }
    ],
    "highlight": {
      "label": "Key Question",
      "value": "Is It Covered?",
      "subtext": "Code upgrade items depend on the policy, not just the building code"
    },
    "visuals": {
      "1": {
        "type": "steps",
        "data": [
          {
            "num": "1",
            "title": "Find the requirement",
            "desc": "Identify the local code or manufacturer requirement that applies to the item."
          },
          {
            "num": "2",
            "title": "Check the policy",
            "desc": "Confirm the policy includes ordinance or law coverage and what limit applies."
          },
          {
            "num": "3",
            "title": "Document the gap",
            "desc": "Photograph what is missing or non-compliant before it is covered."
          },
          {
            "num": "4",
            "title": "Cite and submit",
            "desc": "Attach the code reference and request the item with a short explanation."
          }
        ]
      },
      "3": {
        "type": "tip",
        "data": {
          "type": "info",
          "title": "Codes differ by location",
          "text": "Building codes and amendments are set by local authorities and change over time. Confirm the current requirement with your building department before you cite it."
        }
      }
    },
    "sections": [
      {
        "heading": "What code upgrades are and why they come up on roofs",
        "content": "A code upgrade is work that building codes require when a roof is replaced, even if the old roof did not meet current standards. Older roofs often lack items that are now required, such as ice barrier at the eaves, compliant drip edge or proper ventilation.\n\nThese items are not hidden damage. They are missing components that must be added to pass inspection. That is why they are handled differently from a normal supplement, and why the policy matters so much."
      },
      {
        "heading": "How the process works",
        "content": "Code upgrades follow a clear order. Skipping a step is the usual reason they are denied.\n\nThe most important step is the second one. A building code can require an item and a policy can still decline to pay for it. Policies handle this through coverage often called ordinance or law coverage, which usually carries its own limit."
      },
      {
        "heading": "What Ordinance and Law coverage means",
        "content": "Ordinance or law coverage is an optional or built-in part of many property policies. In general terms, it addresses the extra cost of meeting building codes when a covered loss is repaired. It often has a separate limit, sometimes expressed as a percentage of the dwelling coverage.\n\nWhat your client's policy includes can vary widely. Some policies include it, some exclude it and some limit it. Ask the carrier or read the declarations and endorsements. Do not assume a code requirement automatically means payment."
      },
      {
        "heading": "Roof items commonly tied to code requirements",
        "content": "These are items contractors often raise as code-driven. Whether each applies depends on the local code and the policy.\n\n• Drip edge: Required in many jurisdictions at eaves and rakes.\n• Ice and water barrier: Required in many cold-weather areas at eaves and valleys.\n• Underlayment: Type and number of layers may be specified.\n• Ventilation: Minimum airflow requirements for the attic.\n• Flashing and step flashing: Specific requirements at walls and chimneys.\n• Decking thickness or fastening: Some areas specify minimums.\n\nAlways verify the current requirement with the local building department."
      },
      {
        "heading": "How to document a code upgrade supplement",
        "content": "Give the adjuster everything needed to say yes without research.\n\n1. Photograph what is missing: Show the bare deck where barrier is absent, or the edge with no drip edge.\n2. Cite the requirement: Include the code section or a letter or printout from the building department.\n3. Quote the policy: Point to the ordinance or law language and note the limit if you know it.\n4. Explain the work: State the item, quantity and unit in plain terms.\n5. Keep it separate: List code items apart from hidden damage so each can be reviewed on its own merits.\n\nFor the broader workflow, see <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a> and our <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a>.\n\nThis is general information and not legal advice. Policy terms and local rules determine what is owed."
      }
    ],
    "faq": [
      {
        "q": "What is a code upgrade in a roofing claim?",
        "a": "It is work required by current building codes when a roof is replaced, such as drip edge or ice barrier, even if the old roof did not include it."
      },
      {
        "q": "What is Ordinance and Law coverage?",
        "a": "It is policy coverage for the extra cost of meeting building codes when a covered loss is repaired. It often has its own limit and not every policy includes it."
      },
      {
        "q": "Will insurance always pay for code upgrades?",
        "a": "No. Payment depends on the policy language and limits, so check the coverage before you request the item."
      },
      {
        "q": "How do I prove a code requirement to an adjuster?",
        "a": "Cite the specific code section or provide documentation from the local building department, and attach photos showing the item is missing."
      }
    ]
  },
  {
    slug: "companycam-alternative-roofing-supplements",
    title: "5 CompanyCam Alternatives for Roofers (2026)",
    metaTitle: "5 CompanyCam Alternatives for Roofers (2026)",
    metaDescription: "Five CompanyCam alternatives for roofers compared: Manifold, LibreCam, Roof Report Pro, Supplement Snap and your CRM's photos. What each does and costs as listed.",
    publishedDate: "2026-10-22",
    updatedDate: "2026-10-26",
    related: ["best-app-to-document-roof-damage-for-insurance", "best-roofing-supplement-software", "roofing-photo-documentation-checklist", "roofing-software-comparison", "best-roofing-crm"],
    externalLinks: [
      { text: "CompanyCam pricing (public page)", url: "https://www.companycam.com/pricing" },
      { text: "Manifold for roofing contractors", url: "https://www.scanmanifold.com/roofing-contractors" },
      { text: "LibreCam", url: "https://librecam.com" },
      { text: "NRCA Roofing Manual and Standards", url: "https://www.nrca.net" },
    ],
    highlight: { label: "Disclosure", value: "We make one", subtext: "Supplement Snap is our product. Prices come from public pages seen on October 24, 2026. Verify them yourself." },
    visuals: {
      0: { type: "matrix", data: {
        label: "App",
        headers: ["Built for", "Price as listed"],
        rows: [
          { feature: "1. Manifold", values: ["Photo documentation with GPS tags, PDF export and share links", "Photo $16 per user per month; Photo + Scan $24; 14-day trial, no card, per its page"] },
          { feature: "2. LibreCam", values: ["Free photo capture for crews, with voice captions and offline use", "$0 for unlimited users, per its own page"] },
          { feature: "3. Roof Report Pro", values: ["AI damage tagging and PDF inspection reports", "Not checked here"] },
          { feature: "4. Supplement Snap", values: ["Damage capture tied to supplement findings and the adjuster report", "Starter $99, Team $199, Pro $299 per month; first project free"] },
          { feature: "5. Your CRM's photo tools", values: ["Photos stored with the job in JobNimbus, AccuLynx and similar", "Included in the CRM plan you already pay for"] },
        ],
      }},
      1: { type: "tip", data: { type: "info", title: "Verify before you switch", text: "Prices and features change often, and a comparison page can be out of date. We have not tested these apps. Everything here comes from each company's public pages, seen on October 24, 2026. Confirm current details and try one real job before you move your crew." } },
      7: { type: "checklist", data: { title: "Test any CompanyCam alternative on one real job", items: [
        { text: "Does every photo stay attached to a finding and a note?", checked: true },
        { text: "Are time and location recorded on each photo?", checked: true },
        { text: "Can I share or export one clear report an adjuster can open?", checked: true },
        { text: "Does it work with a weak signal on the roof?", checked: true },
        { text: "What does it cost for my real crew size?", checked: true },
        { text: "Can I take my photos and reports with me if I leave?", checked: true },
      ]}},
    },
    faq: [
      { q: "What is the best alternative to CompanyCam for roofers?", a: "It depends on why you are looking. Manifold and LibreCam are photo apps, so they fit if you want lower cost or different features. Roof Report Pro and Supplement Snap are built around roof damage reports, so they fit if the report for the adjuster is your bottleneck. Run one real job through two options before you switch." },
      { q: "Is there a free alternative to CompanyCam?", a: "LibreCam says on its own page that it is free for unlimited users. Some other apps offer free trials. A free tool may not include reports or support, so check what you need. Supplement Snap's first project is free." },
      { q: "Why would a roofer switch from CompanyCam?", a: "Common reasons are cost for a larger crew, wanting a report built for insurance work, or wanting damage findings tied to each photo. If CompanyCam already works for your crew and your office writes supplements well, you may not need to switch." },
      { q: "Can I use CompanyCam and a supplement tool together?", a: "Yes. Some contractors keep a general photo app for job records and add a supplement tool for the insurance paperwork. Roof Report Pro lists a CompanyCam integration on its Capterra page, but confirm what it does before you rely on it." },
      { q: "Will a different app get my claim approved?", a: "No. Approval depends on the claim, the policy, the carrier and your documentation. A better app can make your package clearer and more complete." },
    ],
    sections: [
      {
        heading: "The short answer: five alternatives, and who each one fits",
        content: "CompanyCam is a popular job photo app, and many roofers use it every day. People look for alternatives for a few reasons: cost as the crew grows, wanting a report built for insurance work, or wanting damage findings tied to each photo.\n\nThe table lists five options in no particular order. No vendor paid to be on this list.\n\nDisclosure: we make Supplement Snap, one of the five. We have not tested the other apps, so this page compares what their public pages say, as seen on October 24, 2026.",
      },
      {
        heading: "Why roofers look for a CompanyCam alternative",
        content: "CompanyCam's pricing page lists plans at $63, $129 and $199 per month, with extra users at $29. The page does not say which billing cycle those figures use, and it notes annual billing saves 20 percent. Its page describes time-stamped photos, project history and job reports. It does not describe insurance workflows, so if you work claims, confirm that its reports meet what your adjuster needs.\n\nThe alternatives below fall into three groups: other photo apps, tools built around roof damage reports, and the photo tools you may already have in your CRM.",
      },
      {
        heading: "1. Manifold: photo documentation with PDF export",
        content: "Manifold's page describes GPS-tagged photos, exports to a branded PDF and share links that adjusters can open without an account.\n\n• Good fit when: You want a photo app with shareable reports and a per-user price.\n• Watch for: Its page lists $16 per user per month with no seat minimum, while one third-party roundup reported a minimum, so confirm with Manifold.\n• Cost as listed: Photo $16 per user per month, Photo + Scan $24, with a 14-day trial and no card required.",
      },
      {
        heading: "2. LibreCam: free photo capture for crews",
        content: "LibreCam describes free photo capture with voice captions and offline use.\n\n• Good fit when: Cost is the main issue and you mostly need organized, captioned photos.\n• Watch for: These are the vendor's own claims on a page it wrote. A free tool may lack reports, support or the features you need, so test it on a real job.\n• Cost as listed: $0 for unlimited users, per its own page.",
      },
      {
        heading: "3. Roof Report Pro: AI damage tagging and PDF reports",
        content: "Roof Report Pro, per its Capterra listing, uses AI to tag damage types in photos and produce PDF inspection reports. It also lists integrations with JobNimbus and CompanyCam.\n\n• Good fit when: You want roof-specific tagging and a ready report, and you may keep your existing photo app alongside it.\n• Watch for: AI tags need a human check. We did not review its pricing, so check its site. For a side-by-side with ours, see <a href='/blog/supplement-snap-vs-roof-report-pro'>Supplement Snap vs Roof Report Pro</a>.\n• Cost as listed: Not checked here.",
      },
      {
        heading: "4. Supplement Snap: damage capture tied to the supplement",
        content: "Supplement Snap is built for one job: documenting hidden damage found at tear-off. Your crew photographs damage on the roof, tags the roof area and damage type, adds a typed or voice note, and the app drafts a written description of each finding that you review and edit. You then email a PDF report to the adjuster.\n\n• Good fit when: Turning photos and notes into a clear supplement package is where your time goes.\n• Watch for: It is not a general photo app for every trade, a CRM or an estimating tool. Team plans add an Xactimate-style CSV export, which is a starting list you review and price yourself.\n• Cost as listed: Starter $99, Team $199 and Pro $299 per month. The first project is free. Check the <a href='/pricing'>pricing page</a> for current details, and see a <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
      {
        heading: "5. Your CRM's photo tools: the option you already pay for",
        content: "Roofing CRMs such as JobNimbus and AccuLynx store photos and documents with each job. If your crew already works in one, its photo tools may cover the basics without another subscription.\n\n• Good fit when: You want photos kept with the customer record and do not need a separate report.\n• Watch for: CRM photo tools are usually a side feature. Check how labeling, reports and offline use work for your crew. See our <a href='/blog/best-roofing-crm'>list of the best roofing CRMs</a>.\n• Cost as listed: Part of your existing CRM plan.",
      },
      {
        heading: "How to choose and test fairly",
        content: "Do not decide from a demo. Run one real job through two or three options. Have the same crew photograph the same roof, add the same notes, and time how long it takes to get from the first photo to a package you could send. Then show each result to someone who was not on the roof, and compare cost at your real crew size.\n\nIf your photo app and office process already produce approved supplements, you may not need to switch. For what to photograph at tear-off, see the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a>, and for a broader comparison see <a href='/blog/best-app-to-document-roof-damage-for-insurance'>5 best apps to document roof damage</a>.",
      },
    ],
  },
  {
    slug: "document-rotted-roof-decking-tear-off",
    images: { 0: { src: "/blog/document-rotted-roof-decking-tear-off/diagram.png", alt: "Illustration of a roof deck from above made of 4 by 8 foot sheets with three whole sheets and half a sheet marked soft or rotted, and the arithmetic for square feet", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "How to Document Rotted Roof Decking Found During Tear-Off",
    metaTitle: "How to Document Rotted Roof Decking at Tear-Off",
    metaDescription: "What to photograph, measure and write down when you find rotted roof decking during tear-off, so the finding is clear to the adjuster.",
    publishedDate: "2026-10-23",
    sections: [
      {
        heading: "Why decking is the finding adjusters ask about most",
        content: "Decking is hidden until the shingles and underlayment come off. That is exactly why it needs clear proof. The adjuster was not on the roof at tear-off, so your photos, measurements and notes are the only way they see what you saw.\n\nThe goal is not to argue for more money. It is to show, factually, what condition the decking was in, where it was, and how much of it was affected. Coverage and approval still depend on the claim, the policy and the carrier.",
      },
      {
        heading: "What to record at the roof",
        content: "Capture these items for every area of damaged decking:\n\n• Location: Which slope or roof area, described the same way in the photo label and the notes.\n• Condition: Soft, rotted, delaminated, water-stained, cracked or sagging, as you actually observed it.\n• Extent: Number of sheets or boards, or the approximate square feet affected.\n• Context: A wide shot showing where the area sits on the roof, then close-ups of the worst boards.\n• Scale: A tape measure or another known object in frame for size.\n\nTake the photos before the decking is replaced or covered. Once new material goes down, the evidence is gone.",
      },
      {
        heading: "How to write the note",
        content: "Keep it short and factual. A useful note answers four questions: what was found, where, how much, and why it was not visible before tear-off.\n\nExample: Rear slope, along the eave: four sheets of decking soft and deteriorated when walked, found after removing existing shingles and underlayment. Photos 12 to 16 show the condition.\n\nAvoid guessing at the cause or at what the policy covers. Describe what you can see and measure, and let the adjuster evaluate coverage.",
      },
      {
        heading: "Match photos, measurements and line items",
        content: "Before you submit, check that the numbers agree. If the note says four sheets, the photos should show four sheets and the line item quantity should reflect that. Mismatches are the quickest way to lose trust with an adjuster.\n\nIf you want a full pre-submission check, use the <a href='/free-roofing-supplement-checklist'>free roofing supplement checklist</a>. For layout help, see the <a href='/blog/roofing-supplement-template'>roofing supplement template</a> and the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a>.",
      },
      {
        heading: "A copy-and-paste checklist for decking",
        content: "• Wide photo of the slope, showing where the damage sits\n• Close photo of each soft, rotted or delaminated area with a tape\n• Photo of a screwdriver or probe pressed into the wood\n• Photos of the old underlayment and shingles over it as they come off, if you can capture them\n• Sheets or square feet affected, written down with the arithmetic\n• The slope and where on it\n• A short factual note, with photo numbers\n\nOur free <a href='/blog/roof-tear-off-findings-log-template'>findings log</a> has a row for each.",
      },
      {
        heading: "Decking, sheathing, plywood and OSB",
        content: "People use several words for the same layer. Decking and sheathing both mean the boards or panels the roofing is attached to. Plywood is thin layers of wood glued together. OSB, or oriented strand board, is made of pressed wood strands. Older homes may have plank boards instead. Use the word that matches what you see, and say which kind it is, because it affects how damage looks and how it is described.",
      },
      {
        heading: "Counting sheets and square feet",
        content: "A standard sheet is 4 feet by 8 feet, which is 32 square feet. Four sheets are 128 square feet. If damage covers part of a sheet, say so rather than rounding up without explanation: about half of a sheet along the eave, roughly 16 square feet, for example. Show the arithmetic in your note, such as 4 ft x 8 ft x 4 sheets = 128 sq ft, so a reviewer can check it.",
      },
      {
        heading: "When the damage followed a storm",
        content: "Reviewers often want to know whether rot was sudden or has been building for a long time. That is not for you to decide, and guessing weakens your package. What you can do is photograph the layers as they come off, show the condition of the underlayment and shingles above the soft area, and describe exactly what you see. Our guide to <a href='/blog/wind-damage-roof-insurance-claim-documentation'>wind damage documentation</a> covers the rest of that package. Building codes, policy wording and carrier practice vary, so confirm the details for your job.",
      },
      {
        heading: "Doing this faster on the roof",
        content: "The slow part is usually not taking photos. It is matching them to notes and measurements later. Capturing the photo, the roof area and a short note at the same moment keeps everything linked.\n\nThat is the workflow <a href='/roofing-supplement-software'>Supplement Snap</a> is built around: photograph, tag and describe the finding on the roof, then generate a report. You can preview the output in the <a href='/roofing-supplement-report-example'>sample report</a>. Software organizes the evidence; it cannot guarantee a supplement is approved.",
      },
    ],
    faq: [
      {
        q: "How many photos of rotted decking should I take?",
        a: "Take a wide shot showing where the damage sits on the roof, then close-ups of the worst boards with a scale in frame. Take enough that someone who was not there can see the condition and the extent.",
      },
      {
        q: "Should I state why the decking rotted?",
        a: "Stick to what you observed and measured. Speculating about cause can cause problems. Describe the condition and location and let the adjuster determine coverage.",
      },
      {
        q: "Does documenting decking guarantee the carrier pays for it?",
        a: "No. Clear documentation helps you present the finding, but payment depends on the claim, policy and carrier.",
      },
      {
        q: "What is the difference between plywood and OSB decking?",
        a: "Plywood is made of thin glued layers of wood. OSB is pressed wood strands. Both are used as decking, and they can fail differently when wet, so say which you found.",
      },
      {
        q: "How do I count decking in square feet or sheets?",
        a: "A standard sheet is 32 square feet. Count whole and partial sheets, write the arithmetic, and keep photo numbers beside the count.",
      },
      {
        q: "Can damaged decking be repaired instead of replaced?",
        a: "Sometimes small areas can be repaired. If you replaced it, write why: soft to the probe, delaminated, or unable to hold fasteners. The reviewer may reasonably ask.",
      },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["document-rotted-fascia-and-sub-fascia-roof-claim", "document-deck-damage-from-old-underlayment-and-fasteners", "roof-tear-off-findings-log-template", "roof-tear-off-vs-overlay", "roofing-photo-documentation-checklist", "roofing-supplement-template", "hail-damage-roof-inspection", "roofing-documentation-spanish-speaking-crews"],
  },
  {
    slug: "organize-roofing-supplement-photos-by-claim",
    images: { 0: { src: "/blog/organize-roofing-supplement-photos-by-claim/card.png", alt: "Key points from the guide: How to Organize Roofing Supplement Photos by Claim and Roof Area", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "How to Organize Roofing Supplement Photos by Claim and Roof Area",
    metaTitle: "Organize Roofing Supplement Photos by Claim",
    metaDescription: "A repeatable system for naming, grouping and labeling roofing supplement photos by claim and roof area so reports are fast to build.",
    publishedDate: "2026-10-23",
    sections: [
      {
        heading: "The problem with a camera roll",
        content: "A single roof can produce a hundred photos. Mixed in with personal pictures and other jobs, they are hard to sort, and the person writing the supplement often was not the person on the roof.\n\nA simple system, applied the same way every job, saves more time than any single tool.",
      },
      {
        heading: "Step 1: One folder per claim",
        content: "Create one folder per claim, named so it sorts and searches well:\n\n1. Claim number or job number\n2. Last name\n3. Street name\n\nExample: 12345-Smith-Oak-St. Keep the carrier estimate, measurement report and photos together in that folder.",
      },
      {
        heading: "Step 2: Group photos by roof area",
        content: "Inside the claim folder, use subfolders or file name prefixes for each area:\n\n• Front slope, rear slope, left and right slopes\n• Valleys, ridges, hips\n• Chimney, skylights, pipe boots and vents\n• Eaves, rakes and drip edge\n• Decking and underlayment\n\nUse the same names on every job so anyone on the team can find a photo.",
      },
      {
        heading: "Step 3: Label every photo with what it shows",
        content: "For each photo, record the area, the condition and the order, for example: rear-slope-decking-soft-03. If you cannot name the photo, you probably cannot explain it to an adjuster either.\n\nTie each photo to a finding in your notes. A finding with no photo, or a photo with no finding, is a gap to close before submitting.",
      },
      {
        heading: "A naming pattern you can copy",
        content: "Pick one pattern and use it on every job. For example: claim-number, then area, then what it shows, then a number.\n\n• 12345-front-slope-wide-01\n• 12345-rear-eave-decking-soft-04\n• 12345-chimney-flashing-corroded-09\n\nSequential numbers keep photos in the order they were taken, and the words tell a reviewer what each one shows without opening it. Keep the original files untouched and do any renaming on copies if your phone or software needs it.",
      },
      {
        heading: "Phone habits that save time later",
        content: "• Keep a separate album for each job so personal photos never mix in\n• Do not delete anything until the claim is fully closed, including blurry shots\n• Back photos up the same day, in case the phone is lost or broken\n• Many phones record the date and time inside the photo file. Keep the originals so that information stays with the photo\n• Do not crop or edit the original. If you want to mark up a photo, do it on a copy\n• Clean the lens before you start, because wet or dusty glass ruins close-ups",
      },
      {
        heading: "Handing photos to the office",
        content: "Photos are only useful if the person writing the supplement can find them. Send them to one shared folder, not through a chain of texts, and send the findings log with them. Our free <a href='/blog/roof-tear-off-findings-log-template'>findings log</a> lists each finding with its photo numbers. A simple check helps: the office confirms it received the number of photos the crew says it sent, and the log's findings match the folders.",
      },
      {
        heading: "Why this matters to the reviewer",
        content: "A reviewer who opens a package with labeled photos, matching findings and a clear order can follow it quickly. One who opens a folder of unlabeled images has to guess. Labeling is not extra work for its own sake. It is the difference between a package that can be reviewed and one that gets sent back. See <a href='/blog/roofing-supplement-mistakes-that-delay-payment'>the common supplement mistakes</a> for the other places packages stall.",
      },
      {
        heading: "Step 4: Build the report from the folder",
        content: "With photos grouped and labeled, the report writes itself: one section per finding, with its photos, measurements and note. Check it against the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> before sending.\n\nIf you would rather not rename files by hand, <a href='/roofing-supplement-software'>Supplement Snap</a> attaches each photo to a finding, roof area and note as you capture it, then builds the PDF. Compare approaches in <a href='/roofing-supplement-software-vs-spreadsheets'>software vs. spreadsheets</a>. Good organization supports a claim but does not guarantee approval.",
      },
    ],
    faq: [
      {
        q: "How should I name roofing claim photos?",
        a: "Use a consistent pattern that includes the roof area, what the photo shows and a sequence number, such as rear-slope-decking-soft-03.",
      },
      {
        q: "Should I keep original photos untouched?",
        a: "Yes. Keep the originals unedited, because metadata such as the capture time can matter, and make copies if you need to crop or annotate.",
      },
      {
        q: "Do I need software to organize photos?",
        a: "No. A consistent folder and naming system works. Software mainly saves the time spent matching photos to notes and building the report.",
      },
      {
        q: "How long should I keep claim photos?",
        a: "Claims can take months and sometimes go through further steps, so keep them until the claim is fully closed. Also follow your own record-retention policy and any requirement from your carrier, state or attorney.",
      },
      {
        q: "Should I edit or crop claim photos?",
        a: "Keep the original untouched. If you need to circle or label something, do it on a copy and keep both.",
      },
      {
        q: "What if my crew uses their own phones?",
        a: "Set one rule for how photos are named and where they are sent. A shared album or folder per job works, and everyone should know who owns the final set.",
      },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["roofing-photo-documentation-checklist", "document-rotted-roof-decking-tear-off", "roofing-supplement-template"],
  },
  {
    slug: "supplemental-roofing-estimate-explained",
    images: { 0: { src: "/blog/supplemental-roofing-estimate-explained/card.png", alt: "Key points from the guide: What Is a Supplemental Roofing Estimate? When It Applies and What It Includes", width: 1200, height: 630 } },
    downloads: "roofing-supplement-template",
    title: "What Is a Supplemental Roofing Estimate? When It Applies and What It Includes",
    metaTitle: "Supplemental Roofing Estimate: What It Is and How It Works",
    metaDescription: "A supplemental roofing estimate asks the insurer to cover damage found after the first estimate. Learn when it applies, what it includes, and how to submit one.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-25",
    visuals: {
      5: { type: "matrix", data: {
        headers: ["Who it goes to", "What it does"],
        rows: [
          { feature: "Supplement (supplemental roofing estimate)", values: ["The insurance carrier", "Requests payment for items missing from the original estimate"] },
          { feature: "Change order", values: ["The property owner", "Changes the scope or price of the contractor's agreement"] },
          { feature: "Revised estimate", values: ["Issued by the carrier", "Shows what the carrier approved after reviewing a supplement or reinspecting"] },
        ],
      }},
    },
    sections: [
      {
        heading: "What a supplemental roofing estimate is",
        content: "A supplemental roofing estimate, usually called a roofing supplement, is a request sent to an insurance company for additional costs that were not in the original claim estimate. It is most often needed when work begins and the crew finds damage or conditions that could not be seen before the old roof came off.\n\nThe insurer decides whether the items are covered. A supplement is a documented request, not a guaranteed payment.",
      },
      {
        heading: "Why the first estimate is often incomplete",
        content: "The first estimate is usually written from an inspection of the roof surface, sometimes with aerial measurements. Anything under the shingles is invisible at that point.\n\nCommon reasons a supplement comes up:\n\n• Decking: Soft or rotted boards found after tear-off.\n• Flashing: Corroded or failed flashing at chimneys, walls and valleys.\n• Underlayment and ice and water shield: Conditions that differ from what the estimate assumed.\n• Quantities: Measurements or counts that differ from the original estimate.\n• Code or manufacturer requirements: Items required for the repair that were left out.",
      },
      {
        heading: "What a supplement request should include",
        content: "Adjusters respond best to a package they can verify quickly:\n\n1. Claim details: Carrier, claim number, date of loss and adjuster.\n2. Findings: Each item described factually, with its location.\n3. Photos: Wide and close-up shots taken before the condition was covered.\n4. Measurements: Quantities that match the notes and the line items.\n5. Line items: Which estimate items each finding supports.\n6. Supporting documents: Measurement reports, invoices or code references where relevant.\n\nUse the <a href='/free-roofing-supplement-checklist'>free roofing supplement checklist</a> to confirm nothing is missing, and see the <a href='/roofing-supplement-report-example'>sample report</a> for the format.",
      },
      {
        heading: "How the process usually runs",
        content: "1. The crew finds a condition during tear-off and photographs it.\n2. The contractor notifies the adjuster and documents the finding.\n3. The contractor submits the supplement package.\n4. The adjuster reviews it, may request more information or reinspect, and then approves, adjusts or denies the items.\n5. The contractor follows up and records the outcome.\n\nTimelines and requirements vary by carrier and claim. If a request is denied, read the stated reason and see <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a supplement is denied</a>.",
      },
      {
        heading: "Doing it yourself or using software",
        content: "Plenty of contractors write supplements by hand. The slow parts are matching photos to findings and building a clean report. <a href='/roofing-supplement-software'>Roofing supplement software</a> like Supplement Snap helps with exactly that: you capture and describe findings on the roof, and it assembles the report for the adjuster. Compare approaches in <a href='/roofing-supplement-software-vs-spreadsheets'>software vs. spreadsheets</a>.\n\nNo tool can guarantee coverage or approval. That depends on the claim, the policy and the carrier. For the full walkthrough, read <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a>.",
      },
      {
        heading: "Supplemental estimate, supplement and change order: what is the difference?",
        content: "People use these words loosely, so it helps to separate them. A supplemental roofing estimate, usually called a supplement, is sent to the insurance carrier to request payment for items missing from the original claim estimate. A change order is an agreement between the contractor and the property owner that changes the scope or price of the job. A revised estimate is what the carrier issues after it reviews a supplement or reinspects the roof.\n\nIn insurance work, supplement and supplemental mean the same request. The table shows how they differ from the other terms.",
      },
      {
        heading: "A fictional example",
        content: "This example is made up to show the idea, and the quantities are not typical of any real claim.\n\nThe carrier's estimate covers tear-off and new shingles on a two-slope roof. During tear-off, the crew finds three sheets of soft decking on the rear slope and no drip edge along one eave. The crew photographs each area with a tape measure in the frame, notes where it is and when it was found, and records the quantities. The supplement then lists two findings, decking and drip edge, each with its location, quantity, photo numbers and a plain description, in the format the adjuster uses. The adjuster reviews it and decides what to approve.\n\nThe point is the evidence: what was found, where, how much, and proof that it was not visible before work began. See <a href='/roofing-supplement-report-example'>a sample supplement report</a>.",
      },
      {
        heading: "How to request one, step by step",
        content: "1. Document hidden damage before new materials cover it, with wide and close photos and a measurement.\n2. Write each finding as a location, a quantity and a plain description, without guessing at causes you cannot show.\n3. Put the findings and line items in one organized PDF with the claim number on the first page.\n4. Email it to the adjuster with a short note, using our <a href='/blog/roofing-supplement-email-to-adjuster'>supplement email template</a>.\n5. Note a follow-up date and track every contact in a <a href='/blog/roofing-supplement-follow-up-log'>follow-up log</a>.\n6. If it is denied or reduced, see <a href='/blog/roofing-supplement-denied-what-to-do'>what to do next</a>.\n\nThe <a href='/blog/what-can-you-supplement-on-a-roof-claim'>list of common supplement items</a> shows what contractors typically check for, and <a href='/blog/how-long-does-a-roofing-supplement-take'>how long a supplement takes</a> explains the timing.",
      },
    ],
    faq: [
      {
        q: "What is a supplemental roofing estimate?",
        a: "It is a request to the insurance company for additional costs not included in the original estimate, usually because damage or conditions were discovered after work started.",
      },
      {
        q: "Who submits a roofing supplement?",
        a: "Usually the roofing contractor, with documentation of what was found. The insurer decides whether to approve the items.",
      },
      {
        q: "Is a roofing supplement guaranteed to be approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and the documentation provided.",
      },
      {
        q: "How long does a supplement take?",
        a: "It varies by carrier and claim. Complete, organized documentation helps avoid back-and-forth requests for more information.",
      },
      {
        q: "Is a supplemental estimate the same as a supplement?",
        a: "Yes. In roofing insurance claims, supplement, supplemental estimate and supplemental roofing estimate all describe a request for payment for items missing from the carrier's original estimate.",
      },
      {
        q: "What is the difference between a supplement and a change order?",
        a: "A supplement is a request to the insurance carrier. A change order is an agreement between the contractor and the property owner that changes the scope or price of the work.",
      },
      {
        q: "Can a homeowner request a supplement?",
        a: "The policyholder can ask the carrier to review additional damage, and contractors often prepare the documentation. Who may submit or negotiate varies by state, so see our guide on what contractors may and may not do on a claim.",
      },
      {
        q: "What should I do if the carrier denies the supplement?",
        a: "Ask for the reason in writing, review your documentation, and consider a reinspection or other options in the policy. See our guide on what to do when a supplement is denied.",
      },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["how-to-write-a-roofing-supplement", "roofing-supplement-email-to-adjuster", "what-can-you-supplement-on-a-roof-claim", "roofing-supplement-denied-what-to-do"],
  },
  {
    slug: "xactimate-roofing-estimate-example",
    images: { 0: { src: "/blog/xactimate-roofing-estimate-example/card.png", alt: "Key points from the guide: Xactimate Roofing Estimate Example: How a Supplement Line-Item List Looks", width: 1200, height: 630 } },
    title: "Xactimate Roofing Estimate Example: How a Supplement Line-Item List Looks",
    metaTitle: "Xactimate Roofing Estimate Example (Sample Layout)",
    metaDescription: "A sample Xactimate-style roofing estimate layout: the sections it contains, how supplement line items are written, and how to attach photo proof.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    visuals: {
      1: { type: "steps", data: [
        { num: "1", title: "Claim and property details", desc: "Insured, address, carrier, claim number, date of loss and the price list used." },
        { num: "2", title: "Roof measurements", desc: "Roof area in squares, pitch, number of layers and the waste factor applied." },
        { num: "3", title: "Line items", desc: "Each task or material with a description, quantity, unit and unit price." },
        { num: "4", title: "Totals and adjustments", desc: "Subtotals, overhead and profit where applied, tax, depreciation and the final figure." },
      ]},
      2: { type: "compare", data: {
        before: { label: "Original estimate (fictional)", items: ["Remove and replace composition shingles: 32 SQ", "Underlayment: 32 SQ", "Ridge cap: 120 LF", "Drip edge: 160 LF", "Debris haul-off: 1 job"] },
        after: { label: "Supplement items found at tear-off (fictional)", items: ["Replace damaged sheathing: 96 SF", "Step flashing at sidewall: 24 LF", "Pipe jack replacement: 3 EA", "Ice and water barrier at eaves: 320 SF", "Additional layer removal: 32 SQ"] },
      }},
      4: { type: "checklist", data: { title: "Check each supplement line before sending", items: [
        { text: "Description matches the item in the price list", checked: true },
        { text: "Quantity matches your measurement and notes", checked: true },
        { text: "Unit is correct (SF, LF, SQ or EA)", checked: true },
        { text: "At least one labeled photo shows the condition", checked: true },
        { text: "One sentence explains why it was not visible before tear-off", checked: true },
        { text: "Same price list as the adjuster's estimate", checked: true },
      ]}},
      5: { type: "tip", data: { type: "warning", title: "Do not pad the list", text: "A supplement with ten supported items is stronger than one with twenty where half have no proof. Every unsupported line gives the adjuster a reason to question the rest." } },
    },
    sections: [
      {
        heading: "What an Xactimate roofing estimate contains",
        content: "An Xactimate roofing estimate is a structured list of line items. Each line has a description, a quantity, a unit and a unit price pulled from the price list in use. Adjusters read estimates in this format every day, so a supplement that follows it is quick to review and easy to compare against the original.\n\nThat is why contractors are often told to submit supplements in the same format the adjuster works in. You do not need a certain look to be taken seriously, but you do need clear line items, correct units and proof for each one.\n\nThe example on this page is fictional. Quantities are illustrative and prices are left out on purpose, because real prices come from the price list tied to your claim.",
      },
      {
        heading: "The sections of a typical roofing estimate",
        content: "Most roofing estimates follow the same outline, even though the exact layout differs by version and by who built it:\n\n• Claim details: Carrier, claim number, insured, address, date of loss and the price list name and date.\n• Roof measurements: Total area in squares, pitch, layers and the waste percentage used for materials.\n• Line items: The repair work itself, usually grouped by roof area or trade.\n• Totals: Subtotals, overhead and profit where it applies, tax and any depreciation or deductible adjustments.\n\nWhen you write a supplement, you are adding or changing lines inside that outline, so the adjuster can see exactly what moved from the original.",
      },
      {
        heading: "Sample layout: original estimate vs. supplement",
        content: "A clear package shows what the original estimate covered and what the supplement adds. The lists below are fictional and meant only to show the structure.\n\nThe original estimate covers what was visible during the first inspection: the roof surface, the shingles and the basic components. The supplement covers conditions that could only be seen after the old roofing came off, or items that were not included.\n\nKeep the two lists separate in your document. If you mix them, the adjuster has to work out which lines are new, and that costs you goodwill. A short cover note that says how many items you are adding and where the proof is makes the package easier to review.",
      },
      {
        heading: "How to write a supplement line, with a worked example",
        content: "Use the same structure for every line:\n\n1. Item: The line item name as it appears in the price list.\n2. Quantity and unit: Matching your measurement.\n3. Location: Slope, area or component.\n4. Proof: The photo numbers that show it.\n5. Reason: Why it was not visible before tear-off.\n\nWorked example (fictional): Replace damaged sheathing, 96 SF, rear slope along the eave. Photos 12 to 16 show soft, deteriorated boards found after removing shingles and underlayment. Three full sheets of 4 by 8 decking, 32 SF each, were affected. The condition was not visible from the surface before tear-off.\n\nNotice what it does not do. It does not guess at the cause, argue about coverage or exaggerate. It states what was found, where, how much and where the proof is. For common items and their units, see the <a href='/blog/xactimate-codes-for-roofing-supplements'>Xactimate roofing supplement list</a>.",
      },
      {
        heading: "What adjusters tend to question",
        content: "Adjusters reviewing a supplement are checking whether each item is real, necessary and measured correctly. These are the points that most often lead to follow-up questions:\n\n• Quantities that do not match: A note says four sheets, the photos show two and the line item says 160 SF.\n• Wrong units: Square feet where the price list uses linear feet, or squares where it uses each.\n• Different price lists: Lines priced from a different region or date than the original estimate.\n• Missing proof: A line item with no photo or measurement behind it.\n• Overclaiming: Items described as damaged when the photos show normal wear.\n\nIf you are missing a photo, say so honestly and offer to provide the measurement or a re-inspection. Trust is worth more than one line.",
      },
      {
        heading: "Mistakes that get packages sent back",
        content: "Most rejected or delayed supplements fail on presentation, not on the roof:\n\n• Photos that are unlabeled or dark, so the adjuster cannot tell what they show.\n• Long narratives that never state a quantity.\n• Submitting items in a random order instead of grouping by roof area.\n• Sending photos as many separate attachments with no index.\n\nRun the whole package through the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> before you send it, and use the <a href='/blog/roofing-supplement-template'>roofing supplement template</a> for the cover page and findings layout.",
      },
      {
        heading: "Where software fits",
        content: "Building this list by hand is slow, and mismatches creep in between photos, notes and line items. <a href='/roofing-supplement-software'>Supplement Snap</a> links each finding to its photo and note as the crew captures it, and can export Xactimate-style line items as a starting list. You still review everything and decide what goes out.\n\nTo see what the finished document looks like, open the <a href='/roofing-supplement-report-example'>sample supplement report</a>. For how an estimating tool and a documentation tool work together, read <a href='/blog/xactimate-roofing-software-explained'>Xactimate roofing software explained</a>. No tool can guarantee that a supplement is approved. Coverage depends on the claim, the policy and the carrier.",
      },
    ],
    faq: [
      {
        q: "Can I write an Xactimate-style estimate without Xactimate?",
        a: "You can submit a clearly formatted document that mirrors line items, quantities and units. Building a native Xactimate estimate requires the software.",
      },
      {
        q: "What price list should I use for a supplement?",
        a: "Use the one named on the adjuster's estimate for your claim, so each line can be compared directly with the original.",
      },
      {
        q: "How many supplement items should I include?",
        a: "Include only the items you can support with photos, measurements and a reason. Padding a list can reduce trust in the whole package.",
      },
      {
        q: "Should I list the original items again in my supplement?",
        a: "Show the original estimate for reference, but keep your supplement items in a separate list so the adjuster can see exactly what is new.",
      },
      {
        q: "Do the example quantities on this page apply to my job?",
        a: "No. They are fictional and only show structure. Use your own measurements and the price list from your claim.",
      },
    ],
    related: ["xactimate-codes-for-roofing-supplements", "xactimate-roofing-software-explained", "roofing-supplement-template", "xactimate-roofing-estimate-approved", "roofing-estimate-template"],
  },
  {
    slug: "xactimate-roofing-software-explained",
    images: { 0: { src: "/blog/xactimate-roofing-software-explained/card.png", alt: "Key points from the guide: Xactimate Roofing Software Explained: What It Does and What It Does Not", width: 1200, height: 630 } },
    title: "Xactimate Roofing Software Explained: What It Does and What It Does Not",
    metaTitle: "Xactimate Roofing Software: What It Does and Doesn't",
    metaDescription: "What Xactimate does for roofing estimates, what it does not do for supplements, and how a documentation tool fits alongside it.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    visuals: {
      3: { type: "matrix", data: {
        headers: ["Estimating software", "Supplement documentation tool"],
        rows: [
          { feature: "Prices line items from regional price lists", values: [true, "Not its job"] },
          { feature: "Builds the estimate adjusters compare against", values: [true, "Not its job"] },
          { feature: "Captures photos on the roof", values: ["Varies by product", true] },
          { feature: "Ties each photo to a finding and a note", values: ["Varies by product", true] },
          { feature: "Generates a report for the adjuster", values: ["Varies by product", true] },
          { feature: "Produces a starting line-item list", values: [true, "Export to review"] },
        ],
      }},
      4: { type: "steps", data: [
        { num: "1", title: "Capture on the roof", desc: "Photos, roof area, a short note and measurements, all in one place." },
        { num: "2", title: "Organize by finding", desc: "Each finding keeps its own photos and notes so nothing gets separated." },
        { num: "3", title: "Generate the report", desc: "A clear document for the adjuster showing every finding with its proof." },
        { num: "4", title: "Bring items into your estimate", desc: "Review the exported list and price it in your own estimating software." },
      ]},
      5: { type: "tip", data: { type: "info", title: "Check current features directly", text: "Products change often. Confirm what any tool does today on its vendor's site, and test it on one real job before you decide." } },
    },
    sections: [
      {
        heading: "What Xactimate is",
        content: "Xactimate is estimating software widely used by insurance carriers and by contractors who work insurance claims. It organizes repair work into line items with quantities, units and regional price lists, so an adjuster and a contractor can compare two estimates line by line.\n\nThe important idea is the shared format. When both sides are looking at the same structure, a disagreement becomes a specific question about one line, not a vague argument about the whole job.\n\nXactimate is made by Verisk. Check their product page for current features and pricing, because both change over time.",
      },
      {
        heading: "Who uses it and why it matters for supplements",
        content: "Adjusters typically build the original estimate in Xactimate. That means the original is already in a format with set item names, units and prices. When you send a supplement, the adjuster compares it against that original.\n\nThat is the reason supplements are easier to review when they follow the same structure. It is also the reason mistakes in units, quantities or price lists stand out quickly.\n\nYou do not always need to build a native Xactimate file. Many contractors submit a clear document that mirrors the line items. Requirements differ by carrier, so confirm what your adjuster accepts.",
      },
      {
        heading: "What Xactimate does well",
        content: "• Structured line items: Every task has a description, quantity, unit and price.\n• Regional pricing: Unit prices come from price lists for a location and date.\n• Shared language: Adjusters and contractors use the same item names.\n• Sketch and measurement tools: Roof area and components feed the quantities.\n\nThose strengths make it the standard place to build and price an estimate. They are not the same as capturing proof on the roof.",
      },
      {
        heading: "What it does not do for a supplement",
        content: "Pricing the work is one job. Proving the work is needed is another. The photos, measurements and written reasons behind each supplement item usually live somewhere else: a phone camera roll, a general photo app, a notes app and an email thread.\n\nThat gap is where supplements slow down. The office has to match photos to findings, rewrite the crew's notes into something an adjuster can follow and build a package from scratch each time.\n\nThe table below compares the two jobs. It describes categories, not specific products, so check each vendor's current features.",
      },
      {
        heading: "How a documentation tool fits alongside Xactimate",
        content: "A documentation tool sits next to your estimating software. It does not replace it. A simple workflow looks like this:\n\n1. The crew captures and labels findings on the roof.\n2. Notes and measurements stay attached to each photo.\n3. A report is generated for the adjuster.\n4. Line items are exported as a starting list that you review and price in your own tools.\n\n<a href='/roofing-supplement-software'>Supplement Snap</a> is built for that workflow. Its export is a starting list, not a finished estimate. You still decide what goes out. See <a href='/blog/xactimate-roofing-estimate-example'>an example layout</a> and the <a href='/roofing-supplement-report-example'>sample report</a> to see the output.",
      },
      {
        heading: "Questions to ask before adding another tool",
        content: "Use the same questions on every product you try:\n\n• Can my crew use it on a phone with weak signal?\n• Does it export something I can use in my estimate?\n• Will the adjuster understand the report without a call?\n• How does it handle photos, notes and measurements together?\n• What does it cost at my monthly volume?\n\nThen run one real job through it. Time the path from the first photo to a finished package and show the result to someone who was not on the roof. The tool that makes the clearest package fastest is usually the right one for you.",
      },
      {
        heading: "Estimate terms contractors run into",
        content: "A few terms come up on almost every claim. Definitions here are general, and carriers and policies handle them differently, so check your own claim documents.\n\n• Price list: The set of regional unit prices used to price line items, tied to a location and a date.\n• Line item: One task or material with a description, quantity, unit and price.\n• Unit of measure: SF is square feet, LF is linear feet, SQ is a square (100 square feet) and EA is each.\n• Waste factor: Extra material allowed for cuts and offcuts, usually shown as a percentage.\n• Replacement cost value (RCV): What it would cost to replace the item without subtracting depreciation.\n• Actual cash value (ACV): Generally replacement cost minus depreciation. How it is applied depends on the policy.\n• Overhead and profit (O&P): An allowance added in some cases when a general contractor coordinates the work. Whether it applies varies by carrier and claim.\n\nUnderstanding these helps you read the adjuster's estimate correctly, which is the first step to a supplement that lines up with it.",
      },
      {
        heading: "Common mistakes when using estimating software on a supplement",
        content: "These show up often when contractors start submitting supplements:\n\n• Rebuilding the whole estimate: Send only what is new or changed, clearly marked, not a new estimate that forces the adjuster to compare everything again.\n• Ignoring the original price list: Pricing new lines from a different list makes totals impossible to compare.\n• Treating the export as final: Any generated list should be checked line by line against your measurements and photos.\n• Skipping the narrative: A list of items with no explanation leaves the adjuster to guess why each one is needed.\n\nA short, factual note with each item, plus labeled photos, does more than extra formatting. See <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a> for the full workflow.",
      },
    ],
    faq: [
      {
        q: "Is Xactimate required to submit a roofing supplement?",
        a: "Not always. Many contractors submit a clear document that mirrors Xactimate line items. Requirements vary by carrier, so confirm with your adjuster.",
      },
      {
        q: "Does supplement software replace Xactimate?",
        a: "No. It helps capture and organize proof and can produce a starting line-item list. You still estimate and price in your own tools.",
      },
      {
        q: "Will using a documentation tool get my supplements approved?",
        a: "It can make your package clearer and more complete, but approval depends on the claim, the policy and the carrier.",
      },
      {
        q: "Where can I see current Xactimate pricing and features?",
        a: "On Verisk's Xactimate product page. Features and pricing change, so check there directly.",
      },
      {
        q: "Do I need Xactimate to use the Xactimate codes guide?",
        a: "No. The guide helps you name items and units correctly in a written supplement. Building a native Xactimate estimate requires the software.",
      },
    ],
    related: ["xactimate-codes-for-roofing-supplements", "xactimate-roofing-estimate-example", "roofing-software-comparison", "xactimate-roof-estimate-supplements"],
  },
  {
    slug: "roof-inspection-report-software",
    images: { 0: { src: "/blog/roof-inspection-report-software/card.png", alt: "Key points from the guide: Roof Inspection Report Software: What to Look For", width: 1200, height: 630 } },
    title: "Roof Inspection Report Software: What to Look For",
    metaTitle: "Roof Inspection Report Software: What to Look For",
    metaDescription: "What roof inspection report software should do: capture labeled photos, attach notes and produce a clear report. Features and how to compare tools.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    visuals: {
      2: { type: "checklist", data: { title: "Core features to look for", items: [
        { text: "Fast photo capture on a phone, including with weak signal", checked: true },
        { text: "Labels for roof area and finding type", checked: true },
        { text: "A note or voice note attached to each photo", checked: true },
        { text: "A report layout that shows each finding with its photos", checked: true },
        { text: "A way to send or share the finished report", checked: true },
        { text: "Data you can export, so your work is not locked in", checked: true },
      ]}},
      3: { type: "matrix", data: {
        headers: ["Main job"],
        rows: [
          { feature: "General job photo app", values: ["Capture and organize photos for many trades"] },
          { feature: "Inspection or report tool", values: ["Turn findings into a written report"] },
          { feature: "Aerial measurement service", values: ["Provide roof measurements from imagery"] },
          { feature: "Roofing CRM", values: ["Manage leads, jobs and customers"] },
          { feature: "Supplement documentation tool", values: ["Document hidden damage and prepare adjuster reports"] },
        ],
      }},
      4: { type: "steps", data: [
        { num: "1", title: "Pick one real job", desc: "Use a job with several findings, not a clean roof." },
        { num: "2", title: "Capture the same findings", desc: "Have the same person record the same conditions in each tool." },
        { num: "3", title: "Time the whole path", desc: "Measure from the first photo to a finished, sendable report." },
        { num: "4", title: "Get a second opinion", desc: "Show each report to someone who was not on the roof." },
      ]},
      6: { type: "tip", data: { type: "info", title: "Match the tool to the job", text: "A tool built for hidden-damage supplements is not the same as one built for sales inspections or aerial measurements. Decide your main job first." } },
    },
    sections: [
      {
        heading: "What roof inspection report software is for",
        content: "Roof inspection report software helps you record what you find on a roof and turn it into a document someone else can understand. The reader might be a homeowner deciding whether to repair, an insurance adjuster reviewing a claim or your own office preparing an estimate.\n\nThe core job is simple: capture, label, describe and report. Everything else is a bonus. Tools differ a lot in how they handle those four steps, and in what else they try to do.\n\nBefore comparing products, write down who reads your reports and what decision they make from them. That tells you what the report needs to show.",
      },
      {
        heading: "Who reads the report, and what each reader needs",
        content: "The same roof can need different reports:\n\n• Homeowner: Plain language, clear photos and a short explanation of what is wrong and why it matters.\n• Insurance adjuster: Findings with locations, measurements and photo proof, written factually so each item can be verified.\n• Your office: Enough detail to write an accurate estimate without calling the crew back.\n\nA report that tries to serve all three often serves none well. If your main need is documenting hidden damage for insurance claims, read <a href='/blog/roof-inspection-report'>how to write a roof inspection report</a> for the structure first.",
      },
      {
        heading: "Features that matter",
        content: "These are the features that decide whether a tool saves time on a real roof:\n\n• Capture speed: If it takes a minute to log one photo, the crew will skip it.\n• Labels: Roof area and finding type, so photos do not pile up unsorted.\n• Notes: A typed or spoken note attached to each photo, written at the time.\n• Report layout: Each finding shown with its photos and measurements in a clean order.\n• Sharing: Sending the report without leaving the app.\n• Export: Getting your data out in a usable form.\n\nTest the first two especially. A beautiful report layout does not help if the crew cannot capture data quickly.",
      },
      {
        heading: "Different kinds of tools do different jobs",
        content: "Roofing software is a crowded category, and the names overlap. It helps to separate the jobs. The table lists the main kinds of tools and what each is mainly built to do. Many products blend several, so check each vendor's current feature list.\n\nA common mistake is to compare a CRM against a documentation tool and conclude one is missing features. They solve different problems. Many roofing companies use more than one.",
      },
      {
        heading: "How to compare options fairly",
        content: "Do not decide from a demo. Run a real job through each tool and compare the result. Keep the test short and the same for every product.\n\nWhen you review the reports, look for the things an adjuster or homeowner would look for: can I tell what each photo shows, where it is on the roof and why it matters? If you have to explain the report out loud, it is not clear enough.\n\nAlso compare the cost at your volume, not the headline price. A tool that charges per user or per report can look very different at ten jobs a month than at a hundred.",
      },
      {
        heading: "What a good finished report includes",
        content: "Whatever tool you use, a strong inspection report has the same bones:\n\n• Property and claim details: Address, date, carrier and claim number if relevant.\n• Findings by roof area: Slope, valley, chimney, eave and so on.\n• Labeled photos: Wide and close-up, with a scale where size matters.\n• Measurements: Area, length or count for each finding.\n• A short factual note: What was observed, without guessing at coverage.\n\nBefore sending, run the report against the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> and the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a>.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> is built for roofing contractors who document hidden damage found at tear-off and prepare supplement reports for adjusters. If your main need is a general sales inspection or aerial measurement, check whether it matches your workflow first.\n\nYou can see the output in the <a href='/roofing-supplement-report-example'>sample report</a>, and compare approaches in <a href='/blog/roofing-software-comparison'>roofing software for contractors</a>. Software organizes your evidence and saves time. It cannot guarantee that a claim is approved.",
      },
      {
        heading: "Mistakes to avoid with inspection reports",
        content: "Whatever tool you use, the same errors make reports less useful:\n\n• Photos without context: A close-up with no wide shot leaves the reader unsure where it is.\n• No scale: Without a tape measure or known object, size is a guess.\n• Opinions as facts: Writing that something was caused by a storm, when you only observed the condition, invites disagreement.\n• Editing originals: Keep the original photos untouched and work from copies if you crop or annotate.\n• Inconsistent labels: Calling the same area a different name in each photo makes the report hard to follow.\n\nA short, consistent routine on every job beats a clever tool used inconsistently.",
      },
      {
        heading: "Questions to ask any vendor",
        content: "Use the same list for every product you evaluate:\n\n• What happens when there is no signal on the roof, and how does data sync later?\n• Can I add a spoken note to a photo, and is it turned into text?\n• What does the finished report look like to someone who does not use the app?\n• Can I export my photos and data if I leave?\n• How is pricing structured: per user, per report or per job?\n• Where is my data stored, and who can see it?\n\nA vendor who answers these plainly and lets you test on a real job is usually one worth trusting. Ask for a trial with your own data, not a prepared demo.",
      },
    ],
    faq: [
      {
        q: "What should a roof inspection report include?",
        a: "Property and claim details, labeled photos, findings by roof area, measurements and a short factual description of each condition.",
      },
      {
        q: "Do I need software to write an inspection report?",
        a: "No. A consistent photo and notes routine works. Software mainly saves time matching photos to findings and building the report.",
      },
      {
        q: "Can inspection software replace an aerial measurement report?",
        a: "Usually not. Aerial measurement reports come from separate services, and tools differ in what they support. Check each vendor.",
      },
      {
        q: "How do I know if a report is clear enough?",
        a: "Show it to someone who was not on the roof. If they can tell what each photo shows and where it is without asking you, it is clear.",
      },
      {
        q: "Is roof inspection software the same as a roofing CRM?",
        a: "No. A CRM manages leads, jobs and customers. Inspection and documentation tools focus on capturing findings and producing reports.",
      },
    ],
    related: ["roof-inspection-report", "roofing-photo-documentation-checklist", "roofing-software-comparison", "xactimate-roofing-software-explained", "supplement-snap-vs-roof-report-pro"],
  },
  {
    slug: "roofing-supplement-follow-up-log",
    images: { 0: { src: "/blog/roofing-supplement-follow-up-log/card.png", alt: "Key points from the guide: Roofing Supplement Follow-Up Log: Track Submissions and Adjuster Responses", width: 1200, height: 630 } },
    downloads: "roofing-supplement-tracker",
    title: "Roofing Supplement Follow-Up Log: Track Submissions and Adjuster Responses",
    metaTitle: "Roofing Supplement Follow-Up Log (Free Template)",
    metaDescription: "A simple roofing supplement follow-up log: the columns to track, status definitions, a follow-up routine and how to learn from adjuster responses.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Why it matters"],
        rows: [
          { feature: "Job and address", values: ["Tells you which roof this is"] },
          { feature: "Carrier and claim number", values: ["Lets you find the claim quickly on a call"] },
          { feature: "Adjuster name and contact", values: ["Who to follow up with"] },
          { feature: "Date submitted and method", values: ["Starts the clock and proves it was sent"] },
          { feature: "Items and amount requested", values: ["What you asked for, in short"] },
          { feature: "Last contact and what was said", values: ["Prevents repeating yourself"] },
          { feature: "Next follow-up date", values: ["The column that stops claims from slipping"] },
          { feature: "Outcome and date", values: ["Builds your history over time"] },
        ],
      }},
      3: { type: "steps", data: [
        { num: "1", title: "Log it the day you send it", desc: "Record the date, method and what you requested while it is fresh." },
        { num: "2", title: "Set the next follow-up date", desc: "Do it right away, before the claim leaves your mind." },
        { num: "3", title: "Note every contact", desc: "Date, who you spoke to and what was said or promised." },
        { num: "4", title: "Answer requests quickly", desc: "If the adjuster asks for more, add it to the log and respond promptly." },
        { num: "5", title: "Record the outcome", desc: "Include partial approvals and the reason for any denial." },
      ]},
      5: { type: "tip", data: { type: "tip", title: "Write down the reason, not just the result", text: "A denial with no reason recorded teaches you nothing. A denial with the stated reason shows which documentation to strengthen next time." } },
    },
    sections: [
      {
        heading: "Why a follow-up log matters",
        content: "A supplement is not finished when you send it. It can sit unanswered, come back with a request for more information or be partly approved. Without a record, the follow-up depends on memory, and requests get missed.\n\nA simple log keeps every open supplement visible and gives you a short answer when someone asks where a claim stands. It also builds a history you can learn from, which is where it starts to pay off.\n\nYou do not need special software for this. A spreadsheet is enough to start. What matters is that you use it every time.",
      },
      {
        heading: "What to track for each supplement",
        content: "Copy these columns into a spreadsheet. The table shows why each one is there:\n\n• Job and address\n• Carrier and claim number\n• Adjuster name and contact\n• Date submitted and method\n• Items requested and the amount\n• Date of last contact and what was said\n• Next follow-up date\n• Outcome and date\n\nKeep entries short. The goal is to find the status in seconds, not to write a diary.",
      },
      {
        heading: "Use clear status labels",
        content: "Pick a small set of statuses and use them the same way every time. A common set is:\n\n• Submitted: Sent, waiting for a response.\n• Information requested: The adjuster asked for more. Note what.\n• Under review: Acknowledged, no decision yet.\n• Partially approved: Some items accepted. Note which.\n• Approved: Accepted as requested.\n• Denied: Declined. Record the reason given.\n• Resubmitted: Sent again with more documentation.\n\nA filter on this column shows everything waiting on you versus everything waiting on the carrier.",
      },
      {
        heading: "A follow-up routine that works",
        content: "The routine is short. What makes it work is doing it every time, not doing it perfectly.\n\nHow long to wait before following up varies by carrier and by claim, so use the carrier's stated timeline if you have one and your own experience if you do not. The date matters less than having one at all.",
      },
      {
        heading: "What to say when you follow up",
        content: "Keep the message short and specific, and reference the claim number so it is easy to find:\n\nExample (fictional): Following up on the supplement submitted on the date in my log for claim number [number], property at [address]. The package included photos, measurements and notes for each item. Please let me know if you need anything further to complete the review.\n\nIt is polite, specific and easy to answer. Record the date you sent it and any reply in the log.",
      },
      {
        heading: "What the log teaches you over time",
        content: "After a few months of entries, patterns show up that no single claim reveals:\n\n• Which carriers ask for more information, and what they ask for.\n• Which items get questioned most often.\n• How long different carriers usually take to respond.\n• Which kinds of documentation lead to fewer follow-up requests.\n\nUse that to improve your packages. For the packages themselves, start with the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> and the <a href='/blog/roofing-supplement-template'>supplement template</a>. If a supplement is denied, see <a href='/blog/roofing-supplement-denied-what-to-do'>what to do next</a>.",
      },
      {
        heading: "When a spreadsheet is not enough",
        content: "A spreadsheet works for a handful of open claims and one person managing them. It gets harder when several people touch the same claim, when photos and reports live in different places or when you want the status and the documents together.\n\nThat is when <a href='/roofing-supplement-software'>supplement software</a> may be worth testing. Compare the two approaches in <a href='/roofing-supplement-software-vs-spreadsheets'>software vs. spreadsheets</a>. No tracking method can guarantee approval. That depends on the claim, the policy and the carrier. To understand the basics first, read <a href='/blog/supplemental-roofing-estimate-explained'>what a supplemental roofing estimate is</a>.",
      },
      {
        heading: "A sample log (fictional)",
        content: "Here is what three rows might look like. Every detail is made up to show the structure.\n\n• Row 1: Maple St job. Carrier A, claim number ending 4410. Submitted by email on the logged date. Requested sheathing, flashing and pipe jacks. Adjuster asked for the pipe jack photos to be resent. Next follow-up date set. Status: Information requested.\n• Row 2: Oak Ave job. Carrier B. Submitted through the carrier portal. Requested ice and water barrier and drip edge. Partial approval received, drip edge accepted. Status: Partially approved, note which item was declined and why.\n• Row 3: Pine Rd job. Carrier A. Submitted and acknowledged, no decision yet. Next follow-up date is on the calendar. Status: Under review.\n\nNotice that each row tells you the status and the next action at a glance.",
      },
      {
        heading: "Handling partial approvals and denials",
        content: "Not every supplement comes back as a simple yes or no. Partial approvals and denials are normal, and the log is where you handle them calmly instead of from memory.\n\nFor a partial approval, record which items were accepted and which were not, and the reason given for each. Decide whether to resubmit the declined items with stronger proof or accept the result.\n\nFor a denial, read the stated reason carefully, then compare it against your documentation. Often the fix is a clearer photo, a missing measurement or a more specific description. If you resubmit, send a complete package, not just a reply. The steps are laid out in <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a supplement is denied</a>. Keep a note in the log of what you changed, so you can see over time which fixes work.",
      },
    ],
    faq: [
      {
        q: "How often should I follow up on a roofing supplement?",
        a: "It depends on the carrier and the claim. Set a follow-up date when you submit, then adjust based on how that carrier usually responds.",
      },
      {
        q: "What should I record when the adjuster responds?",
        a: "The date, what was approved or questioned, anything requested, and your next step with a date.",
      },
      {
        q: "Should I track denied supplements too?",
        a: "Yes. Record the reason given. Patterns in denials show which documentation to strengthen.",
      },
      {
        q: "Do I need software to track supplements?",
        a: "No. A spreadsheet is enough for a small number of claims. Software helps when several people work the same claims or you want documents and status together.",
      },
      {
        q: "What if the adjuster does not respond?",
        a: "Follow up in writing with the claim number, note the date in your log and keep a copy. If it continues, ask who else at the carrier can help.",
      },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["roofing-supplement-tracker-template", "roofing-supplement-email-to-adjuster", "how-long-does-a-roofing-supplement-take", "roofing-supplement-denied-what-to-do", "roofing-supplement-template", "supplemental-roofing-estimate-explained", "roofing-photo-documentation-checklist"],
  },
  {
    slug: "how-insurance-adjusters-determine-roof-damage",
    images: { 0: { src: "/blog/how-insurance-adjusters-determine-roof-damage/card.png", alt: "Key points from the guide: How Insurance Adjusters Determine Roof Damage (and What Documentation Helps)", width: 1200, height: 630 } },
    downloads: "roof-damage-report-template",
    title: "How Insurance Adjusters Determine Roof Damage (and What Documentation Helps)",
    metaTitle: "How Adjusters Determine Roof Damage | Supplement Snap",
    metaDescription: "How insurance adjusters evaluate roof damage: the inspection, what they look for, how estimates are built and what documentation makes a claim easier to review.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "NRCA: National Roofing Contractors Association", url: "https://www.nrca.net" },
      { text: "IBHS: Insurance Institute for Business & Home Safety", url: "https://ibhs.org" },
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
    ],
    visuals: {
      1: { type: "steps", data: [
        { num: "1", title: "Review the claim and policy", desc: "The adjuster checks the date of loss, the reported cause and what the policy covers." },
        { num: "2", title: "Inspect the roof and property", desc: "On the roof when safe, or with drone or aerial imagery. Photos and measurements are taken." },
        { num: "3", title: "Identify and measure damage", desc: "Damage is tied to the covered cause of loss and recorded by slope and component." },
        { num: "4", title: "Build the estimate", desc: "Line items, quantities and regional pricing are written up, often in estimating software." },
        { num: "5", title: "Apply policy terms and issue a decision", desc: "Deductible, depreciation and coverage limits are applied and the carrier communicates the result." },
      ]},
      2: { type: "checklist", data: { title: "What adjusters commonly look at on a roof", items: [
        { text: "Roof covering: missing, cracked, creased or lifted shingles", checked: true },
        { text: "Hail impacts and granule loss, compared across slopes", checked: true },
        { text: "Flashing, vents, pipe boots and other penetrations", checked: true },
        { text: "Soft metals such as vents, gutters and drip edge for dents", checked: true },
        { text: "Roof age, wear and general condition", checked: true },
        { text: "Interior evidence of leaks, where relevant to the claim", checked: true },
      ]}},
      3: { type: "tip", data: { type: "info", title: "Rules vary by carrier and policy", text: "Inspection methods, hail thresholds and how depreciation is applied differ between insurers and policies. Use this guide for the general picture and confirm specifics with the claim documents." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Insurance adjusters determine roof damage by inspecting the roof, identifying damage that matches the reported cause of loss, measuring it, and then pricing the repair using line items and regional prices. The result is then adjusted for the policy: the deductible, depreciation and any coverage limits.\n\nIn practice, the adjuster is answering three questions. Is there damage? Was it caused by a covered event? What does it cost to repair or replace? Everything you document should help answer one of those questions clearly.\n\nThis guide explains how the process generally works and what contractors can do to make a claim easier to review. It is general information, not legal or insurance advice, and details differ by carrier, policy and state.",
      },
      {
        heading: "How the adjuster's evaluation usually runs",
        content: "The sequence below is typical, though carriers differ and some steps may be done remotely. The adjuster does not decide in the driveway. They gather evidence, build an estimate and then apply the policy.\n\nA contractor's role is to supply accurate, well-organized information alongside that process, not to replace the adjuster's judgment. The more clearly your findings are presented, the faster the review tends to go.",
      },
      {
        heading: "What adjusters look for on the roof",
        content: "The specific signs depend on the cause of loss. For wind, adjusters look for missing, creased or lifted shingles. For hail, they look for impact marks and granule loss and compare slopes. Across all claims they check penetrations and flashing, and they note the age and general condition of the roofing system.\n\nTwo concepts come up often:\n\n• Test squares: In hail claims, some carriers evaluate a representative section of each slope and count impacts within it. The threshold for what counts as functional damage varies by carrier and guideline.\n• Collateral damage: Dents in soft metals, such as vents, gutters and flashing, can help show that a hail event reached the property.\n\nThe adjuster also separates storm damage from wear and age. That distinction is one of the most common sources of disagreement, which is why clear photos and honest descriptions matter.",
      },
      {
        heading: "How the estimate is built",
        content: "After the inspection, the adjuster turns findings into an estimate made of line items. Each line has a description, a quantity, a unit and a price from a regional price list, usually built in estimating software such as Xactimate.\n\nThe estimate then goes through the policy:\n\n• Deductible: The amount the policyholder pays first.\n• Depreciation: Some policies pay actual cash value first, which accounts for the age and condition of materials, and release more after the work is done. Others pay replacement cost. It depends on the policy.\n• Limits and exclusions: Coverage may be limited for certain causes or components.\n\nIf you want to see what these line items look like, read the <a href='/blog/xactimate-roofing-estimate-example'>Xactimate roofing estimate example</a> and the <a href='/blog/xactimate-codes-for-roofing-supplements'>Xactimate roofing supplement list</a>.",
      },
      {
        heading: "Why the first estimate is often incomplete",
        content: "The first estimate is based on what can be seen from the surface and in imagery. Decking, underlayment and flashing conditions beneath the shingles are not visible until tear-off. That is why supplements exist: they request additional costs for conditions found once the work begins.\n\nThis is normal and not a sign that anyone acted improperly. It does mean the contractor needs proof, because the adjuster was not on the roof when the old materials came off. For the basics, read <a href='/blog/supplemental-roofing-estimate-explained'>what a supplemental roofing estimate is</a>.",
      },
      {
        heading: "What documentation makes review easier",
        content: "Adjusters work through many claims. A package that is easy to verify gets reviewed faster and generates fewer follow-up questions. These habits help:\n\n• Wide and close-up photos: Show where the damage is on the roof, then the condition itself.\n• Labels: Roof area and what the photo shows, so nothing is ambiguous.\n• Measurements: A scale in frame and quantities that match your notes.\n• Factual notes: What was observed, where and how much, without guessing at coverage.\n• Timing: Photos taken before concealed conditions are covered again.\n• Organization: Findings grouped by roof area, with photos beside each one.\n\nThe <a href='/free-roofing-supplement-checklist'>free roofing supplement checklist</a> covers all of this in a printable form, and the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a> goes deeper on what to photograph.",
      },
      {
        heading: "What to avoid when working with an adjuster",
        content: "These approaches tend to slow claims or erode trust:\n\n• Overstating damage: Describing normal wear as storm damage invites a hard look at everything else you submit.\n• Guessing at cause or coverage: Stick to what you can see and measure. Coverage decisions belong to the carrier.\n• Missing proof: A line item with no photo or measurement gives the adjuster nothing to verify.\n• Slow responses: When a carrier asks for more information, answer promptly and keep a record.\n\nTracking each request helps. See the <a href='/blog/roofing-supplement-follow-up-log'>roofing supplement follow-up log</a> for a simple way to do it.",
      },
      {
        heading: "Should the roofer be there for the adjuster's inspection?",
        content: "Many contractors attend the inspection when the homeowner asks them to, because they can point out damage and answer questions about the roof. Whether and how that works is up to the homeowner, the policy and the carrier, so ask the adjuster in advance.\n\nTwo cautions. First, rules differ by state, and some restrict what a contractor may do on a homeowner's behalf, such as negotiating or advocating for the claim, because that can fall under public adjuster licensing. Check what is allowed where you work. Second, stick to facts you can show: what you saw, where it is, and photos. Do not guess at cause or promise the homeowner an outcome.\n\nThis is general guidance, not legal advice.",
      },
      {
        heading: "How Supplement Snap helps contractors present findings",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps crews capture photos, roof areas, notes and measurements while they are on the roof, and organizes them into a report for the adjuster. It does not decide coverage or guarantee approval. It gives the adjuster a clearer package to review. You can preview the output in the <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
    ],
    faq: [
      {
        q: "How do insurance adjusters determine roof damage?",
        a: "They inspect the roof, identify damage consistent with the reported cause of loss, measure it and price the repair with line items. The policy terms, such as deductible and depreciation, are then applied.",
      },
      {
        q: "What is a test square in a roof inspection?",
        a: "A test square is a representative section of a roof slope used in some hail evaluations. Impacts within it are counted, and each carrier uses its own thresholds.",
      },
      {
        q: "Can an adjuster inspect a roof without going on it?",
        a: "Sometimes. Some carriers use drone or aerial imagery, depending on the roof, the claim and company guidelines.",
      },
      {
        q: "Why does the adjuster's estimate sometimes miss damage?",
        a: "Conditions under the shingles, such as damaged decking or flashing, cannot be seen until tear-off. Contractors request those items through a supplement with supporting documentation.",
      },
      {
        q: "Should a roofer be present with an insurance adjuster?",
        a: "Many contractors attend when the homeowner asks them to, to point out damage and answer roof questions. Rules vary by state, and some limit what a contractor may do for the homeowner on the claim, so check what is allowed where you work.",
      },
      {
        q: "Does good documentation guarantee a claim is approved?",
        a: "No. Coverage and approval depend on the claim, the policy and the carrier. Good documentation helps the adjuster verify what was found.",
      },
    ],
    related: ["roofing-adjuster-inspection-what-to-bring", "roof-claim-reinspection-request", "supplemental-roofing-estimate-explained", "hail-damage-roof-inspection", "roofing-photo-documentation-checklist", "roof-tear-off-vs-overlay"],
  },
  {
    slug: "what-is-the-25-percent-rule-for-roofing",
    title: "What Is the 25% Rule for Roofing? It Depends on Where You Are",
    metaTitle: "What Is the 25% Rule for Roofing? | Supplement Snap",
    metaDescription: "The 25% rule for roofing: what it generally means, why it varies by jurisdiction and code edition, and how contractors should handle it on insurance claims.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-26",
    externalLinks: [
      { text: "International Code Council (ICC)", url: "https://www.iccsafe.org" },
      { text: "NRCA: National Roofing Contractors Association", url: "https://www.nrca.net" },
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
    ],
    visuals: {
      1: { type: "compare", data: {
        before: { label: "Building code rule (if adopted)", items: ["Set by the jurisdiction's building code", "Enforced by the local building department", "Concerns what work is required when repairing a roof", "Can differ by city, county, state and code edition"] },
        after: { label: "Insurance coverage", items: ["Set by the policy and the carrier", "Decided during the claim", "Concerns what the insurer pays for", "May involve Ordinance or Law coverage for code-required work"] },
      }},
      3: { type: "steps", data: [
        { num: "1", title: "Find out which code applies", desc: "Ask the local building department which code edition and amendments are in force." },
        { num: "2", title: "Ask how repairs are treated", desc: "Confirm whether a repair threshold applies and how the roof area is measured." },
        { num: "3", title: "Document the scope", desc: "Record the repair area on each slope and the date of the work." },
        { num: "4", title: "Raise it with the adjuster early", desc: "If code-required work is involved, share the source so it can be reviewed." },
      ]},
      4: { type: "tip", data: { type: "warning", title: "Never assume it applies", text: "Many places have no 25% rule at all. Quoting a rule that does not exist in your jurisdiction can cost you credibility with an adjuster or a homeowner. Always confirm locally." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "The 25% rule for roofing is a rule of thumb that comes from some local building codes. In general terms, it says that if more than about 25% of a roof is repaired or replaced within a set period, often 12 months, the whole roof may need to be brought up to current code.\n\nThe most important thing to know is that it is not a universal rule. It is not a national law, and many jurisdictions do not have it. Where it exists, its exact wording, its time window and its exceptions depend on the code edition and any local amendments. Some places have changed or removed it over time.\n\nThis article is general information, not legal advice. Always confirm with your local building department before you rely on it.",
      },
      {
        heading: "A building code rule, not an insurance rule",
        content: "People often mix up two separate things. A 25% rule, where it applies, is a building code matter. The local building department enforces it. Insurance coverage is a different question, decided by the policy and the carrier.\n\nThat difference explains a common source of confusion. A code may require more work than an insurance estimate originally included. Whether the insurer pays for that extra work depends on the policy, for example whether it includes coverage often called Ordinance or Law, which can address the added cost of meeting code. Policies differ, so read the actual policy.\n\nThe comparison below separates the two.",
      },
      {
        heading: "Why it varies so much",
        content: "Several things make the rule different from place to place:\n\n• Code edition: Jurisdictions adopt model codes on different schedules, and later editions may change the language.\n• Local amendments: Cities, counties and states can modify the model code.\n• Roof age and type: Some versions treat newer roofs differently from older ones.\n• Definition of repair: What counts as part of the 25% and how it is measured can differ.\n• Enforcement: How strictly a building department applies it can vary.\n\nBecause of that, two roofers in two nearby towns can honestly give different answers. The right source is always the local building department for the address in question.",
      },
      {
        heading: "How contractors should handle it",
        content: "If a job might involve a repair threshold, the safest approach is a short, repeatable routine rather than relying on memory or a forum post.\n\nWhen you bring it to an adjuster, cite the actual source: the code section and the building department's confirmation, if you have it. A specific reference is far more useful than saying a rule exists. This is the same discipline that applies to any code-based item on a supplement. For related items, see <a href='/blog/roofing-code-upgrades-ordinance-and-law'>code upgrades and Ordinance and Law coverage</a>.",
      },
      {
        heading: "Common misunderstandings",
        content: "These come up often and are worth avoiding:\n\n• It applies everywhere: It does not. Many jurisdictions have no such rule.\n• It means insurance must replace the whole roof: Not by itself. Payment depends on the policy and the claim.\n• The percentage is always 25%: Thresholds and wording differ by code.\n• It works the same for every roof: Roof age, type and the time window can all matter.\n• A contractor can decide: Only the local building authority can say how it applies at a given address.\n\nIf you are unsure, say so, and send the question to the building department.",
      },
      {
        heading: "How to document it on a claim",
        content: "If code-required work is involved, treat it like any other supplement item: show the condition, the requirement and the proof.\n\n• Photograph the existing roof and the areas being repaired.\n• Measure the repair area and record it by slope.\n• Note the date work began and the area completed.\n• Attach or reference the code section and any written confirmation from the building department.\n• Keep the description factual and short.\n\nThe <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> and the <a href='/blog/roofing-supplement-template'>supplement template</a> help keep that package organized. No documentation can guarantee a result, because coverage depends on the claim, the policy and the carrier.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps crews capture photos, areas and notes on the roof and turn them into an organized report. If a local code requirement affects the job, the report is where you attach the measurements and the proof. The tool does not decide whether a rule applies. That still comes from your local authority and the carrier.",
      },
      {
        heading: "Illustrative scenarios",
        content: "These examples are fictional and simplified. They show why the same repair can lead to different outcomes depending on the local rules. Do not treat them as advice for any real property.\n\nScenario one: A jurisdiction has adopted a repair threshold. A storm damages part of one slope, and the repair covers a small portion of the roof. The work stays under the threshold, so the rest of the roof is not affected by that rule.\n\nScenario two: The same jurisdiction, but damage spans several slopes. The repair area adds up to more than the threshold within the stated period. The building department may require the roof covering to meet current code for the whole roof.\n\nScenario three: A different jurisdiction has no repair threshold at all. The same repairs are permitted without the code requirement in scenario two.\n\nThe lesson is not to memorize a number. It is to ask which rule applies at the address, and to document the repair area carefully so the answer can be applied accurately.",
      },
      {
        heading: "Questions to ask the building department",
        content: "A short call or email to the local building department can settle most uncertainty. Useful questions:\n\n• Which code edition and local amendments apply to this address today?\n• Is there a threshold for repairs that triggers work on the rest of the roof?\n• How is the repair area measured, and over what period?\n• Does the answer depend on roof age or roof type?\n• Is a permit required for this scope of work?\n• Can you confirm that in writing or point me to the code section?\n\nRecord the name, date and answer. If code-required work becomes part of a supplement, that record is exactly what an adjuster needs to evaluate it.",
      },
    ],
    faq: [
      {
        q: "What is the 25% rule for roofing?",
        a: "It is a rule found in some local building codes: if more than about 25% of a roof is repaired or replaced within a set period, the entire roof may need to meet current code. Not every jurisdiction has it.",
      },
      {
        q: "Is the 25% rule a national law?",
        a: "No. Building codes are adopted locally, and wording and thresholds differ. Some places have no such rule, and others have changed it.",
      },
      {
        q: "Does the 25% rule mean insurance has to replace my whole roof?",
        a: "Not by itself. The rule is a building code matter. Whether insurance pays depends on the policy, including any coverage for code-required work, and on the carrier's decision.",
      },
      {
        q: "Who decides whether the 25% rule applies?",
        a: "The local building department for the property. Ask them which code edition and amendments are in force.",
      },
      {
        q: "How should a contractor raise it with an adjuster?",
        a: "Cite the specific code section and, if possible, written confirmation from the building department, along with photos and measurements of the repair area.",
      },
      {
        q: "What is a 25% roof slope?",
        a: "That is a different meaning of 25%. Slope is how steep a roof is: rise divided by run. A 25% slope rises 25 units for every 100 units of run, which is the same as a 3-in-12 pitch (about 14 degrees). It has nothing to do with the 25% repair rule.",
      },
      {
        q: "Does the 25% rule for roofing work the same in Texas or Florida?",
        a: "We cannot state the current rule for either state, and it should not be assumed. Building codes are adopted and amended locally, and editions change, so the answer depends on the city or county where the roof is. Ask the local building department which code edition and amendments apply to the address.",
      },
    ],
    related: ["roofing-code-upgrades-ordinance-and-law", "how-insurance-adjusters-determine-roof-damage", "roofing-supplement-template", "roof-replacement-estimate-vs-final-cost"],
  },
  {
    slug: "roof-damage-report-template",
    images: { 0: { src: "/blog/roof-damage-report-template/card.png", alt: "Key points from the guide: Roof Damage Report Template: Sections, Example and Checklist", width: 1200, height: 630 } },
    title: "Roof Damage Report Template: Sections, Example and Checklist",
    metaTitle: "Roof Damage Report Template (Free, Copyable)",
    metaDescription: "A copyable roof damage report template with the sections to include, a sample finding, a photo checklist and the mistakes that make reports hard to use.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NRCA: National Roofing Contractors Association", url: "https://www.nrca.net" },
      { text: "IBHS: Insurance Institute for Business & Home Safety", url: "https://ibhs.org" },
    ],
    visuals: {
      1: { type: "steps", data: [
        { num: "1", title: "Job and claim details", desc: "Address, date, inspector, carrier, claim number and date of loss if there is one." },
        { num: "2", title: "Roof summary", desc: "Roof type, approximate age, number of layers, slopes and general condition." },
        { num: "3", title: "Findings by roof area", desc: "Each finding with its location, description, measurement and photos." },
        { num: "4", title: "Recommendations and scope", desc: "What work is proposed, stated plainly and tied to the findings." },
        { num: "5", title: "Photo index and attachments", desc: "A numbered list of photos plus any measurement reports or documents." },
      ]},
      3: { type: "checklist", data: { title: "Photo checklist for a damage report", items: [
        { text: "Front, rear and side overview of the property", checked: true },
        { text: "Each roof slope, labeled by direction or name", checked: true },
        { text: "Close-ups of each finding with a scale in frame", checked: true },
        { text: "Flashing, vents, pipe boots and valleys", checked: true },
        { text: "Collateral items such as gutters or soft metals, where relevant", checked: true },
        { text: "Any condition found under the shingles at tear-off", checked: true },
      ]}},
      4: { type: "tip", data: { type: "tip", title: "Write what you saw, not what you assume", text: "A finding like 'three cracked shingles on the rear slope near the valley' is verifiable. A finding like 'storm damage throughout' is not. Specific beats sweeping every time." } },
    },
    sections: [
      {
        heading: "What a roof damage report is",
        content: "A roof damage report is a written record of the conditions found on a roof, supported by photos and measurements. It is used by homeowners to understand a problem, by insurance adjusters to review a claim and by contractors to scope and price the work.\n\nThe best reports are short, specific and easy to verify. Someone who was not on the roof should be able to understand what you found, where it is and why it matters without calling you.\n\nBelow is a template you can copy, a sample finding and a checklist for the photos. It is general guidance. Add whatever your carrier, client or jurisdiction requires.",
      },
      {
        heading: "The sections to include",
        content: "A complete report follows a predictable order. Each section has a clear job, and together they let the reader move from the big picture to the details.\n\nKeep the headings the same on every report. Consistency makes your reports faster to write and easier for others to read, and it helps you notice when something is missing.",
      },
      {
        heading: "Copyable template",
        content: "Copy the structure below into a document or spreadsheet and fill it in for each job.\n\nJob details: Property address. Date of inspection. Inspector name. Client name. Carrier, claim number and date of loss, if applicable.\n\nRoof summary: Roof type and material. Approximate age if known. Number of layers. Number of slopes and pitch. General condition in one or two sentences.\n\nFindings (repeat for each): Finding number. Roof area or slope. What was observed. Measurement or count. Photo numbers. Why it matters, stated factually.\n\nRecommendations: Proposed repair or replacement scope, tied to the numbered findings.\n\nPhoto index: Each photo number with its roof area and a short description.\n\nAttachments: Aerial or manual measurement report, estimate, invoices or other supporting documents.",
      },
      {
        heading: "Photo checklist",
        content: "Photos carry most of the weight in a damage report. The checklist covers the shots that make a report clear. Take wide shots first, then close-ups, and keep your labels consistent.\n\nFor a deeper guide to what to photograph and when, read the <a href='/blog/roofing-photo-documentation-checklist'>roofing photo documentation checklist</a>. For organizing the files afterward, see <a href='/blog/organize-roofing-supplement-photos-by-claim'>how to organize photos by claim and roof area</a>.",
      },
      {
        heading: "A sample finding (fictional)",
        content: "Here is one finding written in the style that works:\n\nFinding 3. Rear slope, along the eave. Four sheets of roof decking were soft and deteriorated when walked, found after removing existing shingles and underlayment. Approximately 128 square feet affected. Photos 14 to 19. The condition was not visible from the surface before tear-off.\n\nNotice the order: location, observation, quantity, photo reference and a factual note on why it was not seen earlier. It does not guess at the cause or argue about coverage. If you are documenting rotted decking specifically, see <a href='/blog/document-rotted-roof-decking-tear-off'>how to document rotted roof decking</a>.",
      },
      {
        heading: "Mistakes that make reports hard to use",
        content: "These are the issues that most often make a report less useful:\n\n• No location: A finding that does not say where on the roof it is forces the reader to guess.\n• Photos without context: A close-up with no wide shot is hard to place.\n• No scale: Without a tape measure or known object, size is a guess.\n• Sweeping statements: Phrases like damage throughout invite doubt.\n• Mismatched numbers: Notes, photos and totals that disagree reduce trust in everything else.\n• Opinions presented as facts: Cause and coverage are for others to decide.\n\nBefore you send, run the finished report through the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a>.",
      },
      {
        heading: "Turning the template into a faster workflow",
        content: "Writing this by hand works, but it takes time to match photos to notes and build a clean document each time. <a href='/roofing-supplement-software'>Supplement Snap</a> follows the same structure: the crew captures photos, tags the roof area and adds a note on the roof, and the report is assembled for you to review. See the <a href='/roofing-supplement-report-example'>sample supplement report</a> to compare it with the template above.\n\nSoftware makes reports faster and more consistent. It does not guarantee that a claim is approved. Coverage and approval depend on the claim, the policy and the carrier.",
      },
      {
        heading: "How to write the recommendations section",
        content: "The recommendations section answers one question: given these findings, what work do you propose? Keep it tied to the numbered findings so nothing floats free.\n\nA clear recommendation names the work, the area and the finding it addresses. For example: Replace damaged decking, rear slope, 128 square feet (Finding 3). Replace failed step flashing at the sidewall, 24 linear feet (Finding 5).\n\nTwo habits keep this section trustworthy. First, do not recommend work you cannot point to a finding for. Second, separate what is clearly needed from what is optional, so the reader can see the difference.",
      },
      {
        heading: "Adapting the report for different readers",
        content: "The same findings can be presented differently depending on who will read the report:\n\n• Homeowner: Use plain language, explain why each finding matters in a sentence and keep the photo selection tight.\n• Insurance adjuster: Lead with location, quantity and photo references. Keep the tone factual and avoid opinions about coverage.\n• Your office: Include everything needed to write an accurate estimate without calling the crew, including measurements and any access or safety notes.\n\nYou do not need three separate reports. Keep one set of findings, and change the summary and emphasis for each reader. If the report is for an insurance claim, the <a href='/blog/how-insurance-adjusters-determine-roof-damage'>guide to how adjusters evaluate roof damage</a> explains what they tend to look for.",
      },
    ],
    faq: [
      {
        q: "What should a roof damage report include?",
        a: "Job and claim details, a roof summary, findings by roof area with measurements and photos, recommended scope, a photo index and any supporting documents.",
      },
      {
        q: "How long should a roof damage report be?",
        a: "As long as it needs to be to be clear. Short, specific findings with labeled photos are better than long general descriptions.",
      },
      {
        q: "Do I need special software to write one?",
        a: "No. A document or spreadsheet using a consistent template works. Software mainly saves time matching photos and notes and building the report.",
      },
      {
        q: "Should I state the cause of the damage?",
        a: "Stick to what you observed and measured. Cause and coverage are decided by others, and speculation can hurt your credibility.",
      },
      {
        q: "Will a good report guarantee an insurance claim is approved?",
        a: "No. A clear report helps the reviewer verify what you found, but approval depends on the claim, the policy and the carrier.",
      },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    downloads: "roof-damage-report-template",
    related: ["roofing-photo-documentation-checklist", "roof-inspection-report", "roofing-supplement-template", "document-rotted-roof-decking-tear-off"],
  },
  {
    slug: "how-roofing-contractors-work-insurance-claims",
    images: { 0: { src: "/blog/how-roofing-contractors-work-insurance-claims/card.png", alt: "Key points from the guide: How Roofing Contractors Work Insurance Claims: A Step-by-Step Guide", width: 1200, height: 630 } },
    title: "How Roofing Contractors Work Insurance Claims: A Step-by-Step Guide",
    metaTitle: "How Roofers Work Insurance Claims (Step by Step)",
    metaDescription: "How roofing contractors work insurance claims from the first inspection to final payment: the steps, the contractor's role, documentation and supplements.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
      { text: "NRCA: National Roofing Contractors Association", url: "https://www.nrca.net" },
    ],
    visuals: {
      1: { type: "steps", data: [
        { num: "1", title: "Homeowner reports the claim", desc: "The policyholder contacts the insurer, who assigns an adjuster and a claim number." },
        { num: "2", title: "Contractor inspects and documents", desc: "Photos, measurements and notes record the roof's condition before any work starts." },
        { num: "3", title: "Adjuster inspects and estimates", desc: "The carrier's adjuster reviews the damage and writes an estimate under the policy." },
        { num: "4", title: "Estimate is compared and discussed", desc: "Differences between the contractor's findings and the estimate are reviewed with the adjuster." },
        { num: "5", title: "Work begins and hidden damage is documented", desc: "Concealed conditions found at tear-off are photographed and measured." },
        { num: "6", title: "Supplement and final payment", desc: "Additional items are submitted, and remaining payments are released according to the policy." },
      ]},
      2: { type: "tip", data: { type: "warning", title: "Know your state's rules on contractors and claims", text: "In many states, contractors may not negotiate a claim on a homeowner's behalf unless they hold the right license, and other rules apply to fees and contracts. Check your state insurance department before you act beyond documenting and estimating." } },
      4: { type: "checklist", data: { title: "Habits that keep claims moving", items: [
        { text: "Record the claim number, carrier and adjuster on day one", checked: true },
        { text: "Photograph the roof before any work starts", checked: true },
        { text: "Keep the original adjuster estimate with the job file", checked: true },
        { text: "Label photos by roof area and finding", checked: true },
        { text: "Log every call and email with the adjuster", checked: true },
        { text: "Document hidden damage before it is covered", checked: true },
      ]}},
    },
    sections: [
      {
        heading: "The short answer",
        content: "Roofing contractors work insurance claims by documenting the roof's condition, providing an estimate, supporting the homeowner while the insurance adjuster reviews the damage, and then submitting a supplement if hidden damage turns up during the work. The insurer decides what is covered and how much it pays. The contractor's job is to make the roof's condition and the cost of repair clear and verifiable.\n\nThis guide walks through that workflow from the first inspection to the final payment. It is general information, not legal or insurance advice. Rules differ by state, carrier and policy, so confirm the specifics for your area.",
      },
      {
        heading: "The claim workflow in six steps",
        content: "Every claim is a little different, but most follow the same path. Understanding the sequence helps you know where your documentation matters and when to expect questions.\n\nThe homeowner starts the claim with their insurer. The adjuster reviews the damage and builds an estimate. If your findings differ from that estimate, you raise the differences with supporting evidence. When work begins, conditions that were hidden may surface, and a supplement addresses them. Payment timing depends on the policy, including whether it pays actual cash value first and releases the rest after the work is complete.",
      },
      {
        heading: "What the contractor's role is, and where it stops",
        content: "A contractor's role is practical and evidence-based:\n\n• Inspect and document: Photos, measurements and a factual description of the roof's condition.\n• Provide an estimate: Scope and price for the repair or replacement.\n• Support the homeowner: Explain what you found and be available when the adjuster inspects.\n• Document hidden damage: Record conditions found during tear-off and submit them as a supplement.\n\nWhere it stops matters just as much. Deciding coverage belongs to the insurer. Depending on the state, negotiating a claim on a homeowner's behalf may require a public adjuster license. Staying within what you can document and estimate protects you and the homeowner.",
      },
      {
        heading: "The first inspection: what to record",
        content: "Your first visit sets the baseline for everything that follows. Photograph every slope, then the specific areas of concern. Include flashing, vents and penetrations. Note the roof's approximate age, the number of layers if you can tell and any visible wear separate from the reported damage.\n\nBe honest in your notes. If you see old wear that is not related to the storm, record it as such. A balanced record is more credible, and credibility helps when you later ask the adjuster to consider additional items. The <a href='/blog/roof-damage-report-template'>roof damage report template</a> gives you a structure to follow.",
      },
      {
        heading: "Working with the adjuster",
        content: "Adjusters handle many claims and respond best to organized, specific information. Some practical habits:\n\n• Be present when you can: With the homeowner's permission, being on site during the adjuster's inspection lets you show what you found.\n• Compare estimates line by line: Note what is missing or different, not just the total.\n• Offer evidence, not arguments: Photos, measurements and references beat opinions.\n• Ask for reasons in writing: If something is denied, the stated reason tells you what to document next.\n• Keep a record: Dates, names and what was said.\n\nFor the evaluation side, read <a href='/blog/how-insurance-adjusters-determine-roof-damage'>how adjusters determine roof damage</a>.",
      },
      {
        heading: "Hidden damage and supplements",
        content: "The first estimate is based on what could be seen. Once the old roofing comes off, you may find damaged decking, failed flashing, missing underlayment or extra layers. A supplement is the documented request for those additional costs.\n\nThe strength of a supplement is its proof: labeled photos taken before the condition is covered, measurements that match your notes and a short factual explanation. For the full picture, see <a href='/blog/supplemental-roofing-estimate-explained'>what a supplemental roofing estimate is</a> and <a href='/blog/how-to-write-a-roofing-supplement'>how to write a roofing supplement</a>.",
      },
      {
        heading: "Payment and closing the claim",
        content: "Payments follow the policy. Many policies pay actual cash value first, then release recoverable depreciation when the work is finished and documented. Final invoices, completion photos and any supplement approvals feed into that last step.\n\nTrack every open claim so none stalls. A simple tracker such as the <a href='/blog/roofing-supplement-follow-up-log'>roofing supplement follow-up log</a> keeps submissions, responses and next steps in one place.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps crews capture photos, areas and notes on the roof, organize findings by claim and produce a report for the adjuster. It supports the documentation part of this workflow. It does not decide coverage or guarantee approval. See the <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
    ],
    faq: [
      {
        q: "How do roofing contractors work with insurance companies?",
        a: "They document the roof's condition, provide an estimate, support the homeowner during the adjuster's review and submit supplements for hidden damage found during the work. The insurer decides coverage and payment.",
      },
      {
        q: "Can a roofer negotiate with the insurance company for me?",
        a: "It depends on the state. In many places, negotiating a claim for a homeowner requires a public adjuster license. Contractors can usually document and estimate but should check local rules.",
      },
      {
        q: "What is the roofing insurance claim process?",
        a: "The homeowner reports the claim, the adjuster inspects and estimates, the contractor documents and compares findings, work begins, hidden damage is supplemented, and payments are released under the policy terms.",
      },
      {
        q: "Does the contractor or the insurer decide what is covered?",
        a: "The insurer decides, based on the policy and the claim. The contractor provides evidence and an estimate.",
      },
      {
        q: "What documentation do I need for a roof insurance claim?",
        a: "Labeled photos, measurements, notes on each finding, the adjuster's estimate and a record of all communication.",
      },
    ],
    related: ["roofing-crew-supplement-documentation-sop", "can-a-roofer-talk-to-the-insurance-company", "supplemental-roofing-estimate-explained", "how-insurance-adjusters-determine-roof-damage", "roof-damage-report-template", "roofing-supplement-follow-up-log"],
  },
  {
    slug: "hail-damage-roof-insurance-claim-documentation",
    images: { 0: { src: "/blog/hail-damage-roof-insurance-claim-documentation/card.png", alt: "Key points from the guide: Hail Damage Roof Insurance Claims: What Contractors Should Document", width: 1200, height: 630 } },
    downloads: "roof-damage-report-template",
    title: "Hail Damage Roof Insurance Claims: What Contractors Should Document",
    metaTitle: "Hail Damage Roof Insurance Claims: What to Document",
    metaDescription: "What roofing contractors should document on a hail damage insurance claim: signs of hail damage, test squares, date of loss and the photos adjusters need.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NOAA National Weather Service", url: "https://www.weather.gov" },
      { text: "NOAA Storm Events Database", url: "https://www.ncdc.noaa.gov/stormevents/" },
      { text: "IBHS: Insurance Institute for Business & Home Safety", url: "https://ibhs.org" },
    ],
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to record"],
        rows: [
          { feature: "Shingle impacts", values: ["Location, size and pattern of marks, compared across slopes"] },
          { feature: "Granule loss", values: ["Exposed mat or bare spots, with a close-up and a wide shot"] },
          { feature: "Soft metals", values: ["Dents on vents, flashing, drip edge and gutters"] },
          { feature: "Collateral items", values: ["Damage to siding, fences, AC units or window screens, where present"] },
          { feature: "Roof condition", values: ["Approximate age and general wear, recorded honestly"] },
        ],
      }},
      2: { type: "tip", data: { type: "info", title: "Thresholds vary by carrier", text: "Some carriers evaluate hail with test squares and count impacts per square. The number that counts as damage differs between carriers and guidelines, so ask the adjuster what standard applies to your claim." } },
      4: { type: "checklist", data: { title: "Hail claim photo checklist", items: [
        { text: "Overview of every slope, labeled by direction", checked: true },
        { text: "Close-ups of impacts with a scale in frame", checked: true },
        { text: "Test square areas marked and photographed, if used", checked: true },
        { text: "Soft metals and collateral damage", checked: true },
        { text: "Date and time on photos, with the date of loss noted", checked: true },
        { text: "Both damaged and undamaged slopes, for comparison", checked: true },
      ]}},
    },
    sections: [
      {
        heading: "The short answer",
        content: "On a hail damage claim, contractors should document what hail did to the roof and the property, where it did it, and when it happened. That means labeled photos of impacts on each slope, evidence on soft metals and nearby items, notes on the roof's age and condition, and a record of the date of loss.\n\nThe insurer decides whether the damage is covered and how it is measured. Your documentation helps the adjuster see what you saw. This guide is general information, and carrier standards vary.",
      },
      {
        heading: "What hail damage looks like",
        content: "Hail damage on asphalt shingles generally shows up as impact marks, bruising or loss of granules that exposes the mat. On metal components, it can appear as dents. Hail also damages items around the roof, which can help show that a storm reached the property.\n\nNot every mark is hail. Wear, blistering, foot traffic, manufacturing issues and other events can leave similar-looking marks. A careful record separates what you can tie to hail from what you cannot.",
      },
      {
        heading: "Test squares and thresholds",
        content: "Some carriers evaluate hail damage by choosing a representative area of each slope, often called a test square, and counting impacts within it. The count that triggers repair or replacement varies by carrier and guideline.\n\nIf a test square is used, photograph its boundaries and the impacts inside it. If the adjuster used one, ask what standard applies. Knowing the method lets you document in a way that matches how the claim is being evaluated.",
      },
      {
        heading: "Verify the date of loss",
        content: "Insurance coverage ties to a date of loss, so it helps to know when the storm happened. Public weather resources can help you confirm that hail occurred in the area on a given date. The National Weather Service and NOAA's Storm Events Database are common references.\n\nRecord the date you are working from and where you found it. This is supporting context. The carrier and policy determine how the date of loss is used.",
      },
      {
        heading: "Photo and notes checklist",
        content: "The checklist covers the shots that make a hail report easy to follow. Take wide photos first, then close-ups, and label each one with the slope or component. Compare damaged slopes with less affected ones so the pattern is clear.\n\nFor more detail on what to capture, see the <a href='/blog/hail-damage-roof-inspection'>hail damage roof inspection guide</a> and the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a>.",
      },
      {
        heading: "Common mistakes on hail claims",
        content: "These slow claims or weaken credibility:\n\n• Treating all wear as hail: Record old wear separately.\n• Missing the wide shot: A close-up with no location is hard to place.\n• No scale: Without one, size is a guess.\n• Vague notes: Say how many, where and how large.\n• Ignoring soft metals: They are quick to photograph and can support the overall picture.\n• Guessing at coverage: That decision belongs to the carrier.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> lets a crew capture labeled photos, roof areas and notes as they work, then builds a report you can send to the adjuster. It does not decide coverage or guarantee approval. See the <a href='/roofing-supplement-report-example'>sample report</a> and the <a href='/free-roofing-supplement-checklist'>free checklist</a>.",
      },
    ],
    faq: [
      {
        q: "What should a contractor document on a hail damage claim?",
        a: "Impacts on each slope, soft-metal dents, collateral damage, the roof's age and condition, and the date of loss, all with labeled photos and notes.",
      },
      {
        q: "What is a test square in a hail inspection?",
        a: "A representative area of a slope used by some carriers. Impacts within it are counted, and the threshold varies by carrier and guideline.",
      },
      {
        q: "How do I confirm when hail happened?",
        a: "Public weather resources such as the National Weather Service and NOAA's Storm Events Database can help confirm hail in an area on a given date. Record the source.",
      },
      {
        q: "Does documenting hail damage guarantee the claim is approved?",
        a: "No. Coverage and approval depend on the policy, the carrier and the claim.",
      },
      {
        q: "Can an adjuster deny a hail claim because the roof is old?",
        a: "Roof age and condition can affect how a claim is evaluated and paid, depending on the policy. Review the policy terms for details.",
      },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["roof-shingle-matching-insurance-claim", "hail-damage-roof-inspection", "how-insurance-adjusters-determine-roof-damage", "roofing-photo-documentation-checklist", "roof-damage-report-template"],
  },
  {
    slug: "wind-damage-roof-insurance-claim-documentation",
    images: { 0: { src: "/blog/wind-damage-roof-insurance-claim-documentation/card.png", alt: "Key points from the guide: Wind Damage Roof Insurance Claims: What to Document", width: 1200, height: 630 } },
    downloads: "roof-damage-report-template",
    title: "Wind Damage Roof Insurance Claims: What to Document",
    metaTitle: "Wind Damage Roof Insurance Claims: What to Document",
    metaDescription: "How to document wind damage on a roof for an insurance claim: creased and missing shingles, lifted tabs, debris impact, photos and notes adjusters can verify.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NOAA National Weather Service", url: "https://www.weather.gov" },
      { text: "IBHS: Insurance Institute for Business & Home Safety", url: "https://ibhs.org" },
      { text: "NRCA: National Roofing Contractors Association", url: "https://www.nrca.net" },
    ],
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to record"],
        rows: [
          { feature: "Missing shingles", values: ["Where they are and how many, with the exposed underlayment or deck"] },
          { feature: "Creased shingles", values: ["A horizontal fold or crease line across the tab, close-up with a scale"] },
          { feature: "Lifted or unsealed tabs", values: ["Location and whether the seal strip has released"] },
          { feature: "Torn or displaced pieces", values: ["Edges, ridges and hips, which often show wind effects first"] },
          { feature: "Debris impact", values: ["Dents, punctures or marks from branches or other objects"] },
        ],
      }},
      2: { type: "steps", data: [
        { num: "1", title: "Photograph the whole roof", desc: "Every slope, labeled by direction, before focusing on details." },
        { num: "2", title: "Map the pattern", desc: "Note which slopes and edges are affected and which are not." },
        { num: "3", title: "Document each finding", desc: "Close-up, wide shot, scale and a short note for each." },
        { num: "4", title: "Record the storm date", desc: "Note the date of loss and the source of any weather confirmation." },
      ]},
      3: { type: "tip", data: { type: "tip", title: "Record what is not damaged too", text: "Showing that some slopes are intact while others are damaged makes the pattern clearer, and it shows you are describing the roof honestly." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "To document wind damage on a roof, photograph the whole roof, then record each finding: missing shingles, creased shingles, lifted or unsealed tabs and torn or displaced pieces. Note where each one is, how many there are and where the pattern is concentrated, and record the date of loss.\n\nThe adjuster and the policy decide what is covered. Your job is to make what you saw clear and verifiable. This is general guidance, and carrier standards differ.",
      },
      {
        heading: "What wind damage looks like on a roof",
        content: "Wind damage often appears at edges, ridges, hips and rakes first, because those areas see the most uplift. Shingles may be missing, creased or lifted, and the sealing strip may have released. In stronger events, debris can add impact damage.\n\nAs with any storm damage, separate wind effects from age, wear and installation issues. Shingles that lifted because the adhesive had failed long before the storm are a different story from shingles that lifted in a recent event. An honest record helps the adjuster sort that out.",
      },
      {
        heading: "How to document it, step by step",
        content: "A repeatable routine keeps the record complete. Start with overview photos, then map the pattern, then document each finding in detail.\n\nFor each finding, take a wide shot that shows where it is, then a close-up with a scale. Add a short note: what you saw, where and how many. Label the photo with the slope or component so it can be matched to your notes later.",
      },
      {
        heading: "Pattern and direction matter",
        content: "Where wind damage sits on a roof can tell a story. Damage concentrated on slopes facing the storm's direction, or along edges and ridges, is consistent with wind. Damage scattered evenly across every slope may point to other causes.\n\nRecord the pattern, but describe it neutrally. Say which slopes and edges are affected and which are not, and let the adjuster interpret it.",
      },
      {
        heading: "Date of loss and weather confirmation",
        content: "Policies tie to a date of loss. Public sources such as the National Weather Service can help you confirm that high winds occurred in the area on a given date. Note the date and the source in your record.\n\nThis is supporting information. How the carrier uses it depends on the claim and the policy.",
      },
      {
        heading: "Mistakes to avoid",
        content: "• Over-attributing: Do not call everything wind damage. Record wear separately.\n• Skipping the wide shot: Close-ups alone do not show location.\n• No count: Say how many, not just some.\n• Missing the undamaged areas: Context makes the pattern clear.\n• Leaving out the date: Always note the date of loss and your source.\n\nBefore you send the package, check it against the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> and the <a href='/blog/roof-damage-report-template'>roof damage report template</a>.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps crews capture labeled photos, areas and notes on the roof and assemble a report for the adjuster. It supports documentation and does not decide coverage. For the broader process, read <a href='/blog/how-roofing-contractors-work-insurance-claims'>how roofing contractors work insurance claims</a>.",
      },
    ],
    faq: [
      {
        q: "How do you document wind damage to a roof?",
        a: "Photograph the whole roof, then each finding with a wide shot, a close-up and a scale, label each one and note how many and where. Record the date of loss.",
      },
      {
        q: "What does wind damage to shingles look like?",
        a: "Missing shingles, creased shingles, lifted or unsealed tabs and torn pieces, often starting at edges, ridges and hips.",
      },
      {
        q: "How can I tell wind damage from normal wear?",
        a: "Look at the pattern, the condition of the exposed surfaces and the age of the roof, and record wear separately. The adjuster makes the final determination.",
      },
      {
        q: "Does wind damage need to be reported right away?",
        a: "Policies often have notice requirements. Check the policy and your state's rules for timing.",
      },
      {
        q: "Will good documentation guarantee the claim is paid?",
        a: "No. It helps the adjuster verify what you found, but coverage depends on the policy, the carrier and the claim.",
      },
    ],
    related: ["how-roofing-contractors-work-insurance-claims", "hail-damage-roof-insurance-claim-documentation", "roof-damage-report-template", "storm-damage-roof-repair"],
  },
  {
    slug: "roof-leak-insurance-claim-contractor-guide",
    images: { 0: { src: "/blog/roof-leak-insurance-claim-contractor-guide/card.png", alt: "Key points from the guide: Roof Leak Insurance Claims: What Contractors Should Know", width: 1200, height: 630 } },
    downloads: "roof-damage-report-template",
    title: "Roof Leak Insurance Claims: What Contractors Should Know",
    metaTitle: "Roof Leak Insurance Claims: A Contractor Guide",
    metaDescription: "What contractors should know about roof leak insurance claims: finding the source, documenting damage, temporary protection and why cause decides coverage.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
      { text: "NRCA: National Roofing Contractors Association", url: "https://www.nrca.net" },
    ],
    visuals: {
      1: { type: "compare", data: {
        before: { label: "Signs pointing to a sudden event", items: ["Recent storm with matching date", "Fresh damage such as a missing or torn shingle", "Interior stain that appeared recently", "Damage localized near the opening"] },
        after: { label: "Signs pointing to long-term conditions", items: ["Widespread wear or granule loss", "Old, dried or repeated stains", "Rust, rot or mold suggesting a long history", "Failed sealant or aged flashing"] },
      }},
      2: { type: "tip", data: { type: "warning", title: "Describe the cause, do not decide coverage", text: "Whether a leak is covered depends on the policy and the cause of loss. Record what you see and let the carrier make the coverage decision. Avoid telling a homeowner a leak is or is not covered." } },
      3: { type: "steps", data: [
        { num: "1", title: "Stop further damage", desc: "Tarp or temporarily protect the opening when it is safe to do so." },
        { num: "2", title: "Photograph before and after", desc: "Capture the condition before any temporary repair, then the repair itself." },
        { num: "3", title: "Keep receipts", desc: "Save invoices and material receipts for temporary protection." },
        { num: "4", title: "Notify the insurer", desc: "The policyholder reports the loss and follows the policy's instructions." },
      ]},
      5: { type: "checklist", data: { title: "Leak documentation checklist", items: [
        { text: "Interior photos of stains, drips or damage, with dates", checked: true },
        { text: "Exterior photos of the suspected source and surrounding area", checked: true },
        { text: "Moisture readings if you have a meter, with locations", checked: true },
        { text: "Photos of any temporary protection installed", checked: true },
        { text: "Notes on roof age, material and condition", checked: true },
        { text: "Receipts and a written description of work done", checked: true },
      ]}},
    },
    sections: [
      {
        heading: "The short answer",
        content: "A roof leak insurance claim usually turns on the cause. Many policies respond to sudden, accidental damage, such as a storm opening a path for water, and may not respond to damage from long-term wear, poor maintenance or repeated seepage. Contractors help by finding and documenting the source, protecting the property from further damage and keeping clear records.\n\nThe insurer decides coverage. This guide is general information, and policies differ, so read the actual policy language.",
      },
      {
        heading: "Why the cause matters so much",
        content: "Two leaks that look the same can be treated differently. A leak from storm damage, for example a section of shingles torn off, is often evaluated as a sudden event. A leak from aged flashing, failed sealant or worn roofing may be evaluated as wear or maintenance.\n\nYour role is not to rule on that. It is to record what you observe: the condition of the roof, the location of the opening, the state of the surrounding materials and the interior damage. The comparison shows the kinds of evidence that tend to point one way or the other, and it is for orientation, not a coverage test.",
      },
      {
        heading: "Stay in your lane on coverage",
        content: "It is tempting to reassure a homeowner by saying a leak will be covered, or to warn them it will not. Avoid both. You do not know the policy terms, and the carrier decides. Stick to factual statements about what you found and what repair is needed.\n\nThat approach also protects you. If a claim is denied after you promised coverage, the trust that cost you is hard to rebuild.",
      },
      {
        heading: "Protect the property first",
        content: "Policies commonly expect the policyholder to take reasonable steps to prevent further damage. Temporary protection, such as tarping an opening or stopping active water entry, is usually part of that. Do it safely.\n\nDocument the condition before you cover anything, then photograph the temporary repair. Keep invoices and receipts. A clear record shows what was done and why. Check the policy and the carrier's instructions on whether and how temporary repair costs are handled.",
      },
      {
        heading: "Finding and recording the source",
        content: "Water often travels along rafters, decking or insulation before it appears inside, so the stain may not sit directly under the opening. Trace carefully. Common sources include flashing at chimneys and walls, pipe boots, valleys, damaged shingles and penetrations.\n\nRecord your reasoning in plain terms: where the water was entering, what evidence you saw and what you could not confirm. Saying that you could not determine something is better than guessing.",
      },
      {
        heading: "Documentation checklist",
        content: "A complete leak file includes interior and exterior photos, notes on the roof's age and condition, any moisture readings, photos of temporary protection and every receipt. Date everything.\n\nIf the repair leads to a bigger scope of work, or hidden damage appears when the roof is opened, the same habits support a supplement. See <a href='/blog/document-rotted-roof-decking-tear-off'>how to document rotted roof decking</a> and the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a>.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps crews capture photos, notes and areas on site and organize them into a report for the adjuster. It does not decide coverage. For the wider process, see <a href='/blog/how-roofing-contractors-work-insurance-claims'>how roofing contractors work insurance claims</a>.",
      },
    ],
    faq: [
      {
        q: "Does homeowners insurance cover a roof leak?",
        a: "It depends on the policy and the cause. Policies often respond to sudden, accidental damage and may not cover damage from long-term wear or maintenance issues. Read the policy language.",
      },
      {
        q: "What should a contractor do first on a roof leak claim?",
        a: "Protect the property from further damage when it is safe, and document the condition before and after any temporary repair, keeping receipts.",
      },
      {
        q: "Should I tell the homeowner the leak will be covered?",
        a: "No. Coverage is decided by the insurer. Describe what you found and let the carrier decide.",
      },
      {
        q: "How do you find where a roof leak is coming from?",
        a: "Trace the water from the interior stain along the likely path to the exterior, checking flashing, penetrations, valleys and damaged roofing. Record what you can and cannot confirm.",
      },
      {
        q: "Are temporary repair costs reimbursed?",
        a: "It depends on the policy. Keep receipts and check the policy and the carrier's guidance.",
      },
    ],
    related: ["how-roofing-contractors-work-insurance-claims", "document-rotted-roof-decking-tear-off", "roof-damage-report-template", "storm-damage-roof-repair"],
  },
  {
    slug: "roofing-supplement-companies-vs-software",
    title: "Roofing Supplement Companies vs. Doing It In-House: How to Decide",
    metaTitle: "Roofing Supplement Companies vs. In-House Software",
    metaDescription: "Roofing supplement companies, in-house work or software? What each option involves, how pricing models differ, and the questions to ask before you choose.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
    ],
    visuals: {
      1: { type: "matrix", data: {
        headers: ["In-house, by hand", "In-house with software", "Outsourced company"],
        rows: [
          { feature: "Who writes the supplement", values: ["Your office", "Your office, with a drafting tool", "The company's staff"] },
          { feature: "Typical cost model", values: ["Staff time", "Software subscription plus staff time", "Varies: per supplement or a share of what is recovered"] },
          { feature: "Control over the file", values: ["Full", "Full", "Shared"] },
          { feature: "Learning curve", values: ["Builds with experience", "Short, mostly the workflow", "Minimal for you"] },
          { feature: "Best when", values: ["Low volume", "Steady volume and a small team", "High volume or little office capacity"] },
        ],
      }},
      3: { type: "steps", data: [
        { num: "1", title: "Ask how they are paid", desc: "Get the fee structure in writing: per supplement, a percentage or a flat fee." },
        { num: "2", title: "Ask who talks to the adjuster", desc: "Understand who communicates with the carrier and what rules apply in your state." },
        { num: "3", title: "Ask for a sample package", desc: "Review what they would actually send, with photos and narrative." },
        { num: "4", title: "Ask for references", desc: "Speak with contractors who have used them, and check reviews independently." },
      ]},
      2: { type: "tip", data: { type: "info", title: "Check the rules in your state", text: "Who may communicate with insurers about a claim, and under what license, varies by state. Confirm that any outside service operates within your state's rules." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "You have three realistic ways to handle roofing supplements: do them by hand in-house, use software to speed up the in-house work, or hire a supplement company to do it for you. The right choice depends on your volume, your office capacity, how much control you want and how a company would be paid.\n\nThere is no single best answer. A small crew handling a few claims a month may do fine by hand. A busy company may value outsourcing. Software sits between them. This guide compares them neutrally so you can decide.",
      },
      {
        heading: "The three options at a glance",
        content: "The table summarizes how the options differ. It describes common patterns, not any specific company, because pricing and service vary widely. Always check a provider's own terms.\n\nThe key trade-off is control against effort. The more of the work you keep, the more control you have over the package and the relationship with the adjuster, and the more time it takes. Outsourcing saves time but shares control.",
      },
      {
        heading: "What a supplement company typically does",
        content: "Supplement companies generally review your photos, notes and the adjuster's estimate, identify items that may be missing and prepare a supplement package. Some also handle follow-up communication.\n\nHow they charge varies. Some charge per supplement, some take a percentage of what is recovered and others use a flat fee. Because models differ, compare total cost on your own claims, not the headline rate. Also consider that a percentage model means the company's income rises with the amount recovered, so ask how they decide what is worth including.",
      },
      {
        heading: "Questions to ask before you outsource",
        content: "Use the same list with every company you consider. Get answers in writing, and read the contract before you sign.\n\nPay particular attention to who communicates with the insurer and what your state allows. Rules about who may negotiate a claim, and what licenses are required, differ across states. If a company says it does everything for you, make sure that is permitted where you work.",
      },
      {
        heading: "When in-house with software makes sense",
        content: "Doing it in-house with software suits companies that want to keep control and speed up the writing. The software handles capture, organization and report building. Your team still reviews every finding and decides what goes out.\n\nCompare it honestly against the other two options: what does a month of software cost against your staff time, and against a company's fees on your actual claims? <a href='/roofing-supplement-software'>Supplement Snap</a> is one tool built for that in-house workflow. See <a href='/roofing-supplement-software-vs-spreadsheets'>software vs. spreadsheets</a> for the by-hand comparison, and the <a href='/roofing-supplement-report-example'>sample report</a> for the output.",
      },
      {
        heading: "How to decide",
        content: "Run the numbers on your last ten claims. How much time did each supplement take, what did it cost in staff hours and what would a company's fee have been? Then consider control and risk: how comfortable are you with someone else representing your documentation?\n\nIf you are unsure, start small. Try one option on a handful of claims and compare the results. No option can guarantee approval, because coverage depends on the claim, the policy and the carrier.",
      },
    ],
    faq: [
      {
        q: "What does a roofing supplement company do?",
        a: "It reviews your documentation and the adjuster's estimate, identifies items that may be missing and prepares a supplement package. Services and fees vary by company.",
      },
      {
        q: "How much do roofing supplement companies charge?",
        a: "It varies. Some charge per supplement, some take a percentage of what is recovered and some use a flat fee. Compare the total cost on your own claims.",
      },
      {
        q: "Is it better to do supplements in-house?",
        a: "It depends on your volume, office capacity and how much control you want. Low volume often works by hand, while software helps steady volume and outsourcing helps when capacity is limited.",
      },
      {
        q: "Is it legal for a supplement company to talk to my insurer?",
        a: "Rules vary by state. In many places, negotiating a claim for someone requires a specific license. Confirm what is allowed where you work.",
      },
      {
        q: "Will any option guarantee supplements are approved?",
        a: "No. Approval depends on the claim, the policy and the carrier, not on who prepares the package.",
      },
    ],
    related: ["can-a-roofer-talk-to-the-insurance-company", "supplemental-roofing-estimate-explained", "roofing-supplement-follow-up-log", "xactimate-roofing-software-explained", "how-roofing-contractors-work-insurance-claims", "roofing-supplement-software-cost", "ai-roofing-supplement-tools-compared", "roofing-supplement-software-for-small-roofing-companies"],
  },
  {
    slug: "best-roofing-supplement-software",
    title: "Best Roofing Supplement Software (2026): 5 Types of Tools Compared",
    metaTitle: "Best Roofing Supplement Software: 5 Types (2026)",
    metaDescription: "Compare roofing supplement software, estimating tools, photo apps and supplement services. What each does, what it costs to run and how to choose.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
      { text: "CompanyCam", url: "https://companycam.com" },
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
    ],
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Main job", "Good fit when"],
        rows: [
          { feature: "Estimating software (for example Xactimate)", values: ["Price the work in the format adjusters use", "You already estimate in it or must match the carrier's estimate"] },
          { feature: "Supplement documentation software", values: ["Capture proof on the roof and build the adjuster report", "Photos, notes and reports are where your supplements slow down"] },
          { feature: "Job photo apps (for example CompanyCam)", values: ["Capture and share photos for any trade", "You need photos organized but write the supplement yourself"] },
          { feature: "Roofing CRM and estimating platforms", values: ["Manage leads, jobs, proposals and customers", "You need a whole-business system, not just supplements"] },
          { feature: "Supplement and estimating services", values: ["A third party writes the supplement for you", "You lack office capacity and accept sharing control"] },
        ],
      }},
      3: { type: "checklist", data: { title: "Questions to ask before you choose", items: [
        { text: "Can my crew use it on a phone with a weak signal?", checked: true },
        { text: "Does each photo stay attached to its finding and note?", checked: true },
        { text: "What does the finished report look like to an adjuster?", checked: true },
        { text: "Can I export line items to use in my own estimate?", checked: true },
        { text: "What is the real monthly cost at my volume?", checked: true },
        { text: "Can I leave and take my data with me?", checked: true },
      ]}},
      4: { type: "steps", data: [
        { num: "1", title: "Pick one real job", desc: "Choose a job with several hidden-damage findings." },
        { num: "2", title: "Run it through each option", desc: "Use the same photos and notes in every tool you are testing." },
        { num: "3", title: "Time the whole path", desc: "Measure from the first photo to a package you could send." },
        { num: "4", title: "Compare the output", desc: "Show each result to someone who was not on the roof." },
      ]},
      5: { type: "tip", data: { type: "info", title: "Verify every vendor claim yourself", text: "Features and prices change often, and comparison pages (including this one) can be out of date. Confirm current details on each vendor's site and test on a real job before you commit." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "There is no single best roofing supplement software, because the phrase covers different jobs. Some tools price the work, some capture the proof, some manage your whole business and some are services where someone else writes the supplement. The right choice depends on where your supplements actually slow down.\n\nIf your problem is turning on-roof photos and notes into a clear report for the adjuster, a supplement documentation tool fits. If your problem is pricing in the adjuster's format, you need estimating software. If you have no office capacity, a service may fit.\n\nDisclosure: we make Supplement Snap, one of the tools discussed here. We describe other categories in general terms and ask you to verify details with each vendor.",
      },
      {
        heading: "The five kinds of tools people mean",
        content: "Searches for roofing supplement software return very different products. This table separates them by main job, so you can compare like with like. It describes categories, not specific feature lists, because those change.\n\nMany products blend two or more categories. A CRM may include estimating, and a photo app may add reports. Use the table to decide what you are shopping for first, then compare products inside that category.",
      },
      {
        heading: "Estimating software: pricing the work",
        content: "Xactimate, made by Verisk, is the estimating software most carriers and adjusters use. It organizes work into line items with quantities, units and regional prices, which is why supplements are easier to review when they follow that format.\n\nIt prices the work. It does not capture or organize the proof on the roof. Many contractors use it alongside a documentation tool. For how line items look in practice, see the <a href='/blog/xactimate-roofing-estimate-example'>Xactimate roofing estimate example</a> and the <a href='/blog/xactimate-roofing-software-explained'>explainer on what Xactimate does and does not do</a>.",
      },
      {
        heading: "Documentation, photo apps and CRMs",
        content: "Supplement documentation software focuses on the evidence: photos tagged to findings, notes, measurements and a report you can send. Supplement Snap is built for this job. Crews capture and label damage on the roof, drafts of the written descriptions are generated for you to review, and a PDF report can be emailed to the adjuster. Team plans add an Xactimate-style CSV export, which is a starting list you review and price yourself.\n\nJob photo apps such as CompanyCam organize photos for many trades. They are a good fit if you write the supplement separately. Roofing CRMs and estimating platforms manage leads, jobs and proposals. They solve a wider problem and may cover supplements only lightly, so check how deep their supplement features go.\n\nSee how the two approaches compare in <a href='/blog/companycam-alternative-roofing-supplements'>photo apps vs. supplement tools</a> and in <a href='/blog/roofing-software-comparison'>roofing software for contractors compared</a>.",
      },
      {
        heading: "Supplement services: when someone else writes it",
        content: "Some companies write supplements for you from your photos and the adjuster's estimate. This can save office time. The trade-offs are cost, shared control of the file and communication with the carrier.\n\nPricing models differ. Some charge per supplement, some take a share of what is recovered and some use flat fees. Ask for the fee structure in writing, ask who talks to the adjuster and check what your state allows, since rules on who may negotiate a claim vary. The full comparison is in <a href='/blog/roofing-supplement-companies-vs-software'>supplement companies vs. doing it in-house</a>.",
      },
      {
        heading: "How to choose and test fairly",
        content: "Decide by testing, not by reading rankings. Rankings, including roundups from vendors, tend to favor the publisher's own product.\n\nUse the checklist above and run one real job through each option you are considering. The path from the first photo to a package you could send is the number that matters, along with how clear the result is to someone who was not on the roof.\n\nIf you are unsure what a complete package contains, start with the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> and compare against the <a href='/roofing-supplement-report-example'>sample supplement report</a>.",
      },
      {
        heading: "Where Supplement Snap fits, and where it does not",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> is built for roofing contractors who document hidden damage found at tear-off and prepare reports for insurance adjusters. Paid plans start at $99 a month with a 14-day free trial (a card is required), and you can start a free project first. See <a href='/pricing'>pricing</a> for current details.\n\nIt is not a CRM, it does not provide aerial measurements and it does not replace your estimating software. No tool can guarantee that a supplement is approved. Coverage and approval depend on the claim, the policy and the carrier.",
      },
    ],
    faq: [
      {
        q: "What is the best roofing supplement software?",
        a: "It depends on the job. Estimating software prices the work, documentation software captures and presents the proof, photo apps organize photos and services write supplements for you. Test your own job in each option before deciding.",
      },
      {
        q: "How do you supplement a roof claim?",
        a: "Document hidden damage found at tear-off with labeled photos, measurements and factual notes, tie each finding to the estimate line item it supports, and send the package to the adjuster. See what a supplemental roofing estimate is for the full process.",
      },
      {
        q: "Do I need Xactimate to submit a supplement?",
        a: "Not always. Many contractors submit a clear document that mirrors the line items. Requirements vary by carrier, so confirm with your adjuster.",
      },
      {
        q: "Is roofing supplement software worth it?",
        a: "It can be if supplement paperwork is slowing you down or photos and notes get separated. Test it on a real job and compare the time and the report against your current process.",
      },
      {
        q: "Can software guarantee my supplement is approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and the documentation. Software can make your package clearer and more complete.",
      },
    ],
    related: ["roofing-supplement-software-data-and-privacy-questions", "questions-to-ask-before-buying-roofing-supplement-software", "is-roofing-supplement-software-worth-it", "roofing-supplement-companies-vs-software", "xactimate-roofing-software-explained", "roofing-software-comparison", "supplemental-roofing-estimate-explained", "supplement-snap-vs-roofgenius", "roofing-supplement-software-cost", "claimtrax-vs-suppx-vs-supplement-snap", "roofing-supplement-software-for-small-roofing-companies", "supplement-snap-vs-acculynx-supplements", "free-roofing-supplement-software"],
  },
  {
    slug: "recoverable-depreciation-roof-claims",
    images: { 0: { src: "/blog/recoverable-depreciation-roof-claims/card.png", alt: "Key points from the guide: Recoverable Depreciation on a Roof Claim: How It Works and How Contractors Help Get It Paid", width: 1200, height: 630 } },
    title: "Recoverable Depreciation on a Roof Claim: How It Works and How Contractors Help Get It Paid",
    metaTitle: "Recoverable Depreciation on Roof Claims Explained",
    metaDescription: "ACV vs. RCV, what recoverable depreciation is, when insurers release it and what paperwork a roofing contractor needs to help the homeowner collect it.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
      { text: "Insurance Information Institute (iii.org)", url: "https://www.iii.org" },
    ],
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Actual cash value (ACV)", "Replacement cost value (RCV)"],
        rows: [
          { feature: "What it means", values: ["Replacement cost minus depreciation", "Full cost to repair or replace with similar materials"] },
          { feature: "Usually paid", values: ["First, after the claim is approved", "After the work is done, if the policy allows"] },
          { feature: "Who feels the gap", values: ["The homeowner, until depreciation is released", "Nobody, if all conditions are met"] },
        ],
      }},
      3: { type: "steps", data: [
        { num: "1", title: "Claim approved", desc: "The carrier issues an estimate showing RCV, depreciation and ACV." },
        { num: "2", title: "First payment", desc: "The carrier pays ACV, minus the deductible." },
        { num: "3", title: "Work is completed", desc: "The roof is repaired or replaced and documented." },
        { num: "4", title: "Proof is sent", desc: "The final invoice and photos go to the carrier." },
        { num: "5", title: "Depreciation released", desc: "If the policy allows it, the held-back amount is paid." },
      ]},
      5: { type: "tip", data: { type: "info", title: "Read the policy, not the summary", text: "Whether depreciation is recoverable, how long you have to claim it and what proof is required are set by the policy and your state. Send homeowners to their policy and carrier for their own claim." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Recoverable depreciation is the part of a roof claim the insurance company holds back at first and may pay later, after the work is finished. It is the gap between the replacement cost of the roof and its actual cash value.\n\nThe usual sequence is that the carrier pays the actual cash value first, the contractor completes the work, and the carrier then releases the held-back amount once it sees proof. Whether this applies depends on the homeowner's policy, so treat this page as a general explanation and not as advice on a specific claim.",
      },
      {
        heading: "ACV vs. RCV in plain terms",
        content: "Replacement cost value (RCV) is what it costs to replace the damaged roofing with similar materials. Actual cash value (ACV) is that figure reduced by depreciation, which reflects the age and wear of what was damaged.\n\nA simple example with round numbers: if replacement cost is $15,000 and the carrier applies $5,000 of depreciation, ACV is $10,000. On a policy with replacement cost coverage, the carrier may pay $10,000 up front (less the deductible) and hold $5,000 as recoverable depreciation. These numbers are illustrative only and are not typical of any particular claim.",
      },
      {
        heading: "When recoverable depreciation gets paid",
        content: "Carriers generally release recoverable depreciation after the repair or replacement is complete and they receive proof, such as the final invoice or a completion certificate. Some policies set a deadline to claim it, so the homeowner should check the time limit in the policy.\n\nSome roof schedules and older roofs are handled differently. Certain policies pay roofs at actual cash value only, and in that case nothing is held back to be recovered later. The estimate from the carrier usually shows whether depreciation is marked recoverable or non-recoverable, so that is the first place to look.",
      },
      {
        heading: "How insurers decide the depreciation amount",
        content: "Carriers typically consider the roof's age, material, condition and remaining useful life. An older roof tends to carry more depreciation than a newer one. How depreciation is calculated, and whether labor is depreciated, varies by carrier and by state, so two similar claims can differ.\n\nIf the depreciation looks wrong, the homeowner can ask the adjuster how it was calculated. Documented roof condition from before the loss, such as dated photos or an inspection, can support a conversation. For how adjusters judge damage in general, see <a href='/blog/how-insurance-adjusters-determine-roof-damage'>how insurance adjusters determine roof damage</a>.",
      },
      {
        heading: "What a contractor can do to help",
        content: "A contractor cannot promise the carrier will release depreciation, but good paperwork removes common reasons for delay. Keep the final invoice itemized, make sure it matches the scope the carrier approved, and send photos that show the completed work.\n\nIf hidden damage was found at tear-off, the supplement and its documentation belong in the same file, so the carrier sees one consistent record. A complete package is easier to review. See <a href='/blog/supplemental-roofing-estimate-explained'>what a supplemental roofing estimate is</a> and the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> for what to include.",
      },
      {
        heading: "Common reasons depreciation is delayed",
        content: "The most common causes are simple: the final invoice does not match the approved estimate, proof of completion is missing, the work is not finished, or the claim deadline passed. Mortgage companies can also be named on the check, which adds a step for the homeowner.\n\nIf a payment is slow or denied, ask the carrier for the reason in writing, then fix the documentation gap. For disputes more broadly, see <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a supplement is denied</a>.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "Supplement Snap helps roofing contractors capture hidden damage and build a clear photo report during the job, so the file is ready when the carrier asks for proof. It does not decide depreciation, and it cannot guarantee that any amount is paid. <a href='/roofing-supplement-software'>See how it works</a> or look at the <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
    ],
    faq: [
      {
        q: "What is recoverable depreciation on a roof?",
        a: "It is the portion of a roof claim the insurer withholds at first and may pay after the repair or replacement is completed, if the policy provides replacement cost coverage.",
      },
      {
        q: "Is recoverable depreciation the same as the deductible?",
        a: "No. The deductible is the amount the homeowner pays out of pocket. Recoverable depreciation is money the carrier holds back and may release later.",
      },
      {
        q: "How long does it take to get recoverable depreciation?",
        a: "It varies. It is usually requested after the work is done and proof is sent, then reviewed by the carrier. Check the policy for any deadline.",
      },
      {
        q: "What if my policy only pays actual cash value?",
        a: "Then the carrier typically pays the depreciated amount and nothing is held back to be recovered later. The policy and the carrier's estimate show which applies.",
      },
      {
        q: "Can a contractor guarantee the depreciation will be paid?",
        a: "No. Payment depends on the policy, the claim and the carrier. A contractor can provide complete documentation that supports the request.",
      },
    ],
    related: ["how-insurance-adjusters-determine-roof-damage", "supplemental-roofing-estimate-explained", "roofing-supplement-denied-what-to-do", "how-roofing-contractors-work-insurance-claims"],
  },
  {
    slug: "does-insurance-cover-roof-replacement",
    images: { 0: { src: "/blog/does-insurance-cover-roof-replacement/card.png", alt: "Key points from the guide: Does Insurance Cover Roof Replacement? What Contractors Should Tell Homeowners", width: 1200, height: 630 } },
    title: "Does Insurance Cover Roof Replacement? What Contractors Should Tell Homeowners",
    metaTitle: "Does Insurance Cover Roof Replacement? A Contractor Guide",
    metaDescription: "When homeowners insurance may pay for a new roof, when it usually does not, and how contractors can explain coverage without promising an outcome.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "Insurance Information Institute (iii.org)", url: "https://www.iii.org" },
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
    ],
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Often considered", "Often not covered"],
        rows: [
          { feature: "Cause of damage", values: ["Sudden events such as hail, wind or a fallen tree", "Age, wear and tear, and neglected maintenance"] },
          { feature: "Typical payout", values: ["Repair or replacement, minus the deductible", "Usually no payment for the worn roof"] },
          { feature: "What helps", values: ["Dated photos, an inspection and a clear report", "Maintenance records that show upkeep"] },
        ],
      }},
      3: { type: "checklist", data: { title: "What to check in the policy", items: [
        { text: "Is the roof paid at replacement cost or actual cash value?", checked: true },
        { text: "Is there a separate wind or hail deductible?", checked: true },
        { text: "Is there a roof age schedule or cosmetic damage exclusion?", checked: true },
        { text: "What is the deadline to report a loss?", checked: true },
        { text: "Is depreciation recoverable after the work?", checked: true },
      ]}},
      5: { type: "tip", data: { type: "info", title: "Do not promise coverage", text: "Coverage is decided by the carrier under the policy. Contractors can document damage and explain the process, but telling a homeowner their roof will be covered can create problems for everyone." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Homeowners insurance may pay for a roof replacement when the roof was damaged by a covered event, such as hail, wind or a falling tree. It generally does not pay to replace a roof that is simply old or worn out.\n\nWhether a particular roof is covered depends on the policy, the cause of the damage and the carrier's decision. This guide is a general explanation for contractors who talk to homeowners every day, not advice on any one claim.",
      },
      {
        heading: "Covered events vs. wear and tear",
        content: "Policies commonly cover sudden and accidental damage and exclude gradual deterioration. A hailstorm that bruises shingles is a different kind of loss than shingles that have reached the end of their life.\n\nThe line is not always obvious. A roof can be both old and storm-damaged, and the adjuster has to separate the two. That is why clear evidence of the damage matters. See <a href='/blog/how-insurance-adjusters-determine-roof-damage'>how adjusters determine roof damage</a> and <a href='/blog/hail-damage-roof-inspection'>how a hail damage inspection works</a>.",
      },
      {
        heading: "Repair or full replacement",
        content: "Having covered damage does not always mean a full replacement. The carrier may approve a repair for a limited area, or a replacement when damage is widespread. Matching issues, such as discontinued shingles or code requirements, can influence the scope, and the rules vary by state and by carrier.\n\nBecause scope is a common point of disagreement, contractors often document each slope and the specific findings. For the topic of repair thresholds, see <a href='/blog/what-is-the-25-percent-rule-for-roofing'>the 25 percent rule for roofing</a>.",
      },
      {
        heading: "Policy details that change the outcome",
        content: "Several policy details change what a homeowner receives. Replacement cost coverage and actual cash value coverage pay differently. Some policies include a separate wind or hail deductible, often a percentage of the home's insured value. Some limit coverage for older roofs through a schedule, and some exclude cosmetic damage.\n\nA homeowner should read their own policy or ask their agent. A contractor should avoid interpreting policy language for them. The checklist above is a good list of questions to hand over.",
      },
      {
        heading: "How contractors can help without overpromising",
        content: "The most useful thing a contractor can do is document the roof well: dated photos, labeled findings and a written report. That helps the homeowner and the adjuster look at the same facts.\n\nIf the carrier approves the claim and the work reveals more damage, a supplement can request the additional items. See <a href='/blog/how-roofing-contractors-work-insurance-claims'>how contractors work insurance claims</a> and <a href='/blog/roof-inspection-report'>what goes into a roof inspection report</a>. Some states regulate what a contractor may say or do on a claim, so check your local rules.",
      },
      {
        heading: "What to say to a homeowner",
        content: "A fair, honest script: \"I can document what I see and give you a report. Whether your policy covers it is up to your insurance company. If they approve the claim and we find more damage during the work, we can submit a supplement.\"\n\nIt sets expectations and keeps you from guaranteeing an outcome you do not control.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "Supplement Snap helps roofing contractors capture and organize damage evidence during inspection and tear-off and send a clear report to the adjuster. It does not determine coverage or promise approval. <a href='/roofing-supplement-software'>Learn more</a> or see the <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
    ],
    faq: [
      {
        q: "Does homeowners insurance cover a new roof?",
        a: "It may when the roof is damaged by a covered event like hail or wind. It generally does not cover replacement due to age or wear. The policy and the carrier decide.",
      },
      {
        q: "Will insurance replace a roof that is 15 or 20 years old?",
        a: "Possibly, if a covered event damaged it, but some policies pay older roofs at actual cash value or limit coverage by age. Check the policy.",
      },
      {
        q: "Does insurance pay for a roof leak?",
        a: "It depends on the cause. A leak from storm damage may be covered, while a leak from wear or lack of maintenance often is not.",
      },
      {
        q: "Can a roofing contractor tell me if my claim will be approved?",
        a: "No. A contractor can document damage and explain the process, but the insurance company decides coverage.",
      },
      {
        q: "What if the insurance estimate is too low?",
        a: "A contractor can submit a supplement with documentation for missed items, and the homeowner can ask the carrier to review. Results depend on the claim.",
      },
    ],
    related: ["roof-shingle-matching-insurance-claim", "how-insurance-adjusters-determine-roof-damage", "hail-damage-roof-insurance-claim-documentation", "roof-leak-insurance-claim-contractor-guide", "what-is-the-25-percent-rule-for-roofing"],
  },
  {
    slug: "roof-inspection-checklist",
    images: { 0: { src: "/blog/roof-inspection-checklist/card.png", alt: "Key points from the guide: Roof Inspection Checklist for Roofing Contractors (Printable)", width: 1200, height: 630 } },
    downloads: "roof-damage-report-template",
    title: "Roof Inspection Checklist for Roofing Contractors (Printable)",
    metaTitle: "Roof Inspection Checklist for Contractors (Printable)",
    metaDescription: "A practical roof inspection checklist covering exterior, flashing, attic and decking, plus how to document findings for a client or insurance claim.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NRCA: Roofing resources", url: "https://www.nrca.net" },
      { text: "OSHA: Fall protection", url: "https://www.osha.gov/fall-protection" },
    ],
    visuals: {
      1: { type: "checklist", data: { title: "Exterior checklist", items: [
        { text: "Missing, cracked, curled or lifted shingles", checked: true },
        { text: "Granule loss and exposed mat", checked: true },
        { text: "Hail bruising or wind creasing", checked: true },
        { text: "Ridge and hip caps", checked: true },
        { text: "Gutters and downspouts", checked: true },
      ]}},
      2: { type: "checklist", data: { title: "Flashing and penetrations", items: [
        { text: "Pipe boots cracked or dried out", checked: true },
        { text: "Chimney and wall flashing", checked: true },
        { text: "Valleys and debris buildup", checked: true },
        { text: "Skylights and vents sealed", checked: true },
        { text: "Exposed or backed-out fasteners", checked: true },
      ]}},
      3: { type: "checklist", data: { title: "Attic and structure", items: [
        { text: "Water stains or dampness on the decking", checked: true },
        { text: "Soft or sagging decking", checked: true },
        { text: "Rafters and trusses for cracks or rot", checked: true },
        { text: "Ventilation and insulation", checked: true },
        { text: "Mold or musty odor", checked: true },
      ]}},
      5: { type: "tip", data: { type: "info", title: "Safety comes first", text: "Use proper fall protection and follow your company and OSHA rules. If a roof is wet, steep or looks unsafe to walk, document from the ground or by drone instead." } },
    },
    sections: [
      {
        heading: "Why use a roof inspection checklist",
        content: "A checklist keeps every inspection consistent, so you do not skip the same detail on a busy day. It also gives you a record you can show a homeowner or attach to an insurance claim.\n\nThis list is a general starting point. Adapt it to your roof types, local building codes and manufacturer requirements. For the report that follows the inspection, see <a href='/blog/roof-inspection-report'>how to write a roof inspection report</a>.",
      },
      {
        heading: "Exterior roof surface",
        content: "Walk or view the roof in a consistent order, such as slope by slope. Look for missing, cracked, curled or lifted shingles, granule loss, exposed fasteners and signs of hail bruising or wind creasing. Check ridge and hip caps, and look at gutters and downspouts for clogs, granules and damage.\n\nPhotograph each finding with a wide shot for location and a close shot for detail. For storm work, <a href='/blog/hail-damage-roof-inspection'>the hail damage inspection guide</a> goes deeper on what to look for.",
      },
      {
        heading: "Flashing, valleys and penetrations",
        content: "Most leaks start at the details, not in the middle of a shingle field. Check pipe boots, chimney and wall flashing, valleys, skylights and vents. Look for cracked or dried sealant, lifted flashing, rust, gaps and debris that holds water.\n\nNote the exact location of each finding so someone else can find it later. Labeling photos by slope or roof area keeps the report clear.",
      },
      {
        heading: "Attic, decking and structure",
        content: "From the attic, check the underside of the decking for water stains, dampness, daylight and mold. Look at rafters and trusses for cracks, bowing or rot, and check ventilation and insulation. From the roof, feel for soft spots or sagging.\n\nRotted decking is often found only at tear-off. If you discover it then, document it with photos and measurements. See <a href='/blog/document-rotted-roof-decking-tear-off'>how to document rotted decking at tear-off</a>.",
      },
      {
        heading: "Documenting findings",
        content: "Good documentation records what you saw, where, and the photo that shows it. Avoid guessing at cause in the field notes unless you can support it. Date the inspection, name the address and keep the photos with the notes.\n\nFor an insurance claim, a clear package makes it easier for the adjuster to follow your findings. The <a href='/blog/roof-damage-report-template'>roof damage report template</a> and the <a href='/free-roofing-supplement-checklist'>free supplement checklist</a> show what to include.",
      },
      {
        heading: "After the inspection",
        content: "Give the homeowner a written summary with the findings, the recommended work and the reasons. Be factual about what is storm damage, what is wear and what is unclear. If the roof is part of an insurance claim, tell them the carrier decides coverage and that you can supply documentation.\n\nKeep your photos organized by address and date so you can find them if the claim reopens or the carrier asks questions.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "Supplement Snap lets a crew capture photos, label the roof area and add notes by typing or voice, then builds a report for the adjuster. It is built for insurance restoration documentation, not as a full inspection or measurement platform. <a href='/roofing-supplement-software'>See how it works</a> or view the <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
    ],
    faq: [
      {
        q: "What should be on a roof inspection checklist?",
        a: "Exterior surface condition, flashing and penetrations, valleys and gutters, attic and decking condition, structural members and ventilation, plus photos and notes for each finding.",
      },
      {
        q: "How long does a roof inspection take?",
        a: "It varies with roof size, pitch and complexity. A thorough inspection with photos and attic access usually takes longer than a quick visual check.",
      },
      {
        q: "Do I need to go on the roof?",
        a: "Often, but safety comes first. Use fall protection, and if conditions are unsafe, document from the ground or with a drone.",
      },
      {
        q: "What photos should I take for an insurance claim?",
        a: "Wide shots to show location, close-ups to show detail, and labeled photos by slope, with the date and address recorded.",
      },
      {
        q: "Is there a free printable checklist?",
        a: "Yes. The free roofing supplement checklist on this site covers documentation for hidden damage and claim packages.",
      },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["steep-roof-charge-roofing-supplement", "roof-flashing-vents-pipe-jacks-insurance-supplement", "roof-inspection-report", "hail-damage-roof-inspection", "roof-damage-report-template", "document-rotted-roof-decking-tear-off"],
  },
  {
    slug: "supplement-snap-vs-roofgenius",
    title: "Supplement Snap vs RoofGenius: Which Fits a Small Roofing Company?",
    metaTitle: "Supplement Snap vs RoofGenius for Small Roofing Companies",
    metaDescription: "Supplement Snap vs RoofGenius compared on price, supplement limits, trial terms and what each does. We make Supplement Snap; verify details on each site.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "RoofGenius pricing (public page)", url: "https://roofgenius.ai/pricing" },
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Try the capture side on one real job.",
    midCtaBody: "Your first Supplement Snap project is free. Judge the report it produces before you pay for anything.",
    visuals: {
      2: { type: "matrix", data: {
        headers: ["Supplement Snap", "RoofGenius"],
        rows: [
          { feature: "Lowest plan with supplement features", values: ["Starter, $99 per month", "Growth, $597 per month"] },
          { feature: "Supplement limit on that plan", values: ["Unlimited projects", "Up to 5 supplement claims per month"] },
          { feature: "Users on that plan", values: ["1 (Team: 3, Pro: 5)", "Unlimited"] },
          { feature: "Extra supplements", values: ["No per-project fee on paid plans", "Claim credits: $149 single, $139 each in a 5-pack, $130 each in a 10-pack"] },
          { feature: "Free way to try it", values: ["First project free; 14-day trial on paid plans (card required)", "No free trial listed on the pricing page; a demo can be booked"] },
          { feature: "Measurements and proposals", values: ["Not offered", "Offered (satellite reports, proposals)"] },
        ],
      }},
      5: { type: "checklist", data: { title: "Questions to settle before you pick either", items: [
        { text: "How many supplements do I file in a typical month?", checked: true },
        { text: "Do I need measurements and proposals, or only supplement paperwork?", checked: true },
        { text: "Does my crew need to capture proof on the roof?", checked: true },
        { text: "How many people need a login?", checked: true },
        { text: "Can I test it on one real job before paying?", checked: true },
      ]}},
      6: { type: "tip", data: { type: "info", title: "Check the vendor sites before you decide", text: "Prices and features come from each company's public pages as seen on October 24, 2026. They change. We have not run RoofGenius on a job, so this compares what each company publishes, not how either performs." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Supplement Snap and RoofGenius solve overlapping but different problems. RoofGenius describes itself as an AI platform for roofing claims, with satellite measurements, proposals and supplement tools. Supplement Snap does one job: it helps your crew capture hidden damage at tear-off and turn it into a report for the adjuster.\n\nFor a small company that mainly needs supplement documentation, the price difference is large. For a company that wants measurements, proposals and supplements in one system, RoofGenius covers more ground.\n\nDisclosure: we make Supplement Snap. We have not tested RoofGenius, and everything below about it comes from its public pages as seen on October 24, 2026. Confirm current details on its site.",
      },
      {
        heading: "What each product is",
        content: "RoofGenius's pricing page lists four plans: Retail, Growth, Concierge and Elite. Retail covers measurement reports, proposals and AI damage detection from photos. Growth adds what the page calls AI Supplements and storm canvassing. Higher plans add a done-for-you service where you forward a claim and the company prepares the supplement.\n\nSupplement Snap is a field tool. Your crew photographs damage on the roof, tags the roof area and damage type, adds a note by typing or by voice, and the app drafts a written description of each finding that you review and edit. You then export a PDF report and email it to the adjuster. See the <a href='/roofing-supplement-software'>feature walkthrough</a> and a <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
      {
        heading: "Price and limits side by side",
        content: "The table lists what each company publishes. The tools are not identical, so a lower price does not mean the same work for less.\n\nOne detail matters for volume. RoofGenius's supplement plans are capped by claims per month, and extra claims are bought as credits or by contacting sales above 25 a month. Supplement Snap's paid plans allow unlimited projects, but a project is not the same thing as a claim, so count your own jobs.",
      },
      {
        heading: "A worked example, using only the posted prices",
        content: "This is arithmetic, not a savings claim. If you file four supplements in a month and use RoofGenius's Growth plan, you would pay $597 for the month, or $149.25 per claim for those four. If you used the five claims it allows, that is $119.40 per claim. A single claim credit is listed at $149.\n\nSupplement Snap's Starter plan is $99 for the month however many projects you run. That is $24.75 per project at four. The difference is real, but the tools do different work, so decide first what you need done.",
      },
      {
        heading: "What RoofGenius does that Supplement Snap does not",
        content: "• Measurements: satellite roof measurement reports, which its site lists at $10 each.\n• Proposals: branded retail proposals with digital sign-off.\n• Estimate audit: its AI Supplements feature is described as checking the carrier's estimate for missed line items, with code citations.\n• Done-for-you option: higher plans let you forward a claim and have the company prepare it.\n• Phone and chat support: its site lists a phone number and a live chat.\n\nSupplement Snap does none of these. It does not measure roofs, write proposals or audit a carrier's estimate. If those are your bottlenecks, it is not the right tool for them.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "Supplement Snap starts from the roof instead of from the carrier's estimate. It is built for the crew member on the roof who needs to capture proof quickly, including voice notes that are translated to English for the report when a crew member speaks Spanish.\n\nIt is a lower-cost option for a company with one to a few crews that wants clean, consistent documentation to send with supplements. The Starter plan is $99 per month, Team is $199 and adds an Xactimate-style CSV export and email open tracking, and Pro is $299. Check the <a href='/pricing'>pricing page</a> for the current details.",
      },
      {
        heading: "How to choose without guessing",
        content: "Run the same real job through each option you are considering. Time the work from the first photo to a package you could send, then show each result to someone who was not on the roof.\n\nThen ask what the tool does if the adjuster pushes back. A report helps, but approval depends on the claim, the policy, the carrier and your documentation, and no software changes that. For a broader view of the category, read our <a href='/blog/best-roofing-supplement-software'>roofing supplement software comparison</a> and the guide to <a href='/blog/roofing-supplement-companies-vs-software'>companies versus software</a>.",
      },
    ],
    faq: [
      {
        q: "Is Supplement Snap a RoofGenius alternative?",
        a: "For supplement documentation, yes. For measurements, proposals and estimate audits, no. Supplement Snap does one job, capturing hidden damage and building the adjuster report, so it suits companies that do not need a full platform.",
      },
      {
        q: "How much does RoofGenius cost?",
        a: "Its public pricing page listed Retail at $297 per month, Growth at $597, Concierge at $997 and Elite at $1,997 as of October 24, 2026, with supplement claims capped per plan. Confirm current prices on its site.",
      },
      {
        q: "How much does Supplement Snap cost?",
        a: "The first project is free. Paid plans are Starter at $99 per month, Team at $199 and Pro at $299, each with a 14-day free trial that requires a card. See the pricing page for current details.",
      },
      {
        q: "Does RoofGenius offer a free trial?",
        a: "No free trial was listed on its pricing page when we looked, though a demo can be booked. Ask the company for current terms.",
      },
      {
        q: "Will either tool get my supplement approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation. Software can make your package clearer and more complete.",
      },
    ],
    related: ["best-roofing-supplement-software", "roofing-supplement-companies-vs-software", "ai-roofing-supplement-tools-compared", "roofing-supplement-software-cost"],
  },
  {
    slug: "ai-roofing-supplement-tools-compared",
    title: "AI Roofing Supplement Tools Compared: What Each One Actually Does",
    metaTitle: "AI Roofing Supplement Tools Compared (2026)",
    metaDescription: "AI roofing supplement tools compared by job: estimate audits, storm CRMs and field documentation, with listed prices and gaps marked. We make Supplement Snap.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "RoofGenius pricing (public page)", url: "https://roofgenius.ai/pricing" },
      { text: "HailMate", url: "https://hailmate.ai" },
      { text: "CapOut", url: "https://capout.ai" },
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Test one tool on a real job before you pay.",
    midCtaBody: "Your first Supplement Snap project is free. Run the same job through any tool you are comparing and judge the output.",
    visuals: {
      2: { type: "matrix", data: {
        headers: ["Main job", "Price listed", "Free trial listed"],
        rows: [
          { feature: "RoofGenius", values: ["Platform: measurements, proposals, supplement audit", "Growth $597 per month (up to 5 supplement claims)", "None listed; demo available"] },
          { feature: "HailMate", values: ["Storm roofing CRM with a supplement engine", "Team $299 per month for up to 10 users; from $79 for hail maps only", "None listed; 15-minute demo offered"] },
          { feature: "CapOut", values: ["Turns carrier estimate PDFs into structured data and Xactimate files", "Not listed", "Get started free, no card; length not listed"] },
          { feature: "Roof Report Pro", values: ["AI tags damage types in photos, builds PDF reports", "Not checked here", "Not checked here"] },
          { feature: "RAFTER AI", values: ["Markets automated Xactimate supplements and scope audits", "Not listed", "Not listed"] },
          { feature: "Supplement Snap", values: ["Field capture and the adjuster report", "Starter $99, Team $199, Pro $299 per month", "First project free; 14-day trial, card required"] },
        ],
      }},
      4: { type: "checklist", data: { title: "Ask any AI supplement tool these questions", items: [
        { text: "Can I edit every line before it goes to the adjuster?", checked: true },
        { text: "Does it show where each suggestion comes from?", checked: true },
        { text: "What happens to my photos and claim documents?", checked: true },
        { text: "What does it cost at my real monthly volume?", checked: true },
        { text: "Can I test it on one real job first?", checked: true },
      ]}},
      5: { type: "tip", data: { type: "info", title: "Details change and some are not published", text: "This table reflects public pages as seen on October 24, 2026, and it marks what we could not confirm. Check each vendor's site, and do not send any AI output to an adjuster without reading it." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "AI roofing supplement tools fall into three groups, and comparing them as one list leads to bad choices. Some read the carrier's estimate and look for missing items. Some are whole-business systems for storm roofers. Some help your crew capture and present the proof from the roof.\n\nChoose by the job that slows you down. Disclosure: we make Supplement Snap, which is in the third group. We have not tested the other tools, so this compares what their public pages say.",
      },
      {
        heading: "The three jobs these tools do",
        content: "• Audit the estimate: read the adjuster's estimate and flag items to check. RoofGenius describes this for its supplement plans, and CapOut converts carrier PDFs into structured data and Xactimate files.\n• Run the business: manage storm leads, claims, estimating and invoicing, with supplement features inside. HailMate describes itself this way.\n• Document the damage: capture photos and notes on the roof and produce the report. Supplement Snap and Roof Report Pro are in this group.\n\nMany products blend these. Use the table to see where each one starts.",
      },
      {
        heading: "Tool by tool, using what each company publishes",
        content: "The table lists the main job, the price and the trial as each company shows them. Where a number was not published, it says so rather than guessing.\n\nRoofGenius lists Growth at $597 per month with up to five supplement claims, and bundles of claim credits from $149 each. HailMate lists a Team plan at $299 per month for up to ten users and a hail-maps-only start from $79. CapOut shows no prices on the page we read and offers to get started free without a card.",
      },
      {
        heading: "What AI can and cannot do here",
        content: "AI can read a long PDF quickly, organize photos and draft wording. It can also be wrong, and the cost of a wrong line in front of an adjuster falls on you.\n\nTreat every AI suggestion as a draft. A code citation needs checking against your local requirements. A missing item needs checking against your photos and the policy. A narrative needs to match what your crew actually saw. In Supplement Snap, the written descriptions are drafts you review and edit before anything is sent.",
      },
      {
        heading: "How to compare them fairly",
        content: "Pick one finished job and run it through each tool you are considering. Use the same photos and the same adjuster estimate. Time the work, then look at the output as the adjuster would.\n\nFor how this category fits with Xactimate and photo apps, see our <a href='/blog/best-roofing-supplement-software'>roofing supplement software overview</a>. For a head-to-head on price and limits, see <a href='/blog/supplement-snap-vs-roofgenius'>Supplement Snap vs RoofGenius</a>.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "Supplement Snap is for the documentation job. Your crew captures labeled photos and notes during tear-off, including voice notes translated from Spanish, and exports a PDF to email to the adjuster. It does not audit a carrier's estimate, measure roofs or run your business.\n\nIt is priced for smaller companies: the first project is free, then Starter is $99 per month, Team $199 and Pro $299. See the <a href='/roofing-supplement-software'>feature walkthrough</a> and a <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
    ],
    faq: [
      {
        q: "What is the best AI roofing supplement tool?",
        a: "It depends on the job. Estimate audit tools, storm CRMs and field documentation tools solve different problems. Pick by where your supplements slow down, and test on a real job.",
      },
      {
        q: "Can AI write a roofing supplement for me?",
        a: "It can draft parts of one, but you are responsible for what is sent. Review every description, line item and code citation against your photos, the estimate and your local requirements.",
      },
      {
        q: "Do these tools replace Xactimate?",
        a: "No. Xactimate is the estimating software most carriers use. These tools work alongside it, by converting files, auditing estimates or documenting damage.",
      },
      {
        q: "Are AI supplement tools worth it for a small roofing company?",
        a: "It depends on your volume and where time is lost. If paperwork is slowing you down and photos and notes get separated, a documentation tool may help. Compare the real monthly cost at your volume.",
      },
      {
        q: "Will an AI tool guarantee my supplement is approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation. No software can guarantee it.",
      },
    ],
    related: ["supplement-snap-vs-roofgenius", "best-roofing-supplement-software", "xactimate-roofing-software-explained", "companycam-alternative-roofing-supplements"],
  },
  {
    slug: "roofing-supplement-software-cost",
    images: { 0: { src: "/blog/roofing-supplement-software-cost/card.png", alt: "Key points from the guide: How Much Does Roofing Supplement Software Cost? A 2026 Price Guide", width: 1200, height: 630 } },
    title: "How Much Does Roofing Supplement Software Cost? A 2026 Price Guide",
    metaTitle: "Roofing Supplement Software Cost: 2026 Price Guide",
    metaDescription: "What roofing supplement software costs: monthly plans, per-claim credits and outsourced services, using prices companies publish. We make Supplement Snap.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "RoofGenius pricing (public page)", url: "https://roofgenius.ai/pricing" },
      { text: "HailMate", url: "https://hailmate.ai" },
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Find your own cost per supplement.",
    midCtaBody: "Your first Supplement Snap project is free. Run one real job and see what the work takes before you commit to a plan.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Model", "Published price"],
        rows: [
          { feature: "Supplement Snap", values: ["Flat monthly plans", "First project free; Starter $99, Team $199, Pro $299 per month"] },
          { feature: "RoofGenius", values: ["Monthly plan with a claim cap, plus credits", "Growth $597 per month (up to 5 claims); credits $149 single, $139 in a 5-pack, $130 in a 10-pack"] },
          { feature: "HailMate", values: ["Monthly storm CRM", "Team $299 per month (up to 10 users); from $79 for hail maps only"] },
          { feature: "Supplement writing service", values: ["Per supplement", "One company lists $150 per supplement; confirm on its site"] },
          { feature: "Xactimate (estimating)", values: ["Monthly subscription", "A third-party listing shows about $350 per month as a baseline; confirm with Verisk"] },
        ],
      }},
      3: { type: "matrix", data: {
        headers: ["Monthly cost for 4 supplements", "Per supplement"],
        rows: [
          { feature: "Supplement Snap Starter ($99 per month)", values: ["$99", "$24.75"] },
          { feature: "RoofGenius Growth ($597 per month, 4 of 5 claims)", values: ["$597", "$149.25"] },
          { feature: "RoofGenius single claim credits ($149 each)", values: ["$596", "$149"] },
          { feature: "Writing service at $150 each", values: ["$600", "$150"] },
        ],
      }},
      5: { type: "checklist", data: { title: "Total cost checklist", items: [
        { text: "Monthly price at the plan I would actually need", checked: true },
        { text: "Limits: claims, projects, users or storage", checked: true },
        { text: "Extra fees for going over a limit", checked: true },
        { text: "Whether a card is needed to start a trial", checked: true },
        { text: "Time my office spends reviewing the output", checked: true },
        { text: "Whether I can cancel and export my data", checked: true },
      ]}},
    },
    sections: [
      {
        heading: "The short answer",
        content: "Roofing supplement software costs anywhere from nothing to a few thousand dollars a month, because the phrase covers very different products. A documentation tool for one crew can cost under $100 a month. A full roofing platform with supplement features can cost several hundred. A service that writes the supplement for you charges per job.\n\nDisclosure: we make Supplement Snap. The prices below come from each company's public pages as seen on October 24, 2026, and they change, so confirm them on the vendor's site.",
      },
      {
        heading: "The four ways these tools charge",
        content: "• Flat monthly plans: a set price for a plan, often with limits on users or projects.\n• Monthly plans with a claim cap: a higher price that includes a number of supplement claims, with extra claims bought separately.\n• Whole-business software: a CRM or platform where supplements are one feature among many.\n• Per-supplement services: someone else writes the supplement for a fee per job.\n\nThe table lists what a few companies publish. It is not a ranking, and the products do different work.",
      },
      {
        heading: "What drives the real cost",
        content: "The monthly price is only part of it. Check the plan limits, since a cap on claims or users changes the cost at your volume. Check what happens beyond the limit, such as credits or a call to sales. Check whether a trial needs a card, and what happens to your data if you leave.\n\nThe largest cost is often your own time. A cheap tool that needs heavy editing can cost more than a pricier one that produces a clean report. That is why testing on a real job matters more than the sticker price.",
      },
      {
        heading: "A worked example, using only the posted prices",
        content: "Suppose you file four supplements in a month. This is plain arithmetic from posted prices, not a savings claim, and the tools do different work.\n\nOn Supplement Snap Starter, the month costs $99, or $24.75 per project. On RoofGenius Growth, the month costs $597, or $149.25 for each of four claims. Buying four single RoofGenius claim credits at $149 would cost $596. A service that lists $150 per supplement would cost $600.\n\nAt higher volume the gaps change. A capped plan gets cheaper per claim as you use more of the cap, and a flat plan gets cheaper per project as you run more jobs.",
      },
      {
        heading: "Which cost model fits which company",
        content: "• One or two crews, a handful of supplements a month: a flat, low-cost documentation tool usually fits.\n• A company that wants measurements, proposals and supplements in one system: a platform may justify a higher price.\n• A company with no office time at all: a per-supplement service trades money for time, and you share control of the file.\n\nFor how these options compare in practice, read the <a href='/blog/roofing-supplement-companies-vs-software'>guide to companies versus software</a> and the <a href='/blog/best-roofing-supplement-software'>software overview</a>.",
      },
      {
        heading: "Supplement Snap pricing",
        content: "Supplement Snap's first project is free. Paid plans are Starter at $99 per month with unlimited projects and one user, Team at $199 with up to three users, an Xactimate-style CSV export and email open tracking, and Pro at $299 with up to five users and custom branding. Paid plans start with a 14-day free trial that requires a card, and you can cancel before it ends.\n\nSee the <a href='/pricing'>pricing page</a> for current details, and a <a href='/roofing-supplement-report-example'>sample report</a> to see what you would be paying for.",
      },
    ],
    faq: [
      {
        q: "How much does roofing supplement software cost?",
        a: "Prices range widely. Companies publish plans from under $100 per month for a documentation tool to several hundred for a platform, and some services charge per supplement. Compare at your real monthly volume.",
      },
      {
        q: "Is there free roofing supplement software?",
        a: "Some tools offer a free first project or a free trial, which lets you test before paying. A fully featured paid tool is rarely free for ongoing use. Supplement Snap's first project is free.",
      },
      {
        q: "Is it cheaper to hire a supplement service?",
        a: "It depends on volume. A per-supplement fee can cost less at very low volume and more as volume grows. You also share control of the file and depend on the service's turnaround.",
      },
      {
        q: "Does Xactimate cost extra?",
        a: "Xactimate is a separate subscription from Verisk, and many contractors use it alongside a documentation tool. Confirm current pricing with Verisk.",
      },
      {
        q: "Will paying more get my supplement approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation, not on the price of the tool.",
      },
    ],
    related: ["questions-to-ask-before-buying-roofing-supplement-software", "is-roofing-supplement-software-worth-it", "best-roofing-supplement-software", "roofing-supplement-companies-vs-software", "supplement-snap-vs-roofgenius", "ai-roofing-supplement-tools-compared", "free-roofing-supplement-software"],
  },
  {
    slug: "best-app-to-document-roof-damage-for-insurance",
    title: "5 Best Apps to Document Roof Damage for Insurance Claims (2026)",
    metaTitle: "5 Best Apps to Document Roof Damage (2026)",
    metaDescription: "Roof damage documentation apps compared: CompanyCam, Manifold, LibreCam, Roof Report Pro and Supplement Snap, with listed prices. We make Supplement Snap.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "CompanyCam pricing (public page)", url: "https://www.companycam.com/pricing" },
      { text: "Manifold for roofing contractors", url: "https://www.scanmanifold.com/roofing-contractors" },
      { text: "LibreCam", url: "https://librecam.com" },
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "See the report before you pick an app.",
    midCtaBody: "Your first Supplement Snap project is free. Photograph one real job and judge the PDF it produces.",
    visuals: {
      2: { type: "matrix", data: {
        headers: ["Built for", "Price as listed", "Trial as listed"],
        rows: [
          { feature: "CompanyCam", values: ["General job photos and reports for many trades", "Core $63, Crew $129, Scale $199 per month; extra users $29 (page does not say which billing cycle)", "Free trial; length not shown"] },
          { feature: "Manifold", values: ["Photo documentation with PDF export and share links", "Photo $16 per user per month; Photo + Scan $24; no seat minimum per its page", "14 days, no card"] },
          { feature: "LibreCam", values: ["Free photo capture for crews, with offline mode", "$0 for unlimited users, per its own page", "Not applicable"] },
          { feature: "Roof Report Pro", values: ["AI damage tagging and PDF inspection reports", "Not checked here", "Not checked here"] },
          { feature: "Supplement Snap", values: ["Damage capture tied to supplement findings and the adjuster report", "Starter $99, Team $199, Pro $299 per month", "First project free; 14-day trial, card required"] },
        ],
      }},
      4: { type: "checklist", data: { title: "Test any documentation app on one real job", items: [
        { text: "Does every photo stay attached to a finding and a note?", checked: true },
        { text: "Are time and location recorded on each photo?", checked: true },
        { text: "Can I share or export one clear report an adjuster can open?", checked: true },
        { text: "Does it work with a weak signal on the roof?", checked: true },
        { text: "What is the cost for my real crew size?", checked: true },
        { text: "Can I take my photos and reports with me if I leave?", checked: true },
      ]}},
      5: { type: "tip", data: { type: "info", title: "Ask your adjuster what they accept", text: "None of the companies' pages we read confirmed which carriers accept their reports. Prices and features come from public pages seen on October 24, 2026 and change. Confirm the format with the adjuster on your claim and with each vendor." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "The best app to document roof damage depends on what you do with the photos. A general photo app is enough if you only need organized, time-stamped pictures. A documentation tool built for supplements fits better if you need findings, notes and a report to send to the adjuster.\n\nDisclosure: we make Supplement Snap. We have not tested the other apps, so this compares what their public pages say as seen on October 24, 2026. Confirm current details on each site. For the broader picture, see our <a href='/blog/companycam-alternative-roofing-supplements'>CompanyCam alternative guide</a>.",
      },
      {
        heading: "What a claim package needs from your photos",
        content: "An adjuster has to be able to tell what a photo shows, where on the roof it was taken and which line item it supports. A pile of unlabeled pictures forces them to guess.\n\nSo look for these things in any app: a label or note on each photo, a record of when and where it was taken, a way to group photos by roof area, and a report that puts them in one document. Our <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a> lists what to photograph at tear-off, and the guide to <a href='/blog/organize-roofing-supplement-photos-by-claim'>organizing photos by claim</a> covers naming.",
      },
      {
        heading: "The 5 apps side by side",
        content: "The table lists what each company publishes. These tools do different jobs, so a lower price is not the same work for less. A few notes on the numbers:\n\nCompanyCam's pricing page shows $63, $129 and $199 per month but does not say which billing cycle those figures use, and it notes annual billing saves 20 percent. Manifold's page lists $16 per user per month with no seat minimum, while one third-party roundup reported a minimum, so confirm with Manifold. LibreCam's figures are its own claims on a page it wrote.",
      },
      {
        heading: "Photo apps and documentation tools are different things",
        content: "CompanyCam is a general job photo app. Its pricing page describes timestamped photos, auto-organized project history and job reports, and it does not mention insurance claims on that page. Many contractors use it well for before-and-after records.\n\nManifold's page describes GPS-tagged photos, exports to a branded PDF and share links that adjusters can open without an account. LibreCam describes free capture with voice captions and offline use. Those are vendor claims. Roof Report Pro, per its Capterra listing, uses AI to tag damage types in photos and produce PDF reports, and it lists integrations with JobNimbus and CompanyCam.\n\nSupplement Snap sits closer to the supplement itself. Your crew photographs damage on the roof, tags the roof area and damage type, adds a typed or voice note, and the app drafts a written description of each finding that you review and edit. You then email a PDF to the adjuster. See the <a href='/roofing-supplement-software'>feature walkthrough</a> and a <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
      {
        heading: "How to choose and test",
        content: "Run the same real job through two or three apps. Photograph the same roof, add the same notes, and time how long it takes to get from the first photo to a package you could send. Then show each result to someone who was not on the roof.\n\nIf photos are your only problem, a lower-cost photo app may be enough. If your bottleneck is turning photos and notes into a clear supplement package, test a documentation tool. For how these fit with estimating software, read our <a href='/blog/best-roofing-supplement-software'>roofing supplement software overview</a>.",
      },
      {
        heading: "Where Supplement Snap fits, and where it does not",
        content: "Supplement Snap is built for one job: documenting hidden damage found at tear-off and producing the report for the adjuster. It is not a general job photo app for every trade, a CRM or an estimating tool. The first project is free. Paid plans are Starter at $99 per month, Team at $199 with up to three users, an Xactimate-style CSV export and email open tracking, and Pro at $299. Check the <a href='/pricing'>pricing page</a> for current details.",
      },
    ],
    faq: [
      {
        q: "What is the best app to document roof damage?",
        a: "It depends on whether you need organized photos or a full supplement package. Photo apps cover the first, and documentation tools built for supplements cover the second. Test on one real job and compare the report.",
      },
      {
        q: "Do adjusters accept photos from these apps?",
        a: "None of the vendor pages we read confirmed carrier acceptance. Ask the adjuster on your claim what format and detail they need, and send clear, labeled photos with a short factual note.",
      },
      {
        q: "Is there a free app for documenting roof damage?",
        a: "Some apps offer free plans or free trials, and LibreCam says its free tier covers unlimited users. A free tool may lack reports or support, so check what you need. Supplement Snap's first project is free.",
      },
      {
        q: "Is CompanyCam good for insurance claims?",
        a: "Many contractors use it for time-stamped photos and job records. Its pricing page does not describe insurance workflows, so confirm that its reports meet what your adjuster needs.",
      },
      {
        q: "Will a documentation app get my claim approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation. An app can make your package clearer and more complete.",
      },
    ],
    related: ["roofing-supplement-software-field-test-checklist", "companycam-alternative-roofing-supplements", "roofing-photo-documentation-checklist", "best-roofing-supplement-software", "ai-roofing-supplement-tools-compared", "supplement-snap-vs-roof-report-pro", "roofing-documentation-spanish-speaking-crews"],
  },
  {
    slug: "claimtrax-vs-suppx-vs-supplement-snap",
    title: "ClaimTrax vs SuppX vs Supplement Snap: Which Supplement Tool Fits?",
    metaTitle: "ClaimTrax vs SuppX vs Supplement Snap Compared",
    metaDescription: "ClaimTrax, SuppX and Supplement Snap compared: tracking, outsourcing or documenting supplements, with listed prices and gaps marked. We make Supplement Snap.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "ClaimTrax for contractors", url: "https://myclaimtrax.com/contractors" },
      { text: "SuppX on the App Store", url: "https://apps.apple.com/us/app/suppx/id6642710466" },
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Try the documentation side on one job.",
    midCtaBody: "Your first Supplement Snap project is free. Judge the report it builds before you decide what else you need.",
    visuals: {
      2: { type: "matrix", data: {
        headers: ["What it is", "Price shown", "Trial shown"],
        rows: [
          { feature: "ClaimTrax", values: ["Supplement management software: claims with owners and deadlines, follow-up reminders, optional outside supplementers", "Not shown on the page we read", "Free for 14 days; no card, no call"] },
          { feature: "SuppX", values: ["Free iPhone and iPad app; per its listing, a team handles negotiating and follow-ups", "App listed as free; fees for the claim service not shown", "Not shown"] },
          { feature: "Supplement Snap", values: ["Field damage capture and the adjuster report", "Starter $99, Team $199, Pro $299 per month", "First project free; 14-day trial, card required"] },
        ],
      }},
      3: { type: "checklist", data: { title: "Questions to settle before you pick", items: [
        { text: "Is my problem tracking claims, doing the follow-up, or building the documentation?", checked: true },
        { text: "Do I have someone in the office to chase adjusters?", checked: true },
        { text: "What does the service cost, and is the price shown before I commit?", checked: true },
        { text: "Who controls the claim file and my photos?", checked: true },
        { text: "Can I test it on one real job first?", checked: true },
      ]}},
      4: { type: "tip", data: { type: "info", title: "Details are limited and change", text: "ClaimTrax shows no prices on the page we read, and SuppX's listing does not explain its pricing or process. This comparison reflects public pages seen on October 24, 2026. Ask each company for current terms." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "These three tools solve different parts of the supplement problem. ClaimTrax tracks supplements so none stall. SuppX describes itself as an app where a team handles the insurance follow-up for you. Supplement Snap helps your crew capture hidden damage on the roof and build the report the adjuster sees.\n\nThe right one depends on whether your bottleneck is tracking, follow-up or documentation. Disclosure: we make Supplement Snap. We have not tested ClaimTrax or SuppX, and everything about them comes from their public pages as seen on October 24, 2026.",
      },
      {
        heading: "Three different jobs",
        content: "• Track: keep every open supplement in one place with an owner, a deadline and a reminder. ClaimTrax is described this way.\n• Outsource the chasing: send the claim to someone else who handles the back-and-forth. SuppX's listing describes this, and ClaimTrax offers outside supplementers through what it calls ClaimXchange.\n• Document: capture the proof on the roof and produce the package. Supplement Snap does this.\n\nThey can work together. A company might document in one tool and track in another. We have not tested any pairing, and we do not list an integration with either.",
      },
      {
        heading: "What each company publishes",
        content: "ClaimTrax describes software for roofing and restoration contractors. Each claim has an assigned owner and a deadline, and follow-up reminders fire at 48 hours. You can run your own supplement team in it or bring in outside supplementers while you keep the file. It lists an integration with the ProLine CRM and shows free for 14 days with no card and no call. The page we read showed no prices.\n\nSuppX is listed on the App Store as a free iPhone and iPad app from The Simple App Inc. Its description says you can submit supplements from the job site and track progress while the company's team handles negotiating, follow-ups and insurer communication. The listing does not explain how that service is priced or how it works, and it showed two ratings.\n\nSupplement Snap has plans at $99, $199 and $299 per month and a free first project. Paid plans start with a 14-day trial that requires a card.",
      },
      {
        heading: "Who each fits",
        content: "• A company with a pile of open supplements and no system: tracking software like ClaimTrax addresses that.\n• A company with no office time at all: a done-for-you model like the one SuppX describes trades cost and control for time. Ask what it charges before you submit a claim.\n• A company whose supplements are weak because proof is scattered across phones: a documentation tool like Supplement Snap addresses that.\n\nFor how outsourcing compares with doing the work yourself, read <a href='/blog/roofing-supplement-companies-vs-software'>supplement companies versus software</a>. For prices across the category, see the <a href='/blog/roofing-supplement-software-cost'>cost guide</a>.",
      },
      {
        heading: "Where Supplement Snap fits, and where it does not",
        content: "Supplement Snap does not track claim status or deadlines, and it does not chase adjusters. It captures labeled photos and notes on the roof, including voice notes that are translated to English when a crew member speaks Spanish, drafts a written description of each finding for you to review, and produces a PDF to email. Team plans can see when the adjuster opens the email.\n\nSee the <a href='/roofing-supplement-software'>feature walkthrough</a>, a <a href='/roofing-supplement-report-example'>sample report</a> and the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "Is Supplement Snap a ClaimTrax alternative?",
        a: "They do different jobs. ClaimTrax tracks supplements, while Supplement Snap captures the damage and builds the report. Some companies could use both. Choose by where your supplements slow down.",
      },
      {
        q: "What is SuppX?",
        a: "Per its App Store listing, SuppX is a free iPhone and iPad app where roofers submit supplements and a team handles insurer follow-ups. The listing does not explain pricing, so ask the company before you submit a claim.",
      },
      {
        q: "Does ClaimTrax have a free trial?",
        a: "Its page says free for 14 days with no card and no call. It did not show what happens afterward or what it costs.",
      },
      {
        q: "Can Supplement Snap track my open supplements?",
        a: "Not as claim-management software. It stores your projects, photos and reports, but it does not assign owners, set deadlines or send follow-up reminders.",
      },
      {
        q: "Will any of these get my supplement approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation. No software can guarantee it.",
      },
    ],
    related: ["roofing-supplement-companies-vs-software", "roofing-supplement-software-cost", "best-roofing-supplement-software", "roofing-supplement-follow-up-log", "supplement-snap-vs-acculynx-supplements", "free-roofing-supplement-software"],
  },
  {
    slug: "roofing-supplement-software-for-small-roofing-companies",
    images: { 0: { src: "/blog/roofing-supplement-software-for-small-roofing-companies/card.png", alt: "Key points from the guide: Roofing Supplement Software for Small Roofing Companies: Do You Need It?", width: 1200, height: 630 } },
    title: "Roofing Supplement Software for Small Roofing Companies: Do You Need It?",
    metaTitle: "Roofing Supplement Software for Small Companies",
    metaDescription: "Do small roofing companies need supplement software? Compare spreadsheets, software and services by claim volume and cost. We make Supplement Snap.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "Roof Sales Mastery: outsourcing supplements", url: "https://roofsalesmastery.com/outsourcing-supplements-for-roofers-insurance-claims/" },
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Find out on one real job.",
    midCtaBody: "Your first Supplement Snap project is free. Run one tear-off through it and see whether it saves you time.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Good fit when", "Main limit"],
        rows: [
          { feature: "Spreadsheet and folders", values: ["Few active claims and someone organized", "Photos and notes drift apart; no report"] },
          { feature: "Supplement documentation software", values: ["Paperwork is slow or proof is scattered", "Does not track claims or chase adjusters"] },
          { feature: "Claim tracking software", values: ["Many open supplements stalling", "Does not capture the proof for you"] },
          { feature: "Supplement service", values: ["No office time at all", "Cost per claim; you share control of the file"] },
        ],
      }},
      3: { type: "matrix", data: {
        headers: ["Example cost for one $3,000 supplement"],
        rows: [
          { feature: "Service at 15 percent of recovery (one vendor's stated range)", values: ["$450"] },
          { feature: "Service at 25 percent of recovery (same range)", values: ["$750"] },
          { feature: "Supplement Snap Starter for the whole month", values: ["$99"] },
        ],
      }},
      5: { type: "steps", data: [
        { num: "1", title: "Count your claims", desc: "Note how many supplements you file in a typical month." },
        { num: "2", title: "Time one", desc: "Track hours from first photo to a sendable package." },
        { num: "3", title: "Test a tool on one job", desc: "Use a free project or trial and compare the time and the report." },
        { num: "4", title: "Decide on your numbers", desc: "Compare the monthly cost with the hours it saved." },
      ]},
    },
    sections: [
      {
        heading: "The short answer",
        content: "A small roofing company may not need supplement software. If you file only a few supplements a year and keep your photos organized, a spreadsheet and a folder system can work. Software starts to help when paperwork is slowing you down or your photos and notes keep getting separated.\n\nOne roofing-sales training site says a small roofer handling about 10 to 15 claims a year may be able to manage supplements internally. That is a vendor's view, not a rule, so count your own claims. Disclosure: we make Supplement Snap, which is one of the options below.",
      },
      {
        heading: "Four ways small companies handle supplements",
        content: "The table compares the main options by when each fits and what limits it. Many companies combine two of them.\n\nThere is no single right answer. The right one depends on your claim volume, how much office time you have and what is actually slowing you down.",
      },
      {
        heading: "What each option costs",
        content: "A spreadsheet is free apart from your time. Software for a small company is typically a flat monthly fee. Supplement Snap's plans are $99, $199 and $299 per month, with a free first project. Prices elsewhere vary widely, and our <a href='/blog/roofing-supplement-software-cost'>cost guide</a> lists what several companies publish.\n\nSupplement services charge either a flat fee per supplement or a share of what they recover. One vendor-written comparison says third-party services typically charge 15 to 25 percent of the amount recovered, and its example is $450 to $750 on a $3,000 supplement. That is one vendor's claim, not a verified market rate, so ask any service for its terms in writing.",
      },
      {
        heading: "A worked example",
        content: "This is arithmetic from the figures above, not a savings claim. On a single $3,000 supplement, a service at 15 percent would cost $450 and at 25 percent $750. A software plan costs the same monthly price however many projects you run, so Supplement Snap's Starter plan is $99 for the month.\n\nThe comparison is not like for like. A service writes and chases the supplement. Software helps your crew document it and you do the rest. Pick based on whether you have the time to do the work yourself.",
      },
      {
        heading: "Signs software would help",
        content: "• Photos and notes live in different places, and you rebuild the story from memory.\n• Your reports look different every time.\n• You spend your evenings turning phone photos into a document.\n• Crew members describe damage inconsistently.\n• You file more supplements than you can comfortably track by hand.\n\nIf none of these sound like you, a spreadsheet may be enough for now. See our <a href='/roofing-supplement-software-vs-spreadsheets'>comparison of supplement software and spreadsheets</a>.",
      },
      {
        heading: "How to decide without guessing",
        content: "Count your claims, time one supplement from the first photo to a package you could send, and test a tool on one real job. Then compare the monthly cost with the hours it saved.\n\nFor how the whole category compares, read our <a href='/blog/best-roofing-supplement-software'>roofing supplement software overview</a> and the guide to <a href='/blog/roofing-supplement-companies-vs-software'>companies versus software</a>.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "Supplement Snap is built for small crews that want consistent documentation. Your crew photographs damage on the roof, tags it, adds a typed or voice note, and the app drafts a description of each finding that you review. You export a PDF and email it to the adjuster. It does not track claims, chase adjusters or measure roofs. See the <a href='/roofing-supplement-software'>feature walkthrough</a>, a <a href='/roofing-supplement-report-example'>sample report</a> and the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "Do small roofing companies need supplement software?",
        a: "Not always. With few claims and organized files, a spreadsheet can work. Software helps when paperwork is slow or proof is scattered. Count your own claims and test on one job.",
      },
      {
        q: "How much does supplement software cost for a small company?",
        a: "Companies publish a wide range. Supplement Snap's plans are $99, $199 and $299 per month. Others cost more. Compare at your real monthly volume.",
      },
      {
        q: "Is it cheaper to hire a supplement service?",
        a: "It depends on volume and the fee model. Some charge per supplement and some take a share of the recovery. Ask for the terms in writing and compare at your volume.",
      },
      {
        q: "Can I try supplement software for free?",
        a: "Some tools offer a free first project or a free trial. Supplement Snap's first project is free, and paid plans start with a 14-day trial that requires a card.",
      },
      {
        q: "Will software get my supplements approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation. Software can make your package clearer and more complete.",
      },
    ],
    related: ["roofing-supplement-software-cost", "best-roofing-supplement-software", "roofing-supplement-companies-vs-software", "supplement-snap-vs-roofgenius"],
  },
  {
    slug: "roofing-estimate-template",
    images: { 0: { src: "/blog/roofing-estimate-template/card.png", alt: "Key points from the guide: Roofing Estimate Template: Free PDF, Word and Excel Download", width: 1200, height: 630 } },
    title: "Roofing Estimate Template: Free PDF, Word and Excel Download",
    metaTitle: "Roofing Estimate Template: Free PDF, Word & Excel",
    metaDescription: "Free roofing estimate template as PDF, Word and Excel, plus what every estimate should include and how it differs from an insurance supplement.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Found hidden damage after tear-off?",
    midCtaBody: "An estimate covers the work you can see before you start. Supplement Snap helps your crew document what turns up once the shingles are off. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to put in it", "Why it matters"],
        rows: [
          { feature: "Your company details", values: ["Name, address, phone, email and license number if your state requires one", "The customer knows who is responsible, and it keeps you compliant"] },
          { feature: "Customer and property", values: ["Name, job address, contact details, date and an estimate number", "You can find and refer to the estimate later"] },
          { feature: "Scope of work", values: ["What you will tear off, repair or replace, area by area", "Prevents arguments about what was included"] },
          { feature: "Materials", values: ["Product, color, quantity and unit for each item", "Shows what the price covers"] },
          { feature: "Labor and other charges", values: ["Labor, disposal, permits, delivery or other fees, listed separately", "Makes the total easy to follow"] },
          { feature: "Price and how long it is good for", values: ["Total, the date it expires and what could change it", "Protects you if material costs move"] },
          { feature: "Terms and signature", values: ["Payment terms, warranty terms, and a line for the customer to accept", "Turns an estimate into an agreement"] },
        ],
      }},
      3: { type: "matrix", data: {
        headers: ["Retail estimate", "Insurance supplement"],
        rows: [
          { feature: "Who it goes to", values: ["The property owner paying you directly", "The insurance adjuster"] },
          { feature: "What it covers", values: ["The planned work, priced before you start", "Damage found after tear-off that was not in the carrier's estimate"] },
          { feature: "What backs it up", values: ["Your measurements and your price list", "Photos, measurements and notes tied to each finding"] },
          { feature: "Format", values: ["Your own layout", "Often follows the carrier's line-item format"] },
        ],
      }},
      5: { type: "tip", data: { type: "info", title: "Rules differ by state", text: "Licensing, written-contract requirements, cancellation rights and permitted payment terms vary by state and sometimes by city. This template is a starting layout, not legal advice. Have it reviewed against your local rules before you use it with customers." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A roofing estimate needs seven things: your company details, the customer and property, a clear scope of work, materials, labor and other charges, a total price with an expiry date, and terms with a place for the customer to sign. The layout below puts them in that order, with blanks you can fill in, and you can download it as a PDF, fillable PDF, Word or Excel file just under this section. For a smaller job or a choice of options, see the <a href='/blog/roof-repair-estimate-template'>roof repair estimate template</a> and the <a href='/blog/good-better-best-roofing-proposal-template'>good, better, best proposal template</a>.\n\nDisclosure: we make Supplement Snap, which is not an estimating tool. It helps crews document hidden damage after tear-off. This page is about the estimate you give a customer before work starts. If you are writing an insurance supplement instead, see our <a href='/blog/roofing-supplement-template'>supplement template</a>.",
      },
      {
        heading: "What every roofing estimate should include",
        content: "The table lists each section and why it is there. A customer who can follow the estimate is less likely to dispute it later, and you are less likely to be asked to do work you did not price.\n\nKeep the language plain. If a customer cannot tell what is included, they will assume everything is.",
      },
      {
        heading: "A layout to copy",
        content: "Copy this into a document or spreadsheet and replace the blanks. The numbers are placeholders, not prices, so fill in your own.\n\n• Header: [Company name] [Address] [Phone] [Email] [License number if required]\n• Estimate: No. [____] Date: [____] Valid until: [____]\n• Customer: [Name] [Job address] [Phone] [Email]\n• Scope of work: Tear off [existing layers] on [roof areas]. Install [underlayment]. Install [shingle brand and color]. Replace [flashing, vents, drip edge as needed]. Clean up and haul away debris.\n• Line items: [Description] [Quantity] [Unit] [Unit price] [Amount]\n• Other charges: [Disposal] [Permit] [Delivery] [Other]\n• Total: [$____]\n• What could change the price: [for example, hidden decking damage found after tear-off, charged at the agreed unit price]\n• Terms: [Payment schedule] [Warranty terms] [Start date window]\n• Acceptance: Customer signature [____] Date [____]\n\nWriting in the line about hidden damage matters. Tear-off often reveals rotted decking or extra layers, and an estimate that says how those will be handled avoids an awkward conversation later.",
      },
      {
        heading: "Retail estimates and insurance supplements are different documents",
        content: "A retail estimate is written before the job and goes to the property owner. An insurance supplement is written after tear-off and goes to the adjuster, asking for money the carrier's estimate left out. The table shows the main differences.\n\nIf the owner is paying through an insurance claim, the carrier's estimate sets the starting scope. Your own estimate and the carrier's can differ, and the difference is where supplements come from. Our guides on <a href='/blog/xactimate-roofing-estimate-example'>how an Xactimate estimate looks</a> and <a href='/blog/xactimate-roofing-estimate-approved'>how to write one adjusters approve</a> cover the insurance format.",
      },
      {
        heading: "Mistakes that cause disputes",
        content: "• A vague scope. Write what is included roof area by roof area.\n• Lumping everything into one price. Separate materials, labor and extra charges so the customer can follow it.\n• No expiry date. Material prices change, and an estimate with no end date can be held against you for months.\n• Nothing about hidden damage. Say how rotted decking or extra layers will be handled.\n• No signature line. An unsigned estimate is a suggestion.\n• Promising an insurance outcome. Never tell a customer that the carrier will pay, because that depends on the policy, the claim and the carrier.",
      },
      {
        heading: "Check your local rules before you use it",
        content: "Many states require specific language in home improvement contracts, a license number, a right-to-cancel notice, or limits on deposits. Some require a written contract above a certain amount. This template does not include state-specific wording.\n\nAsk your state licensing board, your insurance agent or an attorney what must appear in your estimates and contracts. Do not rely on a template alone.",
      },
      {
        heading: "Where Supplement Snap fits, and where it does not",
        content: "Supplement Snap does not write retail estimates, measure roofs or send invoices. It is for the step after tear-off, when your crew finds damage that was not in the estimate. They photograph it on the roof, tag the damage type and roof area, add a typed or voice note, and the app drafts a written description of each finding for you to review and edit. You then export a PDF and email it to the adjuster.\n\nYour first project is free. See the <a href='/roofing-supplement-software'>feature walkthrough</a>, a <a href='/roofing-supplement-report-example'>sample report</a> and the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "What should a roofing estimate include?",
        a: "Your company details, the customer and property, a clear scope of work, materials, labor and other charges, a total with an expiry date, and terms with a signature line. Add a note on how hidden damage will be handled.",
      },
      {
        q: "Is there a free roofing estimate template?",
        a: "The layout on this page is free to copy and has blanks for your own prices. Many invoicing tools also publish free roofing estimate templates in PDF, Word and Excel. Check any template against your state's requirements.",
      },
      {
        q: "What is the difference between a roofing estimate and a quote?",
        a: "Usage varies. An estimate is generally an approximate price and a quote a firm one, but some contractors use the words interchangeably. State on the document whether the price is fixed and how long it is valid.",
      },
      {
        q: "How is a roofing estimate different from an insurance supplement?",
        a: "An estimate is priced before the job and goes to the property owner. A supplement is prepared after tear-off and goes to the adjuster to request money for damage the carrier's estimate did not include.",
      },
      {
        q: "Does a roofing estimate need a signature?",
        a: "A signature line is good practice because it turns the estimate into an agreement. Some states have specific contract requirements, so confirm what yours requires.",
      },
    ],
    downloads: "roofing-estimate-template",
    related: ["starter-strip-ridge-cap-roofing-supplement", "xactimate-roofing-estimate-example", "roof-repair-estimate-template", "good-better-best-roofing-proposal-template", "roofing-supplement-template"],
  },
  {
    slug: "roofing-supplement-email-to-adjuster",
    images: { 0: { src: "/blog/roofing-supplement-email-to-adjuster/card.png", alt: "Key points from the guide: How to Write a Roofing Supplement Request Email to an Adjuster (With Template)", width: 1200, height: 630 } },
    downloads: "roofing-supplement-template",
    title: "How to Write a Roofing Supplement Request Email to an Adjuster (With Template)",
    metaTitle: "Roofing Supplement Email to Adjuster (Template)",
    metaDescription: "How to email an insurance adjuster a roofing supplement request: what the subject line, body and attachments should include, with a copy-and-paste template.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Send the evidence, not a pile of texts.",
    midCtaBody: "Supplement Snap helps your crew capture and describe each finding on the roof, then export one PDF to attach to the email. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to include","Why it matters"],
        rows: [
          { feature: "Claim number and property address", values: ["The adjuster can match the email to the file, and it keeps the request from being misfiled"] },
          { feature: "How many findings and what you are asking for", values: ["Sets expectations before they open the attachment"] },
          { feature: "What is attached", values: ["One clear file is easier to review than several loose photos"] },
          { feature: "A specific ask and a date to follow up", values: ["Turns the email into something they can act on"] },
          { feature: "Your contact details", values: ["Makes it easy for them to call or reply with a question"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Keep it short", text: "The email is a cover note. The proof lives in the attached report with photos, locations and quantities. A long email with arguments in the body is harder to act on than a short one with a clear attachment." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A good supplement request email is short and specific. The subject line has the claim number and the words supplement request. The body says how many items you found, what you are asking for, and what is attached. The attachment, ideally a single PDF, carries the photos, locations and quantities. End with a clear next step and your contact details.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What the email should contain",
        content: "The table lists the parts of the email and why each one is there. Adjusters handle many files, and a request they can match, read and act on quickly is easier to process than one they have to decode.",
      },
      {
        heading: "Subject line examples",
        content: "Put what the adjuster needs to find the file first.\n\n• Supplement request, Claim [number], [property address]\n• Supplement documentation, Claim [number], [policyholder last name]\n• Additional items found at tear-off, Claim [number]\n\nAvoid vague subjects such as Roof photos or Following up. Those are easy to miss.",
      },
      {
        heading: "A template you can copy",
        content: "Replace the brackets with your own details and keep what is true for your job.\n\nSubject: Supplement request, Claim [number], [address]\n\nHello [adjuster name],\n\nI am writing on behalf of [policyholder name] regarding Claim [number] at [address]. During tear-off on [date], our crew found [number] items that were not visible during the initial inspection.\n\nAttached is one PDF with photos, locations, quantities and short descriptions for each item. In summary, the items are [short list, for example decking, flashing, drip edge].\n\nPlease review and let me know what else you need, or whether you would like to schedule a reinspection. I will follow up on [date] if I have not heard from you.\n\nThank you,\n[Your name]\n[Company] | [phone] | [email]\n\nState only what you saw and measured. Do not guess at causes you cannot show, and do not argue coverage in the email.",
      },
      {
        heading: "What to attach",
        content: "Send one PDF so nothing gets separated: a cover page with the claim details, a short list of findings, each finding with its photos and a plain description, and the line items you are requesting. Our <a href='/blog/roofing-supplement-template'>roofing supplement template</a> shows the layout, and the <a href='/roofing-supplement-report-example'>sample report</a> shows a finished one. If the carrier asks for its own format or portal, follow that.",
      },
      {
        heading: "The follow-up email",
        content: "If you have not heard back by the date you named, send a short, polite note in the same thread: the claim number again, a one-line reminder of what you sent and when, and a question such as whether anything else is needed. Keep a record of every message. Our <a href='/blog/roofing-supplement-follow-up-log'>follow-up log</a> is a simple way to track it, and <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a supplement is denied</a> covers the next steps.",
      },
      {
        heading: "Mistakes that slow requests down",
        content: "• No claim number, or the number only in the attachment name\n• Photos pasted into the email body instead of one organized file\n• A long argument in the email and thin proof in the attachment\n• Several emails with pieces of the same request\n• Promising the homeowner an outcome the carrier has not given\n• No date for following up",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps your crew photograph and tag each finding on the roof, add a typed or voice note, review the drafted description and export a PDF you attach to the email. It does not write your negotiation or decide anything about coverage. Your first project is free. See the <a href='/pricing'>pricing page</a> and the <a href='/blog/how-to-write-a-roofing-supplement'>guide to writing a supplement</a>.",
      },
    ],
    faq: [
      {
        q: "What should a roofing supplement email include?",
        a: "The claim number and address, how many items you found, what you are requesting, what is attached, a clear next step and your contact details. Keep the body short and put the proof in the attachment.",
      },
      {
        q: "What should the subject line of a supplement email say?",
        a: "Lead with the claim number and the words supplement request, plus the property address or policyholder name, so the adjuster can match it to the file.",
      },
      {
        q: "Should I attach photos or one PDF?",
        a: "One organized PDF is usually easier to review than loose photos, and it stays together if the email is forwarded. Follow the carrier's own format or portal if it requires one.",
      },
      {
        q: "How soon should I follow up on a supplement email?",
        a: "Name a follow-up date in the email, then send a short reminder in the same thread when it arrives. How quickly carriers respond varies, so ask the adjuster what to expect.",
      },
      {
        q: "Can I just text the adjuster instead?",
        a: "A written email with the claim number and an attachment creates a clear record. Texts are easy to lose, so use them for quick questions, not for the request itself.",
      },
    ],
    related: ["roofing-supplement-template","how-to-write-a-roofing-supplement","roofing-supplement-follow-up-log","roofing-supplement-denied-what-to-do"],
  },
  {
    slug: "what-can-you-supplement-on-a-roof-claim",
    images: { 0: { src: "/blog/what-can-you-supplement-on-a-roof-claim/card.png", alt: "Key points from the guide: What Can You Supplement on a Roof Claim? 12 Items Contractors Commonly Request", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "What Can You Supplement on a Roof Claim? 12 Items Contractors Commonly Request",
    metaTitle: "What Can You Supplement on a Roof Claim? (12 Items)",
    metaDescription: "Common items roofers request in a supplement, from decking to flashing and drip edge, and what to document. Coverage depends on the policy and carrier.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Found something under the shingles?",
    midCtaBody: "Supplement Snap helps your crew photograph and describe each finding at tear-off so it is ready to send. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to document","Often depends on"],
        rows: [
          { feature: "Decking: location, amount of soft or damaged wood, photos up close and wide", values: ["Cause of damage, policy terms and the carrier's estimate"] },
          { feature: "Flashing: which areas, condition, whether it can be reused", values: ["Scope of the original estimate and local practice"] },
          { feature: "Drip edge and starter: whether present and what was installed", values: ["Carrier guidelines and local code"] },
          { feature: "Ice and water protection and underlayment: where it is needed or missing", values: ["Climate, local code and the carrier's scope"] },
          { feature: "Vents and pipe boots: count and condition", values: ["What the original estimate included"] },
          { feature: "Extra layers and steep or high work: number of layers, pitch, stories", values: ["Measurements and the carrier's pricing"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Coverage is not automatic", text: "Every item on this list can be accepted, reduced or denied depending on the policy, the cause of loss, local code and the carrier. The goal is to document what you found, not to assume it will be paid." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Contractors commonly request a supplement for work that was not in the carrier's first estimate because it could not be seen until the old roof came off. The usual categories are damaged decking, flashing, drip edge, ice and water protection and underlayment, starter and ridge or hip cap, vents and pipe boots, extra layers of roofing, steep or high-roof work, permits and code items, and debris removal. Whether any of them is paid depends on the policy, the cause of loss, local rules and the carrier, so each needs documentation.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "The 12 items, and what to document",
        content: "The table covers the main groups. For each one, the strongest request shows where it is, what you found, how much of it there is, and photos that match.",
      },
      {
        heading: "1 to 4: Decking, flashing, drip edge and underlayment",
        content: "<strong>Decking</strong> is the most common hidden finding. Soft, rotted or damaged sheathing is only visible after tear-off, so photograph it before anything new goes on, with a tape measure or marked area for scale. See our guide to <a href='/blog/document-rotted-roof-decking-tear-off'>documenting rotted decking at tear-off</a>.\n\n<strong>Flashing</strong> around chimneys, walls and valleys may be damaged or missing. Note which areas and whether it can be reused.\n\n<strong>Drip edge</strong> and <strong>underlayment</strong> (including ice and water protection) depend heavily on local code and the carrier's guidelines. Record what was there, what you installed and why.",
      },
      {
        heading: "5 to 8: Starter, ridge and hip cap, vents, pipe boots",
        content: "<strong>Starter</strong> and <strong>ridge or hip cap</strong> are part of a complete roof installation and are sometimes left out of an estimate. <strong>Vents</strong> and <strong>pipe boots</strong> are small items that add up. Count them and photograph each type. Our <a href='/blog/xactimate-codes-for-roofing-supplements'>Xactimate codes guide</a> explains how these items are listed in an estimate.",
      },
      {
        heading: "9 to 12: Extra layers, steep or high work, permits and code items, debris removal",
        content: "<strong>Extra layers</strong> of old roofing mean more tear-off and disposal. Note the number of layers and photograph the edge. <strong>Steep or high-roof work</strong> depends on measured pitch and stories, so record both. <strong>Permits and code items</strong> vary a lot by place and policy, and some policies include limited code coverage. See <a href='/blog/roofing-code-upgrades-ordinance-and-law'>code upgrades and ordinance and law coverage</a>. <strong>Debris removal</strong> and disposal should match what was actually hauled.",
      },
      {
        heading: "How to present these in a request",
        content: "Group the items into findings, give each one a location, a quantity and photo numbers, and write a plain sentence on what was found and when. Avoid guessing at causes you cannot prove. The <a href='/blog/roofing-supplement-email-to-adjuster'>supplement email template</a> and the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a> help you assemble it.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> lets your crew photograph each finding on the roof, tag the damage type and roof area, add a typed or voice note, review the drafted description and export a PDF for the adjuster. It does not decide what is covered. Your first project is free. See the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "What can you supplement on a roof claim?",
        a: "Items that were not in the carrier's first estimate, commonly decking, flashing, drip edge, ice and water protection, underlayment, starter and cap, vents, extra layers, steep or high work, permits and code items, and debris removal. Payment depends on the policy and carrier.",
      },
      {
        q: "What is the most common roofing supplement item?",
        a: "Damaged decking is among the most common, because it cannot be seen until the old roof is removed. Document it with photos and measurements before new materials go on.",
      },
      {
        q: "Will the insurance company pay for everything I request?",
        a: "Not automatically. Each item can be accepted, reduced or denied depending on the policy, the cause of loss, local code and the carrier. Good documentation makes it easier to review.",
      },
      {
        q: "Do I need photos for every supplement item?",
        a: "Photos with locations and scale are the main proof, plus a short description and quantity. Record items before they are covered by new materials.",
      },
      {
        q: "Where do I find the Xactimate codes for these items?",
        a: "See our guide to Xactimate codes for roofing supplements. Codes and pricing vary by carrier and region, so match the format the adjuster uses.",
      },
    ],
    related: ["document-rotted-fascia-and-sub-fascia-roof-claim", "step-flashing-behind-siding-roof-claim", "drip-edge-roofing-supplement", "ice-and-water-shield-roofing-supplement", "roofing-permit-fees-insurance-claim", "starter-strip-ridge-cap-roofing-supplement", "roof-flashing-vents-pipe-jacks-insurance-supplement", "xactimate-codes-for-roofing-supplements","document-rotted-roof-decking-tear-off","roofing-code-upgrades-ordinance-and-law","roofing-photo-documentation-checklist"],
  },
  {
    slug: "roof-claim-reinspection-request",
    images: { 0: { src: "/blog/roof-claim-reinspection-request/card.png", alt: "Key points from the guide: How to Request a Reinspection on a Roof Claim (and When a Supplement Fits Better)", width: 1200, height: 630 } },
    downloads: "roof-damage-report-template",
    title: "How to Request a Reinspection on a Roof Claim (and When a Supplement Fits Better)",
    metaTitle: "Roof Claim Reinspection: How to Request One",
    metaDescription: "How to ask an insurer for a roof reinspection, what to prepare, and how a reinspection differs from a supplement. Processes vary by carrier and policy.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Bring evidence to the reinspection.",
    midCtaBody: "Supplement Snap helps your crew capture photos, notes and measurements on the roof and export one PDF you can bring or send. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Reinspection","Supplement"],
        rows: [
          { feature: "When it fits", values: ["Damage that was visible but missed, disputed or measured differently","Damage found after work begins that could not be seen before"] },
          { feature: "What you ask for", values: ["A second look at the roof by the carrier","Payment for the additional items you documented"] },
          { feature: "What backs it up", values: ["Photos, measurements and notes showing the roof as it is","Photos, quantities and notes tied to each finding"] },
          { feature: "Who usually starts it", values: ["The policyholder or contractor through the claim contact","The contractor, with the documentation"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Follow the carrier's process", text: "Carriers handle reinspections differently, and the policyholder is the person with the claim. Ask the adjuster or claims contact how to request one, and put the request in writing." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A reinspection is a second inspection of the roof by the insurance carrier, usually requested when the first inspection missed damage or the scope or measurements are disputed. A supplement is a request for additional payment for items found after work starts. They are different tools, and some claims use both. To request a reinspection, ask the adjuster or claims contact how the carrier handles it, send a short written request with your evidence, and offer times when the roof can be seen.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Reinspection vs supplement",
        content: "The table shows the difference. If damage was visible on the roof but not counted, a reinspection is usually the better fit. If the issue is something hidden that appeared during tear-off, such as soft decking, a supplement fits. See <a href='/blog/supplemental-roofing-estimate-explained'>what a supplemental roofing estimate is</a> and the <a href='/blog/roofing-supplement-process-explained'>supplement process</a>.",
      },
      {
        heading: "When a reinspection makes sense",
        content: "• The adjuster did not inspect a slope, a structure or an area where you found damage\n• The counts or measurements in the estimate do not match what you measured\n• New damage appeared after the first inspection, such as a leak\n• The first estimate left out items that were visible before work started\n\nIf the roof has already been torn off, there may be little left to reinspect, which is why documenting before removal matters.",
      },
      {
        heading: "How to ask for one",
        content: "1. Contact the adjuster or the carrier's claims contact and ask how to request a reinspection and whether the carrier allows the contractor to attend.\n2. Send a short written request that includes the claim number, the address, what you believe was missed or measured differently, and the dates the roof can be seen.\n3. Attach your evidence: dated photos with locations and scale, your measurements, and a roof diagram if you have one.\n4. Keep a record of when you asked and what was said. Our <a href='/blog/roofing-supplement-follow-up-log'>follow-up log</a> is a simple format.\n\nThe homeowner is the policyholder, so check how the carrier wants to receive the request. See <a href='/blog/can-a-roofer-talk-to-the-insurance-company'>what contractors may and may not do on a claim</a>.",
      },
      {
        heading: "What to prepare for the visit",
        content: "Have the photos printed or on a tablet, a list of the specific items you want looked at, and the measurements. Walk the roof with the adjuster if allowed, point to each item, and stay factual. Our guides to <a href='/blog/hail-damage-roof-insurance-claim-documentation'>documenting hail damage</a> and <a href='/blog/how-insurance-adjusters-determine-roof-damage'>how adjusters determine roof damage</a> explain what they look for.",
      },
      {
        heading: "After the reinspection",
        content: "Ask when you can expect a revised estimate and send a short thank-you that restates what was reviewed. If the carrier still disagrees, see <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a supplement is denied</a>. Your policy may also describe other options, and a licensed professional can advise on them.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps your crew capture photos with a typed or voice note, tag each finding and roof area, and export a PDF you can bring to a reinspection or attach to an email. It does not request reinspections or decide coverage. Your first project is free. See the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "What is a roof reinspection?",
        a: "A second inspection of the roof by the insurance carrier, usually requested when the first inspection missed damage or the scope or measurements are disputed.",
      },
      {
        q: "How do I request a reinspection on a roof claim?",
        a: "Ask the adjuster or claims contact how the carrier handles it, then send a short written request with the claim number, what you believe was missed and your evidence. Processes vary by carrier.",
      },
      {
        q: "What is the difference between a reinspection and a supplement?",
        a: "A reinspection is a second look at the roof, usually for damage that was visible but missed. A supplement is a request for payment for additional items found after work starts.",
      },
      {
        q: "Can a contractor request a reinspection?",
        a: "Often the policyholder or the contractor can ask through the claim contact, but rules vary by carrier and state. Check how your carrier handles it and what contractors may do where you work.",
      },
      {
        q: "What if the roof has already been torn off?",
        a: "A reinspection may no longer be useful, so documentation taken before and during tear-off matters. A supplement may fit better for hidden items.",
      },
    ],
    related: ["roof-claim-appraisal-process", "roofing-supplement-denied-what-to-do","how-insurance-adjusters-determine-roof-damage","hail-damage-roof-insurance-claim-documentation","roofing-supplement-process-explained"],
  },
  {
    slug: "can-a-roofer-talk-to-the-insurance-company",
    images: { 0: { src: "/blog/can-a-roofer-talk-to-the-insurance-company/card.png", alt: "Key points from the guide: Can a Roofer Talk to the Insurance Company? What Contractors May and May Not Do", width: 1200, height: 630 } },
    title: "Can a Roofer Talk to the Insurance Company? What Contractors May and May Not Do",
    metaTitle: "Can a Roofer Deal With Your Insurance Company?",
    metaDescription: "Can a roofing contractor work with your insurance company? General guidance on what contractors usually can and cannot do on a claim. Rules vary by state.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Document the work, leave the negotiating to the right people.",
    midCtaBody: "Supplement Snap helps your crew record what they find on the roof as a clear report. It does not negotiate or adjust claims. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Often fine for a contractor","Often restricted without a license"],
        rows: [
          { feature: "Inspecting the roof and explaining what you found", values: ["Negotiating the claim on the homeowner's behalf"] },
          { feature: "Giving the homeowner a written repair estimate", values: ["Advocating for coverage or interpreting the policy"] },
          { feature: "Documenting damage with photos and notes", values: ["Presenting yourself as the policyholder's claims representative"] },
          { feature: "Answering the adjuster's questions about your own scope of work", values: ["Advertising that you will handle or settle the insurance claim"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "This varies by state and changes", text: "The right side of the table is often reserved for licensed public adjusters, but state rules differ and can change. Check your state insurance department, and ask a licensed attorney about your situation. This page is not legal advice." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "In many states, a roofing contractor can inspect a roof, document damage, give the homeowner an estimate and answer an adjuster's factual questions about their own work. Negotiating a claim for the homeowner, advocating for coverage or acting as the policyholder's representative is often something only a licensed public adjuster may do. The details differ by state and can change, so check your state's insurance department before you say or advertise anything about handling a claim.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why the line exists",
        content: "A public adjuster is a licensed professional who represents policyholders in a claim, and most states regulate who may do that work. The rules exist so that the person negotiating a claim is licensed and accountable. A contractor who is paid to do the repair has a different role, and some states restrict contractors from blending the two.",
      },
      {
        heading: "What contractors usually can do",
        content: "• Inspect the roof and explain what you found in plain terms\n• Provide a written estimate to the homeowner\n• Document the damage with dated photos, notes and measurements\n• Answer factual questions from the adjuster about your own scope, materials and work\n• Recommend that the homeowner file a claim, where that is allowed\n\nThese are the activities most guidance describes as fine, but confirm for your state.",
      },
      {
        heading: "What is often restricted",
        content: "• Negotiating the claim or the amount for the homeowner\n• Arguing about what the policy covers\n• Acting as the homeowner's claims representative\n• Advertising that you will handle or settle the insurance claim\n• Promising an outcome from the carrier\n\nPenalties for unlicensed adjusting vary by state, and some states take it seriously. Related rules, such as paying or waiving a deductible, are also restricted in many places, so check yours.",
      },
      {
        heading: "How to check your state",
        content: "Your state's department of insurance is the authority. The National Association of Insurance Commissioners keeps a <a href='https://content.naic.org/state-insurance-departments' target='_blank' rel='noopener noreferrer'>list of state insurance departments</a>. Look for what it says about public adjusters, contractors and claims, and ask a licensed attorney if it is unclear. Your state licensing board for contractors may also have guidance.",
      },
      {
        heading: "Staying in your lane in practice",
        content: "Keep your documents about the work, not the policy: what you found, where, how much, and what you recommend. Let the homeowner talk to the carrier about coverage, or hire a licensed public adjuster for that. When you send documentation, describe it as your own estimate and findings. Our guides to <a href='/blog/how-roofing-contractors-work-insurance-claims'>how roofing contractors work insurance claims</a> and <a href='/blog/roofing-supplement-companies-vs-software'>supplement companies vs doing it in-house</a> cover the workflow.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps your crew document what they find on the roof as a clear report with photos, notes and quantities. It does not negotiate with insurers, interpret policies or decide coverage. Check how your state treats sending documentation to a carrier before you use any tool that emails reports. Your first project is free. See the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "Can a roofer deal with the insurance company for me?",
        a: "In many states a roofer can document damage, give an estimate and answer an adjuster's questions about their work, but negotiating the claim for you often requires a public adjuster license. Rules vary by state.",
      },
      {
        q: "Can a roofing contractor be my public adjuster?",
        a: "Only if they hold the license your state requires, and some states restrict contractors from doing both on the same claim. Check your state insurance department.",
      },
      {
        q: "What can a roofer say to my insurance adjuster?",
        a: "Facts about their own inspection, scope of work, materials and estimate. Arguing about what your policy covers is usually left to the policyholder or a licensed public adjuster.",
      },
      {
        q: "Can a roofer waive my deductible?",
        a: "Paying, absorbing or waiving a deductible is restricted or unlawful in many places. Ask your state insurance department before you agree to anything.",
      },
      {
        q: "Where do I find my state's rules?",
        a: "Start with your state department of insurance, using the NAIC's list of state insurance departments, and ask a licensed attorney if it is unclear.",
      },
    ],
    related: ["roofing-adjuster-inspection-what-to-bring", "how-roofing-contractors-work-insurance-claims","roofing-supplement-companies-vs-software","how-insurance-adjusters-determine-roof-damage","roofing-supplement-process-explained"],
  },
  {
    slug: "how-long-does-a-roofing-supplement-take",
    images: { 0: { src: "/blog/how-long-does-a-roofing-supplement-take/card.png", alt: "Key points from the guide: How Long Does a Roofing Supplement Take? What to Expect and How to Follow Up", width: 1200, height: 630 } },
    downloads: "roofing-supplement-tracker",
    title: "How Long Does a Roofing Supplement Take? What to Expect and How to Follow Up",
    metaTitle: "How Long Does a Roofing Supplement Take?",
    metaDescription: "How long a roofing supplement takes depends on the carrier and the file. See where delays happen, what to ask the adjuster, and how to follow up.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "A complete package is a faster one to review.",
    midCtaBody: "Supplement Snap helps your crew capture and describe each finding on the roof so the report is ready to send the same day. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What can slow it down","What you can do"],
        rows: [
          { feature: "Missing claim number or unclear request", values: ["Put the claim number in the subject line and open with a short summary"] },
          { feature: "Photos that are hard to match to line items", values: ["Send one organized report with locations, quantities and photo numbers"] },
          { feature: "Adjuster workload or a new adjuster on the file", values: ["Ask who is handling it and when you can expect a response"] },
          { feature: "A request for more information", values: ["Answer quickly, in writing, and in the same thread"] },
          { feature: "Disagreement on scope or cause", values: ["Stay factual and ask how the carrier handles a reinspection or review"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Ask for a timeline in writing", text: "Numbers you read online for how long supplements take are anecdotes. The reliable source is the adjuster on your file. Ask what to expect and note the answer and the date." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "There is no standard length. A supplement can be reviewed quickly or take much longer depending on the carrier, the adjuster's workload, how complete your package is and whether the carrier asks for more information or a reinspection. We do not quote an average because the figures online vary widely and we cannot verify them. The practical approach is to send a complete package, ask the adjuster what to expect, and follow up on a schedule you set.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What the process looks like",
        content: "You send the supplement. The carrier receives it and assigns it to an adjuster, who reviews the documentation and may ask questions, request photos or schedule a reinspection. They then approve, adjust or deny some or all of the items, and issue a revised estimate. Our guide to the <a href='/blog/roofing-supplement-process-explained'>supplement process</a> walks through each step.",
      },
      {
        heading: "Where delays usually happen",
        content: "The table lists common causes. Many are within your control, such as how complete the first email and attachment are. Others, such as adjuster workload, are not.",
      },
      {
        heading: "Questions to ask the adjuster",
        content: "• Who is handling this supplement, and what is the best way to reach you?\n• Do you have everything you need, or is there a format you prefer?\n• What should I expect for timing?\n• If something is missing, how will you tell me?\n\nWrite down the answers and the date, and put them in your follow-up log.",
      },
      {
        heading: "How to follow up without nagging",
        content: "State a follow-up date in your first email, then send a short reply in the same thread when it arrives, with the claim number, a one-line reminder of what you sent and a clear question. If there is still no response, ask who else can review the file, such as a claims supervisor, and note each contact. Our <a href='/blog/roofing-supplement-follow-up-log'>follow-up log</a> is a simple tracker and the <a href='/blog/roofing-supplement-email-to-adjuster'>supplement email template</a> has the wording.",
      },
      {
        heading: "Send a package that is easy to approve",
        content: "The faster path is usually a complete first submission: claim details on the first page, a short list of findings, each finding with photos, a location, a quantity and a plain description, and the line items you are requesting. See the <a href='/blog/roofing-supplement-template'>supplement template</a> and the <a href='/roofing-supplement-report-example'>sample report</a>. If the answer is no, read <a href='/blog/roofing-supplement-denied-what-to-do'>what to do when a supplement is denied</a>.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "<a href='/roofing-supplement-software'>Supplement Snap</a> helps your crew capture photos and notes on the roof so the report can be exported the same day, which shortens your side of the timeline. It cannot speed up the carrier's review or guarantee approval. Your first project is free. See the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "How long does a roofing supplement take to get approved?",
        a: "It varies widely by carrier, adjuster workload and how complete the package is. Ask the adjuster on your file what to expect and note the answer.",
      },
      {
        q: "Why is my roofing supplement taking so long?",
        a: "Common causes are an incomplete or unclear package, a heavy adjuster workload, a request for more information, or a disagreement on scope. Follow up in writing with the claim number.",
      },
      {
        q: "How often should I follow up on a supplement?",
        a: "State a follow-up date in your first email, then send a short reminder in the same thread on that date. Avoid daily messages, and keep a record of each contact.",
      },
      {
        q: "Can I speed up a supplement?",
        a: "You can speed up your side by sending a complete, organized package and answering requests quickly. You cannot control the carrier's review time.",
      },
      {
        q: "What if the adjuster does not respond?",
        a: "Send a polite follow-up in the same thread, ask who else can review the file, such as a claims supervisor, and keep a record of every attempt.",
      },
    ],
    related: ["how-to-write-roofing-supplements-faster", "roofing-supplement-tracker-template", "roofing-supplement-process-explained","roofing-supplement-follow-up-log","roofing-supplement-denied-what-to-do","how-to-write-a-roofing-supplement"],
  },
  {
    slug: "drip-edge-roofing-supplement",
    images: { 0: { src: "/blog/drip-edge-roofing-supplement/diagram.png", alt: "Illustration of an eave and a rake in side view showing the roof deck, drip edge, underlayment and shingles in their typical order, with a reminder to measure both in linear feet", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "Drip Edge on a Roof Claim: How Roofers Document and Request It",
    metaTitle: "Drip Edge Roofing Supplement: How to Request It",
    metaDescription: "Drip edge is a common line item roofers ask carriers to include. Learn how to check local code, document it with photos, and request it in a supplement.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "ICC: International Code Council", url: "https://www.iccsafe.org" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Prove the drip edge, not just ask for it.",
    midCtaBody: "Supplement Snap helps your crew photograph edges before and after tear-off and export a report tied to each finding. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Why it matters on a claim"],
        rows: [
          { feature: "Is there existing drip edge?", values: ["Photos of the eave and rake before tear-off show whether metal edging is already there or missing"] },
          { feature: "Does local code call for it?", values: ["Many places have adopted a version of the International Residential Code that calls for it on asphalt shingle roofs; the building department can confirm"] },
          { feature: "Is it in the carrier estimate?", values: ["Compare the estimate to your measured eave and rake lengths and note any difference"] },
          { feature: "What do you measure?", values: ["Linear feet of eave and rake, written next to the photos"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Check your local code first", text: "The model residential code has required drip edge at eaves and rakes under asphalt shingles since the 2012 edition, with the wording changing in later editions. Many local governments have adopted a different edition or amended it. Ask your building department which edition applies before you cite it." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Drip edge is the metal flashing installed along the eaves and rakes of a roof so water drips clear of the fascia and decking. On an insurance job, roofers often ask the carrier to include it when the estimate leaves it out or counts too little of it. Whether the carrier pays depends on the policy, local code and what you can show.\n\nThe practical approach is the same for any supplement item: check what code requires locally, measure the linear feet, photograph what is there before it comes off, and put the request in writing with the evidence attached.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What the carrier needs to see",
        content: "The table lists the questions an adjuster is likely to ask. Answer them in your documentation before they are asked. A request that says add drip edge is easy to set aside. A request that shows the edges, the measurements and the local requirement is easier to review.",
      },
      {
        heading: "How to document it on the roof",
        content: "Take wide photos of each eave and rake before tear-off so the existing edge, or the lack of one, is visible. Take a close photo where the shingles meet the edge. After tear-off, photograph the bare decking edge so it is clear what is being installed.\n\nWrite down the linear feet for each edge and add them up. Show your arithmetic, for example 42 ft + 42 ft for two eaves and 30 ft + 30 ft for two rakes. Keep photo numbers beside each measurement.",
      },
      {
        heading: "Where code fits in",
        content: "Carriers commonly pay for work required to bring a repair up to code only if the policy says so, so a code requirement does not always mean payment. The model residential code is published by the International Code Council, and local governments adopt it on their own schedules and often change it. Building codes, policy wording and carrier practice vary by state, county and policy. Confirm the details for your job with the local building department and the claim documents.\n\nIf the requirement matters to your request, say which edition your jurisdiction uses and quote or attach what the building department told you. Do not state a code section from memory.",
      },
      {
        heading: "How to word the request",
        content: "Keep it factual: the location, the measured length, what was found, and what you are asking to be included. For example: Drip edge, all eaves and rakes, 144 linear feet measured at tear-off. Photos 3 to 9 show the edges before removal. Local code reference attached.\n\nAvoid arguing about what the adjuster should have done. Put the evidence on the page and make the next step easy to take.",
      },
      {
        heading: "Mistakes that slow it down",
        content: "• Asking for drip edge with no photos of the edges\n• Giving a total length with no way to check it\n• Quoting a code edition your jurisdiction has not adopted\n• Mixing it into a long email instead of listing it as a numbered finding\n• Not saying whether the edge was missing, damaged or only being replaced as part of the job",
      },
      {
        heading: "A worked example (fictional numbers)",
        content: "Say a crew tears off a gable roof with two eaves of 44 feet each and two rakes of 31 feet each. Before tear-off, the lead photographs each edge and sees no metal edging under the first course of shingles on either rake. The measurements are 44 + 44 + 31 + 31 = 150 linear feet.\n\nThe carrier's estimate lists 88 linear feet, which covers the eaves only. The contractor's request would then list the difference as its own numbered finding: 62 linear feet at the rakes, with photos of both rakes before removal, the tape reading for each rake and, if the local building department has confirmed a requirement, the written note. Everything the adjuster needs to say yes, no or ask a question is on one page.\n\nThe numbers above are made up to show the format. Use your own measurements and the carrier's own figures.",
      },
      {
        heading: "What to say when the roof had drip edge already",
        content: "Often the old roof has some drip edge. That changes the request. If the existing metal is intact and can be reused, the carrier may reasonably ask why it is being replaced. If it is bent, rusted through, the wrong profile for the new roof, or was only installed on part of the roof, say so and show it in a photo.\n\nWrite what you actually saw, for example: Existing drip edge present at eaves only, rusted through at three locations (photos 4 to 6). None at rakes (photos 7 and 8). Avoid saying the old edge was non-compliant unless the building department has told you so in writing.",
      },
      {
        heading: "Questions an adjuster or desk reviewer may ask",
        content: "• Where is the measurement from, and can I see the photos for each edge?\n• Did the old roof have drip edge, and what was its condition?\n• Is this a local code requirement, and in what edition or amendment?\n• Is the item already included under another line in the estimate?\n\nIf you can answer all four on the page before they are asked, the request is faster to review. If you cannot answer one of them, say that too, and say how you will find out.",
      },
      {
        heading: "Keeping the file clean",
        content: "Name the photos by edge, such as rake-left-before and rake-left-after, or number them and keep a list. Keep the building department's reply in the same folder as the claim. Record the date you sent the request and the date you plan to follow up. If you use Supplement Snap, the finding, its photos and its quantity stay together in the project and export as one PDF, but the same discipline works with any tool or a folder on a laptop.",
      },
    ],
    faq: [
      {
        q: "Does insurance pay for drip edge?",
        a: "Sometimes. It depends on the policy, the local code and the carrier's review. Many carriers include it in a replacement estimate, and others leave it out and wait for a request with documentation.",
      },
      {
        q: "Is drip edge required by code?",
        a: "The model residential code has called for it at eaves and rakes under asphalt shingles since the 2012 edition, but local adoption varies. Ask your building department which edition and amendments apply.",
      },
      {
        q: "How do I measure drip edge?",
        a: "Measure the linear feet along each eave and rake with a tape or a measuring tool, write each length down, and add them. Keep the numbers next to the photos.",
      },
      {
        q: "Should I photograph the old drip edge?",
        a: "Yes, before it is removed. Photos show whether it existed, what shape it was in and where it sat.",
      },
      {
        q: "Can I request it in a supplement after the first estimate?",
        a: "Many contractors do when the estimate leaves it out. Send it with your photos and measurements and follow the carrier's process.",
      },
      {
        q: "What if the building department will not give me anything in writing?",
        a: "Note the date, the person you spoke with and what they said, and say plainly in the request that it was a phone conversation. You can also ask the homeowner's insurance agent or the carrier which documentation they accept.",
      },
      {
        q: "Should drip edge be a separate line from the shingles?",
        a: "List it as its own finding with its own quantity so it can be accepted or questioned on its own. If the carrier's estimate combines it with other items, say which line you compared against.",
      },
    ],
    related: ["what-can-you-supplement-on-a-roof-claim","xactimate-codes-for-roofing-supplements","how-to-write-a-roofing-supplement","roofing-supplement-email-to-adjuster"],
  },
  {
    slug: "ice-and-water-shield-roofing-supplement",
    images: { 0: { src: "/blog/ice-and-water-shield-roofing-supplement/diagram.png", alt: "Illustration of an ice and water shield strip along the eave in side view, with the exterior wall line and distance up the roof, and a roof plan showing eave and valley strips measured as length times width", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "Ice and Water Shield on a Roof Claim: Documenting and Requesting It",
    metaTitle: "Ice and Water Shield Supplement: Document and Request",
    metaDescription: "Ice and water barrier is often left out or undercounted in roof estimates. Learn what to check, how to measure it, and how to request it with proof.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "ICC: International Code Council", url: "https://www.iccsafe.org" },
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Measure it, photograph it, send it.",
    midCtaBody: "Supplement Snap helps your crew capture each area and quantity as it is exposed. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to record"],
        rows: [
          { feature: "Where it goes", values: ["Eaves, valleys and low slopes are the usual places; the shingle maker's instructions and local code decide the rest"] },
          { feature: "How much", values: ["Square feet by area, with the width of each strip and the length written down"] },
          { feature: "What was there", values: ["A photo of the underlayment under the old shingles shows what was installed before"] },
          { feature: "Local requirement", values: ["Whether your area calls for an ice barrier at the eaves, and how far up the roof it must go"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Do not copy a rule from another state", text: "The model residential code asks for an ice barrier in places with a history of ice forming along the eaves, extending a set distance inside the exterior wall line. Whether your area is covered, and how it is worded, depends on local adoption. Ask your building department rather than assuming." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Ice and water shield, also called an ice barrier or self-adhering underlayment, is a waterproof membrane installed along eaves, in valleys and in other leak-prone areas under the shingles. On a claim it is a common line item because estimates differ in how much they include. The way to ask for it is to show where it goes, how much of it, and why, with photos and measurements.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What to check before you ask",
        content: "The table shows what to record. Start with the shingle manufacturer's installation instructions, which often say where a membrane is needed for the warranty, and with the local building department. Then check the carrier's estimate for what is already included and compare it with your own measurements.",
      },
      {
        heading: "How to measure it",
        content: "Break the job into areas: each eave, each valley, each low slope or other spot. For a strip along an eave, multiply length by the strip width. For a valley, multiply the valley length by the width you install.\n\nWrite the arithmetic, not only the total. Example: Eave, front: 42 ft x 3 ft = 126 sq ft. Add the areas, then add any overlap you must include. Keep the roll width and overlap you actually use, because they change the result.",
      },
      {
        heading: "How to document it",
        content: "Photograph the eaves and valleys before tear-off, then the bare deck after tear-off, then the membrane going on. Close photos show the material and wide photos show where it sits. Number the photos and match them to your list.\n\nIf the existing roof had no membrane, a photo of the bare underlayment at the eave shows that. If it had some, show how far up it went.",
      },
      {
        heading: "Code, the warranty and the policy",
        content: "Three different things can support the request: local code, the manufacturer's instructions and the policy. They do not always agree and the carrier is not bound by your warranty or the manufacturer. Building codes, policy wording and carrier practice vary by state, county and policy. Confirm the details for your job with the local building department and the claim documents.\n\nPut each source in the request separately and label it. Do not mix them together as if one proved the other.",
      },
      {
        heading: "How to word the request",
        content: "Keep it short and checkable. Example: Self-adhering ice barrier, front and rear eaves and two valleys, 410 sq ft by the attached measurements. Photos 12 to 21. Manufacturer instructions and local code reference attached.\n\nList it as its own numbered finding with its own quantity so the adjuster can answer yes or no to it by itself.",
      },
      {
        heading: "A worked example (fictional numbers)",
        content: "A hip roof has two long eaves of 52 feet and two short eaves of 28 feet, and two valleys of 18 feet each. The crew installs a 3 foot strip at the eaves and a 3 foot strip centered on each valley. The arithmetic is (52 + 52 + 28 + 28) x 3 = 480 square feet at the eaves, plus (18 + 18) x 3 = 108 square feet in the valleys, for 588 square feet before overlap and waste.\n\nIf the carrier's estimate lists 300 square feet, the request is the difference with the drawing, measurements and photos attached. The numbers here are for illustration only. Your strip width, the product's roll width and your overlap will change the result.",
      },
      {
        heading: "Waste and overlap",
        content: "Self-adhering membrane is sold in rolls, and installation requires overlaps. Some estimates include a waste factor and some do not. Write down the roll size you use and the overlap, and say how you arrived at the quantity you request. If the carrier applies a standard waste factor, compare your number to theirs before and after waste so you are comparing like with like.",
      },
      {
        heading: "Where the manufacturer fits in",
        content: "Shingle manufacturers publish installation instructions, and some tie warranty coverage to using a membrane in certain places. That instruction is evidence of how the product is meant to be installed. It is not a policy term and the carrier is not bound by it. Attach the relevant page of the instructions, label it as the manufacturer's instruction and keep it separate from your code reference.",
      },
      {
        heading: "Photographing the membrane",
        content: "The membrane is only visible for a short time between the deck and the shingles. Take a wide photo of each eave and valley with the membrane on, a close photo with a tape across the strip width, and one photo showing the edge lap. If you work with a second person, ask them to hold the tape. Number the photos and match them to the lines in your quantity list.",
      },
      {
        heading: "When the carrier already included some",
        content: "Many estimates include a strip along the eaves. If yours does, ask what width and which locations it covers, then compare. A request that says the estimate covers the eaves at 3 feet and you are asking for the valleys and a second course at the low-slope section is easier to accept than a request to add ice barrier with no context.",
      },
    ],
    faq: [
      {
        q: "Does insurance cover ice and water shield?",
        a: "It can. Some estimates include it, some include part, and some leave it out. Coverage depends on the policy and local code, and the carrier decides.",
      },
      {
        q: "Is ice and water shield required by code?",
        a: "The model residential code calls for an ice barrier in areas where ice historically forms along eaves, but each local government adopts and amends the code. Check with your building department.",
      },
      {
        q: "How far up the roof does it go?",
        a: "The model code uses a distance measured from the exterior wall line, and manufacturers give their own instructions. Use the local requirement and the manufacturer's sheet for the product you install.",
      },
      {
        q: "Do I need a photo of it being installed?",
        a: "Yes, it helps. A photo of the membrane on the deck, with a tape or marker showing width, backs up the quantity.",
      },
      {
        q: "What if the adjuster says the old roof did not have it?",
        a: "Show what you found at tear-off and explain the requirement that applies now. The carrier may still decide differently, so keep your records of the exchange.",
      },
      {
        q: "What is the difference between ice and water shield and regular felt or synthetic underlayment?",
        a: "Ice and water shield is a self-adhering waterproof membrane. Felt and synthetic underlayment are standard layers that are not self-sealing around fasteners. Which one a spot needs depends on code, the manufacturer and the design of the roof.",
      },
      {
        q: "Do I need to measure valleys separately?",
        a: "Yes. Valleys and eaves are different areas with different widths. Listing them separately makes your arithmetic easy to check.",
      },
    ],
    related: ["what-can-you-supplement-on-a-roof-claim","drip-edge-roofing-supplement","xactimate-codes-for-roofing-supplements","how-to-write-a-roofing-supplement"],
  },
  {
    slug: "roof-shingle-matching-insurance-claim",
    images: { 0: { src: "/blog/roof-shingle-matching-insurance-claim/card.png", alt: "Key points from the guide: Shingle Matching on Roof Claims: What Roofers Should Know", width: 1200, height: 630 } },
    downloads: "roof-damage-report-template",
    title: "Shingle Matching on Roof Claims: What Roofers Should Know",
    metaTitle: "Roof Shingle Matching Insurance Claims Explained",
    metaDescription: "When shingles are discontinued or colors no longer match, who pays? How matching works on roof claims, what varies by state, and how to document it.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Show the mismatch with evidence.",
    midCtaBody: "Supplement Snap helps your crew document the existing roof and what was found so your report shows the whole picture. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What can differ"],
        rows: [
          { feature: "State rules", values: ["Some states have rules or guidance about matching, written in different words; others have none"] },
          { feature: "The policy", values: ["Wording and endorsements can add to or limit matching coverage"] },
          { feature: "Carrier practice", values: ["Two carriers in the same state can treat the same situation differently"] },
          { feature: "The roof itself", values: ["Age, weathering, discontinued products and slope layout affect what a fair match looks like"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Do not promise a full replacement", text: "A homeowner who hears that matching means a whole new roof may be told something different by the carrier. Say what you can show, what the policy and your state say, and that the carrier decides." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Matching is the question of whether a repaired roof should look like the rest of it. If only part of a roof is replaced and the new shingles do not match the old ones, the homeowner may ask the carrier to pay for more. What the carrier owes depends on the state, the policy and the facts, so there is no single rule. Your job is to document the facts well.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why the answer changes",
        content: "The table shows what varies. Some states say the repair should leave a reasonably uniform appearance. Others look at whether the mismatch can be seen from a normal viewing point. Some policies have endorsements that change the result. Do not assume the rule from the last state you worked in applies here.",
      },
      {
        heading: "What to document",
        content: "Photograph the whole roof from several angles, including from the street, and every slope that would be affected. Take close photos of the shingles that show color, wear and any maker's markings on a loose piece.\n\nIf the product is discontinued, record the maker, the line and the color, and keep any written confirmation from the manufacturer or a supplier that it is no longer available. A supplier's printout of available colors, dated, is stronger than a verbal note.",
      },
      {
        heading: "Repairability and brittle shingles",
        content: "On older roofs, a shingle may crack when lifted, which is relevant to whether a spot repair is practical. If you test a few shingles to see whether they can be lifted without breaking, document it with photos and notes. Present it as what you observed on this roof, not as a general rule.",
      },
      {
        heading: "How to present it",
        content: "Put the matching question in its own section of the report: the existing product, what is available, the photos from each angle and the slopes involved. State what you observed and what you are asking for. Building codes, policy wording and carrier practice vary by state, county and policy. Confirm the details for your job with the local building department and the claim documents.\n\nIf your state publishes guidance on matching, link it. Your state's insurance department is a good source, and the NAIC lists them.",
      },
      {
        heading: "Talking with the homeowner",
        content: "Be clear about what you cannot promise. You can explain what you see and how you will document it, and you can tell the homeowner to ask their carrier about matching coverage under their policy. In many states a contractor should not advise on coverage or negotiate the claim, so keep to your own scope of work.",
      },
      {
        heading: "A practical way to organize the evidence",
        content: "Treat matching like any other finding. Give it a number and a short description, then attach the evidence in the same order each time: a wide photo showing the slopes, a close photo of the existing shingle, a photo of the replacement sample next to it, then any written confirmation about availability. A reviewer who sees the same order on every job learns where to look and what is missing.",
      },
      {
        heading: "Samples and side-by-side photos",
        content: "If you can get a sample of the closest available product, photograph it in daylight next to an existing shingle from the same roof. Use the same angle and the same lighting. Phone cameras change color depending on light, so take more than one photo and avoid shadows. Say in your note that color on a screen may differ from color in person.",
      },
      {
        heading: "Layout of the roof matters",
        content: "Roofs with several slopes that are visible from the same point can raise different questions than roofs where each slope is seen separately. A simple sketch or an annotated aerial image that shows which slopes are visible from the street, the yard and the neighbor's property is useful. You are describing what the eye sees, not predicting what the carrier will decide.",
      },
      {
        heading: "Age and weathering",
        content: "A thirteen-year-old roof does not look like new shingles of the same color. Weathering, granule loss and fading are normal. Photograph the existing roof honestly. If you claim a mismatch, the reviewer will compare your photos with the sample and with the age of the roof, so overstating it hurts the credibility of your other items.",
      },
      {
        heading: "Where the homeowner comes in",
        content: "Matching is a coverage question as much as a documentation question. The homeowner can ask the carrier or the agent how the policy and the state treat matching, and can ask the state insurance department for a plain-language explanation. A contractor can give the homeowner the photos and measurements to bring to that conversation.",
      },
    ],
    faq: [
      {
        q: "Does insurance have to replace the whole roof to match?",
        a: "Not necessarily. It depends on the state, the policy and the facts. Some situations lead to a full replacement and some to a repair of the damaged slopes only.",
      },
      {
        q: "What if the shingles are discontinued?",
        a: "Document the product and keep proof it is no longer available. That is evidence for the carrier to consider, not a guarantee of payment.",
      },
      {
        q: "Is there a federal rule on matching?",
        a: "No. Matching is mostly handled by state rules, policy wording and carrier practice.",
      },
      {
        q: "Where can I find my state's rules?",
        a: "Start with your state insurance department. The NAIC keeps a list of them.",
      },
      {
        q: "Should a contractor argue matching with the carrier?",
        a: "Document the facts and give them to the homeowner and carrier. Whether a contractor can discuss coverage or negotiate depends on state licensing rules.",
      },
      {
        q: "Can a contractor decide that a mismatch requires a full replacement?",
        a: "No. A contractor can document the mismatch and the roof layout. The decision rests with the carrier under the policy and the state's rules, and in a dispute with the process the policy and state law provide.",
      },
      {
        q: "Should I include a sample in the package?",
        a: "A photo of a sample next to the existing shingle is usually enough. Keep the physical sample in case the carrier asks to see it.",
      },
    ],
    related: ["does-insurance-cover-roof-replacement","can-a-roofer-talk-to-the-insurance-company","roofing-supplement-denied-what-to-do","hail-damage-roof-insurance-claim-documentation"],
  },
  {
    slug: "steep-roof-charge-roofing-supplement",
    images: { 0: { src: "/blog/steep-roof-charge-roofing-supplement/diagram.png", alt: "Illustration of a 6 in 12 roof pitch as a right triangle with a level, 12 inches of run and 6 inches of rise, beside 4 in 12, 9 in 12 and 12 in 12 slopes", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "Steep Roof and High Roof Charges: How to Document Them",
    metaTitle: "Steep Roof Charge Supplement: How to Document It",
    metaDescription: "Steep-pitch and multi-story roofs take more labor and safety gear. Learn how to measure pitch, photograph it, and request steep and high charges.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Pitch and height, proven on site.",
    midCtaBody: "Supplement Snap helps your crew record roof details with photos and notes for the report. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to record"],
        rows: [
          { feature: "Pitch", values: ["Rise over run for each slope, with a photo of the measurement"] },
          { feature: "Area at each pitch", values: ["Square footage of each slope so charges apply to the right area"] },
          { feature: "Height", values: ["Number of stories and eave height at each side of the house"] },
          { feature: "Safety and access", values: ["Anything that needs added setup, such as roof jacks or fall protection, written down"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Measure each slope, not the house", text: "Different slopes often have different pitches. A single pitch for the whole roof can undercount or overcount the charge." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Steeper roofs take more time and more safety setup, and so do roofs that are high above the ground. Many pricing systems include charges for steep pitch and for roof height. The carrier's estimate may include them, partly include them or leave them out. A contractor documents the pitch and height of each area so the right charge can be checked.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What carriers usually check",
        content: "The table lists what to record. Estimating software groups pitch into ranges, and the ranges and names depend on the price list in use. Check the price list on your claim for the categories rather than assuming.",
      },
      {
        heading: "How to measure pitch",
        content: "Use a level and a tape, a pitch gauge or an app on a phone, and take a photo that shows the reading. Do it for each slope that differs. Write the pitch beside the slope and the square feet of that slope.\n\nIf the carrier's report used drone or satellite measurements, compare them with what you measured and note any difference without guessing why.",
      },
      {
        heading: "Documenting height",
        content: "Photograph each side of the house from the ground showing the eave height, and note the number of stories. If a section is above two stories, say so and show it. A wide photo with a person or a ladder for scale is more convincing than a number alone.",
      },
      {
        heading: "Safety setup and what to claim",
        content: "Roof jacks, harnesses and anchors are part of working on steep roofs. Whether they are separately payable depends on the price list and the carrier. Record what your crew actually used and why, and do not add items to the request that you cannot show.",
      },
      {
        heading: "How to word the request",
        content: "Example: Steep charge, rear slope, 9/12 pitch measured, 760 sq ft. Photo 4 shows the reading. High roof charge, rear section above two stories, 480 sq ft, photo 5.\n\nList each area as its own line with its own pitch or height. That makes it simple for the adjuster to check one against the estimate.",
      },
      {
        heading: "A worked example (fictional numbers)",
        content: "A house has a main roof with a 6/12 pitch and a rear addition with a 10/12 pitch. The rear addition is two stories at the back and measures 520 square feet. The main roof measures 2,400 square feet.\n\nThe contractor measures each slope with a level and tape, records the readings with photos, and lists the pitch beside the area: Main roof, 6/12, 2,400 sq ft. Rear addition, 10/12, 520 sq ft. If the price list adds a charge for the pitch range that includes 10/12, the request is for that charge on the 520 square feet, not on the whole roof. The charge categories and their ranges come from the price list on the claim, so check them there.",
      },
      {
        heading: "Why per-slope measurements matter",
        content: "A single pitch for the whole roof can lead to a charge on every square when only part of the roof qualifies, or to no charge when only part of the roof is steep. Reviewers check this because it changes the total. Breaking it down by slope shows you measured, and it makes your request easy to verify.",
      },
      {
        heading: "Measuring safely",
        content: "Do not climb a steep roof to measure it if it is unsafe. A pitch gauge, a level on a straight board, or a measurement from the attic rafters can give the rise and run without walking the slope. If you use aerial reports, treat their pitch as a starting point and say in your notes whether you confirmed it on site.",
      },
      {
        heading: "What belongs in the photo",
        content: "Show the level or gauge against the roof surface, with the reading visible. Include something that shows which slope it is, such as the chimney or a vent. A second photo from the ground showing the whole slope helps the reviewer match the reading to the area.",
      },
    ],
    faq: [
      {
        q: "What is a steep roof charge?",
        a: "It is an added charge in many pricing systems for the extra labor and safety work on roofs above a certain pitch.",
      },
      {
        q: "How steep is steep?",
        a: "The ranges depend on the price list. Check the one in use on the claim.",
      },
      {
        q: "What is a high roof charge?",
        a: "It is an added charge for roofs high off the ground, such as above one or two stories. The thresholds depend on the price list.",
      },
      {
        q: "How do I prove the pitch?",
        a: "Photograph a level and tape or gauge showing the reading on each slope, and write it down next to the square footage.",
      },
      {
        q: "Will the carrier always pay it?",
        a: "No. The carrier reviews each request under the policy and its own process.",
      },
      {
        q: "Is a steep charge the same as a high roof charge?",
        a: "No. Steep charges depend on pitch. High roof charges depend on height above the ground. A roof can qualify for one, both or neither, and the price list defines the ranges.",
      },
      {
        q: "Do I need to measure pitch if the estimate already lists it?",
        a: "If the carrier's estimate lists a pitch, confirm it on site. If it differs from your measurement, note both numbers and your photo.",
      },
    ],
    related: ["xactimate-codes-for-roofing-supplements","what-can-you-supplement-on-a-roof-claim","roof-inspection-checklist","how-to-write-a-roofing-supplement"],
  },
  {
    slug: "roofing-permit-fees-insurance-claim",
    images: { 0: { src: "/blog/roofing-permit-fees-insurance-claim/card.png", alt: "Key points from the guide: Roofing Permit Fees on an Insurance Claim: How to Request Them", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "Roofing Permit Fees on an Insurance Claim: How to Request Them",
    metaTitle: "Roofing Permit Fees on Insurance Claims: How to Ask",
    metaDescription: "Permit costs are a normal part of a roof replacement. Learn how to document them, when to submit, and how to keep the paper trail carriers expect.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Keep every receipt with the claim.",
    midCtaBody: "Supplement Snap keeps photos, notes and findings in one project so nothing gets lost between the roof and the office. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to keep"],
        rows: [
          { feature: "The permit", values: ["The receipt or record from the building department showing the fee and the address"] },
          { feature: "The date", values: ["When it was paid, so it fits the timeline of the work"] },
          { feature: "The scope", values: ["That the permit covers the roof work on the claim"] },
          { feature: "The invoice", values: ["Show the permit as its own line so it is easy to match to the receipt"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Get the receipt before you need it", text: "Ask for or save the receipt when you pull the permit. Finding it later is harder, especially if a different person handled it." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Many places require a permit for a roof replacement, and the fee is a real cost of the job. Carriers often handle it as a cost incurred on the job and ask for proof, such as the receipt. Whether the first estimate included it and how the carrier handles it depends on the carrier and the policy, so treat it like any other item: document it and send it with the right paperwork.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What the paperwork looks like",
        content: "The table lists the proof to keep. A permit record that shows the address, the work and the fee is the simplest support. Keep it with the claim number written on it or in the same folder.",
      },
      {
        heading: "When to submit it",
        content: "Some contractors send permit costs with the first estimate, and others add them in a supplement once the permit is paid. Follow the process your carrier or the claim contact uses. If you send it later, say it is a permit cost and attach the receipt.",
      },
      {
        heading: "If the fee changes",
        content: "Fees can depend on the project value or on the local schedule. If the final fee is different from what was estimated, send the actual receipt and note the difference. Do not round or guess.",
      },
      {
        heading: "Inspections and other local costs",
        content: "Some places charge for inspections, re-inspections or special reviews. Keep those receipts too, and list them separately rather than folding them into one number. Building codes, policy wording and carrier practice vary by state, county and policy. Confirm the details for your job with the local building department and the claim documents.",
      },
      {
        heading: "Common mistakes",
        content: "• Requesting a permit fee with no receipt\n• Combining permit, disposal and other costs in one line\n• Forgetting the permit when the first estimate is written, then adding it late with no explanation\n• Not saving the permit record with the claim file",
      },
      {
        heading: "A worked example (fictional numbers)",
        content: "A contractor pulls a re-roof permit for a house under claim number 123-456. The building department receipt shows a permit fee of $265 and a separate $75 inspection fee. The contractor's invoice lists the permit and the inspection as two lines, each with the receipt attached, and the claim number is written at the top of both receipts.\n\nIf the carrier's estimate did not include a permit line, the supplement lists them as their own finding: Permit fee, receipt attached, $265. Inspection fee, receipt attached, $75. The amounts here are invented for the example. Fees vary by place and project.",
      },
      {
        heading: "Who pays up front",
        content: "Often the contractor pays the fee when pulling the permit and is reimbursed through the claim payment, and sometimes the homeowner pays. Settle this in your contract before the permit is pulled. If the homeowner pays, give them a copy of the receipt so they can send it to the carrier. A paper trail that shows who paid and when prevents arguments later.",
      },
      {
        heading: "What if the permit is not required",
        content: "Not every place requires a permit for every roof job. If your local building department does not require one, do not add a line for it. If the carrier included a permit allowance and none was needed, say so openly rather than leaving the question to come up later.",
      },
      {
        heading: "Fees that are not the permit itself",
        content: "Some jurisdictions add plan review fees, technology fees, re-inspection fees or expedited fees. Itemize what the receipt shows, one line each. Do not add your own administrative time to a line labeled as a permit fee. If you charge for the time spent handling the permit, that belongs in your own pricing and your agreement with the homeowner.",
      },
    ],
    faq: [
      {
        q: "Does insurance pay for roofing permits?",
        a: "Carriers commonly consider permit costs as part of the cost of the job, but how and when depends on the carrier and policy.",
      },
      {
        q: "What proof do I need?",
        a: "The permit receipt or record showing the fee, the address and the work. Keep it with the claim number.",
      },
      {
        q: "Can I add a permit fee in a supplement?",
        a: "Many contractors do. Attach the receipt and list the permit as its own line.",
      },
      {
        q: "What if my permit fee is different from the estimate?",
        a: "Send the actual receipt and note the difference.",
      },
      {
        q: "Who pulls the permit?",
        a: "That depends on local rules and your contract. Whoever does it should keep the receipt.",
      },
      {
        q: "Should the permit be in my original estimate?",
        a: "If your area requires one, yes. Showing it as its own line from the start avoids a surprise later.",
      },
      {
        q: "Does the carrier pay the permit fee directly?",
        a: "Usually the fee is part of the claim payment rather than paid directly to the building department. Check how your carrier handles it.",
      },
    ],
    related: ["what-can-you-supplement-on-a-roof-claim","roofing-supplement-email-to-adjuster","how-to-write-a-roofing-supplement","roof-replacement-estimate-vs-final-cost"],
  },
  {
    slug: "starter-strip-ridge-cap-roofing-supplement",
    images: { 0: { src: "/blog/starter-strip-ridge-cap-roofing-supplement/diagram.png", alt: "Illustration of a gable roof and a hip roof from above with eaves marked for starter strip, rakes marked if starter is installed there, and ridges and hips marked for ridge cap", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "Starter Strip and Ridge Cap on a Roof Claim: What to Check",
    metaTitle: "Starter Strip and Ridge Cap on Roof Claims: Checklist",
    metaDescription: "Starter strip and ridge cap quantities are easy to undercount in an estimate. How to measure them, compare to the carrier's numbers, and document the gap.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Count the edges and ridges once, with photos.",
    midCtaBody: "Supplement Snap helps your crew record linear footage and photos in one project. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["How to measure"],
        rows: [
          { feature: "Starter strip", values: ["Linear feet along the eaves and, where installed, the rakes"] },
          { feature: "Ridge cap", values: ["Linear feet of ridges and hips"] },
          { feature: "Waste", values: ["The carrier's waste allowance may not match the product; note how you cut it"] },
          { feature: "Product", values: ["Whether you use a standard or a specialty product, as the unit changes"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Compare, don't assume", text: "Some estimates include starter and ridge in the shingle line, others list them separately. Read the estimate before you call something missing." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Starter strip is the first course along the edge of the roof. Ridge cap covers the ridges and hips. Both are measured in linear feet, not square feet, and both are easy to undercount if the estimate relies on roof area. A contractor can compare their own linear measurements to the estimate and document any gap.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why they are easy to miss",
        content: "Area-based measurements do not show ridge and edge lengths directly. Reports built from aerial images can be off on a complicated roof. The table covers what to measure so the numbers come from the roof, not a guess.",
      },
      {
        heading: "How to measure",
        content: "For starter, add the eave lengths and the rake lengths if you install starter there. For ridge cap, add the ridge and hip lengths. Write each length and the sum. Walk the roof or use a reliable tool, and note which.",
      },
      {
        heading: "How to document",
        content: "Photograph each ridge and hip, showing its full length where you can. Photograph the eaves. Number the photos and tie them to the measurements in your list.",
      },
      {
        heading: "Compare to the estimate",
        content: "Find the starter and ridge lines in the carrier's estimate and note the quantities and units. If they differ from yours, write the two numbers side by side with your measurements. Do not assume the difference is an error. It might be a different product or waste factor.",
      },
      {
        heading: "How to word the request",
        content: "Example: Ridge cap, 118 linear feet measured on roof, estimate shows 96. Photos 22 to 27. Starter, 168 linear feet, estimate shows 140. Photos 3 to 9.\n\nAsk for the difference, show the work, and let the adjuster respond to each line.",
      },
      {
        heading: "A worked example (fictional numbers)",
        content: "A gable roof has two eaves of 40 feet and two rakes of 28 feet, with one ridge of 40 feet. The contractor installs starter along the eaves and rakes, so the starter quantity is 40 + 40 + 28 + 28 = 136 linear feet. Ridge cap is 40 linear feet.\n\nThe carrier's estimate lists 80 linear feet of starter and 30 linear feet of ridge. The request lists each difference as its own finding: starter, 136 measured against 80 in the estimate; ridge, 40 measured against 30. The photos show the full run of each edge and the ridge, with a tape reading at one end. Those numbers are illustrative, not typical.",
      },
      {
        heading: "Waste and product choice",
        content: "Starter and ridge cap products come in bundles with set coverage. Some contractors use a dedicated starter product and others cut shingles to make starter, which changes the amount of material needed. Write down what you actually use. If the carrier's estimate assumes a different method, name the difference without arguing it.",
      },
      {
        heading: "Hips and valleys",
        content: "Hips take ridge cap, and some valleys take different material depending on the style. Count hips with the ridge when the same product is used, and write the lengths separately so the arithmetic is visible: Ridge 40 ft, Hip A 22 ft, Hip B 22 ft, total 84 ft.",
      },
      {
        heading: "Check the product line in the estimate",
        content: "Estimates may name specific products or generic items. Read the line description. A line that says starter course or ridge cap is not the same as one that says shingle waste only. If the estimate's description does not match what is being installed, quote it back in your note so the reviewer can see what you compared.",
      },
    ],
    faq: [
      {
        q: "How is ridge cap measured?",
        a: "In linear feet along the ridges and hips.",
      },
      {
        q: "How is starter measured?",
        a: "In linear feet along the eaves, and along the rakes where starter is installed.",
      },
      {
        q: "Why do estimates differ from my measurements?",
        a: "Aerial measurements, waste factors and product choices can all differ. Compare the numbers and note the difference.",
      },
      {
        q: "Are starter and ridge ever included in the shingle line?",
        a: "Some estimates combine them. Read the estimate before concluding something is missing.",
      },
      {
        q: "Do I need photos of ridges?",
        a: "Yes. They show length, condition and where the measurement came from.",
      },
      {
        q: "Is starter strip measured in squares?",
        a: "Starter is usually measured in linear feet, as is ridge cap. Check the unit on the estimate line so you compare like with like.",
      },
      {
        q: "Do rakes get starter?",
        a: "Some installers put starter on rakes and some do not. Follow the shingle manufacturer's instructions and say what you installed.",
      },
    ],
    related: ["what-can-you-supplement-on-a-roof-claim","drip-edge-roofing-supplement","roofing-estimate-template","xactimate-codes-for-roofing-supplements"],
  },
  {
    slug: "roof-flashing-vents-pipe-jacks-insurance-supplement",
    images: { 0: { src: "/blog/roof-flashing-vents-pipe-jacks-insurance-supplement/diagram.png", alt: "Illustration of a roof plan with numbered pipe boots, vents, a chimney and step flashing along a wall, with a legend for counting each penetration", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "Flashing, Vents and Pipe Jacks: Documenting Small Items on a Roof Claim",
    metaTitle: "Roof Flashing, Vents, Pipe Jacks: Supplement Guide",
    metaDescription: "Flashing, vents and pipe boots are small items that add up. How to count, photograph and request them in a roofing supplement without missing any.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Count every penetration once.",
    midCtaBody: "Supplement Snap helps your crew log each item with a photo and location as they find it. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to record"],
        rows: [
          { feature: "Pipe boots or jacks", values: ["Count and size; photo of each"] },
          { feature: "Vents", values: ["Type and count; condition of each"] },
          { feature: "Step and counter flashing", values: ["Linear feet along walls and chimneys"] },
          { feature: "Chimney and skylight flashing", values: ["Each one as its own item, with a photo"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Photograph before removal", text: "Once a pipe boot or vent is removed it is hard to prove what was there. Take the photo first." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Small roof items like pipe boots, vents and flashing are easy to overlook in an estimate. They are also easy to document well if the crew counts and photographs them before tear-off. List each one, its location and its condition, and ask for any that the estimate leaves out.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why small items matter",
        content: "A few missing pieces across a job add up, and an estimate built from aerial images cannot count every penetration. The table lists the items to record. A complete count also helps the crew know what to order.",
      },
      {
        heading: "Counting method",
        content: "Walk each slope with a clipboard or phone notes. Number each penetration, write its type and size, and photograph it. Use the same numbering in the report so the adjuster can match item to photo.",
      },
      {
        heading: "Flashing",
        content: "Measure step flashing and counter flashing in linear feet along walls, and record chimneys and skylights as separate items. Note whether existing flashing is damaged, reusable or missing, and show it.",
      },
      {
        heading: "Reuse or replace",
        content: "Carriers and contractors sometimes disagree on whether an item can be reused. Photograph its condition and write down why you replace it, such as corrosion, cracking or a different profile needed for the new roof. Avoid saying it must always be replaced.",
      },
      {
        heading: "How to word the request",
        content: "Example: Pipe boots, 4, sizes 2 in and 3 in, photos 31 to 34. Step flashing, 36 linear feet along the east wall, photo 35. List each as a numbered finding and give counts.",
      },
      {
        heading: "A worked example (fictional numbers)",
        content: "On one roof the crew counts four pipe boots (two 2 inch and two 3 inch), three box vents, one chimney with a 6 foot front and two 4 foot sides, and 36 linear feet of step flashing along a sidewall. The crew photographs each item before removal and numbers the photos 31 to 44.\n\nThe carrier's estimate lists two pipe boots, two vents and no chimney flashing. The request lists the difference line by line: two additional pipe boots, one additional vent, chimney flashing at 14 linear feet, step flashing 36 linear feet. Each line points to its photo numbers. These counts are an example only.",
      },
      {
        heading: "Reusing versus replacing",
        content: "Some flashing can be reused when the new roof goes on. Whether it should be depends on its condition and the new roofing. If you replace an item that looks reusable, explain why: corroded, cracked, wrong profile, or sealant that failed. Photograph the problem. If you are not sure, say so rather than overstating.",
      },
      {
        heading: "Roof-to-wall and chimney details",
        content: "Chimneys and sidewalls take several pieces of flashing. Rather than listing it as one lump, break it into step flashing, counter flashing and a cricket or saddle if the chimney is wide enough to need one. Record each piece's length. Local code and the manufacturer's instructions may call for details that differ from the old installation.",
      },
      {
        heading: "Penetrations that are easy to miss",
        content: "Walk the roof for bathroom fan vents, kitchen vents, plumbing stacks, attic ventilation, satellite mounts, and electrical masts. A quick pass with a numbered list or a sketch of the roof helps. Photograph each one even if you are not requesting a change, so the file shows the whole roof.",
      },
    ],
    faq: [
      {
        q: "Does insurance pay for pipe boots and vents?",
        a: "They are often part of a roof replacement estimate. If one is missing, you can document it and ask.",
      },
      {
        q: "How do I count vents?",
        a: "Walk each slope, number each vent, and photograph it. Record the type.",
      },
      {
        q: "Can flashing be reused?",
        a: "Sometimes. Document its condition and your reason for replacing it.",
      },
      {
        q: "Do I measure flashing in square feet?",
        a: "Step and counter flashing are usually measured in linear feet. Check the unit in the estimate.",
      },
      {
        q: "What if the estimate lumps them together?",
        a: "Compare your counts to the lumped line and show what is not covered.",
      },
      {
        q: "Is a pipe boot the same as a pipe jack?",
        a: "They are two names for the same part: the flashing that seals around a vent pipe where it passes through the roof.",
      },
      {
        q: "Should I request every vent as a separate item?",
        a: "Count them and list by type and size. Whether the estimate prices them individually or as a group, your list lets the reviewer match what you installed to what was priced.",
      },
    ],
    related: ["step-flashing-behind-siding-roof-claim", "what-can-you-supplement-on-a-roof-claim","roof-inspection-checklist","drip-edge-roofing-supplement","how-to-write-a-roofing-supplement"],
  },
  {
    slug: "roof-debris-removal-dumpster-insurance-claim",
    images: { 0: { src: "/blog/roof-debris-removal-dumpster-insurance-claim/card.png", alt: "Key points from the guide: Debris Removal and Dumpster Costs on a Roof Claim", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    title: "Debris Removal and Dumpster Costs on a Roof Claim",
    metaTitle: "Roof Debris Removal and Dumpster Costs on Claims",
    metaDescription: "Haul-off and dumpster costs are part of most roof replacements. How to document extra layers and weight, and what to send the carrier.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Document the load, not just the bill.",
    midCtaBody: "Supplement Snap helps your crew log extra layers and conditions found at tear-off. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to keep"],
        rows: [
          { feature: "Layers", values: ["Photos of the edge showing how many layers came off"] },
          { feature: "Extra material", values: ["Notes on decking, felt or other material that added to the load"] },
          { feature: "Dump records", values: ["Tickets or receipts, with the date and the address or claim number"] },
          { feature: "Disposal in the estimate", values: ["What the carrier's estimate included, so you can compare"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Layers change the load", text: "A second layer of shingles roughly doubles what comes off. Photograph it at the edge before tear-off." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Removing and hauling off old roofing is a standard part of a replacement, and carriers usually include some disposal in the estimate. When a roof has more layers than expected, or extra material comes off, the load can be larger than the estimate assumed. Document the layers, the extra material and the actual disposal records, then ask for the difference.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What to document",
        content: "The table lists what to keep. Photograph the roof edge before tear-off to show the number of layers, and photograph the debris pile or dumpster as it fills. Keep every dump ticket.",
      },
      {
        heading: "Extra layers",
        content: "Many places limit how many layers can be on a roof, and removing all layers may be needed for a proper install. A photo of the edge at tear-off and the local requirement are the support. Local rules vary. Policy wording, state rules and carrier practice vary, so confirm the details for your job.",
      },
      {
        heading: "Comparing to the estimate",
        content: "Find the tear-off and disposal lines in the carrier's estimate and note the quantity and unit. Compare them with your count of layers and with actual disposal records. Write the numbers side by side.",
      },
      {
        heading: "How to word the request",
        content: "Example: Tear-off of second layer, 28 squares, photo 2 shows two layers at the rear eave. Disposal tickets attached, 3 loads. List the difference as its own finding.",
      },
      {
        heading: "A worked example (fictional numbers)",
        content: "A crew finds two layers of asphalt shingles on a 32 square roof. The edge photo at the rake shows both layers. The carrier's estimate prices tear-off of one layer, 32 squares. The contractor's request lists the second layer as its own finding, 32 squares, with the edge photo and a dump ticket showing the weight of the loads that came off.\n\nThe quantities here are made up. The point is the structure: one photo of the condition, one measurement and the receipts.",
      },
      {
        heading: "Weight, loads and tickets",
        content: "Disposal costs are often based on weight or on the number of loads. A ticket from the transfer station or landfill shows the weight, the date and the vehicle. Dumpster rental invoices show the size and the days. Keep them and write the claim number or address on each. If the load includes material from other jobs, do not claim it for this job.",
      },
      {
        heading: "Wet and heavy material",
        content: "Wet underlayment, rotted decking and extra layers all add weight. If rain fell before tear-off, note it. Do not exaggerate the effect. Say what the debris contained and attach the ticket.",
      },
      {
        heading: "Protecting the property",
        content: "Tarps, plywood on landscaping and magnet sweeps are part of cleaning up. Photograph them in place. Whether the carrier pays for them is up to the policy and the estimate, but the photos show the care taken and can support a conversation.",
      },
    ],
    faq: [
      {
        q: "Does insurance pay for roof debris removal?",
        a: "Disposal is commonly included in a replacement estimate. Extra amounts depend on the policy and what you can show.",
      },
      {
        q: "How do I prove there were two layers?",
        a: "Photograph the edge of the roof before tear-off, ideally with a tape showing thickness.",
      },
      {
        q: "Do I need dump tickets?",
        a: "Keep them. They show actual disposal and date.",
      },
      {
        q: "Is the second layer covered?",
        a: "That depends on the carrier and policy. Documentation lets them review it.",
      },
      {
        q: "Can I include dumpster rental?",
        a: "Many contractors do when it is a real cost of the job. Show the receipt.",
      },
      {
        q: "Is haul-off included in the price per square for tear-off?",
        a: "In some estimates it is a separate line and in others it is combined. Read the line description before you request more.",
      },
      {
        q: "What if the dump ticket covers multiple jobs?",
        a: "Do not use a combined ticket as proof for one job. Ask the facility for a ticket for each job or note the split.",
      },
    ],
    related: ["how-to-document-multiple-roof-layers-during-tear-off", "roof-tear-off-cost","roof-tear-off-vs-overlay","document-rotted-roof-decking-tear-off","what-can-you-supplement-on-a-roof-claim"],
  },
  {
    slug: "insurance-lowball-roof-estimate-what-to-do",
    images: { 0: { src: "/blog/insurance-lowball-roof-estimate-what-to-do/card.png", alt: "Key points from the guide: Insurance Lowball Roof Estimate: What Roofers and Homeowners Can Do", width: 1200, height: 630 } },
    downloads: "roofing-supplement-template",
    title: "Insurance Lowball Roof Estimate: What Roofers and Homeowners Can Do",
    metaTitle: "Lowball Roof Estimate From Insurance: Next Steps",
    metaDescription: "The carrier's roof estimate seems too low. Learn how to compare line items, document what is missing, and request a reinspection or supplement properly.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Turn disagreement into documentation.",
    midCtaBody: "Supplement Snap helps your crew capture the proof a carrier can review. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Where to look"],
        rows: [
          { feature: "Scope", values: ["Are all slopes and components in the estimate?"] },
          { feature: "Quantities", values: ["Do measurements match the roof?"] },
          { feature: "Line items", values: ["Are drip edge, underlayment, flashing and similar items listed?"] },
          { feature: "Pricing", values: ["Is the price list current for your area and date?"] },
          { feature: "Policy limits", values: ["Deductible, depreciation and coverage terms that change the payment"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Low is not the same as wrong", text: "An estimate can be lower than a quote for reasons that are correct, such as depreciation or the deductible. Compare scope and quantity before you call it wrong." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "When an estimate seems low, the first step is to find out why. Compare the carrier's line items with the work you would do, check the quantities, and separate differences in scope from differences in price. Then document what is missing and send it through the carrier's process, usually a supplement or a reinspection request.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Compare line by line",
        content: "The table lists places to look. Put the carrier's estimate next to your own and mark each difference as scope, quantity or price. Differences in scope and quantity are the ones you can back with photos and measurements.",
      },
      {
        heading: "Understand depreciation and the deductible",
        content: "Part of the gap between a quote and a payment can come from the deductible and from depreciation that may be recoverable later. Those are policy matters. Explain them to the homeowner as questions for the carrier and avoid predicting the outcome.",
      },
      {
        heading: "Documenting what is missing",
        content: "For each difference, take photos, record measurements and write a short factual note. Number the items. If the roof was not fully inspected, a reinspection request may fit better than a supplement.",
      },
      {
        heading: "Choosing the next step",
        content: "Use a supplement for items found or missed that you can document. Use a reinspection when you think the original inspection missed visible damage. If you and the carrier still disagree on the amount of loss, the policy may offer an appraisal process. Read the policy and ask the carrier.",
      },
      {
        heading: "Keep it professional",
        content: "Stay factual and polite in writing, keep copies, and note dates. Contractors should be careful about negotiating coverage for a homeowner because rules differ by state. Policy wording, state rules and carrier practice vary, so confirm the details for your job.",
      },
      {
        heading: "A side-by-side comparison you can build in ten minutes",
        content: "Make a table with four columns: item, the carrier's quantity, your quantity, and the reason for any difference. Fill it row by row from the carrier's estimate. Typical rows are tear-off, underlayment, shingles, starter, ridge cap, drip edge, flashing, vents, decking, permit, disposal and any charges for pitch or height.\n\nA difference with a reason, such as the carrier lists 28 squares and you measured 31 because of the dormer, is something the reviewer can check. A difference with no reason invites a reply that says the estimate stands.",
      },
      {
        heading: "What a reasonable gap looks like",
        content: "Two honest measurements of the same roof rarely match to the foot. Small differences in quantity can come from where each person measured, waste factors or rounding. Focus on differences that are large, that involve a missing item, or that change a category such as a layer of tear-off or a pitch range. Do not build a request around a one percent difference.",
      },
      {
        heading: "Questions to ask the homeowner",
        content: "Ask whether they have the full estimate with all pages, the policy declarations page, and any letters from the carrier. Ask which deductible applies and whether the policy pays on actual cash value or replacement cost. Those answers explain a lot of the gap between a quote and a payment. They are also the homeowner's to ask the carrier, and a contractor should not interpret the policy for them.",
      },
      {
        heading: "Writing the request",
        content: "A short cover note works best: the claim number, that you reviewed the estimate against your measurements, the number of differences, the total requested and the list attached. Keep tone neutral. Attach the comparison table, the photos and the measurements. Then set a follow-up date.",
      },
    ],
    faq: [
      {
        q: "Why is the insurance estimate lower than my contractor's quote?",
        a: "Differences can come from scope, quantities, prices, depreciation or the deductible. Compare line by line to find out.",
      },
      {
        q: "Can I dispute an insurance estimate?",
        a: "You can ask the carrier to review it with new documentation. The policy may have other dispute steps.",
      },
      {
        q: "What is a supplement?",
        a: "A request for additional payment for items found or missed, with documentation.",
      },
      {
        q: "When should I ask for a reinspection?",
        a: "When you think visible damage was missed or measured differently in the original inspection.",
      },
      {
        q: "Should the contractor argue with the adjuster?",
        a: "Provide documentation. Whether a contractor can negotiate the claim depends on state rules.",
      },
      {
        q: "Is the carrier's first estimate final?",
        a: "Not necessarily. Carriers commonly review additional documentation, and the policy may offer further steps if there is a disagreement. The process varies by carrier and state.",
      },
      {
        q: "Should I send my own contractor quote as proof?",
        a: "A quote shows what you would charge, but the carrier's review turns on scope, quantity and the policy. Evidence about the roof is usually more useful than a price alone.",
      },
    ],
    related: ["roofing-supplement-denied-what-to-do","roof-claim-reinspection-request","roof-claim-appraisal-process","recoverable-depreciation-roof-claims"],
  },
  {
    slug: "roof-claim-appraisal-process",
    images: { 0: { src: "/blog/roof-claim-appraisal-process/card.png", alt: "Key points from the guide: The Appraisal Clause on a Roof Claim: How It Works", width: 1200, height: 630 } },
    title: "The Appraisal Clause on a Roof Claim: How It Works",
    metaTitle: "Roof Claim Appraisal Clause: How the Process Works",
    metaDescription: "When a homeowner and carrier disagree on the amount of a roof loss, the policy may offer appraisal. What it is, how it generally works and what to prepare.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Good records help in every dispute path.",
    midCtaBody: "Supplement Snap keeps photos, notes and findings together by project. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Typically"],
        rows: [
          { feature: "Who starts it", values: ["Often either side can demand it, if the policy has the clause"] },
          { feature: "What it decides", values: ["Usually the amount of loss, not whether the policy covers it"] },
          { feature: "Who takes part", values: ["An appraiser for each side and an umpire if they disagree"] },
          { feature: "Cost", values: ["Each side usually pays its own appraiser and shares the umpire; check the policy"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Policies differ", text: "Some policies word appraisal differently, and state law can change how it works. Read the clause and ask your state insurance department or an attorney." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Many property policies include an appraisal clause for disputes about the amount of a loss. If the homeowner and the carrier agree the damage is covered but not on how much it costs, appraisal may be a way to settle the number. It is a formal process with its own rules and cost, so it is not a first step. This page is a general overview.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "How it generally works",
        content: "The table gives the usual shape. Each side picks an appraiser. The two appraisers try to agree on the amount. If they cannot, they ask an umpire to help decide. An agreement by two of the three is typically binding on the amount, subject to the policy and state law.",
      },
      {
        heading: "What it does not do",
        content: "Appraisal usually does not decide whether the loss is covered under the policy. Coverage disputes can follow a different path. A homeowner who is unsure which kind of dispute they have can ask the carrier or an attorney.",
      },
      {
        heading: "Where a contractor fits",
        content: "A contractor is a witness to conditions and a source of documentation. Appraisers may look at your photos, measurements and estimates, so keep them organized. A contractor with a financial interest generally should not act as the homeowner's appraiser, and local rules vary.",
      },
      {
        heading: "What to prepare",
        content: "Collect photos with dates and locations, tear-off notes, measurements, estimates and the carrier's documents. Number everything and keep a clear index. Policy wording, state rules and carrier practice vary, so confirm the details for your job.",
      },
      {
        heading: "Before you start",
        content: "Appraisal can take time and cost money. Often a well-documented supplement or reinspection resolves the gap sooner. If it comes to appraisal, the homeowner should read the policy and consider professional advice.",
      },
      {
        heading: "A timeline of what usually happens",
        content: "First the homeowner and the carrier disagree on the amount. Then one side makes a written demand for appraisal under the policy. Each side names an appraiser. The two appraisers try to agree on the amount of loss. If they cannot, they select an umpire, and an agreement between the umpire and one appraiser is generally what sets the amount. Timelines, deadlines and notice requirements come from the policy and state law, so read them closely.",
      },
      {
        heading: "Documents appraisers like to see",
        content: "Appraisers typically want the carrier's estimate, the contractor's estimate or supplement, dated photos, measurements, receipts, and a clear list of the items in dispute. A one-page summary that lists each disputed item, the carrier's number, the other side's number and the page where the evidence is makes their work faster.",
      },
      {
        heading: "Costs and tradeoffs",
        content: "Appraisers charge for their time, and the umpire's fee is usually shared. Compare the likely cost with the amount in dispute. Sometimes a stronger supplement or a reinspection resolves a smaller gap more cheaply. Sometimes appraisal is the right tool for a larger gap. The homeowner makes that call, ideally after reading the policy and talking with their agent or an attorney.",
      },
      {
        heading: "What a contractor should not do",
        content: "Do not tell the homeowner that appraisal will get them more money. Do not act as an appraiser if you have a financial stake in the job. Do not draft legal demands unless you are licensed to. Do give accurate documents and answer questions about the condition of the roof.",
      },
    ],
    faq: [
      {
        q: "What is the appraisal clause?",
        a: "A policy provision that can allow an appraisal process for disputes about the amount of a loss.",
      },
      {
        q: "Does appraisal decide coverage?",
        a: "Usually no. It deals with the amount of loss. Coverage questions are handled differently.",
      },
      {
        q: "Who pays for appraisal?",
        a: "Policies commonly have each side pay its appraiser and share the umpire. Check the policy.",
      },
      {
        q: "Can a roofer be the appraiser?",
        a: "Appraisers are generally expected to be impartial, and a contractor with a stake usually should not. Rules vary.",
      },
      {
        q: "Should I try a supplement first?",
        a: "Often, yes. A supplement or a reinspection can resolve missed items faster and cost less.",
      },
      {
        q: "Is appraisal the same as going to court?",
        a: "No. Appraisal is a policy process for deciding the amount of a loss. Court is a separate legal route. Which one applies depends on the policy and the dispute.",
      },
      {
        q: "Can the carrier refuse appraisal?",
        a: "Policies and state laws differ on when appraisal can be demanded and what it can decide. The homeowner should read the clause and ask their state insurance department or an attorney.",
      },
    ],
    related: ["insurance-lowball-roof-estimate-what-to-do","roofing-supplement-denied-what-to-do","roof-claim-reinspection-request","can-a-roofer-talk-to-the-insurance-company"],
  },
  {
    slug: "roofing-supplement-tracker-template",
    images: { 0: { src: "/blog/roofing-supplement-tracker-template/card.png", alt: "Key points from the guide: Roofing Supplement Tracker Template (Free PDF, Fillable, Word)", width: 1200, height: 630 } },
    title: "Roofing Supplement Tracker Template (Free PDF, Fillable, Word)",
    metaTitle: "Roofing Supplement Tracker (Free Template)",
    metaDescription: "Keep track of every supplement you send: claim, carrier, date, follow-up and status. A free printable and fillable tracker and how to keep it current.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    downloads: "roofing-supplement-tracker",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Stop losing supplements in the inbox.",
    midCtaBody: "Supplement Snap keeps each project's findings and report together, so your tracker only needs the status. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to write"],
        rows: [
          { feature: "Claim number and property", values: ["How the carrier and you both find the file"] },
          { feature: "Sent on", values: ["The date the package left your hands"] },
          { feature: "Follow up on", values: ["A date you commit to, so it does not slip"] },
          { feature: "Status", values: ["A short word that says where it stands"] },
          { feature: "Amount asked", values: ["What the supplement requested, for your own totals"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Set the follow-up date when you send", text: "A tracker only works if the next date is written down at the moment you send. Waiting to remember is how supplements go quiet." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A supplement tracker is a simple list with one line for each supplement you send. It shows what is open, what needs a follow-up and what has been paid or denied. The template here is a one-page printable and fillable PDF and a Word version, so you can start today without software.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What to put in it",
        content: "The table lists the columns. Keep the entries short. The details live in the claim file. The tracker exists to point you to the next action.",
      },
      {
        heading: "How to keep it current",
        content: "Update it when you send, when you hear back and when you follow up. Once a week, scan the list for anything past its follow-up date. Mark paid and denied ones so the open list stays short.",
      },
      {
        heading: "Status words",
        content: "Pick a few and use them the same way every time: sent, in review, questions, paid in full, paid in part, denied, closed. Consistent words make it easy to search and count.",
      },
      {
        heading: "When a paper list is not enough",
        content: "If you handle many claims at once, a tracker in a project tool can show status next to the photos and report. Supplement Snap, for example, has a claim status on each project. The principle is the same either way: one place, one next date.",
      },
      {
        heading: "Using the follow-up date",
        content: "On the follow-up date, send a short note in the same email thread and record the contact. Our supplement follow-up log guide covers wording and timing.",
      },
      {
        heading: "How to fill in a sample row (fictional)",
        content: "Claim 123-456, 9 Pine Ct. Carrier: Example Mutual. Sent on: Oct 12. Follow up on: Oct 17. Status: Sent. Amount asked: $2,140. Notes: emailed to adjuster, copied supervisor. On Oct 17 you follow up and change the status to In review, then on Oct 24 you record that the adjuster asked for the decking photos, and you answer the same day.\n\nThe example is invented. The pattern is real: every change gets a date and a short note.",
      },
      {
        heading: "Reviewing the tracker every week",
        content: "Pick a day, such as Monday, and read down the list. Anything with a follow-up date in the past gets a message today. Anything marked Questions gets a reply. Add up the amounts asked on open lines so you know what is waiting. Move paid and denied lines to a closed list.",
      },
      {
        heading: "Using the tracker with a team",
        content: "If more than one person sends supplements, keep one shared copy and add a column for who owns each line. Whoever sends the supplement writes the next date. If you keep a printed copy on a clipboard, take a photo of it each week so there is a backup.",
      },
      {
        heading: "Choosing between paper, PDF, Word and software",
        content: "Paper works if one person handles every claim. The fillable PDF suits people who like to type but do not want a spreadsheet. The Word file lets you add columns. Software helps when many people need to see the same status. Whatever you pick, use it every time you send.",
      },
    ],
    faq: [
      {
        q: "Is the tracker free?",
        a: "Yes. It is a free download in printable PDF, fillable PDF and Word formats.",
      },
      {
        q: "How often should I update it?",
        a: "Whenever something changes, and review it once a week.",
      },
      {
        q: "What should I track besides status?",
        a: "The date sent, the follow-up date, who you spoke to and the amount asked.",
      },
      {
        q: "Can I use it for any carrier?",
        a: "Yes. It is not tied to a carrier.",
      },
      {
        q: "Do I need software to use it?",
        a: "No. Print it or type into the fillable PDF or Word file.",
      },
      {
        q: "How many supplements can the tracker hold?",
        a: "The printable page holds 14 lines. Print more pages or copy the Word table if you need more.",
      },
      {
        q: "Does the tracker replace the claim file?",
        a: "No. It is an index. Keep the actual documents, emails and photos in the claim file.",
      },
    ],
    related: ["how-to-measure-roofing-supplement-results", "roofing-supplement-follow-up-log","how-long-does-a-roofing-supplement-take","roofing-supplement-email-to-adjuster","roofing-supplement-process-explained"],
  },
  {
    slug: "roof-tear-off-findings-log-template",
    images: { 0: { src: "/blog/roof-tear-off-findings-log-template/card.png", alt: "Key points from the guide: Roof Tear-Off Findings Log Template (Free PDF and Word)", width: 1200, height: 630 } },
    title: "Roof Tear-Off Findings Log Template (Free PDF and Word)",
    metaTitle: "Roof Tear-Off Findings Log Template (Free)",
    metaDescription: "What to capture during roof tear-off: decking, layers, flashing and more. A free findings log and checklist your crew can use on the roof.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    downloads: "roof-tear-off-findings-log",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Log it on the roof, not at the kitchen table.",
    midCtaBody: "Supplement Snap lets your crew capture findings with photos and notes on a phone, then export the report. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Capture it when you see it"],
        rows: [
          { feature: "Soft or rotted decking", values: ["Where, how many sheets, photos wide and close"] },
          { feature: "Extra layers", values: ["Photo at the edge, number of layers"] },
          { feature: "Missing or damaged underlayment", values: ["Area and photo"] },
          { feature: "Flashing and vents", values: ["Count, condition, photo"] },
          { feature: "Anything not in the scope", values: ["A note with location and photo"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Do it before it is covered", text: "Concealed conditions are only visible for a short time. After the new deck or underlayment is on, the evidence is gone." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Tear-off is when hidden conditions show up. A simple log, filled in as the crew works, turns what they see into something the office can use. The free findings log below has a table for each finding and a checklist to finish before the crew leaves the roof.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What to log",
        content: "The table lists the usual things. For each, write where it is, what it is, how much and the photo numbers. Keep the wording factual.",
      },
      {
        heading: "How to use the log",
        content: "Give it to the crew lead before the job. As the roof opens up, the lead writes a line for each finding. A phone photo of the page at the end of the day gets it to the office the same day.",
      },
      {
        heading: "Measure, don't guess",
        content: "A quantity written as about two sheets is easy to dispute. Measure or count and write the number. Include the arithmetic for areas.",
      },
      {
        heading: "Before you leave the roof",
        content: "Use the checklist: close and wide photos, scale in the picture, photo numbers recorded, quantities measured, and the office informed. Five minutes here prevents a return trip.",
      },
      {
        heading: "From log to supplement",
        content: "The log feeds the findings in your supplement. Each row becomes a numbered finding with photos and a quantity. See our guide to writing a supplement for the full package.",
      },
      {
        heading: "A sample log entry (fictional)",
        content: "# 3. Where: rear slope, along the eave near the left corner. What was found: decking soft and deteriorated when walked, dark staining on the underside. Quantity: 4 sheets, each 4 ft by 8 ft, 128 sq ft. Photos: 14 to 17. Found at: 10:20 AM after shingles and underlayment were removed.\n\nThe entry is invented. It shows the level of detail that lets the office build a finding without calling the roof.",
      },
      {
        heading: "Assign the log to one person",
        content: "The log works best when one person owns it for each job, usually the crew lead. Others tell that person what they see. This avoids duplicates and missing lines. At the end of the day the lead photographs the page or sends the entries to the office.",
      },
      {
        heading: "What to do when something is unclear",
        content: "If you cannot tell whether a condition is damage from the storm, old wear or a past repair, write what you see and leave the cause blank. The office or the carrier can decide what it means. Do not guess in writing.",
      },
      {
        heading: "From the log to the supplement",
        content: "In the office, turn each log line into a finding: a short description, the location, the quantity and the photo numbers. Keep the log with the claim file in case someone asks what was written on the roof. If a number in the log differs from the number in the supplement, explain why.",
      },
    ],
    faq: [
      {
        q: "Is the findings log free?",
        a: "Yes. It comes as a printable PDF, a fillable PDF and a Word file.",
      },
      {
        q: "Who should fill it in?",
        a: "Whoever sees the condition, usually the crew lead.",
      },
      {
        q: "How detailed should entries be?",
        a: "Where, what, how much and which photos. Short and factual.",
      },
      {
        q: "Do I still need photos?",
        a: "Yes. The log points to the photos.",
      },
      {
        q: "Can I use a phone instead?",
        a: "Yes. An app can hold the same information. The log works with no app at all.",
      },
      {
        q: "Can I keep the log on my phone?",
        a: "Yes. A notes app works if you keep the same columns. Take a screenshot at the end of the day.",
      },
      {
        q: "Should the homeowner sign the log?",
        a: "Not required for the log itself. Some contractors have the homeowner acknowledge changes in scope. Follow your own contract.",
      },
    ],
    related: ["document-rotted-roof-decking-tear-off","roofing-crew-supplement-documentation-sop","roofing-photo-documentation-checklist","how-to-write-a-roofing-supplement"],
  },
  {
    slug: "roofing-crew-supplement-documentation-sop",
    images: { 0: { src: "/blog/roofing-crew-supplement-documentation-sop/card.png", alt: "Key points from the guide: A Crew SOP for Supplement Documentation (Free Checklist)", width: 1200, height: 630 } },
    title: "A Crew SOP for Supplement Documentation (Free Checklist)",
    metaTitle: "Roofing Crew Documentation SOP (Free Checklist)",
    metaDescription: "How to get every crew to document insurance jobs the same way. A simple SOP and one-page checklist to reduce missed photos and missed supplements.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    downloads: "roofing-crew-documentation-checklist",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Make the routine the same on every job.",
    midCtaBody: "Supplement Snap gives the crew one simple way to capture findings on any phone. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Who does it"],
        rows: [
          { feature: "Before tear-off", values: ["Crew lead: whole-roof photos and existing conditions"] },
          { feature: "During tear-off", values: ["Whoever sees a finding: stop, photograph, measure, tell the lead"] },
          { feature: "Before leaving", values: ["Crew lead: check the list, send the log"] },
          { feature: "Next morning", values: ["Office: review and build the supplement"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Keep it to one page", text: "A long procedure does not get read on a roof. One page, large type and checkboxes get used." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A standard operating procedure, or SOP, is a short written routine everyone follows. For insurance jobs, a simple documentation SOP reduces missed photos and missed items. The free one-page checklist covers before tear-off, during tear-off and before the crew leaves.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why crews skip documentation",
        content: "It is slow, it is raining, the phone is dirty and nobody told them what the office needs. A routine makes the expectation clear and short. The table assigns each step to a person.",
      },
      {
        heading: "How to introduce it",
        content: "Show the checklist at a morning meeting. Walk one real job through it. Explain why: each missed item is money the company may not recover. Keep the tone practical, not punishing.",
      },
      {
        heading: "Make it easy",
        content: "Tape the checklist where the crew sees it. Keep a labeled marker and a tape measure in the truck. Use one phone or app for photos so they end up in one place.",
      },
      {
        heading: "Review and improve",
        content: "After a few jobs, ask the crew what slowed them down and fix it. Check one job per week for photos and quantities. Praise good logs.",
      },
      {
        heading: "Adapt it",
        content: "The checklist is a starting point. Add your carrier's requirements and your state's rules, and remove what does not apply. It is not legal advice.",
      },
      {
        heading: "A one-week rollout plan",
        content: "Day 1: share the one-page checklist and explain why it exists. Day 2: walk one job through it with the whole crew. Days 3 to 5: the crew lead fills it out on every insurance job and the office checks it each evening. At the end of the week, ask what slowed people down and change one thing. Small steady changes stick better than a big training day.",
      },
      {
        heading: "What good looks like",
        content: "A good job has wide photos of every slope before tear-off, a findings log with quantities and photo numbers, close and wide photos of each finding, photos of new material going on and a note for any change to the scope. A weak job has twenty unlabeled photos and a text that says we found rot. Show the crew one of each.",
      },
      {
        heading: "Handling language and literacy differences",
        content: "Not everyone on the crew reads English at the same level. Use pictures, simple words and a checklist with checkboxes. Our guide for Spanish-speaking crews covers translated checklists and voice notes. The goal is the same photos and numbers from every job.",
      },
      {
        heading: "Measuring whether it works",
        content: "Pick two simple measures: how many jobs had a complete log by the end of the day, and how many supplement items had to be delayed for missing photos. Track them for a month. If both improve, keep going. If not, ask the crew where the routine breaks down.",
      },
    ],
    faq: [
      {
        q: "What is an SOP?",
        a: "A short written routine that everyone follows the same way.",
      },
      {
        q: "Is the checklist free?",
        a: "Yes. It is a printable PDF, a fillable PDF and a Word file.",
      },
      {
        q: "How long should it be?",
        a: "One page.",
      },
      {
        q: "How do I get crews to use it?",
        a: "Explain why, keep it short, and review it with them on real jobs.",
      },
      {
        q: "Can I add my own steps?",
        a: "Yes. Edit the Word file.",
      },
      {
        q: "Who should own the SOP?",
        a: "One person, usually an operations manager or owner. They update it when something changes and answer questions.",
      },
      {
        q: "How often should I update it?",
        a: "Review it every few months or when your carrier, state or process changes.",
      },
    ],
    related: ["how-to-roll-out-roofing-supplement-software", "roof-tear-off-findings-log-template","roofing-photo-documentation-checklist","roofing-documentation-spanish-speaking-crews","how-roofing-contractors-work-insurance-claims"],
  },
  {
    slug: "is-roofing-supplement-software-worth-it",
    images: { 0: { src: "/blog/is-roofing-supplement-software-worth-it/card.png", alt: "Key points from the guide: Is Roofing Supplement Software Worth It? The Break-Even Math", width: 1200, height: 630 } },
    title: "Is Roofing Supplement Software Worth It? The Break-Even Math",
    metaTitle: "Is Roofing Supplement Software Worth It? Break-Even",
    metaDescription: "How to work out whether supplement software pays for itself: the break-even formula, the inputs you need and the honest limits of any estimate.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Run the numbers on your own jobs.",
    midCtaBody: "Your first Supplement Snap project is free, so you can judge the report before you pay for anything.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Where it comes from"],
        rows: [
          { feature: "Monthly cost of the tool", values: ["The price on the vendor's pricing page"] },
          { feature: "Supplements you file in a month", values: ["Your own records"] },
          { feature: "Average extra you recover per supplement", values: ["Your own records, not an industry average"] },
          { feature: "Share the software helps with", values: ["Your honest estimate; start low"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Use your numbers", text: "Averages from other companies do not describe your jobs. Use your last three months and treat the result as a rough guide, not a promise." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Software is worth it when the extra money it helps you recover, plus the time it saves, is more than it costs. You can check this with simple arithmetic and your own records. No one can promise a result, because carriers decide and every job differs.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "The break-even formula",
        content: "Break-even supplements per month = monthly cost divided by the average extra you recover per supplement. If a tool costs $99 a month and the extra you recover averages $400 per supplement, then $99 divided by $400 is about 0.25, so one such recovery every four months covers the monthly cost. Those are example numbers only. Use your own and check the vendor's current price, or try the <a href='/roofing-supplement-roi-calculator'>ROI calculator</a>.",
      },
      {
        heading: "What goes in",
        content: "The table lists the inputs. Pull them from your records: how many supplements you sent last quarter, what you asked for, what was paid. If you do not track those, start with the free tracker.",
      },
      {
        heading: "The time side",
        content: "Hours spent building reports, sorting photos and chasing details also cost money. Estimate how long a report takes now and how long it takes with a better process, and value the difference at your own rate. Be careful with this one, because faster is only worth it if the reports are as good.",
      },
      {
        heading: "What software cannot do",
        content: "It cannot make a carrier pay. It can help you present clearer documentation. If you rarely find hidden damage, or you already have a process that works, the benefit may be small.",
      },
      {
        heading: "How to test cheaply",
        content: "Use the free project or trial on one real job and compare the output with your current process. Then decide. Our guide to free supplement software and the cost comparison give more detail.",
      },
      {
        heading: "Three worked scenarios (fictional numbers)",
        content: "Scenario A: a company sends 2 supplements a month, recovers about $300 extra on each when it does, and thinks software helps with half of them. Benefit is 2 x 50% x $300 = $300 a month before any time savings. Against a $99 plan, that is a gain of $201 on paper.\n\nScenario B: a company sends 1 supplement a month and recovers $150 extra. Benefit is $75 if software helps with half, which is below a $99 price. Time savings would have to make up the difference.\n\nScenario C: a company sends 12 supplements a month, recovers $400 on each, and software helps with a quarter of them. Benefit is 12 x 25% x $400 = $1,200.\n\nThe numbers are invented. Run your own.",
      },
      {
        heading: "The hidden costs of switching",
        content: "Software has a learning curve. Allow a few jobs for the crew to get comfortable, and expect some reports to take longer at first. Also consider where the data lives, how you export it and what happens if you stop paying. Ask any vendor, including us, about export before you commit.",
      },
      {
        heading: "Alternatives that cost less",
        content: "A tracker, a template and a crew checklist cost nothing and fix a lot of problems. They do not draft descriptions or build the PDF for you, so they take more of your time. If your volume is low, they may be enough. If your time is the constraint, software may be worth testing.",
      },
      {
        heading: "How to run a fair test",
        content: "Pick three real jobs. Do the first with your current process and time it. Do the second with the software and time it. Compare the finished reports, side by side, as a reviewer would. Decide on the quality of the output and the time, not on the demo.",
      },
    ],
    faq: [
      {
        q: "How do I calculate the return on supplement software?",
        a: "Compare its monthly cost with the extra you recover and the time you save, using your own records.",
      },
      {
        q: "What is a good break-even?",
        a: "That depends on your volume and averages. Fewer supplements needed to break even is better.",
      },
      {
        q: "Does software guarantee more money?",
        a: "No. Carriers decide. Software helps organize and present documentation.",
      },
      {
        q: "What if I only file a few supplements a year?",
        a: "The benefit may be small, and a free tracker and template may be enough.",
      },
      {
        q: "Should I trust a vendor's ROI claims?",
        a: "Treat them as examples. Use your own data.",
      },
      {
        q: "Can I trust a calculator's result?",
        a: "Only as much as the inputs. Use real numbers from your own records and test the assumptions with a conservative estimate.",
      },
      {
        q: "What if my supplements are mostly denied?",
        a: "Look at why first. If documentation is the reason, better capture may help. If the reason is coverage, software will not change it.",
      },
    ],
    related: ["roofing-supplement-software-free-trial-plan", "how-to-measure-roofing-supplement-results", "questions-to-ask-before-buying-roofing-supplement-software", "roofing-supplement-software-cost","free-roofing-supplement-software","best-roofing-supplement-software","roofing-supplement-companies-vs-software"],
  },
  {
    slug: "roofing-supplement-mistakes-that-delay-payment",
    images: { 0: { src: "/blog/roofing-supplement-mistakes-that-delay-payment/card.png", alt: "Key points from the guide: 9 Roofing Supplement Mistakes That Slow Down or Sink a Request", width: 1200, height: 630 } },
    downloads: "roofing-supplement-template",
    title: "9 Roofing Supplement Mistakes That Slow Down or Sink a Request",
    metaTitle: "9 Roofing Supplement Mistakes That Delay Payment",
    metaDescription: "Missing claim numbers, vague photos, guessed quantities and no follow-up date are common reasons supplements stall. Nine mistakes and how to avoid each.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Fix the paperwork problems before they cost you.",
    midCtaBody: "Supplement Snap helps your crew capture locations, quantities and photos together so each finding is complete. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["The fix"],
        rows: [
          { feature: "No claim number on the package", values: ["Put it on the cover page and in the email subject"] },
          { feature: "Photos with no location", values: ["Number them and match each to a finding"] },
          { feature: "Guessed quantities", values: ["Measure, and show the arithmetic"] },
          { feature: "Everything in one email", values: ["Send one organized PDF with a short cover note"] },
          { feature: "No follow-up date", values: ["Write the date when you send"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Most delays are paperwork", text: "Reviewers handle many files. A package that is complete and easy to check is easier to act on than one that needs questions answered first." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Supplements stall for many reasons, and some of them are outside your control. The ones inside your control are mostly about completeness and clarity. These nine mistakes come up often in the documentation advice we have written, and avoiding them makes a request easier to review. None of this guarantees payment, because the carrier decides.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "1. Leaving off the claim number",
        content: "Without it, the package can be misfiled or need a call to match. Put the claim number on the first page, in the file name and in the subject line.",
      },
      {
        heading: "2. Photos without locations",
        content: "A photo of rotted wood means little if the reviewer cannot tell where it is. Number photos, tie them to findings and say which slope or area.",
      },
      {
        heading: "3. Guessing at quantities",
        content: "About ten sheets is easy to dispute. Measure, count and show the math, such as 12 ft x 8 ft = 96 sq ft.",
      },
      {
        heading: "4. Mixing opinions with facts",
        content: "Say what you found and where. Avoid blaming the adjuster or guessing at causes you cannot prove.",
      },
      {
        heading: "5. Sending a pile instead of a package",
        content: "Twenty loose photos in a long email are hard to review. One PDF with a cover page, a findings list and photos beside each finding is easier.",
      },
      {
        heading: "6. Waiting too long",
        content: "Hidden damage is only visible during tear-off. Document it that day and send the package promptly. Check the claim for any time limits.",
      },
      {
        heading: "7. No follow-up plan",
        content: "Write a follow-up date when you send, and record each contact. See the follow-up log guide for wording.",
      },
      {
        heading: "8. Skipping the code or policy source",
        content: "If your request depends on a code requirement, attach where it comes from. Policy wording, state rules and carrier practice vary, so confirm the details for your job.",
      },
      {
        heading: "9. Not keeping copies",
        content: "Keep what you sent, when, and to whom. If a request is questioned, your records matter.",
      },
      {
        heading: "A before-and-after example (fictional)",
        content: "Before: an email with the subject Roof photos, no claim number, fourteen attachments named IMG_2031 to IMG_2044, and a body that says found rot, please pay.\n\nAfter: a subject of Supplement request, Claim 123-456, 9 Pine Ct. A short body that says 3 findings, $2,140 requested, one PDF attached, follow up on Oct 17. The PDF has a cover page, a findings list and photos beside each finding.\n\nThe second version is easier to review. It does not guarantee payment, but it removes avoidable reasons for delay.",
      },
      {
        heading: "The checklist to run before you hit send",
        content: "Is the claim number on the first page and in the subject? Does each finding have a location, a quantity and photo numbers? Are the quantities measured with the arithmetic shown? Is everything in one PDF? Does the email say what you want? Have you written the follow-up date? Five minutes with this list catches most of the problems above.",
      },
      {
        heading: "When a mistake has already happened",
        content: "If you sent an incomplete package, send a short correction in the same thread: what was missing, the corrected attachment and a note that it replaces the earlier one. Do not send several partial versions. Keep a note of what you sent and when.",
      },
    ],
    faq: [
      {
        q: "Why do supplements get delayed?",
        a: "Common reasons include missing claim details, unclear photos, estimated quantities and no follow-up. Carrier review time also varies.",
      },
      {
        q: "Do these steps guarantee approval?",
        a: "No. The carrier decides. These steps make a request easier to review.",
      },
      {
        q: "How soon should I send a supplement?",
        a: "Promptly after documenting the findings. Also check the claim for any deadlines.",
      },
      {
        q: "What should the email say?",
        a: "A short note with the claim number, the number of findings, the total requested and what is attached.",
      },
      {
        q: "What if the carrier denies it?",
        a: "Read the reason, add missing documentation and consider a reinspection request or other steps.",
      },
      {
        q: "Do I need the free templates to avoid these mistakes?",
        a: "No, but they help. The supplement template and the tracker put the key fields on the page so nothing is forgotten.",
      },
      {
        q: "What is the most common reason a supplement stalls?",
        a: "It varies, but incomplete or hard-to-match documentation is a frequent cause, along with no follow-up.",
      },
    ],
    related: ["how-to-write-a-roofing-supplement","roofing-supplement-denied-what-to-do","roofing-supplement-email-to-adjuster","roofing-supplement-follow-up-log"],
  },
  {
    slug: "roofing-adjuster-inspection-what-to-bring",
    images: { 0: { src: "/blog/roofing-adjuster-inspection-what-to-bring/card.png", alt: "Key points from the guide: Meeting the Insurance Adjuster on the Roof: What to Bring and Do", width: 1200, height: 630 } },
    downloads: "roof-damage-report-template",
    title: "Meeting the Insurance Adjuster on the Roof: What to Bring and Do",
    metaTitle: "Roof Adjuster Meeting: What Roofers Should Bring",
    metaDescription: "Preparing for the adjuster's roof inspection: what to bring, what to show, how to take notes and how to stay professional. A practical contractor checklist.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NAIC: State Insurance Departments", url: "https://content.naic.org/state-insurance-departments" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Walk in with the proof already organized.",
    midCtaBody: "Supplement Snap helps you keep photos and notes by project so you can show what you found. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Why bring it"],
        rows: [
          { feature: "Your photos and notes", values: ["So you can point to what you saw"] },
          { feature: "A tape and chalk or marker", values: ["To show size and mark spots, if allowed"] },
          { feature: "The carrier's estimate, if you have it", values: ["To compare scope and quantities"] },
          { feature: "A notebook or phone", values: ["To record what is said and agreed"] },
          { feature: "Safe access and gear", values: ["So the inspection can happen safely"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Stay on your scope", text: "Show the condition of the roof and the work you would do. Whether to discuss coverage is up to the homeowner and the carrier, and rules for contractors differ by state." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "An adjuster visit is a chance to show the roof as you found it. Arrive early, bring organized photos and measurements, be polite and take notes. Avoid arguing coverage. Your job is to make the condition of the roof clear. The homeowner is the policyholder, and in many states rules limit what a contractor may do on a claim.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "What to bring",
        content: "The table lists the basics. Add a ladder or access plan so the adjuster can see the roof safely, and have the homeowner's permission for you to be there.",
      },
      {
        heading: "What to show",
        content: "Walk the roof the way you would for your own estimate. Point out each area of concern, show photos taken before the visit, and let the adjuster look for themselves. Keep your comments factual.",
      },
      {
        heading: "Taking notes",
        content: "Write the date, the adjuster's name and company, who was present, and what was inspected. Note any item the adjuster agrees to include or declines, in their words. Send a short written summary afterward.",
      },
      {
        heading: "Staying professional",
        content: "A calm, helpful visit helps everyone. If you disagree about something, record it and follow up in writing with documentation rather than arguing on the roof. Policy wording, state rules and carrier practice vary, so confirm the details for your job.",
      },
      {
        heading: "After the visit",
        content: "Compare the carrier's estimate to your scope when it arrives. If items are missing, document them and send a supplement or a reinspection request.",
      },
      {
        heading: "A pre-visit checklist",
        content: "The day before: confirm the time with the homeowner and adjuster, charge your phone and tablet, print or load your photos and measurements, and check the weather. On the day: arrive early, walk the roof yourself first, and make a short list of the items you want the adjuster to see. After: send a thank-you and a summary within a day.",
      },
      {
        heading: "What to say and what to avoid",
        content: "Say what you see and where, such as the decking at this corner is soft and the chimney flashing has separated. Avoid saying what the carrier must pay, who is at fault or what the policy covers. If asked a coverage question, say that is a question for the homeowner and the carrier. Rules about what contractors may say vary by state.",
      },
      {
        heading: "Safety and access",
        content: "Provide a ladder the adjuster can use safely, or offer to take photos of areas the adjuster cannot reach. Adjusters have their own safety policies, and some use drones or limit roof access. Do not pressure anyone to climb.",
      },
      {
        heading: "The follow-up message",
        content: "A short email works: thank you for meeting today, here is a summary of the areas we discussed, attached are the photos taken that day, and please let me know if you need anything else. Keep it factual and keep a copy.",
      },
    ],
    faq: [
      {
        q: "Should a roofer attend the adjuster's inspection?",
        a: "Many do, with the homeowner's permission. Rules about what a contractor may say or do differ by state.",
      },
      {
        q: "What should I bring?",
        a: "Photos, measurements, a tape, a way to take notes and safe access to the roof.",
      },
      {
        q: "Can I argue coverage with the adjuster?",
        a: "Focus on documenting conditions. Coverage is between the policyholder and the carrier, and state rules vary.",
      },
      {
        q: "What if the adjuster misses something?",
        a: "Note it and follow up in writing with photos. A reinspection request or supplement may fit.",
      },
      {
        q: "Should I send a summary afterward?",
        a: "Yes. A short written note of what was inspected and discussed helps keep a record.",
      },
      {
        q: "What if the adjuster refuses to let me attend?",
        a: "That is the carrier's choice in many cases. Send your documentation afterward and ask the homeowner to bring up what you found.",
      },
      {
        q: "Should I record the conversation?",
        a: "Recording laws differ by state. Take written notes instead unless you know the rules and have consent.",
      },
    ],
    related: ["how-insurance-adjusters-determine-roof-damage","can-a-roofer-talk-to-the-insurance-company","roof-claim-reinspection-request","insurance-lowball-roof-estimate-what-to-do"],
  },
  {
    slug: "questions-to-ask-before-buying-roofing-supplement-software",
    images: { 0: { src: "/blog/questions-to-ask-before-buying-roofing-supplement-software/card.png", alt: "Key points from the guide: 15 Questions to Ask Before You Buy Roofing Supplement Software", width: 1200, height: 630 } },
    title: "15 Questions to Ask Before You Buy Roofing Supplement Software",
    metaTitle: "15 Questions to Ask Before Buying Supplement Software",
    metaDescription: "A buyer's checklist for roofing supplement software: pricing limits, users, trial terms, cancellation, offline use, data, AI review and what to test first.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Test it on one real job before you pay.",
    midCtaBody: "Your first Supplement Snap project is free, and paid plans start with a 14-day trial. Judge the report it produces against your current process.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["How Supplement Snap answers (verify on our pricing page)"],
        rows: [
          { feature: "Free way to try it", values: ["First project is free with no card. Paid plans start with a 14-day trial; a card is required."] },
          { feature: "Price", values: ["Starter $99, Team $199, Pro $299 per month at the time of writing. Check the pricing page for current prices."] },
          { feature: "Users", values: ["Starter 1, Team up to 3, Pro up to 5"] },
          { feature: "Project limit on paid plans", values: ["Unlimited projects"] },
          { feature: "Cancelling", values: ["From the account page, through Manage billing, with no call needed"] },
          { feature: "Works with weak signal", values: ["Captures made without signal are saved on the phone and upload when it returns"] },
          { feature: "CRM integration", values: ["None. Reports download as PDF; Team and Pro can also export Xactimate CSV."] },
          { feature: "Who decides coverage", values: ["The carrier. The software does not decide coverage or guarantee approval."] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Ask every vendor the same questions", text: "Use this list with any company, including us. A good vendor answers plainly and in writing. If an answer is vague, or you are told to talk to sales for something as basic as price, treat that as information." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Before you pay for roofing supplement software, you should know five things: what it costs at your volume, what your crew has to do on the roof, who owns your photos and reports, how you leave if it does not work, and what it cannot do. The fifteen questions below cover those and a few more. Ask them of every vendor, then test your favorite on one real job.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Price and limits (questions 1 to 4)",
        content: "1. What does it cost per month at my size, in writing? Ask for the total, not the starting price.\n2. Is there a limit on projects, supplements or photos? Some tools price per claim or cap the number per month, which changes the math if you file a lot.\n3. How many people can log in on the plan I would use? A crew lead, an office person and an owner may all need access.\n4. Are there setup, onboarding or per-user fees on top?\n\nThe table shows how we answer a few of these. Compare the numbers to your own volume with the <a href='/roofing-supplement-roi-calculator'>ROI calculator</a>, and see the <a href='/blog/roofing-supplement-software-cost'>cost guide</a> for how pricing models differ.",
      },
      {
        heading: "Trial, contract and cancelling (questions 5 to 7)",
        content: "5. Can I try it on a real job before paying? A free project or a trial is a fair test. A demo video is not.\n6. Is a card required for the trial, and what happens on day 15? Ask what reminder you get before the first charge.\n7. How do I cancel, and is it self-service? You should be able to cancel without a call or an email chain, and you should know whether access continues to the end of the paid period.\n\nIf cancelling takes a phone call, that is worth knowing before you start.",
      },
      {
        heading: "What your crew actually does (questions 8 to 10)",
        content: "8. How many taps from opening the app to a captured finding with a photo and a note? Try it with gloves on or at arm's length in sunlight.\n9. What happens with no signal? Roofs and rural jobs often have weak coverage. Ask whether captures are saved on the phone and sent later.\n10. Can the crew speak a note instead of typing? Voice notes save time in the field, but ask what happens when the microphone is blocked or the network is down.\n\nThe best test is to hand the phone to your least technical crew member and watch. If they get stuck, your crew will too.",
      },
      {
        heading: "AI and the quality of the report (questions 11 to 12)",
        content: "11. Does the AI write something I have to review, or does it send on its own? You should be able to read and edit every description before anything goes to an adjuster. Software that drafts is useful. Software that sends without review is a risk to your reputation.\n12. What does the finished report look like, and can I see a real sample? Compare it with what you send today. Look for photos beside each finding, locations, quantities and a clear cover page.\n\nNo software can promise a carrier will pay. Anyone who guarantees approval is selling something they cannot control.",
      },
      {
        heading: "Your data and how you leave (questions 13 to 14)",
        content: "13. Who owns my photos, notes and reports, and can I download them? Ask what you would walk away with if you cancelled tomorrow.\n14. How long are photos kept, and what happens to them after I cancel? Claims can take months, and you may need the photos later.\n\nGet the answers in writing. For us, reports download as PDF and Team and Pro plans can export an Xactimate CSV. If you need a bulk export of everything, ask any vendor, including us, exactly what they provide.",
      },
      {
        heading: "Fit with your other tools (question 15)",
        content: "15. Does it connect to my CRM or estimating software, and do I need that? Some tools integrate and some do not. We do not integrate with CRMs today, so jobs are set up in Supplement Snap on their own. If a CRM connection is essential for you, that is a fair reason to choose something else. Our <a href='/blog/best-roofing-crm'>CRM guide</a> and <a href='/blog/best-roofing-supplement-software'>supplement software comparison</a> cover how the categories differ.",
      },
      {
        heading: "How to run a one-job test",
        content: "Pick one real job with hidden damage. Document it the way you normally would on one side, and with the software on the other. Then compare: how long each took, how complete each report looks, and how comfortable your crew was.\n\nWrite the answers to the fifteen questions on one page for each vendor you test. The decision is usually clear by the second page.\n\nIf you want a fallback that costs nothing, our free <a href='/free-roofing-templates'>supplement template, tracker and findings log</a> work without any software.",
      },
    ],
    faq: [
      {
        q: "What should I look for in roofing supplement software?",
        a: "Clear pricing for your volume, a free way to test it, simple capture that works on a roof, drafts you review before sending, a report adjusters can follow, and an easy way to cancel.",
      },
      {
        q: "Is a free trial enough to decide?",
        a: "It is enough if you use it on a real job. Test the capture, the report and the cancellation process before the trial ends.",
      },
      {
        q: "Should the software connect to my CRM?",
        a: "Only if that matters to your workflow. Many contractors use a CRM for customers and a separate tool for documenting hidden damage. Ask each vendor what it supports today.",
      },
      {
        q: "Can software guarantee that the carrier pays?",
        a: "No. The carrier decides. Software can help you document and present findings clearly.",
      },
      {
        q: "What is a red flag when buying?",
        a: "No price until a sales call, no free way to test, a cancellation process that needs a phone call, or promises about how much money you will recover.",
      },
      {
        q: "What if I only file a few supplements a year?",
        a: "A template, a tracker and a crew checklist may be enough. Run the numbers with your own volume before paying for software.",
      },
    ],
    related: ["roofing-supplement-software-field-test-checklist", "roofing-supplement-software-data-and-privacy-questions", "best-roofing-supplement-software","roofing-supplement-software-cost","is-roofing-supplement-software-worth-it","free-roofing-supplement-software"],
  },
  {
    slug: "how-to-write-roofing-supplements-faster",
    images: { 0: { src: "/blog/how-to-write-roofing-supplements-faster/card.png", alt: "Key points from the guide: How to Write Roofing Supplements Faster (Without Cutting Corners)", width: 1200, height: 630 } },
    title: "How to Write Roofing Supplements Faster (Without Cutting Corners)",
    metaTitle: "How to Write Roofing Supplements Faster: A Workflow",
    metaDescription: "Roofing supplements take too long when documentation starts in the office. A step-by-step workflow that moves the work to the roof and keeps reports complete.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    downloads: "roofing-supplement-template",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Draft while the damage is still in front of you.",
    midCtaBody: "Supplement Snap lets your crew capture photos, tags and voice notes on the roof and drafts descriptions for you to review. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Where the time usually goes"],
        rows: [
          { feature: "Sorting photos", values: ["Photos arrive by text with no labels, so someone matches them to findings later"] },
          { feature: "Chasing details", values: ["Quantities and locations were never written down, so the office calls the crew"] },
          { feature: "Writing descriptions", values: ["Each finding is written from scratch from memory and a blurry photo"] },
          { feature: "Formatting", values: ["Photos, notes and line items are pasted into a document by hand"] },
          { feature: "Resending", values: ["The carrier asks for something missing and the cycle repeats"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Speed comes from capturing once, well", text: "Faster supplements usually mean fewer steps after the roof, not faster typing in the office. Every missing detail you fix on the roof saves a phone call later." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Most of the time spent on a supplement is not writing. It is finding the right photo, remembering where it was taken, and asking the crew for numbers they did not write down. You write supplements faster by capturing each finding completely on the roof, using one routine every time, and building the package from what was captured instead of from memory. Better documentation also tends to mean fewer rounds with the adjuster.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Where the time goes",
        content: "The table lists the usual time sinks. None of them is hard on its own, but they pile up. If your supplements take days, look for which of these five is costing you the most and fix that one first.",
      },
      {
        heading: "Step 1: Capture each finding completely at the roof",
        content: "For every finding, the crew records five things before moving on: a wide photo for location, a close photo for detail, what it is, where it is, and how much. A tape in the picture and a quantity written down save the most time later.\n\nOur free <a href='/blog/roof-tear-off-findings-log-template'>tear-off findings log</a> is a printable way to do this, and an app can hold the same fields on a phone. What matters is that the same five things are captured every time.",
      },
      {
        heading: "Step 2: Use one routine so nothing is optional",
        content: "A short checklist taped to the truck beats a long training. Give the crew lead one page: before tear-off, during tear-off, before leaving. Our <a href='/blog/roofing-crew-supplement-documentation-sop'>crew SOP and checklist</a> is a free starting point.\n\nA routine removes the question of what to photograph, which is where most missed items come from.",
      },
      {
        heading: "Step 3: Write short, factual descriptions",
        content: "A good description is two or three sentences: what was found, where, how much, and when it was found. For example: Decking, rear slope along the eave. Four sheets soft and deteriorated, about 128 square feet, found after shingles and underlayment were removed.\n\nAvoid guessing at causes you cannot prove, and avoid arguing with the adjuster in the description. Plain facts are quick to write and easy to review. Software can draft these from a photo and a voice note, but read every description yourself before it goes out.",
      },
      {
        heading: "Step 4: Build one package, not a pile",
        content: "Put the cover page, the findings list, each finding with its photos, and the line items in one PDF. Our <a href='/blog/roofing-supplement-template'>supplement template</a> has all five parts. One organized file is faster for you to assemble and faster for the carrier to review than a long email with attachments.",
      },
      {
        heading: "A worked example (fictional)",
        content: "A crew finds soft decking, two corroded flashing sections and a missing drip edge section on one roof. Without a routine: the crew texts eleven photos, the office asks where each was taken, the crew guesses at quantities, and the supplement goes out two days later.\n\nWith a routine: the crew lead logs three findings on the roof, each with a wide photo, a close photo, a tape reading and a location. The office builds the package the same afternoon, reviews the descriptions and sends one PDF with a cover note.\n\nThe example is invented and the time saved will differ on your jobs. The point is that the work moved to the moment when the answers were easy to get.",
      },
      {
        heading: "Step 5: Send it the same day and set a follow-up",
        content: "Speed also means not letting a finished package sit. Send it promptly with a short cover email (see our <a href='/blog/roofing-supplement-email-to-adjuster'>email template</a>) and write a follow-up date in your <a href='/blog/roofing-supplement-tracker-template'>tracker</a>. A supplement that is sent quickly and followed up is usually resolved sooner than one that waits.",
      },
      {
        heading: "Where software helps and where it does not",
        content: "Software helps by keeping photos, tags, quantities and drafts in one place, so you are not assembling them by hand. It does not decide coverage, and it cannot make a carrier pay. If you are weighing tools, use our <a href='/blog/questions-to-ask-before-buying-roofing-supplement-software'>buyer's checklist</a> and test one on a real job. If you only file a few supplements a year, the free templates may be all you need.",
      },
    ],
    faq: [
      {
        q: "How long should a supplement take to write?",
        a: "It varies with the number of findings and how much was captured on the roof. Complete capture is what shortens it.",
      },
      {
        q: "What slows supplements down the most?",
        a: "Missing details: unlabeled photos, no locations or quantities, and descriptions written from memory days later.",
      },
      {
        q: "Can AI write my supplement?",
        a: "AI can draft descriptions from photos and notes. You should read and edit every one, and the carrier still decides what to pay.",
      },
      {
        q: "Do I need software to write supplements faster?",
        a: "No. A findings log, a checklist and a template get you most of the way. Software helps when volume is high or many people capture findings.",
      },
      {
        q: "Should I send the supplement right away?",
        a: "Send it promptly once it is complete, and write down a follow-up date. Check your claim for any time limits.",
      },
      {
        q: "What should the crew capture at minimum?",
        a: "A wide photo, a close photo, what it is, where it is, and how much, for every finding.",
      },
    ],
    related: ["how-to-write-a-roofing-supplement","roof-tear-off-findings-log-template","roofing-crew-supplement-documentation-sop","roofing-supplement-email-to-adjuster"],
  },
  {
    slug: "roofing-supplement-software-field-test-checklist",
    images: { 0: { src: "/blog/roofing-supplement-software-field-test-checklist/card.png", alt: "Key points from the guide: How to Field-Test Roofing Supplement Software Before You Buy", width: 1200, height: 630 } },
    title: "How to Field-Test Roofing Supplement Software Before You Buy",
    metaTitle: "Field-Test Roofing Supplement Software: A Checklist",
    metaDescription: "Test supplement software where it matters: on a roof, with gloves, in sun, with weak signal. A field-test checklist for one real job before you pay.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Run the test on a real tear-off.",
    midCtaBody: "Your first Supplement Snap project is free. Use it on one job and score it against this checklist before you decide.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to watch for"],
        rows: [
          { feature: "Gloves and dirty hands", values: ["Can you tap the right button without taking a glove off?"] },
          { feature: "Bright sun", values: ["Can you read the screen and see what the camera captured?"] },
          { feature: "Weak or no signal", values: ["Does a capture survive, and does it send later without redoing it?"] },
          { feature: "Rain or a cracked screen", values: ["Are the main actions big enough to hit quickly and by mistake rarely?"] },
          { feature: "Interruptions", values: ["If the phone rings or the app closes, is your work still there?"] },
          { feature: "A new crew member", values: ["Can someone who has never seen it capture a finding in a couple of minutes?"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Test the worst day, not the best", text: "A demo on a desk in good light proves nothing. Try it on a hot afternoon on a roof with one bar of signal. If it works there, it will work almost anywhere." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Supplement software is used in the field, so test it in the field. Pick one real tear-off, give the app to the person who will actually use it, and watch. The checklist below covers the conditions that cause problems on roofs: gloves, sun, bad signal, interruptions and a user who has never seen the app. Score what you see, not what the demo promised.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Before you go up",
        content: "Install the app or open the web version on the phone your crew really uses, not your newest one. Log in and make sure the project exists before you leave the truck. Check battery and storage, because photo apps use both.\n\nIf you are comparing two tools, test them on the same job so the conditions match. Our <a href='/blog/questions-to-ask-before-buying-roofing-supplement-software'>buyer's checklist</a> covers the questions to ask vendors before the test.",
      },
      {
        heading: "Test 1: Gloves, sun and speed",
        content: "Capture three findings in a row and time how long each takes from opening the app to a saved finding with a photo and a note. Try it with work gloves on. Try reading the screen in direct sun, and tilt the phone as you would on a slope.\n\nA good result is that the crew lead can do it quickly without help and without mistakes. If you need two hands and a shaded spot, the crew will skip it on busy days.",
      },
      {
        heading: "Test 2: Weak signal and no signal",
        content: "Put the phone in airplane mode and capture a finding, then reconnect. Does the finding appear, with its photos and notes, without you retyping? Supplement Snap saves captures on the phone and sends them when signal returns, but test any tool you are considering yourself rather than taking our word for it.\n\nAlso test the opposite: a strong signal with a slow upload. Photos are large, and a tool that freezes on a slow connection is a problem on a long job.",
      },
      {
        heading: "Test 3: Interruptions and mistakes",
        content: "Start a capture, then switch to another app or lock the phone for a minute. Come back. Is your work there? Tap the wrong thing on purpose and see if you can undo it. Delete something and see whether the tool lets you take it back.\n\nOn a real job, calls and texts arrive constantly. A tool that loses work on an interruption will lose your crew's trust fast.",
      },
      {
        heading: "Test 4: The new person",
        content: "Hand the phone to the least technical person on the crew with no instructions. Time how long it takes them to capture a finding. Do not help unless they are stuck for a full minute.\n\nIf they cannot do it, ask whether the problem is the tool or the training. A short instruction card can fix training. A confusing screen is harder to fix.",
      },
      {
        heading: "Test 5: What comes out the other end",
        content: "Back in the office, build the report from the test job. Open the PDF on a phone and on a computer. Are the photos beside each finding? Are locations, quantities and notes clear? Would an adjuster who was not there follow it?\n\nThis is the part that matters most. A fast capture that produces a hard-to-read report has not helped you. Compare it with your current process side by side.",
      },
      {
        heading: "How to score it",
        content: "Give each test a pass, a partial pass or a fail, and write one line about what happened. Two fails on tests 1 to 3 are a serious warning. Weigh the report quality heavily. Then decide, and if you are still unsure, run the same job through a second tool.",
      },
      {
        heading: "A sample scorecard (fictional)",
        content: "Test job: a 28 square re-roof with soft decking at the rear eave. Tool A: capture took about a minute with gloves, one missed tap, work survived a phone call, report readable. Tool B: captured fine in good signal, lost a finding after airplane mode, report cluttered.\n\nA simple three-line verdict for each tool is enough: what worked, what failed, would the crew use it again. The example is made up. What matters is that you write down what you saw while it is fresh, so the decision is not based on a vague feeling a week later.",
      },
      {
        heading: "Common reasons tools fail in the field",
        content: "Buttons that are too small for a gloved thumb, text that disappears in sun, long forms that need typing, no way to save when the signal drops, and apps that reload and lose a half-finished entry. If the tool does well on all five, it has cleared most of the obstacles that make crews quietly stop using something.",
      },
    ],
    faq: [
      {
        q: "How long should a field test take?",
        a: "One real tear-off is enough. Most of the testing happens while the crew works, with a few minutes of extra attention.",
      },
      {
        q: "Should I use the free version for the test?",
        a: "Yes, if it includes the features you need. Check what the free version limits, and see whether the trial or free project includes the report you will actually send.",
      },
      {
        q: "What if the tool fails the signal test?",
        a: "That is a real problem if you work in areas with poor coverage. Ask the vendor how they handle it, and test again before you decide.",
      },
      {
        q: "Who should run the test?",
        a: "The person who will use it day to day, not the owner. Their experience is the one that predicts whether it gets used.",
      },
      {
        q: "Can I test more than one tool?",
        a: "Yes. Use the same job and the same checklist so the results are comparable.",
      },
      {
        q: "What should I do if all tools feel clumsy?",
        a: "Start with a printed findings log and a crew checklist, then revisit software later.",
      },
    ],
    related: ["questions-to-ask-before-buying-roofing-supplement-software","best-app-to-document-roof-damage-for-insurance","roof-tear-off-findings-log-template","best-roofing-supplement-software"],
  },
  {
    slug: "roofing-supplement-software-free-trial-plan",
    images: { 0: { src: "/blog/roofing-supplement-software-free-trial-plan/card.png", alt: "Key points from the guide: How to Use a Free Trial to Choose Roofing Supplement Software", width: 1200, height: 630 } },
    title: "How to Use a Free Trial to Choose Roofing Supplement Software",
    metaTitle: "Free Trial Plan for Roofing Supplement Software",
    metaDescription: "A 14-day plan for testing supplement software on real jobs: what to do each week, what to compare, and how to cancel before you pay for a tool you do not use.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Use the trial on real jobs.",
    midCtaBody: "Your first Supplement Snap project is free, and paid plans start with a 14-day trial. Cancel from your account page if it is not for you.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to do"],
        rows: [
          { feature: "Days 1 to 2", values: ["Sign up, set up one real job, and capture a few findings on a current tear-off"] },
          { feature: "Days 3 to 7", values: ["Build a full report and compare it with your usual process"] },
          { feature: "Days 8 to 12", values: ["Use it on a second job with a different crew member"] },
          { feature: "Days 13 to 14", values: ["Decide, and cancel before the trial ends if the answer is no"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Write the cancel date on day one", text: "If a card is required, put the day before the trial ends on your calendar the moment you sign up. A trial you forget about is the most common way people end up paying for software they do not use." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A free trial is only useful if you use it on real work. Fourteen days is enough to test supplement software on two real jobs, compare the reports with your own, and decide. The plan below tells you what to do each week, what to compare and how to leave cleanly if it is not a fit. Treat the trial like a job interview for the software.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Before you start",
        content: "Ask three things in writing: is a card required, what happens on day 15, and how do I cancel. Read the cancellation steps before you enter a card. A fair trial tells you plainly and lets you cancel yourself, without a phone call. See our <a href='/blog/questions-to-ask-before-buying-roofing-supplement-software'>buyer's checklist</a> for the full list of questions.\n\nAlso check what the trial includes. Some trials limit features, so make sure you can build and download a full report.",
      },
      {
        heading: "Days 1 to 2: Set up one real job",
        content: "Do not test with made-up data if you can avoid it. Pick a job you are already working and set it up with the real address, claim number and carrier. Capture a few findings, even if the job is early. The goal is to see how the app feels in your hands and how long setup takes.\n\nIf setup is confusing, note what confused you. That is the information the trial is for.",
      },
      {
        heading: "Days 3 to 7: Build a report and compare",
        content: "Use the findings to generate a full report and open the PDF. Put it next to what you would normally send. Compare: photos beside findings, clear locations, quantities, readable descriptions, a cover page the adjuster can match to the claim.\n\nIf the software drafts descriptions with AI, read every one and edit what is off. Note how much editing was needed. Heavy rewriting means less time saved than you hoped.",
      },
      {
        heading: "Days 8 to 12: Use it again with someone else",
        content: "A second job, ideally with a different crew member, shows whether it works beyond the person who set it up. Watch where they get stuck. Try at least one capture with weak signal. Our <a href='/blog/roofing-supplement-software-field-test-checklist'>field-test checklist</a> covers the conditions to try.",
      },
      {
        heading: "Days 13 to 14: Decide",
        content: "Score three things: how easy it was for the crew, how good the report was, and what it would cost at your volume. Use our <a href='/roofing-supplement-roi-calculator'>ROI calculator</a> with your real numbers. If the answer is yes, keep it. If it is maybe, give it one more week on a third job before the trial ends only if the vendor offers an extension, otherwise decide on what you saw.\n\nIf the answer is no, cancel before the trial ends. Check that your account shows the cancellation, and save the confirmation.",
      },
      {
        heading: "After you decide",
        content: "If you keep it, tell the crew exactly what you expect from them on every job, and use a short checklist. See <a href='/blog/how-to-roll-out-roofing-supplement-software'>how to roll it out</a>. If you cancel, ask what happens to your data and whether you can download your reports first.",
      },
      {
        heading: "A one-page trial scorecard",
        content: "Write five lines on a sheet before you start: setup time, crew ease, report quality, cost at your volume, and how cancelling works. After each job, add a score from one to five and one sentence. At the end of day fourteen you have a decision on paper instead of an impression.\n\nIf you are comparing two tools at once, use the same sheet for both and the same job where possible.",
      },
      {
        heading: "Mistakes to avoid during a trial",
        content: "Testing only with sample data, letting one person decide alone, skipping the cancellation steps until the last day, and judging by features instead of by what the finished report looks like. Also avoid starting a trial the week before a vacation or a storm rush, when you will not have the attention to evaluate it.",
      },
    ],
    faq: [
      {
        q: "How long is a typical free trial?",
        a: "Many offer around 14 days, but terms differ. Ask the vendor for the exact length, whether a card is required, and what happens at the end.",
      },
      {
        q: "Do I need a card to start a trial?",
        a: "Some vendors require one and some do not. Supplement Snap's first project is free with no card, and paid plans start with a 14-day trial that needs a card.",
      },
      {
        q: "How do I avoid being charged after a trial?",
        a: "Set a reminder for the day before it ends, and cancel from your account. Keep the confirmation.",
      },
      {
        q: "What should I compare during a trial?",
        a: "Crew ease of use, report quality, time spent, and cost at your volume.",
      },
      {
        q: "Can I test with sample data?",
        a: "You can, but a real job tells you more. Use sample data only if no job is available.",
      },
      {
        q: "What if a tool has no free trial?",
        a: "Ask for a demo with your own photos, or a refund policy in writing before you pay.",
      },
    ],
    related: ["how-to-roll-out-roofing-supplement-software", "questions-to-ask-before-buying-roofing-supplement-software","roofing-supplement-software-field-test-checklist","free-roofing-supplement-software","is-roofing-supplement-software-worth-it"],
  },
  {
    slug: "how-to-roll-out-roofing-supplement-software",
    images: { 0: { src: "/blog/how-to-roll-out-roofing-supplement-software/card.png", alt: "Key points from the guide: How to Roll Out Supplement Software to Your Crew: First 30 Days", width: 1200, height: 630 } },
    title: "How to Roll Out Supplement Software to Your Crew: First 30 Days",
    metaTitle: "Roll Out Roofing Supplement Software: First 30 Days",
    metaDescription: "A practical 30-day plan for getting a roofing crew to use new supplement software: who does what, what to check weekly, and how to fix what is not sticking.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Start with one job and one crew lead.",
    midCtaBody: "Your first Supplement Snap project is free. Use it to try the rollout plan on a single job.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Focus"],
        rows: [
          { feature: "Week 1", values: ["One job, one crew lead, one short checklist"] },
          { feature: "Week 2", values: ["Add a second crew and review every report together"] },
          { feature: "Week 3", values: ["Fix what slowed people down and write it into the checklist"] },
          { feature: "Week 4", values: ["Everyone uses it, and you track what is working"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Do not roll out to everyone on day one", text: "A tool that fails with the whole company watching is hard to bring back. Prove it with one person first, fix the rough edges, then widen it." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "New software only helps if the crew uses it on every job. The way to get there is slowly and visibly: start with one crew lead on one job, keep the instructions to one page, review the results together and fix what slows people down. By week four the routine should be habit, and you should know from your own numbers whether it is worth keeping.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Before week 1: choose who and what",
        content: "Pick one crew lead who is patient and reasonably comfortable with phones. Pick one live insurance job. Write down the three things you want from the tool, such as complete findings, photos beside each one, and a report sent the same day. Our <a href='/blog/roofing-crew-supplement-documentation-sop'>crew checklist and SOP</a> is a good starting page.\n\nDecide who reviews every report in the first weeks. That person is the quality check and the support line.",
      },
      {
        heading: "Week 1: One job, one lead",
        content: "Walk the crew lead through the app on the truck, then let them do the job. Stay reachable by phone. After the job, build the report together and look at it as an adjuster would. Note every point where the lead hesitated.\n\nDo not add more tools or more rules this week. The goal is a clean first success.",
      },
      {
        heading: "Week 2: Add a second crew",
        content: "Bring in a second crew lead and let the first one show them. Peer teaching beats a presentation from the office. Keep reviewing every report. Share one good example with the group so everyone sees what good looks like.\n\nExpect questions about photos and where to tag things. Collect them in a short list.",
      },
      {
        heading: "Week 3: Fix and simplify",
        content: "Turn the question list into a one-page cheat sheet and update the checklist. If the app is slow on a certain phone, replace that phone or change the step. If one finding type is always missing quantities, add a reminder to the checklist. Our <a href='/blog/roof-tear-off-findings-log-template'>findings log</a> can back up the app when signal is bad.",
      },
      {
        heading: "Week 4: Everyone, with a scoreboard",
        content: "Make the routine the standard for every insurance job. Start tracking a few simple numbers: how many jobs had complete findings, how many supplements went out within a day or two, and how many were paid in whole or in part. See <a href='/blog/how-to-measure-roofing-supplement-results'>how to track your supplement results</a>.\n\nIf adoption is patchy, ask why instead of pushing harder. Usually a step is too slow or too confusing.",
      },
      {
        heading: "Keeping it going",
        content: "Review one report a week, praise good ones, and fix friction quickly. Check in with the crew leads monthly. If after a month the tool is not getting used, decide honestly whether to simplify, retrain or switch. The software cannot do the work if the habit does not form.",
      },
      {
        heading: "A sample week-one plan (fictional)",
        content: "Monday: walk the crew lead through the app on the truck for ten minutes. Tuesday and Wednesday: use it on a live tear-off while you stay on call. Thursday: build the report together and note every hesitation. Friday: change one thing on the cheat sheet and thank the lead.\n\nThe schedule is an example. Adjust it to your jobs. The shape is the point: short practice, a real job, a review and one improvement.",
      },
      {
        heading: "Signs the rollout is working",
        content: "Crew leads capture findings without being asked, reports arrive with photos beside each finding, quantities are written down, and the office stops calling the roof for details. A drop in follow-up questions from adjusters is another good sign. If those are not happening after a few weeks, return to week three and find the friction.",
      },
    ],
    faq: [
      {
        q: "How long does it take a crew to learn supplement software?",
        a: "It varies. Many crews can capture a finding after one walkthrough, and building the habit usually takes a few weeks of consistent use.",
      },
      {
        q: "Who should own the rollout?",
        a: "One person, such as an operations manager or the owner, who answers questions and reviews reports in the first weeks.",
      },
      {
        q: "What if some crew members resist?",
        a: "Ask what slows them down and fix that first. Show them how the documentation protects their work.",
      },
      {
        q: "Do I need training sessions?",
        a: "A short walkthrough on a real job, a one-page cheat sheet and a quick review of the first reports are usually enough.",
      },
      {
        q: "How do I know it is working?",
        a: "Track complete findings per job, time to send, and what was paid. Compare them with your numbers from before.",
      },
      {
        q: "What if we have poor signal on many jobs?",
        a: "Test that case early. Keep a paper findings log as a backup while you confirm how the app handles it.",
      },
    ],
    related: ["roofing-supplement-software-free-trial-plan","roofing-crew-supplement-documentation-sop","how-to-measure-roofing-supplement-results","roofing-documentation-spanish-speaking-crews"],
  },
  {
    slug: "how-to-measure-roofing-supplement-results",
    images: { 0: { src: "/blog/how-to-measure-roofing-supplement-results/card.png", alt: "Key points from the guide: How to Track Whether Your Roofing Supplements Are Working", width: 1200, height: 630 } },
    title: "How to Track Whether Your Roofing Supplements Are Working",
    metaTitle: "How to Track Roofing Supplement Results (Simple Metrics)",
    metaDescription: "Track a few simple numbers to see if your supplement process works: time to send, paid versus asked and follow-ups. Free tracker included.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    downloads: "roofing-supplement-tracker",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Keep the numbers in one place.",
    midCtaBody: "Supplement Snap keeps each project's findings and report together, so your tracker only needs the status. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Why it matters"],
        rows: [
          { feature: "Supplements sent per insurance job", values: ["Shows how often hidden damage is actually being documented and requested"] },
          { feature: "Days from tear-off to sent", values: ["Shows whether the package goes out while the damage is fresh"] },
          { feature: "Amount asked versus amount paid", values: ["Shows what the carrier actually accepts, in your market, on your jobs"] },
          { feature: "Days to first response", values: ["Shows where follow-up is needed"] },
          { feature: "Supplements denied and why", values: ["Shows what documentation was missing"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Measure your own jobs, not an industry average", text: "No average from another company tells you how your process is doing. A few numbers tracked on your own jobs for three months tell you much more." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "You cannot tell whether supplements are worth your time, or whether new software is paying off, without a few numbers from your own jobs. Track five things on every insurance job: whether a supplement was sent, how many days after tear-off, how much you asked for, how much was paid, and why anything was denied. Three months of that tells you more than any published average.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "The five numbers",
        content: "The table lists them. None needs special software. A spreadsheet, a printed page or our free tracker works. What matters is that you write them down every time, at the moment they happen, not from memory at the end of the month.",
      },
      {
        heading: "How to record them",
        content: "Use one line per supplement. Our <a href='/blog/roofing-supplement-tracker-template'>supplement tracker template</a> has columns for claim, carrier, date sent, follow-up date, status and amount asked. Add two columns of your own: the date of tear-off and the amount paid.\n\nWhen the carrier responds, write the date and the result. If part was denied, write the reason in a few words, such as no photo of the location or quantity not shown.",
      },
      {
        heading: "What to look for after a month",
        content: "Count jobs with hidden damage and compare with supplements actually sent. A gap means findings are being missed or not sent. Look at days from tear-off to sent: long gaps usually mean the documentation is being rebuilt later in the office. See <a href='/blog/how-to-write-roofing-supplements-faster'>how to write supplements faster</a>.\n\nThen look at paid versus asked. A big gap may mean quantities or photos were not convincing, or that you asked for items the policy does not cover.",
      },
      {
        heading: "What to look for after three months",
        content: "Patterns appear: one carrier that responds slowly, one finding type that is often denied, one crew that always sends complete packages. Use them. Send the strong crew's packages to the others as examples. Change the checklist for the weak spot. Raise problem patterns with the carrier contact in writing.\n\nIf you tried new software during this time, compare the three months before and after on the same five numbers. Use our <a href='/roofing-supplement-roi-calculator'>ROI calculator</a> with your real figures.",
      },
      {
        heading: "What not to conclude",
        content: "A single denial does not mean the process is broken. Carriers decide, and one job can go either way. Look for patterns across many jobs. Also be careful comparing months: a hail season and a quiet month are not comparable. Compare like with like.",
      },
      {
        heading: "Keeping it light",
        content: "The aim is a few minutes a week, not a reporting project. Put one person in charge, review the numbers once a month, and change one thing at a time. If you stop recording, you lose the advantage, so make it part of sending the supplement.",
      },
      {
        heading: "A sample month (fictional numbers)",
        content: "Ten insurance jobs, six with hidden damage, five supplements sent, an average of three days from tear-off to sent. Asked: five requests listed in the tracker. Paid in full: two. Paid in part: one. Denied: two, both noted as missing photo of location.\n\nFrom that month you would learn that one job had damage that never went out, that three days is slower than you want, and that location photos are the weak spot. All numbers here are invented to show the method, not a benchmark.",
      },
      {
        heading: "Turning numbers into changes",
        content: "Pick one weak number and change one thing. If location photos are the problem, add a wide-photo step to the crew checklist. If days to send is long, set a same-day rule. Then look at the same number next month. Changing five things at once makes it impossible to see what helped.",
      },
    ],
    faq: [
      {
        q: "What should I track for roofing supplements?",
        a: "Whether one was sent, days from tear-off to sent, amount asked, amount paid, and reasons for any denial.",
      },
      {
        q: "Do I need software to track it?",
        a: "No. A spreadsheet or a printed tracker works. Software helps when many people are involved.",
      },
      {
        q: "How long before the numbers mean anything?",
        a: "Three months of consistent records is a reasonable start, longer if you do few jobs.",
      },
      {
        q: "What is a good paid-to-asked ratio?",
        a: "There is no universal number. Compare your own over time and across carriers.",
      },
      {
        q: "How do I know if new software is helping?",
        a: "Compare the same five numbers before and after, on similar kinds of jobs.",
      },
      {
        q: "Should I track time spent too?",
        a: "If you want to value time savings, note the minutes spent building each report for a few jobs before and after a change.",
      },
    ],
    related: ["roofing-supplement-tracker-template","roofing-supplement-follow-up-log","is-roofing-supplement-software-worth-it","how-roofing-contractors-work-insurance-claims"],
  },
  {
    slug: "roofing-supplement-software-data-and-privacy-questions",
    images: { 0: { src: "/blog/roofing-supplement-software-data-and-privacy-questions/card.png", alt: "Key points from the guide: Roofing Supplement Software: Data, Privacy and Security Questions", width: 1200, height: 630 } },
    title: "Roofing Supplement Software: Data, Privacy and Security Questions",
    metaTitle: "Supplement Software Data and Privacy: What to Ask",
    metaDescription: "Your photos, notes and homeowner details live in the tool you choose. Ask about data ownership, AI use, storage, deleting your account and security.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-25",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Ask us anything about your data.",
    midCtaBody: "Our privacy policy is public, and your first project is free. Read it before you decide.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["How Supplement Snap answers (see our privacy policy)"],
        rows: [
          { feature: "Where data is stored", values: ["Account data and projects in Supabase, a managed database; uploaded images in Supabase Storage"] },
          { feature: "Who can read it", values: ["Project records: only the signed-in account that owns them, and team members the owner invites. We tested that a visitor with no login can read none of the tables. Photos: each file has a long, hard-to-guess web address, and anyone who has the exact link can open it, so do not post report photo links publicly."] },
          { feature: "AI drafting", values: ["The drafting step sends the written notes and details to an AI service (Anthropic). Photos are not part of that request as the app is built today."] },
          { feature: "Payments", values: ["Handled by Stripe. We do not store card numbers."] },
          { feature: "Deleting your account", values: ["Per our privacy policy, data is removed within 30 days of account deletion."] },
          { feature: "Email", values: ["Reports and notices are sent through Resend"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Read the privacy policy, then ask questions", text: "A policy tells you what a company says it does. Good vendors also answer specific questions plainly and in writing." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "When you use supplement software, homeowner names, addresses, claim numbers and photos of their homes live in someone else's system. Before you choose one, ask who can see that information, where it is stored, what happens when you cancel, and whether it is sent to an AI service. The questions below cover what matters most. We answer them for Supplement Snap in the table, based on our privacy policy and what we have tested, and you should ask any vendor for the same.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Who owns the data",
        content: "Ask: who owns the photos, notes and reports, and can I download them? You should keep ownership of the work you document. Ask what you can take with you if you cancel: reports as PDFs, photos, notes. Get the answer in writing.",
      },
      {
        heading: "Where it is stored and who can see it",
        content: "Ask: where is the data stored, and who inside the company can access it? Ask how accounts are separated from each other. For us, project records live in Supabase and are tied to your login, and we tested that a person with no login cannot read the tables. Photos are different: they are stored as files with long, hard-to-guess web addresses, and anyone who has the exact address can open the photo without logging in. That is a common design, but you should know it. We cannot claim a system is impossible to breach, and no honest vendor can.",
      },
      {
        heading: "AI and your information",
        content: "Ask: does the tool send my information to an AI company, and which information? For Supplement Snap, the drafting step sends your written notes and project details to an AI service so it can draft descriptions. Photos are not part of that request as the app works today. Ask any vendor whether your data is used to train models and what their provider's terms say. Our privacy policy lists the services we use.",
      },
      {
        heading: "Keeping and deleting",
        content: "Ask: how long is data kept, and what happens after I cancel? Claims can take months, so you may need your photos later. Download your reports before you cancel. For our policy, data is removed within 30 days of account deletion. Ask other vendors for their number.",
      },
      {
        heading: "Payments and email",
        content: "Ask: who handles payments, and is my card stored? We use Stripe, so card details go to Stripe, not to us. Ask who sends the emails and whether adjusters see your address or the company's. Our reports are sent through Resend and replies go to the sender.",
      },
      {
        heading: "Team members and access",
        content: "Ask: can I control who sees what, and can I remove someone quickly? When a crew member leaves, you should be able to remove their access the same day. Ask how invites work and whether each person has their own login.",
      },
      {
        heading: "Questions that should worry you",
        content: "Be cautious if a vendor will not say where data is stored, cannot explain what happens when you cancel, has no privacy policy, or promises that data is completely safe. A plain, specific answer, including what they do not do, is a good sign.",
      },
      {
        heading: "A short script you can use with any vendor",
        content: "Email or ask: Where is my data stored? Who at your company can see it? Is my information sent to an AI provider, and which part? What happens to my photos and reports if I cancel? Can I download everything first? How do I remove a team member? Where is your privacy policy?\n\nA good vendor answers each in a sentence or two. If you get a sales pitch instead of answers, treat that as an answer.",
      },
      {
        heading: "What we do not promise",
        content: "We do not promise that data can never be breached, that a carrier will accept any report, or that AI drafts are always right. You review every draft before it goes anywhere. We also do not claim certifications we have not earned. If your carrier or a client requires a specific security standard, ask us directly and we will tell you plainly whether we meet it.",
      },
    ],
    faq: [
      {
        q: "Does Supplement Snap send my photos to an AI service?",
        a: "As the app is built today, the AI drafting step receives your written notes and project details, not your photos. Check our privacy policy for current details.",
      },
      {
        q: "Who can see my projects?",
        a: "The account that owns them and any team members the owner invites. A visitor without a login cannot read them.",
      },
      {
        q: "What happens to my data if I cancel?",
        a: "Per our privacy policy, data is removed within 30 days after account deletion. Download your reports first if you may need them.",
      },
      {
        q: "Do you store my credit card?",
        a: "No. Payments are handled by Stripe.",
      },
      {
        q: "Is any software completely secure?",
        a: "No. Choose a vendor that is honest about how it protects data and what it cannot promise.",
      },
      {
        q: "What should I ask any vendor?",
        a: "Where data is stored, who can see it, whether AI is used and with what, how long it is kept, and how you leave.",
      },
    ],
    related: ["questions-to-ask-before-buying-roofing-supplement-software","best-roofing-supplement-software","roofing-supplement-software-free-trial-plan","roofing-supplement-companies-vs-software"],
  },
  {
    slug: "how-to-document-multiple-roof-layers-during-tear-off",
    title: "How to Document Multiple Layers of Shingles During Tear-Off",
    metaTitle: "Document Multiple Shingle Layers During Tear-Off",
    metaDescription: "Found a second or third roof layer? How to photograph each layer with a tape, record the count by slope, and send proof for extra labor and disposal.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-26",
    images: { 0: { src: "/blog/how-to-document-multiple-roof-layers-during-tear-off/diagram.png", alt: "Illustration of a cut roof edge showing two layers of shingles over a roof deck with a tape measure beside it and four numbered photo steps", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Catch the layers before they hit the dumpster.",
    midCtaBody: "Supplement Snap lets your crew photograph and tag each finding by slope the moment it appears. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to capture"],
        rows: [
          { feature: "The edge", values: ["A close photo of the cut edge showing every layer stacked, with a tape against it"] },
          { feature: "The count", values: ["How many layers, on which slope, and where on that slope"] },
          { feature: "The type", values: ["Shingles, felt, wood shakes or something else, so the office knows what came off"] },
          { feature: "The change", values: ["A wide photo showing where the extra layers start and stop"] },
          { feature: "The proof of work", values: ["Photos of the debris or weight tickets from the extra material"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Photograph it before the second layer is gone", text: "The edge is only readable until it is torn off. Take the photo the moment you see more than you expected, and write down the slope while you are standing there." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "When a crew strips the first section of a roof and finds a second or third layer that was not visible from the ground, the job is bigger than the estimate assumed. Extra layers mean more labor, more disposal and sometimes different installation steps. To ask the carrier to reflect that, you need proof the office can use: a clear photo of the stacked edge with a tape, the count by slope, and a note of the material. Take it during tear-off, before the layers are in the trailer.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why layers get missed",
        content: "From the ground, a roof with two layers can look like one. Edges are covered by drip edge or fascia, and the layer count may differ between slopes if part of the roof was repaired or re-roofed at another time. The estimate is usually built from what the adjuster could see and from aerial measurements, so extra layers often show up only once the crew is on the roof. The table lists what to capture the moment you find them.",
      },
      {
        heading: "Step 1: Photograph the stacked edge",
        content: "Cut or lift a clean edge so the layers are visible from the side. Hold a tape measure or a marked stick against it. Take one close photo showing every layer and the tape, and one slightly wider photo that shows where on the slope the edge is. If you cannot get a clean side view, photograph the exposed layers as the crew removes them, one at a time, with the slope noted.\n\nDo not rely on a single photo. If a reviewer cannot tell how many layers there are, the photo does not do its job.",
      },
      {
        heading: "Step 2: Count by slope, not by house",
        content: "Layers can differ across a roof. A rear addition may have one layer while the main roof has two. Write the count for each slope: Front slope, two layers. Rear slope, one layer. Addition, three layers. Then put the quantity of roofing in squares beside each count, if the crew has measured it. Our free <a href='/blog/roof-tear-off-findings-log-template'>findings log</a> has a table for exactly this.",
      },
      {
        heading: "Step 3: Name what you found",
        content: "Say what the layers are made of. Asphalt shingles over felt over old shingles is different from wood shakes under newer shingles. Note whether the lower layer looks like a different age or product, and whether you saw anything unusual between layers. Keep it factual: what is there, not why it happened.",
      },
      {
        heading: "Step 4: Keep proof of the extra disposal",
        content: "Extra layers add weight and loads. Keep dump tickets and dumpster invoices, and photograph the debris pile if useful. Write the claim number or address on each receipt. Our article on <a href='/blog/roof-debris-removal-dumpster-insurance-claim'>debris removal and dumpster costs</a> covers what the carrier may need to see. Building codes, manufacturer instructions, policy wording and carrier practice vary, so confirm the details for your job with the building department and the claim documents.",
      },
      {
        heading: "A worked example (fictional)",
        content: "A crew starts on the rear slope of a 32 square roof. The lead lifts a shingle at the eave and finds two layers. He walks the roof, finds the same stack on the front slope, and then sees that the garage addition has only one. He photographs the cut edge on each slope with a tape, writes Front 2 layers, Rear 2 layers, Garage 1 layer in the log, and sends the log and photos to the office before lunch.\n\nThe office builds a supplement with three numbered findings, each with its edge photo, and compares the tear-off quantity in the estimate with the second-layer quantity. The example is made up. It shows the order: stop, photograph, count by slope, send.",
      },
      {
        heading: "How to word the request",
        content: "Keep it short and checkable: Second layer of asphalt shingles found on front and rear slopes, 28 squares. Photos 6 to 11 show the stacked edge with a tape. Garage addition has one layer, photo 12. Dump tickets attached.\n\nAsk for the difference between what the estimate lists and what you found. Do not argue about why the adjuster did not see it. The roof was not open when they looked.",
      },
      {
        heading: "A copy-and-paste checklist for the crew lead",
        content: "• Stop as soon as you see more layers than expected\n• Photograph the cut edge from the side with a tape against it\n• Take a second photo a step back that shows where on the slope it is\n• Count the layers and write the number for this slope\n• Write what each layer is made of\n• Repeat on every slope, because counts can differ\n• Keep dump tickets and invoices for the extra disposal\n• Send the log and photos to the office before the layers are in the trailer\n\nOur <a href='/blog/roof-tear-off-findings-log-template'>free findings log</a> has a row for each of these.",
      },
      {
        heading: "What a reviewer usually needs to see",
        content: "Someone reviewing a supplement from a desk was not on the roof. They commonly want to be able to answer four questions from your package alone: how many layers, on which slope, of what material, and how much extra material that created. If a photo or a note answers each, there is less reason to send the request back for more information. If the reviewer still has to ask, answer in writing and attach the missing photo. Keep a copy of each exchange.",
      },
      {
        heading: "If the estimate and your count do not match",
        content: "Compare the carrier's tear-off line with your own count. If the estimate assumes one layer and you found two, write the difference in squares and attach the edge photos. If the quantities are close but not identical, say how you measured, because small differences can come from where each person measured. Ask for the difference in writing, keep the tone factual, and set a follow-up date. See <a href='/blog/roofing-supplement-email-to-adjuster'>our email template</a> and <a href='/blog/roofing-supplement-tracker-template'>tracker</a>.",
      },
      {
        heading: "Layers, code and your contract",
        content: "Many places limit how many layers a roof can carry, and some require all layers to come off when there are already two. Whether that applies to your job depends on the local building code, so ask the building department. Your own contract should also say what happens when hidden layers are found, so the homeowner is not surprised. Neither of those decides what the carrier pays, but both are good records to have. Building codes, manufacturer instructions, policy wording and carrier practice vary, so confirm the details for your job with the building department and the claim documents.",
      },
      {
        heading: "Mistakes that weaken the proof",
        content: "• One photo of the edge with no tape and no slope noted\n• A count for the whole house when slopes differ\n• Photos taken after the layers were already in the dumpster\n• No receipts for the extra disposal\n• Claiming a layer you did not photograph",
      },
    ],
    faq: [
      {
        q: "Does insurance pay for an extra layer of shingles?",
        a: "Sometimes. It depends on the policy, local code, and what the carrier accepts after reviewing your photos and quantities. Document it clearly and ask.",
      },
      {
        q: "How do I prove how many layers there were?",
        a: "Photograph the cut edge with a tape against it, and write the count for each slope with the photo numbers.",
      },
      {
        q: "Do layers have to be removed?",
        a: "Many places limit how many layers a roof can have, and shingle manufacturers give installation instructions. Check your local code and the manufacturer's sheet for the product you install.",
      },
      {
        q: "What if only part of the roof has two layers?",
        a: "Document each slope separately. Quantities and counts by slope are what the reviewer needs.",
      },
      {
        q: "Should I keep the dump tickets?",
        a: "Yes. They show the extra weight and loads and support the disposal line.",
      },
      {
        q: "Can I add this to a supplement after the first estimate?",
        a: "Many contractors do. Send the photos, counts and receipts together and follow the carrier's process.",
      },
      {
        q: "How many layers of shingles can a roof have?",
        a: "It depends on local code and the roof's condition. Many places require removing all layers when there are already two, and shingle makers give their own installation instructions. Ask your building department for the rule in your area.",
      },
      {
        q: "How do I tell shingle layers from underlayment?",
        a: "Layers of shingles are thick, granule-covered courses stacked on each other. Underlayment is a thin sheet, usually felt or synthetic, between the shingles and the deck. Photograph the edge and label each layer so the difference is clear.",
      },
      {
        q: "Can I charge more for an extra layer?",
        a: "That depends on your contract and the carrier's review. Write the contract so hidden conditions are addressed, and document the extra layer with photos and quantities either way.",
      },
    ],
    related: ["roof-debris-removal-dumpster-insurance-claim","roof-tear-off-vs-overlay","roof-tear-off-findings-log-template","what-can-you-supplement-on-a-roof-claim"],
  },
  {
    slug: "document-rotted-fascia-and-sub-fascia-roof-claim",
    title: "Rotted Fascia on a Roof Claim: How to Document It at Tear-Off",
    metaTitle: "Rotted Fascia Roof Claim: How to Document It",
    metaDescription: "Dropping the gutters can reveal rotted fascia and rafter tails the estimate never saw. How to photograph, measure and describe it factually for the carrier.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-26",
    images: { 0: { src: "/blog/document-rotted-fascia-and-sub-fascia-roof-claim/diagram.png", alt: "Illustration of a roof eave cross-section showing the rafter, roof deck, sub-fascia, fascia and a removed gutter, with four numbered photo steps", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Log it before the gutters go back up.",
    midCtaBody: "Supplement Snap helps your crew capture each finding with a photo, a location and a note while the damage is still exposed. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to capture"],
        rows: [
          { feature: "The wide shot", values: ["The whole eave or rake, showing where along the roof the damage is"] },
          { feature: "The close shot", values: ["The rotted board with a tape, and a probe or screwdriver showing how soft it is"] },
          { feature: "The length", values: ["Linear feet of fascia, and how many rafter tails look affected"] },
          { feature: "What is behind it", values: ["The gutter attachment and the edge of the roof deck, if exposed"] },
          { feature: "The date", values: ["When the gutters came off, so the finding is tied to the tear-off"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "State what you see, not the cause", text: "Say the board is soft and discolored and where. Whether it is storm damage, old moisture or maintenance is for the carrier and the policy to decide, and a guess weakens your credibility." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Fascia, sub-fascia and rafter tails sit behind the gutters, so their condition is often unknown until the gutters come off during a replacement. When the crew finds rot there, the job has gained work that was not in the first estimate. The way to handle it is to stop, photograph and measure while it is exposed, describe it plainly without guessing at the cause, and send it to the office the same day. The carrier decides whether it is covered.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why it shows up late",
        content: "Gutters and drip edge cover the fascia, and the sub-fascia and rafter tails are behind it. Water that runs down the back of a gutter or sits against the eave can soften wood out of sight. An adjuster inspecting from the ground or from aerial images usually cannot see it. The table lists what to capture the moment the board is exposed.",
      },
      {
        heading: "Step 1: Wide shot, then close shot",
        content: "Take a photo of the whole eave or rake first, so a reviewer can see where the damage is. Then move in: photograph the rotted board with a tape against it. If it is soft, press a screwdriver or a probe into it and photograph that, because it shows condition better than a description.",
      },
      {
        heading: "Step 2: Measure and count",
        content: "Write the linear feet of fascia that is affected, and how many rafter tails look soft. Note which side of the house and which part of the eave. Our <a href='/blog/roof-tear-off-findings-log-template'>findings log</a> has a row for each, with photo numbers.",
      },
      {
        heading: "Step 3: Describe it without guessing",
        content: "A short factual note works: Front eave, left side. About 14 linear feet of fascia is soft and discolored when probed. Three rafter tails show deterioration at the end. Found after gutters were removed. Photos 18 to 23.\n\nAvoid words like neglected, old or storm damage unless you can show the evidence. Leave the cause to the reviewer.",
      },
      {
        heading: "Step 4: Send it before the repair",
        content: "Do not replace the board before the office has the photos. If the work cannot wait because of weather or safety, photograph it thoroughly first and tell the office what you did. If you need the carrier's approval before replacing it, send the photos right away and follow up. Building codes, manufacturer instructions, policy wording and carrier practice vary, so confirm the details for your job with the building department and the claim documents.",
      },
      {
        heading: "A worked example (fictional)",
        content: "On a full replacement, the crew removes the gutters on the front eave and finds that a length of fascia crumbles at the lower edge. The lead photographs the eave, then the board with a tape, then a screwdriver sinking into the wood. He counts three rafter tails with the same condition, writes it in the log, and calls the office.\n\nThe office builds a numbered finding for fascia and another for the rafter tails, attaches the photos and asks the carrier to review the added work. The numbers and details are invented to show the process, and the carrier may decide differently.",
      },
      {
        heading: "How to word the request",
        content: "Fascia and rafter tails, front eave: 14 linear feet of fascia and 3 rafter tails soft and deteriorated, found after gutter removal. Photos 18 to 23 show the condition with a tape and probe. Replacement requested for the affected sections.\n\nKeep fascia and rafter tails as separate findings so the reviewer can answer each on its own.",
      },
      {
        heading: "Fascia, sub-fascia, soffit and rafter tails: what is what",
        content: "• Fascia: the board that runs along the edge of the roof, usually where the gutter attaches\n• Sub-fascia (also called a fascia backer in some regions): a board behind the fascia that gives it something solid to fasten to\n• Rafter tails: the ends of the rafters that stick out past the wall\n• Soffit: the underside of the overhang, between the wall and the fascia\n\nUse the same words in your photos and notes so a reviewer knows exactly which board you mean.",
      },
      {
        heading: "A copy-and-paste checklist",
        content: "• Wide photo of the whole eave or rake\n• Close photo of each bad section with a tape\n• Photo of a screwdriver or probe pressed into the soft wood\n• Linear feet of fascia affected, written down\n• Count of rafter tails that look soft\n• Which side of the house and where along it\n• A note that the gutters were removed and when\n• A photo of anything unusual behind the gutter, such as old water staining",
      },
      {
        heading: "Safety first",
        content: "Dropping gutters and working at the eave puts crews at the edge of the roof. Follow your fall protection rules and do not lean out to get a photograph. If a rafter tail is badly deteriorated, treat the edge as unsafe until it is braced or replaced. A good photo is not worth an injury.",
      },
      {
        heading: "What if the damage is small or hard to judge",
        content: "Not every soft spot is a finding. If the board is sound and only stained, say so honestly. If a section is soft but small, record the length and let the reviewer decide. Overstating a minor spot weakens the rest of your package. Our <a href='/blog/roofing-supplement-mistakes-that-delay-payment'>supplement mistakes guide</a> covers how that happens.",
      },
      {
        heading: "Mistakes to avoid",
        content: "• Replacing the board before photographing it\n• Writing a cause you cannot show\n• One photo of a whole eave with no close shot\n• No length or count\n• Sending the request weeks later, after the exposed wood is covered",
      },
    ],
    faq: [
      {
        q: "Does insurance cover rotted fascia?",
        a: "It depends on the policy, the cause and the carrier's review. Document what you find and ask. Do not promise the homeowner that it will be covered.",
      },
      {
        q: "What is sub-fascia?",
        a: "The board behind the fascia that the gutter and fascia attach to. It is also called a fascia backer or sub-fascia depending on the region.",
      },
      {
        q: "How do I show how soft the wood is?",
        a: "Photograph a screwdriver or probe pressed into it, with a tape alongside for size.",
      },
      {
        q: "Should I replace it before the carrier agrees?",
        a: "Photograph it thoroughly first and tell the office. If you must proceed for safety or weather, document what you did and why.",
      },
      {
        q: "How do I avoid blaming the cause?",
        a: "Describe condition and location only. The reviewer decides cause.",
      },
      {
        q: "Can this be part of a supplement?",
        a: "Many contractors list it as its own numbered finding with photos and a quantity. The carrier decides what to pay.",
      },
      {
        q: "What is the difference between fascia and soffit?",
        a: "Fascia is the board along the roof's edge where the gutter attaches. Soffit is the underside of the overhang. They are different parts and are usually priced separately, so photograph and list each.",
      },
      {
        q: "Who pays for rotted fascia, the homeowner or insurance?",
        a: "That depends on the policy, the cause and the carrier's review. Document what you find and tell the homeowner it is for the carrier to decide.",
      },
      {
        q: "Can shingles be replaced without replacing fascia?",
        a: "Often yes, if the fascia is sound. If it is soft or damaged, the edge detail and gutter attachment may need repair first. Photograph the condition and note the work needed.",
      },
    ],
    related: ["document-rotted-roof-decking-tear-off","what-can-you-supplement-on-a-roof-claim","roof-tear-off-findings-log-template","roofing-photo-documentation-checklist"],
  },
  {
    slug: "step-flashing-behind-siding-roof-claim",
    title: "Replacing Step Flashing Behind Siding: How to Document It",
    metaTitle: "Step Flashing Behind Siding: Document It for the Claim",
    metaDescription: "Old step flashing behind stucco or siding is hard to reuse and hard to explain. How to photograph it, say why it cannot be reused, and log the added labor.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-26",
    images: { 0: { src: "/blog/step-flashing-behind-siding-roof-claim/diagram.png", alt: "Illustration of roof shingle courses stepping up against a wall with L-shaped step flashing pieces, two corroded spots circled, and four numbered photo steps", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Photograph the flashing before it comes out.",
    midCtaBody: "Supplement Snap helps your crew capture the condition, location and length of each flashing section while it is exposed. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to capture"],
        rows: [
          { feature: "The wall", values: ["Wide photo of the roof-to-wall junction, showing the siding type and the roof slope"] },
          { feature: "The condition", values: ["Close photos of rust, holes, lifted pieces or missing sections with a tape"] },
          { feature: "The length", values: ["Linear feet along the wall, written down"] },
          { feature: "Why it cannot be reused", values: ["A short factual note: corroded, broken when lifted, or wrong profile for the new roof"] },
          { feature: "The access", values: ["What had to be cut, lifted or removed to reach it"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Reusing flashing is not always the right call", text: "Some flashing can be reused and some cannot. Photograph its condition and write why you are replacing it. Do not claim it must always be replaced." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Step flashing along a sidewall or dormer is often covered by siding, stucco or trim. When the crew opens the junction and finds the old flashing rusted through, bent or missing, the replacement may need extra labor around the wall covering. The way to document it is to photograph the junction, the condition of the metal and the access work, record the length, and write down plainly why the old pieces cannot be reused. The carrier decides what to pay.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why this item gets disputed",
        content: "Flashing behind siding is out of sight, so the original estimate often does not know its condition. A reviewer may also ask whether the existing metal could have been reused, and whether the work behind the siding was necessary. A clear photo and a factual reason answer both questions before they are asked.",
      },
      {
        heading: "Step 1: Show the junction",
        content: "Take a wide photo of the wall where it meets the roof, with the roof slope and the wall covering in the frame. Note which wall it is: left sidewall of the main roof, dormer front, chimney side. Our <a href='/blog/roof-flashing-vents-pipe-jacks-insurance-supplement'>flashing and vents guide</a> covers the full count of small items.",
      },
      {
        heading: "Step 2: Photograph the condition",
        content: "Lift or remove only what you need to see it, then photograph the flashing close up with a tape. Rust through, holes, pieces that crumble or lift, and missing sections should each have a close photo. If a piece cannot be reused because it breaks when lifted, photograph it breaking, or photograph the broken piece beside the tape.",
      },
      {
        heading: "Step 3: Record the length and the access",
        content: "Write the linear feet along the wall. Note what had to be cut, lifted or removed to reach the flashing, such as a section of siding trim, a row of stucco, or a counterflashing. Photograph the access work. The labor to reach and restore the area is part of the finding.",
      },
      {
        heading: "Step 4: Say why it cannot be reused",
        content: "A short note is enough: Existing step flashing corroded with holes along 22 linear feet. Pieces broke when lifted. Replacement installed to match the new shingle course. Avoid saying it is always required. Local code and the shingle maker's instructions may say how flashing should be installed, so check them. Building codes, manufacturer instructions, policy wording and carrier practice vary, so confirm the details for your job with the building department and the claim documents.",
      },
      {
        heading: "A worked example (fictional)",
        content: "On a roof with a stucco sidewall, the crew exposes the step flashing along 22 feet and finds holes and crumbling edges. The lead photographs the wall, the metal with a tape, and a piece that breaks in his hand. He notes that a strip of stucco was cut back to reach the flashing and photographs that too.\n\nThe office makes one finding for the flashing with the length and photos and a second for the stucco work, so each can be reviewed separately. The numbers are invented for the example.",
      },
      {
        heading: "How to word the request",
        content: "Step flashing, left sidewall of main roof: 22 linear feet corroded with holes, pieces broke when lifted. Stucco cut back and restored to reach it. Photos 24 to 31 show the wall, condition and access. Replacement and restoration requested.\n\nSeparate the flashing from the wall work so the reviewer can say yes or no to each.",
      },
      {
        heading: "Step flashing, counterflashing and kickout flashing",
        content: "• Step flashing: small L-shaped metal pieces, one per shingle course, that run up where a roof meets a wall\n• Counterflashing: metal installed over the top of the step flashing and into or over the wall to cover the joint\n• Kickout flashing: a piece at the bottom of a roof-to-wall junction that sends water into the gutter and away from the wall\n\nName the one you are describing, so the reviewer can match your note to your photo.",
      },
      {
        heading: "Can you replace it without removing the siding?",
        content: "Sometimes, but not always. It depends on how the wall is covered and how the old flashing was installed. Some installers lift or cut a strip of siding or trim to reach the metal, and some work with the wall covering in place. The right method follows the siding maker's guidance, the shingle and flashing manufacturers' instructions, and local code. Whatever you did, photograph it and write it down, because the access work is part of the finding.",
      },
      {
        heading: "A copy-and-paste checklist",
        content: "• Wide photo of the roof-to-wall junction and which wall it is\n• Close photos of rust, holes, lifted or missing sections with a tape\n• Linear feet along the wall, written down\n• A photo of a piece that breaks when lifted, if that is why it cannot be reused\n• Photos of anything cut, lifted or removed to reach it\n• A short note on why you are replacing it\n• The siding or trim type",
      },
      {
        heading: "When reuse is reasonable",
        content: "Old flashing in good condition, with the right profile for the new shingle courses, can sometimes be reused. If yours is sound, say so, and do not claim it needs replacing. A reviewer who sees honest notes on the good pieces is more likely to trust your notes on the bad ones. Building codes, manufacturer instructions, policy wording and carrier practice vary, so confirm the details for your job with the building department and the claim documents.",
      },
      {
        heading: "Mistakes to avoid",
        content: "• Removing flashing before photographing the condition\n• Saying it can never be reused\n• Lumping flashing and siding work into one line\n• No length or wall noted\n• No photos of what was cut or lifted",
      },
    ],
    faq: [
      {
        q: "Can step flashing be reused?",
        a: "Sometimes. It depends on its condition and the new roofing. Photograph it and write why you are replacing it.",
      },
      {
        q: "Does insurance pay to replace flashing behind siding?",
        a: "It depends on the policy and the carrier's review. Document the condition, length and access work and ask.",
      },
      {
        q: "Do I need to remove the siding?",
        a: "Only as much as needed to reach and replace the flashing properly, following the manufacturer's instructions and local code. Photograph what you did.",
      },
      {
        q: "How do I measure step flashing?",
        a: "In linear feet along the wall. Write the length and note which wall.",
      },
      {
        q: "Should I separate flashing from siding work?",
        a: "Yes. Separate findings are easier for a reviewer to approve or question.",
      },
      {
        q: "What if the old flashing looks fine?",
        a: "Say so honestly. If it can be reused, the reviewer may reasonably ask for that, and exaggerating hurts your other findings.",
      },
      {
        q: "Can you replace step flashing without removing siding?",
        a: "Sometimes. It depends on the wall covering and how the flashing was installed. Follow the manufacturers' instructions and local code, and document whatever access work you do.",
      },
      {
        q: "What is a kickout flashing?",
        a: "A piece at the bottom of a roof-to-wall junction that directs water into the gutter and away from the wall. A missing or poorly placed one is something to photograph.",
      },
      {
        q: "How do I know if step flashing needs replacing?",
        a: "Look for rust through, holes, pieces that are bent, lifted or missing, and metal that crumbles or breaks when touched. Photograph each with a tape and write what you saw.",
      },
    ],
    related: ["roof-flashing-vents-pipe-jacks-insurance-supplement","what-can-you-supplement-on-a-roof-claim","document-rotted-roof-decking-tear-off","roofing-code-upgrades-ordinance-and-law"],
  },
  {
    slug: "document-deck-damage-from-old-underlayment-and-fasteners",
    title: "Deck Damage From Old Underlayment and Rusted Nails: Document It",
    metaTitle: "Deck Damage From Old Underlayment and Rusted Nails",
    metaDescription: "When old self-adhered underlayment tears the deck or rusted nails lose their grip, the evidence ends up in the dumpster. How to photograph it first.",
    publishedDate: "2026-10-25",
    updatedDate: "2026-10-26",
    images: { 0: { src: "/blog/document-deck-damage-from-old-underlayment-and-fasteners/diagram.png", alt: "Illustration of a roof deck sheet seen from above with two torn areas, rusted and normal nail heads, a tape measure, and four numbered photo steps", width: 1200, height: 630 } },
    downloads: "roof-tear-off-findings-log",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture it before the sheets hit the dumpster.",
    midCtaBody: "Supplement Snap lets your crew log each finding by slope with photos and notes at tear-off. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to capture"],
        rows: [
          { feature: "The underlayment", values: ["Close photo of old self-adhered underlayment bonded to the deck and what happens as it is lifted"] },
          { feature: "The deck surface", values: ["Top ply torn, shredded or delaminated, with a tape for size"] },
          { feature: "The fasteners", values: ["Close photos of rusted or pulled-through nails, and nail heads that no longer hold"] },
          { feature: "The area", values: ["Which slope, and how many sheets or square feet are affected"] },
          { feature: "The test", values: ["A photo of how the deck holds a new fastener, or fails to"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Describe what the deck does, not what you assume", text: "Say the top ply tears away when the underlayment is removed, or that the nails pull through. Check the shingle maker's deck requirements and your local code before saying the deck does not meet them." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Two conditions show up only once the old roof is off: old self-adhered underlayment that bonds so tightly the deck surface tears when it is removed, and rusted or loosened fasteners that no longer hold. Both can mean the deck needs partial replacement before new roofing is installed. Because the evidence is destroyed when the sheets go in the trailer, the crew has to photograph it on the roof: close shots, a tape, the slope, and a count of sheets. The carrier decides what to pay.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document damage found at tear-off and export a report. It does not decide coverage, negotiate claims or guarantee approval. This page is general guidance, not legal or claims advice.",
      },
      {
        heading: "Why the evidence disappears",
        content: "Torn or delaminated decking is thrown away with the old roof. Rusted nails come off with the shingles. A reviewer who was not on the roof cannot judge what they cannot see, so a description with no photo carries little weight. The table lists what to capture before the material is removed.",
      },
      {
        heading: "Step 1: Photograph the underlayment as it comes up",
        content: "Take a close photo of the old underlayment bonded to the deck, then another as the crew lifts it showing what comes with it. If the top ply of the plywood or the surface of the OSB tears away, photograph the torn area with a tape. Do it for each slope where it happens, not just one.",
      },
      {
        heading: "Step 2: Photograph the fasteners",
        content: "Pull a few shingles back or lift a section of deck and photograph the nail shanks and heads close up. Rusted shanks, nails that have pulled through the deck, and heads that spin freely are all worth a clear shot with a tape. Note which slope and where on it. Our <a href='/blog/document-rotted-roof-decking-tear-off'>decking documentation guide</a> covers the sheet-by-sheet count.",
      },
      {
        heading: "Step 3: Count the area",
        content: "Write how many sheets or how many square feet on each slope are affected. If you walk the deck and it flexes, or fasteners will not bite, note it as an observation. Do not write that the whole roof is bad unless you have checked every slope.",
      },
      {
        heading: "Step 4: Say what is required, with sources",
        content: "If you are saying the deck must be replaced to install the new roof, point to something you can show: the shingle manufacturer's deck and fastening requirements, the underlayment maker's instructions, or the building department's requirement. Attach the page, or ask the building department for it in writing. Building codes, manufacturer instructions, policy wording and carrier practice vary, so confirm the details for your job with the building department and the claim documents.",
      },
      {
        heading: "A worked example (fictional)",
        content: "On a steep rear slope, the crew peels back an old self-adhered underlayment. The top ply of the plywood comes up with it in strips. The lead photographs the bonded underlayment, the torn deck with a tape, and a handful of rusted nails with the heads pulling through. He counts nine sheets affected, writes it by slope, and sends the log.\n\nThe office builds one finding for the sheets, one for the rusted fasteners, attaches the manufacturer's deck requirements and asks for review. The example is invented. The carrier may decide differently, and some tears can be repaired without replacing the sheet.",
      },
      {
        heading: "How to word the request",
        content: "Decking, rear slope: 9 sheets with the top ply torn away when old self-adhered underlayment was removed, photos 33 to 38 with a tape. Rusted fasteners pulling through the deck on the same slope, photos 39 to 41. Replacement of affected sheets requested. Manufacturer deck requirements attached.\n\nKeep the torn sheets and the fastener condition as separate findings.",
      },
      {
        heading: "A copy-and-paste checklist",
        content: "• Close photo of the old underlayment bonded to the deck, with a tape\n• Photo of what comes up when it is lifted\n• Photo of torn, shredded or delaminated deck surface with a tape\n• Close photos of rusted or pulled-through nail shanks and heads\n• The slope, and sheets or square feet affected\n• A photo of how a new fastener holds, if the crew tested it\n• The manufacturer's deck and fastening page you rely on",
      },
      {
        heading: "Where to look for the requirement",
        content: "Roofing materials come with installation instructions that usually say what the deck must be, how fasteners must hold, and how to prepare it. Local code may add its own rules. Find the instructions for the shingle and underlayment you are installing, copy the relevant page, and ask the building department in writing if you rely on a code rule. Quote only what you can show. Building codes, manufacturer instructions, policy wording and carrier practice vary, so confirm the details for your job with the building department and the claim documents.",
      },
      {
        heading: "Repair or replace",
        content: "Not every torn spot needs a new sheet. A reviewer may reasonably ask why a section was replaced instead of repaired. Write what you saw and why: for example, the top ply came away over a large area, fasteners would not hold, or the deck flexed underfoot. If you repaired a small area instead of replacing a sheet, say that too. Honest scope builds credibility.",
      },
      {
        heading: "What is delamination",
        content: "Plywood is made of thin layers glued together. Delamination is when those layers separate, often after moisture or when something bonded to the surface is pulled off. Photograph it with a tape and describe it in plain words: top layer peeled away over about two feet by three feet, for example. Avoid technical terms you cannot back up.",
      },
      {
        heading: "Mistakes to avoid",
        content: "• Photographing only the new, clean deck\n• Claiming the whole roof deck is failed without checking each slope\n• No tape or scale in the photo\n• Stating a code or manufacturer requirement you did not check\n• Throwing the sheets away before photographing them",
      },
    ],
    faq: [
      {
        q: "Does insurance pay for decking damaged when removing old underlayment?",
        a: "It depends on the policy, the cause and the carrier's review. Document the condition and ask. Do not promise the homeowner it will be covered.",
      },
      {
        q: "How do I prove rusted nails matter?",
        a: "Photograph the nail shanks and heads close up with a tape, and note where the nails pull through. Then point to the manufacturer's or code requirement for fastening.",
      },
      {
        q: "Can torn decking be repaired instead of replaced?",
        a: "Sometimes. The reviewer may ask. Describe what you saw and why you chose to replace it.",
      },
      {
        q: "Do I count by sheet or square foot?",
        a: "Either, as long as you show the arithmetic. A sheet is typically 4 ft by 8 ft, 32 square feet.",
      },
      {
        q: "Should I photograph every slope?",
        a: "Yes where the condition appears. A photo on one slope does not prove the same on another.",
      },
      {
        q: "Where do I find the manufacturer's requirements?",
        a: "In the shingle and underlayment installation instructions, usually on the maker's website or the package. Attach the page you rely on.",
      },
      {
        q: "Can you nail new roofing to rusted or damaged decking?",
        a: "Shingle makers specify how fasteners must be driven and into what. If the deck cannot hold a fastener properly, the manufacturer's instructions and local code decide what is required. Check them before you describe the requirement to a reviewer.",
      },
      {
        q: "What is peel-and-stick underlayment?",
        a: "A self-adhering waterproof membrane that bonds to the deck. When it is old and well bonded, removing it can pull up the deck surface. Photograph that as it happens.",
      },
      {
        q: "How much deck replacement is normal on a re-roof?",
        a: "There is no reliable normal. It varies with the roof, its age and the conditions found. Count and photograph what you find on each slope.",
      },
    ],
    related: ["document-rotted-roof-decking-tear-off","roof-tear-off-vs-overlay","roofing-photo-documentation-checklist","roof-tear-off-findings-log-template"],
  },
  {
    slug: "roof-tear-off-vs-overlay",
    title: "Roof Tear-Off vs Overlay: Which to Choose and What Gets Missed",
    metaTitle: "Roof Tear-Off vs Overlay: Pros, Cons & What's Missed",
    metaDescription: "Roof tear-off vs overlay compared: how each works, when an overlay may not be allowed, and the damage nobody sees when new shingles go over old ones.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
      { text: "IBHS: Insurance Institute for Business & Home Safety", url: "https://ibhs.org" },
    ],
    midCtaAfter: 2,
    midCtaTitle: "Tearing off? Document the deck first.",
    midCtaBody: "Once the old roof is off, the deck is visible for the first time. Supplement Snap helps your crew photograph and describe what they find. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Tear-off", "Overlay"],
        rows: [
          { feature: "What happens", values: ["Old roofing is removed to the deck, then a new roof is installed", "New shingles are installed over the existing layer"] },
          { feature: "Can the deck be inspected?", values: ["Yes, once the old roof is off", "No, it stays covered"] },
          { feature: "Labor and disposal", values: ["More labor, and the old material has to be hauled away", "Less labor, and no removal of the old roofing"] },
          { feature: "Typical cost", values: ["Usually higher", "Usually lower"] },
          { feature: "Hidden damage", values: ["Can be found, repaired and documented", "Stays hidden until it gets worse"] },
          { feature: "Code and warranty", values: ["Generally allowed", "May be limited by layer count, warranty terms or roof condition"] },
        ],
      }},
      5: { type: "checklist", data: { title: "Questions to answer before choosing an overlay", items: [
        { text: "Does the roof have only one layer today?", checked: false },
        { text: "Does local code allow another layer?", checked: false },
        { text: "Does the shingle warranty allow installation over an existing layer?", checked: false },
        { text: "Is the existing roof flat, dry and sound, with no curling, cupping or sagging?", checked: false },
        { text: "Has anyone checked for leaks, stains or soft spots inside the house or attic?", checked: false },
        { text: "Do you have written quotes and warranty terms for both options?", checked: false },
      ]}},
      3: { type: "tip", data: { type: "info", title: "Check your local rules", text: "Layer limits, permits and warranty conditions vary by city, state and product. This page is general guidance, not legal or building advice. Ask your local building department and read the manufacturer's warranty before you decide." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A roof tear-off removes the old roofing down to the deck before the new roof goes on. An overlay, also called a layover or recover, puts new shingles over the existing layer. An overlay usually means less labor and no disposal of the old roofing, which is why it is often cheaper. A tear-off lets someone see and fix the deck, flashing and underlayment underneath. Whether an overlay is even allowed depends on your local code, the shingle manufacturer's warranty, and the condition of the roof you have.\n\nDisclosure: we make Supplement Snap, which helps roofing crews document hidden damage found during tear-off. We have an interest in the tear-off side of this comparison, so we have kept this page to what is generally true and told you where it depends. We do not give prices here because they vary too much by area and roof.",
      },
      {
        heading: "Tear-off vs overlay side by side",
        content: "The table compares the two on the points that decide most jobs. It is general, and your roof, your code and your warranty can change the answer.",
      },
      {
        heading: "What an overlay cannot show you: the deck",
        content: "Once new shingles go over old ones, nobody sees what is underneath. That includes the roof deck, the underlayment, the flashing and any places where water has been getting in. Soft or rotted decking, failed flashing and missing ice and water protection are typically only found when the old roof comes off.\n\nThat matters for two reasons. If the deck is in poor shape, a new layer over it can hide a problem that gets worse. And on an insurance claim, damage that was never seen cannot be documented, so it cannot be requested later. A tear-off lets the crew inspect and photograph the deck before anything new goes on. See our guide to <a href='/blog/document-rotted-roof-decking-tear-off'>documenting rotted decking at tear-off</a>.",
      },
      {
        heading: "When an overlay may not be an option",
        content: "Several things can rule an overlay out, and you should check them before you decide:\n\n• Local building code. Many jurisdictions limit how many layers a roof can have, so a roof that already has the maximum must be torn off. Codes differ by place and by edition, so ask your local building department.\n• The manufacturer's warranty. Some shingle warranties have conditions about installation over an existing layer. Read the one for the product you plan to use.\n• The roof's condition. Curling, cupping, uneven surfaces, sagging or moisture problems usually mean the old layer is not a good base.\n• Matching and flashing. New shingles over old can raise the roofline at edges and flashings, which can make details harder to do properly.\n\nWhen in doubt, ask a licensed roofer to inspect, and get the answer in writing.",
      },
      {
        heading: "Overlays and insurance claims",
        content: "On an insurance claim, what the carrier pays for depends on the policy, the carrier and the damage. An estimate that assumes one approach does not stop a contractor from finding something different once the old roof is off. If tear-off reveals damage that was not in the carrier's estimate, such as rotted decking or failed flashing, contractors typically document it and request it through a supplement.\n\nThat is another reason tear-off matters for claims. The photos and notes you take of the deck are the evidence. Our guides on <a href='/blog/how-insurance-adjusters-determine-roof-damage'>how adjusters determine roof damage</a> and the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a> explain what to capture. This is general guidance, not legal or claims advice.",
      },
      {
        heading: "How to decide",
        content: "Work through the checklist with whoever is quoting the job. If any answer is no or unknown, treat the overlay as unproven until you have confirmed it.",
      },
      {
        heading: "What about cost?",
        content: "Overlays generally cost less because they skip removal and disposal, and a tear-off costs more for that labor. How much less depends on your area, the roof size and pitch, the materials and what is found underneath, so we have not put numbers on this page. Our <a href='/blog/roof-tear-off-cost'>roof tear-off cost guide</a> explains what drives the price, including the hidden costs that only show up once the old roof is removed. Get written quotes for both options so you can compare like for like.",
      },
      {
        heading: "If you tear off, document the deck",
        content: "For roofing crews, the tear-off is the one chance to see the deck, so photograph it before anything is installed. Get wide shots of each slope, close-ups of each problem, a tape measure or marked area for scale, and short notes on where each finding is and what it affects.\n\n<a href='/roofing-supplement-software'>Supplement Snap</a> lets crews capture photos on the roof, tag each finding, add a typed or voice note, review the drafted description and export a PDF for the adjuster. It does not decide coverage or guarantee approval. Your first project is free. See a <a href='/roofing-supplement-report-example'>sample report</a>, the <a href='/blog/roofing-supplement-template'>supplement template</a> and the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "Is a roof overlay worth it?",
        a: "It can be, when the existing roof is in good condition, only one layer is present, local code and the shingle warranty allow it, and the lower cost matters. It is a poor choice when the deck may be damaged, because nobody can inspect it.",
      },
      {
        q: "Is a roof tear-off better than an overlay?",
        a: "A tear-off lets the crew inspect and repair the deck, flashing and underlayment, which an overlay cannot. An overlay is usually cheaper. Which is better depends on the roof's condition, your code, the warranty and your budget.",
      },
      {
        q: "Can you put new shingles over old shingles?",
        a: "Sometimes. Many places limit the number of layers, some warranties set conditions, and the existing roof must be flat and sound. Ask your local building department and check the manufacturer's warranty.",
      },
      {
        q: "How long does a roof overlay last?",
        a: "It depends on the materials, the condition of the layer underneath, ventilation and climate. Do not rely on a single number. Ask the contractor what warranty applies to an overlay and read its terms.",
      },
      {
        q: "Is a roof overlay considered a new roof?",
        a: "It depends on who is asking. Insurers, lenders, home inspectors and warranty providers may treat it differently. If it matters for your policy or a sale, ask them directly.",
      },
      {
        q: "Does insurance pay for a tear-off or an overlay?",
        a: "That depends on your policy and the carrier, not on a general rule. If damage is found at tear-off that was not in the carrier's estimate, contractors document it and request it through a supplement.",
      },
    ],
    related: ["how-to-document-multiple-roof-layers-during-tear-off", "document-deck-damage-from-old-underlayment-and-fasteners", "roof-debris-removal-dumpster-insurance-claim", "roof-tear-off-cost", "document-rotted-roof-decking-tear-off", "how-insurance-adjusters-determine-roof-damage", "roofing-photo-documentation-checklist"],
  },
  {
    slug: "roof-repair-estimate-template",
    images: { 0: { src: "/blog/roof-repair-estimate-template/card.png", alt: "Key points from the guide: Roof Repair Estimate Template: Free PDF, Fillable PDF and Word", width: 1200, height: 630 } },
    title: "Roof Repair Estimate Template: Free PDF, Fillable PDF and Word",
    metaTitle: "Roof Repair Estimate Template: Free PDF & Word",
    metaDescription: "Free roof repair estimate template as a printable PDF, fillable PDF and Word file, plus what a repair estimate should say that a full replacement estimate does not.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Found hidden damage after tear-off?",
    midCtaBody: "An estimate covers the work you can see before you start. Supplement Snap helps your crew document what turns up once the shingles are off. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to put in it","Why it matters"],
        rows: [
          { feature: "The problem", values: ["Where it is on the roof, what you found and the cause if you know it", "The customer sees you understood the issue, and the record shows what you were asked to fix"] },
          { feature: "Repair scope", values: ["Exactly what you will do, and what is not included", "Stops a small repair turning into an argument about the rest of the roof"] },
          { feature: "Line items", values: ["Materials, labor and any trip or disposal charge, listed separately", "Makes a short job easy to follow"] },
          { feature: "What could change the price", values: ["How extra damage found once the area is opened up will be handled", "Avoids a surprise bill"] },
          { feature: "Workmanship warranty", values: ["How long you stand behind this repair and what it covers", "Sets expectations about the repaired area, not the whole roof"] },
          { feature: "Terms and signature", values: ["Payment terms, planned date window and a line for the customer to accept", "Turns the estimate into an agreement"] },
        ],
      }},
      4: { type: "tip", data: { type: "info", title: "Rules differ by state", text: "Licensing, written-contract requirements, cancellation rights and permitted payment terms vary by state and sometimes by city. This template is a starting layout, not legal advice. Have it reviewed against your local rules before you use it with customers." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A roof repair estimate is shorter than a full replacement estimate, but it still needs the problem, a clear repair scope, line items, a total, what could change the price, terms and a signature. You can download the template below as a printable PDF, a fillable PDF you type into on screen, or a Word file.\n\nDisclosure: we make Supplement Snap, which is not an estimating tool. It helps crews document hidden damage after tear-off. This page is about the estimate you give a customer for a repair. If you are quoting a full replacement, use our <a href='/blog/roofing-estimate-template'>roofing estimate template</a> instead.",
      },
      {
        heading: "What a repair estimate needs to say",
        content: "The table lists the sections and why each one is there. A repair is often a small job, so the temptation is to write one line and a price. That is where disputes start, because the customer may assume the repair covers more than you meant.\n\nKeep the language plain, and say what is included and what is not.",
      },
      {
        heading: "How to fill it in",
        content: "Start with the problem. Write where it is and what you saw, for example a leak around a chimney where the flashing has pulled away. If you know the cause, say so, and if you do not, leave it blank rather than guessing.\n\nThen write the repair scope as a short list of actions, with a limit where one is needed. For example: remove and replace the chimney flashing, reseal, and replace up to a stated number of damaged shingles. Add a sentence on what is not included, such as interior ceiling repair.\n\nPut materials, labor and any trip or disposal charge on separate lines with your own prices. The template has blanks only, not prices.",
      },
      {
        heading: "Say what a repair does not do",
        content: "A repair fixes the problem you describe. It does not make the rest of the roof new, and it cannot promise that nothing else will fail. If you noticed other worn areas while you were up there, write them in the terms section so the customer knows. It protects you, and it is the honest thing to tell them.\n\nIf a repair is likely to be followed by a larger job, or the roof is near the end of its life, say that plainly and point to the <a href='/blog/good-better-best-roofing-proposal-template'>good, better, best proposal template</a> for offering a replacement choice.",
      },
      {
        heading: "Check your local rules before you use it",
        content: "Many states require specific language in home improvement contracts, a license number, a right-to-cancel notice, or limits on deposits. Some apply a written-contract rule above a certain dollar amount, and repairs can fall under it. This template does not include state-specific wording.\n\nAsk your state licensing board, your insurance agent or an attorney what must appear in your estimates and contracts.",
      },
      {
        heading: "If the repair is part of an insurance claim",
        content: "When a carrier is paying, the carrier's estimate sets the starting scope, and damage found after the work begins is handled through a supplement, not through your repair estimate. See our <a href='/blog/roofing-supplement-template'>roofing supplement template</a> and the <a href='/blog/roof-damage-report-template'>roof damage report template</a> for documenting it.\n\nSupplement Snap is for that second step: your crew photographs the damage on the roof, adds a note, reviews the drafted description and exports a PDF for the adjuster. Your first project is free. See the <a href='/roofing-supplement-software'>feature walkthrough</a> and the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "What should a roof repair estimate include?",
        a: "The problem and where it is, a clear repair scope with what is not included, line items for materials and labor, a total, how extra damage will be handled, terms such as payment and a workmanship warranty, and a signature line.",
      },
      {
        q: "Is there a free roof repair estimate template?",
        a: "Yes. This page offers one as a printable PDF, a fillable PDF and a Word file, with blanks for your own prices. Check it against your state's requirements before using it.",
      },
      {
        q: "How is a repair estimate different from a roof replacement estimate?",
        a: "A repair estimate describes a limited fix for a specific problem and should say what the rest of the roof still needs. A replacement estimate covers the whole roof area by area, with materials and a larger set of terms.",
      },
      {
        q: "Does a small roof repair need a written estimate?",
        a: "It is good practice to write one so the scope and price are clear. Some states also require a written contract above a set amount, so confirm what yours requires.",
      },
      {
        q: "What if more damage is found during the repair?",
        a: "Say in the estimate how that will be handled, for example that extra damage is priced at an agreed unit rate and approved by the customer first. If an insurance claim is involved, additional damage goes through a supplement.",
      },
    ],
    downloads: "roof-repair-estimate-template",
    related: ["roofing-estimate-template","good-better-best-roofing-proposal-template","roofing-supplement-template","roof-damage-report-template"],
  },
  {
    slug: "good-better-best-roofing-proposal-template",
    images: { 0: { src: "/blog/good-better-best-roofing-proposal-template/card.png", alt: "Key points from the guide: Good Better Best Roofing Proposal Template: Free PDF and Word", width: 1200, height: 630 } },
    title: "Good Better Best Roofing Proposal Template: Free PDF and Word",
    metaTitle: "Good Better Best Roofing Proposal Template (Free)",
    metaDescription: "Free good, better, best roofing proposal template as a printable PDF, fillable PDF and Word file, with how to build three honest options and a comparison table.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "NRCA", url: "https://www.nrca.net" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Found hidden damage after tear-off?",
    midCtaBody: "An estimate covers the work you can see before you start. Supplement Snap helps your crew document what turns up once the shingles are off. Your first project is free.",
    visuals: {
      1: { type: "matrix", data: {
        headers: ["What to put in it","Why it matters"],
        rows: [
          { feature: "Work common to all options", values: ["The scope that is the same in every option", "You do not repeat it three times, and the customer sees what is not a choice"] },
          { feature: "Each option", values: ["Material and color, underlayment and flashing, what is included, warranties and the price", "The customer compares real products, not labels"] },
          { feature: "A side-by-side table", values: ["The differences that matter to this customer", "Lets them compare at a glance"] },
          { feature: "What could change the price", values: ["How hidden damage is handled in any option", "Applies to all three, so it only needs saying once"] },
          { feature: "Customer choice", values: ["A box for the option they pick and a signature", "Records exactly what they agreed to"] },
        ],
      }},
      3: { type: "tip", data: { type: "info", title: "Rules differ by state", text: "Licensing, written-contract requirements, cancellation rights and permitted payment terms vary by state and sometimes by city. This template is a starting layout, not legal advice. Have it reviewed against your local rules before you use it with customers." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "A good, better, best proposal offers the customer three priced options for the same job, so they choose instead of deciding whether to hire you at all. The template below has a shared-scope section, three option blocks, a side-by-side table, terms and a place for the customer to choose and sign. Download it as a printable PDF, a fillable PDF you type into on screen, or a Word file.\n\nDisclosure: we make Supplement Snap, which is not an estimating or proposal tool. It helps crews document hidden damage after tear-off. This page is about the proposal you give a customer before work starts.",
      },
      {
        heading: "What goes in each option",
        content: "The table lists the sections and why each is there. The template leaves every price, product and warranty blank for you to fill in, because the right options depend on what you install, what your suppliers offer and what the customer needs.\n\nWhatever you put in the three options should be true and specific: the actual product line, the actual warranty terms, the actual price.",
      },
      {
        heading: "How to build three honest options",
        content: "Start with the work that is the same in every option, such as tear-off, decking inspection, cleanup and haul-away, and write it once.\n\nThen make each option a real alternative. A common approach is a standard shingle, a higher-grade shingle, and a premium product or a more complete system, but use whatever you actually offer. For each, fill in the material and color, the underlayment and flashing, what is included, the manufacturer warranty, your workmanship warranty and the price.\n\nIn the side-by-side table, list only the differences the customer will care about, such as warranty length, material grade or included extras. Do not pad it with features that are the same in all three, and do not describe a difference that is not real.",
      },
      {
        heading: "Keep the choice fair",
        content: "The point of three options is to help the customer choose well. Describe the lower option accurately, without running it down to push the higher one. State what each price includes, and do not promise results such as energy savings, insurance discounts or resale value unless you can back them up and they are allowed where you work.\n\nIf you are not sure a claim is true, leave it out.",
      },
      {
        heading: "Check your local rules before you use it",
        content: "Many states require specific language in home improvement contracts, a license number, a right-to-cancel notice, or limits on deposits. A signed proposal may count as a contract where you work. This template does not include state-specific wording.\n\nAsk your state licensing board, your insurance agent or an attorney what must appear in your proposals and contracts.",
      },
      {
        heading: "Related templates and where Supplement Snap fits",
        content: "For a single-price replacement estimate, use the <a href='/blog/roofing-estimate-template'>roofing estimate template</a>. For a limited fix, use the <a href='/blog/roof-repair-estimate-template'>roof repair estimate template</a>.\n\nSupplement Snap is for the step after tear-off: your crew photographs hidden damage on the roof, adds a note, reviews the drafted description and exports a PDF for the adjuster. Your first project is free. See the <a href='/roofing-supplement-software'>feature walkthrough</a> and the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "What is a good, better, best roofing proposal?",
        a: "A proposal that gives the customer three priced options for the same job, usually in rising levels of material, warranty or scope, so they choose between options instead of deciding whether to hire you.",
      },
      {
        q: "Is there a free good, better, best roofing proposal template?",
        a: "Yes. This page offers one as a printable PDF, a fillable PDF and a Word file, with blanks for your own products, warranties and prices.",
      },
      {
        q: "How many options should a roofing proposal have?",
        a: "Three is common because it is easy to compare, but offer as many as you can describe clearly and honestly. Fewer is fine if you only have two real alternatives.",
      },
      {
        q: "What should go in the comparison table?",
        a: "Only the differences that matter to the customer, such as material grade, warranty terms and what is included. Leave out anything that is the same in every option.",
      },
      {
        q: "Does a signed proposal count as a contract?",
        a: "It can, depending on where you work and what it says. Some states require specific contract wording, so confirm your local requirements.",
      },
    ],
    downloads: "good-better-best-roofing-proposal-template",
    related: ["roofing-estimate-template","roof-repair-estimate-template","roofing-supplement-template","roof-damage-report-template"],
  },
  {
    slug: "supplement-snap-vs-roof-report-pro",
    title: "Supplement Snap vs Roof Report Pro: Which Documentation Tool Fits?",
    metaTitle: "Supplement Snap vs Roof Report Pro Compared",
    metaDescription: "Supplement Snap vs Roof Report Pro compared on how reports are built, trial terms and what each is for. We make Supplement Snap; verify details on each site.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "Roof Report Pro", url: "https://www.roofreportpro.ai" },
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "See the supplement report before you choose.",
    midCtaBody: "Your first Supplement Snap project is free. Photograph one real tear-off and judge the PDF it produces.",
    visuals: {
      2: { type: "matrix", data: {
        headers: ["Supplement Snap", "Roof Report Pro"],
        rows: [
          { feature: "Built for", values: ["Documenting hidden damage found at tear-off for a supplement", "Roof inspection reports for homeowners and insurance carriers"] },
          { feature: "How the report starts", values: ["Crew photographs a finding and adds a typed or voice note", "Inspector follows a 46-point checklist and adds photos"] },
          { feature: "Role of AI", values: ["Drafts the written description from the crew's note; does not analyze photos", "Tags and counts damage in photos; inspector can override findings"] },
          { feature: "Report output", values: ["PDF of findings, notes and photos for the adjuster", "Standard report and a Forensic report for carriers, per its site"] },
          { feature: "Integrations listed", values: ["Xactimate-style CSV on Team and Pro plans", "JobNimbus and CompanyCam, per its site"] },
          { feature: "Price", values: ["Starter $99, Team $199, Pro $299 per month", "Not shown on the page we read; seat-based plus report packs"] },
          { feature: "Free way to try it", values: ["First project free; 14-day trial on paid plans, card required", "5 free reports over 14 days, no card, per its site"] },
        ],
      }},
      4: { type: "checklist", data: { title: "Questions to settle before you choose", items: [
        { text: "Am I documenting an inspection, or hidden damage found at tear-off?", checked: true },
        { text: "Do I want AI to analyze my photos, or only help with the wording?", checked: true },
        { text: "Who will read the report: a homeowner, an adjuster or both?", checked: true },
        { text: "What does it cost at my real monthly volume?", checked: true },
        { text: "Can I test it on one real job first?", checked: true },
      ]}},
      5: { type: "tip", data: { type: "info", title: "Compare on a real job", text: "Details here come from each company's public pages as seen on October 24, 2026, and Roof Report Pro's pricing page was not part of what we read. We have not tested Roof Report Pro. Confirm current terms with each vendor and run the same job through both." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Both tools turn roof photos into a report, but they start from different jobs. Roof Report Pro is built around inspections: an inspector works through a checklist, and AI tags damage in the photos. Supplement Snap is built around the tear-off: a crew documents hidden damage as they find it, and the app helps draft the explanation for the adjuster.\n\nDisclosure: we make Supplement Snap. We have not tested Roof Report Pro, and everything below about it comes from its public pages as seen on October 24, 2026. Confirm current details on its site.",
      },
      {
        heading: "What each tool is for",
        content: "Roof Report Pro describes AI-assisted software for roof inspection reports. A checklist guides the inspector, the AI checks photos and tags damage markers, and the inspector can override any finding. It lists a Standard report for homeowners and a Forensic report for insurance carriers, and integrations with JobNimbus and CompanyCam.\n\nSupplement Snap starts later in the job. When a crew pulls shingles and finds rotted decking, failed flashing or extra layers, they photograph it on the roof, tag the damage type and roof area and add a note. The app drafts a description for each finding that you review and edit, and you email a PDF to the adjuster. See the <a href='/roofing-supplement-software'>feature walkthrough</a> and a <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
      {
        heading: "Side by side",
        content: "The table lists what each company publishes. The tools overlap on photos and PDF reports, so the difference is in the job each is built for.\n\nOne point is worth stating plainly. Supplement Snap's AI does not look at your photos. It drafts the written description from the damage type, roof area and note your crew entered, so the quality of the note matters. Roof Report Pro describes AI that analyzes photos, which is a different approach with its own tradeoffs.",
      },
      {
        heading: "How AI is used in each",
        content: "AI that reads photos can speed up an inspection and help an inspector count and classify damage. It can also be wrong, and Roof Report Pro's own page says nothing ships without the inspector's approval.\n\nAI that drafts wording from a crew's note speeds up the paperwork but only knows what the crew told it. If the note is thin, the draft is thin. Supplement Snap flags a note with no real detail instead of inventing a story, and asks you to review every draft before sending. In either tool, the contractor is responsible for what the adjuster receives.",
      },
      {
        heading: "How to choose",
        content: "Choose by the job. If you need inspection reports for homeowners or carriers with AI help tagging photos, Roof Report Pro is built for that. If you need to document hidden damage at tear-off and build a supplement package, Supplement Snap is built for that. Some contractors might use both for different stages, but we have not tested that.\n\nRun the same real job through each and compare the time and the finished report. For the wider category, read our <a href='/blog/best-roofing-supplement-software'>roofing supplement software overview</a> and the guide to <a href='/blog/best-app-to-document-roof-damage-for-insurance'>apps that document roof damage</a>.",
      },
      {
        heading: "Where Supplement Snap fits, and where it does not",
        content: "Supplement Snap does not analyze photos, run a 46-point inspection checklist or integrate with JobNimbus. It does capture field proof, draft explanations for you to review, and produce a PDF for the adjuster, and Team and Pro plans add an Xactimate-ready CSV and email open tracking.\n\nThe first project is free. Paid plans are Starter at $99 per month, Team at $199 and Pro at $299. See the <a href='/pricing'>pricing page</a> for current details.",
      },
    ],
    faq: [
      {
        q: "Is Supplement Snap an alternative to Roof Report Pro?",
        a: "They overlap on photos and PDF reports but start from different jobs. Roof Report Pro is built for inspection reports, and Supplement Snap for documenting hidden damage at tear-off for a supplement.",
      },
      {
        q: "Does Supplement Snap use AI to analyze photos?",
        a: "No. Its AI drafts the written description from the damage type, roof area and note your crew enters. You review and edit every draft.",
      },
      {
        q: "How much does Roof Report Pro cost?",
        a: "The page we read did not show prices. It describes seat-based access with report packs and a free start of 5 reports over 14 days. Confirm current pricing with the vendor.",
      },
      {
        q: "Can I try both for free?",
        a: "Roof Report Pro describes 5 free reports over 14 days with no card. Supplement Snap's first project is free, and paid plans start with a 14-day trial that requires a card.",
      },
      {
        q: "Will either tool get my claim approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation. A report can make your package clearer and more complete.",
      },
    ],
    related: ["best-app-to-document-roof-damage-for-insurance", "ai-roofing-supplement-tools-compared", "roof-inspection-report-software", "supplement-snap-vs-roofgenius"],
  },
  {
    slug: "supplement-snap-vs-acculynx-supplements",
    title: "Supplement Snap vs AccuLynx for Supplements: Do You Need Both?",
    metaTitle: "Supplement Snap vs AccuLynx for Supplements",
    metaDescription: "Supplement Snap vs AccuLynx for roofing supplements: documenting damage versus tracking claims in a roofing CRM. We make Supplement Snap; confirm details.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "AccuLynx: roofing insurance supplements", url: "https://acculynx.com/roofing-insurance-supplements-tips-tools/" },
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Test the documentation side on one job.",
    midCtaBody: "Your first Supplement Snap project is free. Judge the report it builds before you decide what else you need.",
    visuals: {
      2: { type: "matrix", data: {
        headers: ["Supplement Snap", "AccuLynx"],
        rows: [
          { feature: "What it is", values: ["A field tool for documenting hidden damage and building the adjuster report", "A roofing business management platform with a supplements feature"] },
          { feature: "Supplement tracking", values: ["Not offered", "Tracker with requested, approved and added amounts, tasks and reminders, per its article"] },
          { feature: "Contacting the adjuster", values: ["Email the PDF report; Team plans see when it is opened", "Send supplements to adjusters or carriers using templates, per its article"] },
          { feature: "Capturing proof on the roof", values: ["Photos, tags and voice notes in the project", "Photos and documents can be attached to the claim, per its article"] },
          { feature: "Price", values: ["Starter $99, Team $199, Pro $299 per month", "Not shown on the page we read; a Get Pricing button"] },
          { feature: "Free way to try it", values: ["First project free; 14-day trial on paid plans, card required", "Not shown on the page we read"] },
        ],
      }},
      4: { type: "checklist", data: { title: "Questions to settle first", items: [
        { text: "Do I need a system to run my whole roofing business, or only supplement paperwork?", checked: true },
        { text: "Is my problem tracking claims, or capturing the proof?", checked: true },
        { text: "How many people need a login, and what does that cost?", checked: true },
        { text: "Can I see pricing before I talk to sales?", checked: true },
        { text: "Can I test it on one real job?", checked: true },
      ]}},
      5: { type: "tip", data: { type: "info", title: "We have not tested AccuLynx", text: "Everything about AccuLynx here comes from its own published article and pages as seen on October 24, 2026, which is marketing material. A third-party guide has suggested using Supplement Snap, Xactimate and AccuLynx together, but we have not tested that combination. Ask AccuLynx for current pricing and terms." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "AccuLynx and Supplement Snap are not direct substitutes. AccuLynx is a roofing business platform, and its article describes a supplements feature for tracking claim amounts, assigning follow-ups and sending supplements to adjusters. Supplement Snap is a small field tool for capturing hidden damage at tear-off and building the report.\n\nA roofing company could reasonably want one, the other or both. Disclosure: we make Supplement Snap. We have not tested AccuLynx, and what follows about it comes from its public pages as seen on October 24, 2026.",
      },
      {
        heading: "What AccuLynx describes",
        content: "AccuLynx's supplements article describes a tracker that shows requested, approved and added amounts, with tasks and reminders for outstanding items. It says you can send supplements to adjusters, carriers or homeowners using templates, attach photos and documents, and tie supplement amounts to a financial worksheet. It also describes assigning team members as supplementers.\n\nThat is claim management. It helps a company with many open supplements keep track of who is chasing what. The article is published by AccuLynx, so treat it as a vendor's description. It shows no prices, only a Get Pricing button.",
      },
      {
        heading: "What Supplement Snap does instead",
        content: "Supplement Snap helps with the step before the paperwork goes out: gathering proof. Your crew photographs damage on the roof, tags the roof area and damage type, adds a typed or voice note, and the app drafts a written description of each finding for you to review. You export a PDF and email it to the adjuster.\n\nIt does not track supplement status, assign owners or send reminders. See the <a href='/roofing-supplement-software'>feature walkthrough</a> and a <a href='/roofing-supplement-report-example'>sample report</a>.",
      },
      {
        heading: "Side by side",
        content: "The table lists what each company publishes. A platform and a field tool cost different amounts and solve different problems, so a lower price is not the same work for less.\n\nIf you already use AccuLynx for jobs and want your crew to capture proof more consistently, a documentation tool could fill that gap. If you do not run a CRM and only need supplement paperwork, AccuLynx may be more than you need. We have not tested how the two would work together, and we do not list an integration.",
      },
      {
        heading: "How to decide",
        content: "Start with where your supplements actually slow down. If photos and notes are scattered and the reports look inconsistent, the problem is documentation. If supplements get lost between people and nobody knows their status, the problem is tracking.\n\nRun one real job through whatever you are considering and compare the time and the output. For how supplement tools compare with services and spreadsheets, read our <a href='/blog/roofing-supplement-companies-vs-software'>guide to companies versus software</a> and <a href='/blog/best-roofing-supplement-software'>the software overview</a>. For tracking without a CRM, our <a href='/blog/roofing-supplement-follow-up-log'>follow-up log</a> is a simple starting point.",
      },
      {
        heading: "Where Supplement Snap fits, and where it does not",
        content: "Supplement Snap is for small crews that want clean, consistent documentation without a full platform. It is not a CRM, a scheduler or a claim tracker. The first project is free, then Starter is $99 per month, Team $199 and Pro $299. See the <a href='/pricing'>pricing page</a> for current details.",
      },
    ],
    faq: [
      {
        q: "Is Supplement Snap an AccuLynx alternative?",
        a: "Not a full one. AccuLynx is a roofing business platform with a supplements feature, and Supplement Snap documents hidden damage and builds the adjuster report. Some companies might use one or both.",
      },
      {
        q: "Does AccuLynx handle roofing supplements?",
        a: "Its published article describes a supplements tracker with tasks, reminders, templates for sending supplements and document attachments. We have not tested it.",
      },
      {
        q: "How much does AccuLynx cost?",
        a: "The page we read showed no prices, only a Get Pricing button. Ask the company for current pricing.",
      },
      {
        q: "Can I use Supplement Snap with AccuLynx?",
        a: "Supplement Snap lists no AccuLynx integration. You could create reports in one and attach the PDF in the other, but we have not tested that workflow.",
      },
      {
        q: "Will either tool get my supplement approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation. No software can guarantee it.",
      },
    ],
    related: ["best-roofing-supplement-software", "roofing-supplement-companies-vs-software", "claimtrax-vs-suppx-vs-supplement-snap", "roofing-supplement-follow-up-log"],
  },
  {
    slug: "roofing-documentation-spanish-speaking-crews",
    images: { 0: { src: "/blog/roofing-documentation-spanish-speaking-crews/card.png", alt: "Key points from the guide: Roofing Damage Documentation for Spanish-Speaking Crews", width: 1200, height: 630 } },
    downloads: "roofing-crew-documentation-checklist",
    title: "Roofing Damage Documentation for Spanish-Speaking Crews",
    metaTitle: "Roof Damage Documentation for Spanish-Speaking Crews",
    metaDescription: "How Spanish-speaking roofing crews can document tear-off damage for insurance supplements in their own language, and what to check in the English text.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "Verisk Xactimate Product Page", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Let the crew speak the way they work.",
    midCtaBody: "Supplement Snap lets crew members record notes in Spanish and translates them to English for the report. Your first project is free.",
    visuals: {
      2: { type: "steps", data: [
        { num: "1", title: "Photograph the damage", desc: "Take the photo on the roof and tag the damage type and roof area." },
        { num: "2", title: "Speak the note", desc: "Choose the language in the app and record the note out loud." },
        { num: "3", title: "Review the English", desc: "Read the translated text, fix anything that is wrong, and add detail if it is thin." },
        { num: "4", title: "Generate and review the draft", desc: "The app drafts the explanation from the note. Read it before it goes anywhere." },
      ]},
      4: { type: "checklist", data: { title: "Check the English before it goes to the adjuster", items: [
        { text: "Does every term match what the crew actually saw?", checked: true },
        { text: "Are measurements and quantities correct after translation?", checked: true },
        { text: "Are roofing words translated correctly (decking, flashing, drip edge)?", checked: true },
        { text: "Does the note say what and where, not only 'damaged'?", checked: true },
        { text: "Did someone who speaks both languages review it when it matters?", checked: true },
      ]}},
      5: { type: "tip", data: { type: "info", title: "Translation is a draft", text: "Speech recognition and AI translation can both make mistakes, especially with trade terms, accents and background noise. Treat the English text as a draft that a person reviews. The contractor is responsible for what the adjuster receives." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Many roofing crews speak Spanish, and the person who sees the damage best is often the one on the roof. If that crew member has to write the note in English, the detail gets lost. A better approach is to let them describe the damage in Spanish and have the app translate it, then have someone review the English before it goes in a supplement.\n\nDisclosure: we make Supplement Snap, which works this way. We describe how it works, not how accurate it is.",
      },
      {
        heading: "Why the language of the note matters",
        content: "The adjuster reads English, but the person who found the rotted decking may think and speak Spanish. When they type a short English note to be quick, it often says only 'bad decking'. That is not enough proof for a supplement.\n\nA spoken note in their own language is usually longer and more specific. It can say where the damage is, how far it runs, what it looks like and why it was not visible before tear-off. That detail is what makes a finding clear to the adjuster. Our guide to <a href='/blog/document-rotted-roof-decking-tear-off'>documenting rotted decking</a> lists what to say.",
      },
      {
        heading: "How it works in Supplement Snap",
        content: "In the app, a crew member photographs a finding, tags the damage type and roof area, and records a note by voice. The language picker lists Spanish along with Portuguese, French, Polish, Russian, Ukrainian, Vietnamese, Chinese and English. Voice recognition uses the phone or browser's speech recognition, so how well it works depends on the device.\n\nIf the note is not in English, the app sends the text to an AI translation step that returns an English version. You see the English text and can edit it. The draft explanation is then written from that note.\n\nThe steps below show the flow. We have not published accuracy figures for the voice recognition or the translation, and we do not claim any.",
      },
      {
        heading: "What to check in the English text",
        content: "Translation can slip on trade terms. Check that decking, flashing, drip edge, ice and water shield and pipe boot come out as the words your adjuster uses. Check numbers and units. Check that the note says what and where and not only 'damaged'.\n\nIf the supplement is large or contested, have someone who speaks both languages read the English against the original. It takes a minute and protects the contractor's credibility.",
      },
      {
        heading: "Tips for better voice notes",
        content: "• Say what you see, then where it is, then how big. For example: what the damage looks like, which slope or area, and roughly how far it runs.\n• Say why it was not visible before tear-off when that is true.\n• Speak slowly and clearly, and move away from saws and nail guns if you can.\n• Include numbers and units out loud, such as how many sheets or how many linear feet.\n• Avoid guessing at causes you did not see.",
      },
      {
        heading: "Where Supplement Snap fits, and where it does not",
        content: "Supplement Snap helps your crew capture notes in their own language and drafts the explanation for you to review. It does not guarantee a correct translation, replace a bilingual reviewer or decide what your carrier will accept.\n\nYour first project is free, so you can test the voice and translation flow on one real job. Paid plans are Starter at $99 per month, Team at $199 and Pro at $299. See the <a href='/roofing-supplement-software'>feature walkthrough</a>, a <a href='/roofing-supplement-report-example'>sample report</a> and the <a href='/pricing'>pricing page</a>. For what to photograph, use the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a>.",
      },
    ],
    faq: [
      {
        q: "Can roofing crews dictate damage notes in Spanish?",
        a: "In Supplement Snap, yes. The language picker includes Spanish, and a non-English note is translated to English for the report. Accuracy depends on the device's speech recognition and the translation, so review the English.",
      },
      {
        q: "Is the translation accurate?",
        a: "We do not publish accuracy figures. Speech recognition and AI translation can both make mistakes, especially with trade terms and background noise. Treat the English as a draft and have it reviewed.",
      },
      {
        q: "Which other languages are supported?",
        a: "The app's language list includes English, Spanish, Portuguese, French, Polish, Russian, Ukrainian, Vietnamese and Chinese. Check the app for the current list.",
      },
      {
        q: "Do adjusters accept notes that were translated?",
        a: "Adjusters read the English text in your report. What matters is that it is accurate and specific. Ask your adjuster if they have requirements for documentation.",
      },
      {
        q: "Does using voice notes make a supplement more likely to be approved?",
        a: "No tool can promise that. Approval depends on the claim, the policy, the carrier and your documentation. Clear, detailed notes help the adjuster understand the finding.",
      },
    ],
    related: ["roofing-crew-supplement-documentation-sop", "document-rotted-roof-decking-tear-off", "roofing-photo-documentation-checklist", "organize-roofing-supplement-photos-by-claim", "best-app-to-document-roof-damage-for-insurance"],
  },
  {
    slug: "free-roofing-supplement-software",
    images: { 0: { src: "/blog/free-roofing-supplement-software/card.png", alt: "Key points from the guide: Free Roofing Supplement Software: What Is Actually Free?", width: 1200, height: 630 } },
    title: "Free Roofing Supplement Software: What Is Actually Free?",
    metaTitle: "Free Roofing Supplement Software: What's Really Free",
    metaDescription: "Free roofing supplement software compared: free trials, free apps and free plans, with what each includes and what to check. We make Supplement Snap.",
    publishedDate: "2026-10-24",
    updatedDate: "2026-10-24",
    externalLinks: [
      { text: "LibreCam", url: "https://librecam.com" },
      { text: "Manifold for roofing contractors", url: "https://www.scanmanifold.com/roofing-contractors" },
      { text: "ClaimTrax for contractors", url: "https://myclaimtrax.com/contractors" },
      { text: "Roof Report Pro", url: "https://www.roofreportpro.ai" },
    ],
    midCtaAfter: 1,
    midCtaTitle: "Start with a free project.",
    midCtaBody: "Your first Supplement Snap project is free. See the report before you decide on anything.",
    visuals: {
      2: { type: "matrix", data: {
        headers: ["What is free", "What to check"],
        rows: [
          { feature: "Supplement Snap", values: ["First project free; 14-day trial on paid plans (card required)", "What happens after the first project and the trial"] },
          { feature: "Roof Report Pro", values: ["5 free reports over 14 days, no card, per its site", "Built for inspection reports, not supplements specifically"] },
          { feature: "ClaimTrax", values: ["Free for 14 days, no card, no call, per its site", "Tracks claims; price after the trial was not shown"] },
          { feature: "Manifold", values: ["14-day trial, no card, per its site", "Photo documentation, not supplement writing"] },
          { feature: "LibreCam", values: ["Free tier for unlimited users, per its own page", "Photo capture; check reports and support"] },
          { feature: "SuppX", values: ["App listed as free on the App Store", "The fee for its claim service was not shown"] },
          { feature: "CompanyCam", values: ["Free trial, length not shown on the pricing page", "General job photos; no insurance workflow described on that page"] },
        ],
      }},
      4: { type: "checklist", data: { title: "Before you rely on anything free", items: [
        { text: "What happens to my projects and photos when the trial or free plan ends?", checked: true },
        { text: "Does the free version produce a report I could send to an adjuster?", checked: true },
        { text: "Is a card required to start, and how do I cancel?", checked: true },
        { text: "Are there limits on projects, users or photos?", checked: true },
        { text: "Can I export my data?", checked: true },
      ]}},
      5: { type: "tip", data: { type: "info", title: "Free offers change", text: "These details come from each company's public pages as seen on October 24, 2026, and several are the company's own claims. We have not tested the other tools. Confirm current terms before you rely on any of them." } },
    },
    sections: [
      {
        heading: "The short answer",
        content: "Almost no full roofing supplement tool is free forever. What you can get for free is a trial, a free first project, a free photo app or a free app that sends your claims to a service. Each is useful for a different thing, and none replaces testing on a real job.\n\nDisclosure: we make Supplement Snap, whose first project is free. We have not tested the other tools, and their details come from their public pages as seen on October 24, 2026.",
      },
      {
        heading: "Four kinds of free",
        content: "• A free first project or trial of a paid tool: you get the real product for a limited time or amount. Supplement Snap, ClaimTrax, Manifold and Roof Report Pro describe offers like this.\n• A free photo app: it organizes your photos but does not write the supplement. LibreCam describes itself this way.\n• A free app with a paid service behind it: SuppX is listed as a free app, and its listing says a team handles the follow-up. The listing does not show what the service costs.\n• A free plan with limits: common in general roofing software, and usually limited by features or time.\n\nThe table lists what each company publishes.",
      },
      {
        heading: "What to look for in a free trial",
        content: "A good trial lets you finish a real piece of work, not just click around. For supplements, that means going from photos to a report you could actually send to an adjuster.\n\nCheck whether a card is required, how long the trial runs, and what happens to your data afterward. Some tools keep your projects but lock them. Some delete them. Ask before you build a real job inside one.",
      },
      {
        heading: "What free usually will not do",
        content: "Free photo apps rarely write the supplement narrative or build a claim package. Free trials end. A free app that hands your claims to a service may charge a share or a fee that is not on its listing page, so ask what it costs before you submit anything.\n\nNone of these things is wrong. They are just the tradeoffs. For prices of paid options, see our <a href='/blog/roofing-supplement-software-cost'>cost guide</a>.",
      },
      {
        heading: "How to test a free option properly",
        content: "Use one finished job. Photograph the same roof and write the same notes in each tool you try. Time the work from the first photo to a package you could send, then show each result to someone who was not on the roof.\n\nOur guide to <a href='/blog/best-app-to-document-roof-damage-for-insurance'>documentation apps</a> and the <a href='/blog/roofing-supplement-software-for-small-roofing-companies'>small-company guide</a> cover what to compare, and the <a href='/blog/roofing-supplement-companies-vs-software'>companies versus software</a> article covers services.",
      },
      {
        heading: "Where Supplement Snap fits",
        content: "Supplement Snap's first project is free, so you can photograph a real tear-off, add notes, review the drafted explanations and download the PDF report before paying anything. Paid plans are Starter at $99 per month, Team at $199 and Pro at $299, each with a 14-day trial that requires a card.\n\nSee the <a href='/roofing-supplement-report-example'>sample report</a>, the <a href='/roofing-supplement-software'>feature walkthrough</a> and the <a href='/pricing'>pricing page</a>.",
      },
    ],
    faq: [
      {
        q: "Is there free roofing supplement software?",
        a: "Some tools offer a free first project or trial, and some photo apps are free. A fully featured supplement tool is rarely free for ongoing use. Supplement Snap's first project is free.",
      },
      {
        q: "Do I need a credit card for a free trial?",
        a: "It depends on the tool. ClaimTrax, Manifold and Roof Report Pro describe no card on their sites. Supplement Snap's paid plans require a card for the trial. Confirm on each site.",
      },
      {
        q: "Is LibreCam good for supplements?",
        a: "Its own page describes free photo capture for crews. It is a photo tool, so check whether its output includes the report an adjuster needs.",
      },
      {
        q: "Is SuppX really free?",
        a: "The app is listed as free on the App Store. The listing does not explain what its claim service costs, so ask the company before you submit a claim.",
      },
      {
        q: "Will a free tool get my supplement approved?",
        a: "No. Approval depends on the claim, the policy, the carrier and your documentation, not on what you paid for the tool.",
      },
    ],
    related: ["roofing-supplement-software-free-trial-plan", "roofing-supplement-software-cost", "best-app-to-document-roof-damage-for-insurance", "roofing-supplement-software-for-small-roofing-companies", "claimtrax-vs-suppx-vs-supplement-snap"],
  },
]

/* ── Inline link parser ── */
function parseInlineLinks(str: string): React.ReactNode {
  const parts = str.split(/(<a\s+href='[^']*'>[^<]*<\/a>)/g)
  if (parts.length === 1) return str
  return parts.map((part, i) => {
    const m = part.match(/<a\s+href='([^']*)'>(.*?)<\/a>/)
    if (m) return <Link key={i} href={m[1]} className="text-indigo-600 underline hover:text-indigo-800">{m[2]}</Link>
    return part
  })
}

/* ── Rich content renderer ── */
function RichContent({ text }: { text: string }) {
  const paragraphs = text.split("\n\n")

  return (
    <div className="mt-3 space-y-4">
      {paragraphs.map((p, pi) => {
        const trimmed = p.trim()

        // Numbered list block (lines starting with 1. 2. 3. etc.)
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()))
          return (
            <div key={pi} className="space-y-4 my-6">
              {items.map((item, ii) => {
                const match = item.match(/^(\d+)\.\s(.*)$/)
                if (!match) return null
                const [, num, rest] = match
                const colonIdx = rest.indexOf(":")
                const hasColon = colonIdx > 0 && colonIdx < 60
                return (
                  <div key={ii} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                      {num}
                    </div>
                    <p className="text-base leading-relaxed text-zinc-600">
                      {hasColon ? (
                        <><span className="font-semibold text-zinc-900">{rest.slice(0, colonIdx)}</span>{rest.slice(colonIdx)}</>
                      ) : rest}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        }

        // Bullet list block (lines starting with •)
        if (trimmed.startsWith("•")) {
          const items = trimmed.split("\n").filter((l) => l.trim().startsWith("•"))
          return (
            <div key={pi} className="space-y-3 my-4">
              {items.map((item, ii) => {
                const content = item.replace(/^•\s*/, "").trim()
                const colonIdx = content.indexOf(":")
                const hasColon = colonIdx > 0 && colonIdx < 80
                // Detect if this is a stat/money item
                const isStat = /^\$[\d,]+/.test(content) || /^\d+[–-]\d+%/.test(content)
                return (
                  <div key={ii} className={`flex items-start gap-3 ${isStat ? "rounded-lg border border-zinc-100 bg-zinc-50 p-3" : ""}`}>
                    <svg className="mt-1 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-base leading-relaxed text-zinc-600">
                      {hasColon ? (
                        <><span className="font-semibold text-zinc-900">{content.slice(0, colonIdx)}</span>{content.slice(colonIdx)}</>
                      ) : content}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        }

        // Stat callout (single line with $ or % that looks like a key metric)
        if (/^(Average|Total|Additional|Subtotal|O&P|Breakeven)/.test(trimmed) && /\$/.test(trimmed)) {
          return (
            <div key={pi} className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 my-4">
              <p className="text-base font-semibold text-indigo-900">{trimmed}</p>
            </div>
          )
        }

        // Xactimate code line (starts with RFG)
        if (/^RFG\s/.test(trimmed) || (trimmed.includes("RFG ") && trimmed.includes("—"))) {
          const lines = trimmed.split("\n")
          return (
            <div key={pi} className="space-y-2 my-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              {lines.map((line, li) => (
                <p key={li} className="text-sm font-mono text-zinc-700">{line}</p>
              ))}
            </div>
          )
        }

        // Scenario blocks
        if (/^Scenario \d/.test(trimmed)) {
          const lines = trimmed.split("\n")
          const title = lines[0]
          const rest = lines.slice(1)
          return (
            <div key={pi} className="rounded-xl border border-zinc-200 bg-white p-5 my-4 shadow-sm">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wide">{title}</h4>
              <div className="mt-2 space-y-1">
                {rest.map((line, li) => {
                  const l = line.replace(/^•\s*/, "").trim()
                  const colonIdx = l.indexOf(":")
                  const hasColon = colonIdx > 0 && colonIdx < 60
                  return (
                    <p key={li} className="text-sm leading-relaxed text-zinc-600">
                      {hasColon ? (
                        <><span className="font-semibold text-zinc-900">{l.slice(0, colonIdx)}</span>{l.slice(colonIdx)}</>
                      ) : l}
                    </p>
                  )
                })}
              </div>
            </div>
          )
        }

        // Paragraph with multiple "Label: description" lines (like report structure sections)
        const lines = trimmed.split("\n")
        if (lines.length > 1 && lines.filter((l) => { const ci = l.indexOf(":"); return ci > 0 && ci < 40; }).length >= 2) {
          return (
            <div key={pi} className="space-y-3 my-4">
              {lines.map((line, li) => {
                const ci = line.indexOf(":")
                const hasColon = ci > 0 && ci < 40
                return (
                  <p key={li} className="text-base leading-relaxed text-zinc-600">
                    {hasColon ? (
                      <><span className="font-semibold text-zinc-900">{line.slice(0, ci)}</span>{line.slice(ci)}</>
                    ) : line}
                  </p>
                )
              })}
            </div>
          )
        }

        // Regular paragraph - also bold before first colon if it looks like a label
        const colonIdx = trimmed.indexOf(":")
        const hasLabelColon = colonIdx > 0 && colonIdx < 40 && !trimmed.startsWith("http") && lines.length === 1
        return (
          <p key={pi} className="text-base leading-relaxed text-zinc-600">
            {hasLabelColon ? (
              <><span className="font-semibold text-zinc-900">{trimmed.slice(0, colonIdx)}</span>{parseInlineLinks(trimmed.slice(colonIdx))}</>
            ) : parseInlineLinks(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

export const dynamicParams = false

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) return {}
  const firstImage = article.images ? Object.values(article.images)[0] : null
  const ogImage = firstImage ? `https://supplementsnap.io${firstImage.src}` : "https://supplementsnap.io/opengraph-image"
  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: {
      canonical: `https://supplementsnap.io/blog/${slug}`,
    },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: "article",
      publishedTime: article.publishedDate,
      ...(article.updatedDate && { modifiedTime: article.updatedDate }),
      url: `https://supplementsnap.io/blog/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: firstImage?.alt || article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      images: [ogImage],
    },
  }
}

export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) notFound()

  const firstImg = article.images ? Object.values(article.images)[0] : null
  const wordCount = article.sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0)

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedDate,
    dateModified: article.updatedDate || article.publishedDate,
    wordCount,
    ...(firstImg && { image: `https://supplementsnap.io${firstImg.src}` }),
    author: {
      "@type": "Person",
      name: "Kelvin Spratt",
      jobTitle: "Founder",
      url: "https://supplementsnap.io",
      worksFor: {
        "@type": "Organization",
        name: "Supplement Snap",
        url: "https://supplementsnap.io",
      },
    },
    publisher: {
      "@type": "Organization",
      name: "Supplement Snap",
      url: "https://supplementsnap.io",
      logo: {
        "@type": "ImageObject",
        url: "https://supplementsnap.io/favicon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://supplementsnap.io/blog/${article.slug}`,
    },
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://supplementsnap.io" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://supplementsnap.io/blog" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://supplementsnap.io/blog/${article.slug}` },
    ],
  }

  const faqSchema = article.faq && article.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null

  // Related posts: the ones the article names first, then fill with the rest
  const relatedPosts = [
    ...(article.related || []).map((r) => ARTICLES.find((a) => a.slug === r)).filter((a): a is Article => !!a && a.slug !== slug),
    ...ARTICLES.filter((a) => a.slug !== slug && !(article.related || []).includes(a.slug)),
  ].slice(0, 4)

  return (
    <div className="bg-white text-zinc-900">
      <ScrollToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-zinc-500">
              <li><Link href="/" className="hover:text-zinc-600">Home</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-zinc-600">Blog</Link></li>
              <li>/</li>
              <li className="text-zinc-600 truncate max-w-[200px]">{article.title}</li>
            </ol>
          </nav>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{article.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">KS</div>
            <div>
              <p className="text-sm font-medium text-zinc-900">Kelvin Spratt</p>
              <p className="text-xs text-zinc-500">Founder, Supplement Snap &middot; {new Date(article.publishedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}{article.updatedDate && <> &middot; Updated {new Date(article.updatedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>}</p>
            </div>
          </div>
        </div>

        {article.highlight && (
          <div className="mb-12 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
            <div className="px-6 py-6 sm:px-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{article.highlight.label}</p>
              <p className="mt-2 text-4xl font-extrabold text-zinc-900 sm:text-5xl">{article.highlight.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{article.highlight.subtext}</p>
            </div>
          </div>
        )}

        {/* Key Takeaways */}
        <div className="mb-12 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Key Takeaways
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700">
            {article.metaDescription}
          </p>
        </div>

        {/* Early call-out for readers who will not scroll to the end */}
        <div className="mb-12 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-700">
            <span className="font-semibold text-zinc-900">Preparing a supplement?</span> Use the free checklist so nothing is missing when you submit.
          </p>
          <div className="flex gap-2">
            <TrackedLink location="article-top-checklist" href="/free-roofing-supplement-checklist" className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500">
              Free checklist
            </TrackedLink>
            <TrackedLink location="article-top-sample-report" href="/roofing-supplement-report-example" className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Sample report
            </TrackedLink>
          </div>
        </div>

        <div className="space-y-10">
          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 id={section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")} className="scroll-mt-24 text-xl font-bold tracking-tight text-zinc-900">{section.heading}</h2>
              <RichContent text={section.content} />
              {article.images?.[i] && (
                <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
                  <img
                    src={article.images[i].src}
                    alt={article.images[i].alt}
                    width={article.images[i].width}
                    height={article.images[i].height}
                    className="w-full h-auto max-h-96 object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              {article.visuals?.[i] && <VisualBlock visual={article.visuals[i]} />}
              {i === 0 && article.downloads && getTemplate(article.downloads) && (
                <DownloadBox template={getTemplate(article.downloads)!} showHubLink />
              )}
              {article.midCtaAfter === i && (
                <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
                  <p className="text-sm font-semibold text-zinc-900">{article.midCtaTitle || "Skip the lookup on your next tear-off."}</p>
                  <p className="mt-1 text-sm text-zinc-600">{article.midCtaBody || "Supplement Snap suggests a matching code and quantity for each finding your crew captures. Review the suggestions before you send them."}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <TrackedLink location="article-mid-start-trial" href="/signup?trial=1" className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500">
                      Start a free project
                    </TrackedLink>
                    <TrackedLink location="article-mid-sample-report" href="/roofing-supplement-report-example" className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
                      See a sample report
                    </TrackedLink>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>

        {article.faq && article.faq.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
              {article.faq.map((f, i) => (
                <div key={i} className="p-5">
                  <h3 className="text-base font-semibold text-zinc-900">{f.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* External Links */}
        {article.externalLinks && article.externalLinks.length > 0 && (
          <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">References & Resources</h3>
            <div className="mt-3 space-y-2">
              {article.externalLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500">
                  <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                  {link.text}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tools and product pages */}
        <div className="mt-12 rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Free tools and resources</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/free-roofing-supplement-checklist" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Free roofing supplement checklist &rarr;</Link>
            <Link href="/roofing-supplement-report-example" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Roofing supplement report example &rarr;</Link>
            <Link href="/roofing-supplement-documentation" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Roofing supplement documentation guide &rarr;</Link>
            <Link href="/roofing-supplement-software" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Roofing supplement software &rarr;</Link>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <h3 className="text-lg font-bold text-zinc-900">Ready to streamline your supplement process?</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Supplement Snap helps your crew capture hidden damage during tear-off and generate adjuster-ready reports in minutes.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <TrackedLink location="article-bottom-start-trial" href="/pricing" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
              Start Free Trial
            </TrackedLink>
            <TrackedLink location="article-bottom-pricing" href="/pricing" className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              See Pricing
            </TrackedLink>
          </div>
        </div>

        {/* Author Bio */}
        <div className="mt-16 flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700" style={{fontFamily: "serif"}}>
            KS
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Written by</p>
            <p className="mt-1 text-lg font-bold text-zinc-900">Kelvin Spratt</p>
            <p className="mt-0.5 text-sm text-zinc-500">Founder, Supplement Snap</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Kelvin builds software for roofing contractors who are tired of
              leaving supplement money on the table. His background in software
              development and insurance restoration workflows drives everything
              Supplement Snap does.
            </p>
          </div>
        </div>

        {/* Related articles */}
        <div className="mt-16 border-t border-zinc-100 pt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">More Articles</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedPosts.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm">
                <h4 className="text-sm font-semibold text-zinc-900">{a.title}</h4>
                <p className="mt-1 text-xs text-indigo-600">Read more &rarr;</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
