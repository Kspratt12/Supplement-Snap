import React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteFooter } from "../../../lib/site-footer"
import { NavLinks } from "../../../lib/nav-links"
import { ScrollToTop } from "../../../lib/scroll-to-top"
import { TrackedLink } from "../../../lib/tracked-link"

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

function ComparisonMatrix({ headers, rows }: { headers: string[]; rows: Array<{ feature: string; values: Array<boolean | string> }> }) {
  return (
    <div className="my-8 overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200">
            <th className="px-4 py-3 text-left font-semibold text-zinc-900">Feature</th>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-center font-semibold text-zinc-900">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row, i) => (
            <tr key={i} className="bg-white">
              <td className="px-4 py-3 text-zinc-700">{row.feature}</td>
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
    case "matrix": return <ComparisonMatrix headers={visual.data.headers} rows={visual.data.rows} />
    default: return null
  }
}

const ARTICLES: Article[] = [
  {
    slug: "how-to-write-a-roofing-supplement",
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
    related: ["roofing-supplement-template","roofing-supplement-denied-what-to-do","xactimate-codes-for-roofing-supplements","roofing-photo-documentation-checklist"],
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
        content: "A roofing supplement is a request for additional payment beyond the original insurance estimate. When your crew tears off an existing roof and discovers concealed damage (rotted decking, failed flashing, missing ice and water shield, deteriorated pipe boots), that damage wasn't visible during the initial adjuster inspection. The supplement documents this hidden damage and requests the insurance carrier to cover the cost of repairing it.\n\nSupplements are one of the most overlooked revenue opportunities in roofing. The average supplement recovers $1,500–$3,200 per job, yet most contractors either skip them entirely or submit weak documentation that gets denied."
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
    title: "Roofing Supplement Denied? Here's What to Do Next",
    metaTitle: "Roofing Supplement Denied? What to Do Next",
    metaDescription: "Your roofing supplement was denied. Here's what to do next, from re-documenting damage to appeals and preventing future denials.",
    publishedDate: "2026-01-13",
    externalLinks: [
      { text: "National Association of Insurance Commissioners (NAIC)", url: "https://www.naic.org" },
      { text: "NRCA: Contractor Resources", url: "https://www.nrca.net" },
    ],
    highlight: { label: "Denial Rate With Weak Docs", value: "60–80%", subtext: "Supplements without photos and narratives get denied" },
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
    related: ["how-to-write-a-roofing-supplement","roofing-supplement-follow-up-log","roofing-photo-documentation-checklist","roofing-supplement-template"],
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
    related: ["xactimate-roofing-estimate-example","xactimate-roofing-software-explained","xactimate-roofing-estimate-approved","roofing-supplement-template"],
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
    title: "How Much Do Roofing Supplements Pay? Real Numbers for Contractors",
    metaTitle: "How Much Do Roofing Supplements Pay? | Real Revenue Numbers",
    metaDescription: "How much do roofing supplements actually pay? Real revenue data from contractors on average supplement values, what gets approved, and how to maximize recovery.",
    publishedDate: "2026-01-27",
    externalLinks: [
      { text: "Insurance Information Institute: Homeowners Claims", url: "https://www.iii.org" },
      { text: "NRCA: Roofing Industry Data", url: "https://www.nrca.net" },
    ],
    highlight: { label: "Average Per Job", value: "$1,500–$3,200", subtext: "Hidden damage recovery on a typical insurance tear-off" },
    visuals: {
      1: { type: "stats", data: [
        { label: "Decking replacement (3+ sheets)", value: "$200–$600", color: "text-zinc-900" },
        { label: "Step & counter flashing", value: "$300–$800", color: "text-zinc-900" },
        { label: "Ice & water shield", value: "$200–$500", color: "text-zinc-900" },
        { label: "Multiple layer removal", value: "$400–$1,000", color: "text-zinc-900" },
        { label: "Pipe boot replacement", value: "$85–$340", color: "text-zinc-900" },
        { label: "Drip edge (full perimeter)", value: "$150–$400", color: "text-zinc-900" },
      ]},
      3: { type: "stats", data: [
        { label: "Monthly revenue (no supplements)", value: "$120,000" },
        { label: "Monthly revenue (with supplements)", value: "$144,000", color: "text-green-700" },
        { label: "Additional annual revenue", value: "$288,000", color: "text-green-700" },
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
        content: "On a typical residential roof replacement with an insurance claim value of $10,000–$15,000, the average supplement recovery is $1,500–$3,200. This represents hidden damage found during tear-off that wasn't included in the original adjuster estimate.\n\nSome jobs yield more, some less. A simple re-roof on a ranch-style home might only produce $800–$1,200 in supplementable items. A complex roof with multiple penetrations, valleys, and older construction can produce $4,000–$6,000 in supplements."
      },
      {
        heading: "What items contribute to supplement value",
        content: "The most valuable supplement items by average recovery:\n\n• Decking replacement (3+ sheets): $200–$600. This is the most common supplement item.\n• Step and counter flashing (chimney or wall): $300–$800. Often corroded and hidden.\n• Ice and water shield (valleys + eaves): $200–$500. Code-required, often missing on older roofs.\n• Multiple layer removal: $400–$1,000. Only discovered during tear-off.\n• Pipe boot replacement (multiple): $85–$340. Cracked boots are extremely common.\n• Drip edge (full perimeter): $150–$400. Missing on many older homes.\n\nOn a single job, a crew might find 3–5 of these items, pushing the total supplement value into the $1,500–$3,200 range."
      },
      {
        heading: "How many jobs have supplementable damage?",
        content: "Experienced restoration contractors report that 70–90% of insurance tear-offs have at least one supplementable finding. The damage is almost always there. The question is whether your crew documents it.\n\nThe problem isn't finding the damage. The problem is that most crews don't have a system to capture it properly in the moment. By the time someone in the office tries to write up the supplement from memory and a few blurry photos, the opportunity is lost."
      },
      {
        heading: "The math: what supplements mean for your business",
        content: "Let's say your company does 10 insurance roof replacements per month:\n\n• Without supplements: 10 jobs × $12,000 average = $120,000/month\n• With supplements ($2,400 avg): 10 jobs × $14,400 average = $144,000/month\n• Additional annual revenue: $288,000\n\nThat's $288,000 in revenue that was already there, on jobs you were already doing. You're not finding new customers. You're just capturing the money that was hiding under the shingles.\n\nEven a solo crew doing 4 jobs per month recovers an additional $115,200/year with proper supplement documentation."
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
    title: "The Roofing Supplement Process Explained: From Tear-Off to Approval",
    metaTitle: "Roofing Supplement Process: Tear-Off to Approval",
    metaDescription: "Complete guide to the roofing supplement process, from discovering hidden damage during tear-off to getting insurance approval. Written for contractors.",
    publishedDate: "2026-02-03",
    externalLinks: [
      { text: "International Building Code (ICC)", url: "https://www.iccsafe.org" },
      { text: "NRCA: Roofing Manual", url: "https://www.nrca.net" },
    ],
    highlight: { label: "Jobs With Supplementable Damage", value: "70–90%", subtext: "Of insurance tear-offs have at least one hidden finding" },
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
    related: ["how-to-write-a-roofing-supplement","roofing-photo-documentation-checklist","roofing-supplement-denied-what-to-do","roofing-supplement-template"],
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
    highlight: { label: "Average Tear-Off Cost", value: "$1,000–$1,800", subtext: "Per square (100 SF) including labor and disposal" },
    images: {
      1: { src: "/blog/roof-tear-off-cost/tear-off-in-progress.jpg", width: 1024, height: 683, alt: "Roof mid-tear-off showing exposed decking and damaged shingles being removed" },
      3: { src: "/blog/roof-tear-off-cost/hidden-damage-found.jpg", width: 1400, height: 934, alt: "Rotted roof decking discovered during tear-off requiring supplement documentation" },
    },
    related: ["roofing-overhead-and-profit-claims","how-much-do-roofing-supplements-pay","roof-replacement-estimate-vs-final-cost","roofing-code-upgrades-ordinance-and-law"],
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
        content: "The single biggest financial opportunity during a roof tear-off is capturing and recovering the cost of concealed damage through supplements. On an average insurance reroof, contractors who document hidden damage properly recover an additional $1,500–$3,200 per job.\n\nThe challenge has always been the documentation workflow. Your crew is on the roof, moving fast, focused on getting the tear-off done and new materials installed. Stopping to take detailed photos, write notes, and measure damaged areas slows down production. And if documentation happens after the fact, back at the office from memory, it is usually incomplete.\n\nThis is exactly the problem Supplement Snap was built to solve. During tear-off, your crew captures damage photos directly in the app, tags the damage type and roof location, and adds a quick voice note describing what they found. The system generates a professional supplement narrative using AI, suggests matching Xactimate line codes for each finding, and produces a PDF report you can email to the adjuster the same day.\n\nThe result: hidden tear-off costs that used to eat into your margin become documented, submitted, and recovered. Instead of absorbing $2,000 in rotted decking and missing flashing, you turn it into a supplement that gets approved and paid. For contractors doing 10 or more insurance jobs per month, proper tear-off documentation can mean the difference between a tight year and a highly profitable one.\n\nFor more on why the initial estimate rarely matches the final cost, read <a href='/blog/roof-replacement-estimate-vs-final-cost'>roof replacement estimate vs final cost</a>."
      },
    ],
  },
  {
    slug: "best-roof-estimating-software",
    title: "Best Roof Estimating Software for Contractors in 2026",
    metaTitle: "Best Roof Estimating Software for Contractors (2026)",
    metaDescription: "Compare the best roof estimating software for contractors in 2026: satellite measurement, field documentation, CRM and supplement tools.",
    publishedDate: "2026-02-17",
    externalLinks: [
      { text: "Verisk Xactimate", url: "https://www.verisk.com/insurance/products/xactimate/" },
      { text: "EagleView Roof Measurement", url: "https://www.eagleview.com" },
    ],
    highlight: { label: "Key Insight", value: "$1,500–$3,200", subtext: "Average supplement recovery per job (the gap most software misses)" },
    images: {
      1: { src: "/blog/best-roof-estimating-software/satellite-roof-measurement.png", width: 1344, height: 768, alt: "Satellite roof measurement showing 3D roof model with panel dimensions and pitch data" },
      3: { src: "/blog/best-roof-estimating-software/supplement-snap-capture.png", width: 1200, height: 628, alt: "Supplement Snap field capture screen showing roof damage being documented during tear-off" },
      5: { src: "/blog/best-roof-estimating-software/supplement-snap-pdf-report.png", width: 1400, height: 679, alt: "Professional supplement report generated by Supplement Snap with photos and damage narratives" },
    },
    related: ["companycam-alternative-roofing-supplements","best-roofing-crm","roofing-software-comparison","roofing-photo-documentation-checklist"],
    sections: [
      {
        heading: "What roof estimating software does and why it matters",
        content: "Roof estimating software helps contractors measure roofs, calculate material quantities, generate cost estimates, and produce professional proposals, faster and more accurately than manual methods. In 2026, the category has expanded well beyond simple calculators. Modern roof estimating tools pull satellite imagery, integrate with supplier pricing, sync with CRMs, and even generate insurance-ready documentation.\n\nFor roofing contractors, the right software stack directly impacts revenue. Accurate estimates mean fewer jobs underbid. Faster measurements mean more proposals generated per day. Professional-looking reports build homeowner confidence and increase close rates. And for insurance restoration contractors, the ability to produce Xactimate-compatible documentation can mean the difference between recovering full claim value and leaving thousands on the table.\n\nThe challenge is that no single tool does everything. The roof estimating software market is fragmented across several categories, and contractors often need two or three tools working together to cover the full workflow, from initial measurement through final supplement submission. Understanding what each category does and where the gaps are helps you build a stack that actually pays for itself."
      },
      {
        heading: "Category 1: Satellite measurement tools",
        content: "Satellite measurement tools let you measure a roof remotely using aerial imagery, no ladder climb required. You enter an address, the software pulls high-resolution satellite or drone imagery, and you get a detailed roof report with square footage, pitch, ridges, valleys, hips, rakes, eaves, and waste factor.\n\nPopular satellite measurement platforms in 2026 include:\n\n• EagleView: The industry standard for roof measurement reports. Provides detailed geometry including facet-level measurements, pitch by slope, and suggested waste percentages. Reports are widely accepted by insurance carriers and are often used by adjusters themselves. Pricing runs $15–$50 per report depending on volume and turnaround time.\n\n• GAF QuickMeasure: A strong competitor to EagleView with competitive pricing and fast turnaround. Integrated with GAF's contractor programs and offers material-specific waste calculations.\n\n• Roofr: Combines instant satellite measurements with a built-in proposal tool. Strong for residential contractors who want to generate a measurement and a customer-facing quote in one step. Offers a free tier with limited features and paid plans starting around $100/month.\n\n• SkyMeasure (by CoreLogic): Popular with insurance-focused contractors and carriers. Provides detailed reports used in the claims process.\n\nSatellite measurement tools are excellent for generating initial estimates and proposals before visiting the property. Their limitation is that they show you what the roof looks like from above. They cannot tell you what is hiding underneath the existing materials. The condition of the decking, flashing, underlayment, and other concealed components remains unknown until someone physically inspects or tears off the roof."
      },
      {
        heading: "Category 2: Estimating and proposal platforms",
        content: "Once you have measurements, estimating platforms help you turn those numbers into material lists, labor calculations, and customer-facing proposals. Some are standalone; others are built into larger CRM systems.\n\nKey platforms in this space:\n\n• Xactimate (by Verisk): The industry standard for insurance restoration estimating. If you do insurance work, you need Xactimate. Adjusters use it, carriers expect it, and supplements must be submitted in its format. Pricing is subscription-based, starting around $200/month for the desktop version. The learning curve is steep, but it is non-negotiable for restoration work.\n\n• RoofSnap: Combines aerial measurements with a built-in estimating tool. Allows you to draw roof diagrams, calculate materials, and generate proposals. Popular with residential retail contractors. Plans start around $100/month.\n\n• JobNimbus: A full CRM with built-in estimating capabilities. Tracks leads, generates estimates, manages projects, and handles invoicing. Strong for contractors who want one system for the entire sales pipeline. Plans start around $150/month.\n\n• AccuLynx: Another CRM-plus-estimating platform focused on roofing. Includes aerial measurements, material ordering integration, and project management. Geared toward mid-size and larger roofing companies.\n\nThese platforms are strong for generating retail estimates and managing the sales process. For insurance restoration, Xactimate is the essential tool, but even Xactimate only covers the estimating side. It does not capture field documentation, generate supplement narratives, or help your crew document what they find on the roof."
      },
      {
        heading: "Category 3: Field documentation and supplement tools",
        content: "This is the newest and most underserved category in roofing software. Field documentation tools focus on what happens after the sale, specifically capturing evidence of damage discovered during roof tear-off and turning that evidence into supplement requests.\n\n• Why this category exists: On insurance restoration jobs, the adjuster writes an initial estimate based on visible damage. When the crew tears off the existing roof and finds concealed damage (rotted decking, failed flashing, missing ice and water shield), that damage needs to be documented, written up, and submitted as a supplement to the insurance carrier. This process has historically been manual, inconsistent, and slow.\n• Traditional workflow: Crew texts blurry photos to the office. Project manager tries to remember what the damage looked like. Someone writes up a narrative days or weeks later. An office admin manually builds the Xactimate line items. The supplement gets submitted late with weak documentation and often gets denied.\n• Modern workflow: Field documentation tools replace this entire process by enabling the crew to capture and tag damage from the roof in real time. Photos are organized by damage type and roof location. Narratives are generated automatically. Xactimate line items are mapped and exported. Reports are produced on-site the same day.\n\nThis category is critical because it captures revenue that the other categories cannot. Satellite measurement tools do not see hidden damage. Estimating platforms do not capture field evidence. CRMs do not generate supplement documentation. The average supplement recovery of $1,500–$3,200 per job means that a field documentation tool can be the highest-ROI software in your entire stack."
      },
      {
        heading: "Key features to look for in roof estimating software",
        content: "When evaluating any roof estimating software, these features separate tools that save time from tools that actually make you money:\n\n• Accuracy of measurements: For satellite tools, how current is the imagery? Are pitch readings accurate? Does the waste factor match reality? An inaccurate measurement leads to an inaccurate estimate, which leads to either overbidding (losing the job) or underbidding (losing money).\n\n• Integration with Xactimate: If you do any insurance work, your software needs to speak Xactimate's language. Look for the ability to export Xactimate-compatible line items, codes, and pricing. This applies to both initial estimates and supplements.\n\n• Speed of output: How quickly can you go from address to proposal? Or from damage discovery to supplement submission? Time is money in roofing. A tool that saves 30 minutes per estimate across 200 estimates per year gives you back 100 hours.\n\n• Mobile-first design: Roofing happens on roofs, not at desks. Any tool that requires a desktop computer for core functions creates a bottleneck. The best tools let your crew capture data in the field and let project managers review and submit from anywhere.\n\n• Team collaboration: Can your crew in the field and your office staff work from the same data? Real-time sync between field and office eliminates the game of telephone that kills supplement documentation.\n\n• Multilingual support: In many markets, roofing crews speak Spanish as their primary language. Software that supports Spanish voice notes, interface, or input removes friction for the people actually on the roof.\n\n• Professional output: Whether it is a homeowner proposal or an adjuster report, the document that leaves your company represents your brand. Clean, professional PDFs with labeled photos and organized findings build credibility and improve approval rates."
      },
      {
        heading: "Building your roofing software stack",
        content: "Most successful roofing contractors in 2026 use a combination of tools rather than relying on a single platform. A practical stack for an insurance restoration contractor looks like this:\n\n• Satellite measurement (EagleView, Roofr, or GAF QuickMeasure) for remote measurements and initial estimates\n• Xactimate for insurance-format estimating and adjuster communication\n• A CRM (JobNimbus, AccuLynx, or similar) for lead tracking, project management, and invoicing\n• A field documentation and supplement tool for capturing hidden damage and generating supplement reports\n\nRetail contractors who do not work insurance claims can often get by with a satellite measurement tool and a CRM with built-in estimating. But any contractor who touches insurance work, even occasionally, needs the supplement documentation piece.\n\nThe question to ask about each tool in your stack is simple: does it pay for itself? A $50 measurement report that helps you close a $15,000 job is an obvious yes. A $200/month CRM that keeps 20 leads from falling through the cracks is an obvious yes. And a supplement tool that recovers $2,000+ per job on work you are already doing is perhaps the highest-ROI investment of all."
      },
      {
        heading: "Why supplement documentation is the missing piece",
        content: "Of all the categories in roofing software, supplement documentation is the one most contractors are either missing entirely or handling manually. Satellite measurement tools have been mainstream for years. Xactimate has been the industry standard for decades. CRMs have penetrated the market deeply. But the step between tear-off and supplement submission (the actual field documentation) remains the biggest gap in most contractors' technology stack.\n\nThis gap costs money on every single insurance job. When documentation is weak, supplements get denied. When supplements are skipped because the process is too cumbersome, revenue stays on the table. When office staff spend hours writing narratives and building Xactimate line items from blurry text-message photos, overhead increases.\n\nSupplement Snap was built specifically to close this gap. It sits between the field and the adjuster's inbox. Your crew captures damage during tear-off (photos, tags, voice notes) and the platform generates professional supplement documentation with AI-written narratives, Xactimate-ready CSV exports, and branded PDF reports. The entire process happens on-site, same-day, from a mobile device.\n\nFor contractors evaluating their software stack in 2026, adding a dedicated supplement documentation tool is often the single highest-impact change they can make. Not because the other tools are not important (they are), but because supplement revenue is real money on jobs you are already performing, and the only thing standing between you and that revenue is proper documentation.\n\nFor a broader look at how these tools fit together, see our <a href='/blog/roofing-software-comparison'>roofing software comparison</a>."
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
    highlight: { label: "Storm Season Revenue", value: "$30,000–$64,000", subtext: "Additional monthly revenue from supplements on 20 hail damage re-roofs" },
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
        content: "Every hail damage re-roof has hidden findings. Rotted decking under a failed pipe boot. Flashing that cracked when the hailstone hit it. Underlayment that was punctured by the impact force. Ice and water shield that was never installed in the first place. The damage is there on almost every job. The question is whether it gets documented and submitted.\n\nThe average hail damage supplement recovers $1,500–$3,200 per job. On a busy storm season with 20 insurance re-roofs in a single month, that represents $30,000–$64,000 in additional revenue. Over a full season, proper supplement documentation can add six figures to a restoration contractor's top line.\n\nSupplement Snap was purpose-built for this workflow. Your crew captures hail damage findings during tear-off: photos tagged by damage type and roof location, voice notes in English or Spanish describing what they found. The platform's AI generates professional supplement narratives from the field data. Xactimate-ready CSV exports map each finding to the correct line codes with quantities and pricing. A branded PDF report is generated and emailed to the adjuster the same day.\n\nThe result is a supplement process that scales with storm volume. Whether you are running 5 hail damage jobs or 50, every finding gets documented, every supplement gets submitted, and every dollar of hidden damage gets recovered. That is the difference between a storm season that stretches your operation thin and one that drives your most profitable quarter of the year.\n\nFor a broader guide on all types of storm damage, see <a href='/blog/storm-damage-roof-repair'>storm damage roof repair guide</a>."
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
    highlight: { label: "Revenue Gap", value: "$20,000–$30,000/mo", subtext: "Left on the table by contractors with no supplement tool (10 jobs/month)" },
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
        content: "Supplement tools are the newest and least adopted category of roofing software. They focus on a specific problem: documenting concealed damage found during tear-off and converting that documentation into insurance supplement requests.\n\nWhat a supplement tool typically does:\n\n• Enables field crews to capture and tag damage photos during tear-off\n• Records voice notes and field observations in real time\n• Generates professional supplement narratives explaining what was found\n• Maps damage to Xactimate line codes with correct quantities and pricing\n• Exports Xactimate-compatible CSV files for adjuster submission\n• Produces PDF reports with photos, narratives, and findings summaries\n• Tracks supplement status from submission through approval\n\nThe core value proposition is simple: on a typical insurance tear-off, your crew discovers $1,500–$3,200 in hidden damage that wasn't included in the original adjuster estimate. A supplement tool ensures that damage gets documented properly and submitted to the carrier for additional payment.\n\nWithout a supplement tool, that documentation process relies on crew members texting blurry photos to the office, someone writing up the supplement days later from incomplete information, and hoping the adjuster approves it despite the weak evidence."
      },
      {
        heading: "The gap most contractors don't see",
        content: "Here's the pattern across the roofing industry: almost every established contractor has a CRM. Most have some form of estimating tool. But very few have a dedicated supplement tool.\n\nThis creates a predictable revenue leak. Consider a typical insurance job:\n\n• The CRM tracks the lead from door knock to signed contract, working perfectly\n• The estimating tool produces accurate measurements and a material order, working perfectly\n• The crew tears off the roof and finds rotted decking, failed flashing, and missing ice and water shield\n• Nobody has a system to document the hidden damage properly\n• The supplement either doesn't happen, or it gets submitted with a blurry photo and a one-line description\n• The adjuster denies it or the office never bothers submitting it\n• $2,000+ in legitimate, recoverable revenue disappears\n\nThis happens job after job, month after month. A contractor doing 10 insurance roofs per month might be leaving $20,000–$30,000 on the table every month, not because the damage isn't there, but because they don't have a system to capture it.\n\nThe irony is that contractors will spend $300–$500/month on a CRM to close more deals but won't invest in a tool that recovers $2,000+ per job on deals they've already closed. The ROI on supplement documentation is dramatically higher than almost any other software investment a roofing company can make."
      },
      {
        heading: "Overlap and integration between the three categories",
        content: "There's some overlap between these categories, but less than you might expect:\n\n• Some CRMs include basic estimating features, but they rarely match the accuracy of dedicated measurement tools\n• Some estimating platforms include CRM-like features for managing jobs, but they lack the depth of a dedicated CRM\n• A few CRMs have started adding 'supplement tracking' features, but these are typically just status fields. They don't help with the actual documentation, narrative generation, or Xactimate export\n\nThe reality is that each category solves a fundamentally different problem at a different stage of the job:\n\n• CRM: pre-sale through project completion (customer-facing)\n• Estimating: pre-job measurement and quoting (planning-focused)\n• Supplement: during and after tear-off (revenue recovery)\n\nThe most productive roofing operations use all three categories in combination. The CRM manages the customer relationship and project pipeline. The estimating tool produces accurate measurements and material orders. The supplement tool captures hidden damage during tear-off and recovers additional revenue.\n\nWhen evaluating any roofing software, ask yourself: does this tool help me close more deals, plan jobs more accurately, or recover more revenue from jobs I'm already doing? If you're strong on the first two but have nothing for the third, you've identified your biggest opportunity."
      },
      {
        heading: "Why supplement documentation should be your next investment",
        content: "If you already have a CRM and an estimating tool, the highest-ROI addition to your tech stack is a supplement documentation platform. The math is straightforward:\n\n• Average supplement recovery: $1,500–$3,200 per job\n• Percentage of insurance tear-offs with supplementable damage: 70–90%\n• Cost of a supplement tool: $99–$299/month\n• Breakeven: one approved supplement pays for months of the software\n\nThe key is choosing a tool that actually solves the documentation problem, not just a status tracker. You need something your crew can use on the roof during tear-off to capture photos, tag damage types, record voice notes, and generate professional reports before they leave the job site.\n\nSupplement Snap was built specifically for this workflow. Your crew captures damage findings from the roof with tagged photos and voice notes. The AI generates professional supplement narratives. You export Xactimate-ready CSV files and email a PDF report to the adjuster the same day. It fills the gap that your CRM and estimating tool were never designed to address, and it pays for itself on the very first job.\n\nStop investing only in software that helps you win jobs. Start investing in software that helps you get paid fully for the jobs you've already won.\n\nFor a deep dive into CRM options specifically, check out <a href='/blog/best-roofing-crm'>best roofing CRM</a>."
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
    highlight: { label: "Sample Supplement Total", value: "$1,438", subtext: "Typical supplement value using standard Xactimate codes + O&P" },
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
    highlight: { label: "Annual Revenue Left Behind", value: "$192,000–$288,000", subtext: "For a contractor doing 8-12 insurance roofs/month without supplements" },
    images: {
      5: { src: "/blog/roof-replacement-estimate-vs-final-cost/supplement-snap-project-value.png", width: 2533, height: 812, alt: "Supplement Snap app showing project with $1,300 estimated supplement value and damage capture workflow" },
    },
    related: ["roof-tear-off-cost","roofing-code-upgrades-ordinance-and-law","roofing-overhead-and-profit-claims","how-to-write-a-roofing-supplement"],
    sections: [
      {
        heading: "Why the initial estimate is always lower than the final cost",
        content: "If you've been in the roofing business for any length of time, you already know this: the insurance adjuster's initial estimate almost never covers the full cost of replacing the roof. The estimate comes in at $9,500, but by the time your crew finishes the job, the actual cost is $12,000 or more.\n\nThis gap between the initial estimate and the final cost isn't a mistake, and it isn't the adjuster being dishonest. It's a structural reality of how insurance roof inspections work. The adjuster inspects the roof from the surface. They walk it, note visible damage, and write an estimate based on what they can see. They don't tear off the shingles. They don't inspect the decking underneath. They don't check whether the flashing behind the chimney has corroded or whether the ice and water shield in the valleys has deteriorated.\n\nThe initial estimate covers the visible scope. The actual job includes everything hidden underneath. That's where the gap comes from, and it's why supplements exist: to close it."
      },
      {
        heading: "What gets missed in adjuster inspections",
        content: "Insurance adjusters are not trying to shortchange you. They're writing an estimate based on a surface-level inspection, and there's a long list of items that cannot be assessed without removing the existing roofing materials.\n\nThe most commonly missed items include:\n\n• Rotted decking: Plywood or OSB that has deteriorated from years of moisture penetration. The shingles on top may look fine, but the wood underneath is soft, spongy, or crumbling. On average, contractors find 2–4 sheets of damaged decking per job, adding $140–$280 to the actual cost.\n\n• Failed step and counter flashing: Metal flashing at chimneys, walls, and dormers corrodes over time behind the shingles, invisible from the surface. Replacing flashing at a single chimney can add $200–$500.\n\n• Missing or deteriorated ice and water shield: Many older roofs were installed before current building codes required ice and water shield in valleys, at eaves, and around penetrations. This can add $200–$500 depending on coverage area.\n\n• Cracked pipe boots: Rubber gaskets around plumbing vents crack and split with age. At $85 per boot with 2–5 boots per roof, this adds $170–$425.\n\n• Additional layers of roofing: The original estimate may have been written for a single-layer tear-off. Additional layer removal on a 25-square roof adds $950–$1,375.\n\n• Missing drip edge: Older homes often lack drip edge entirely. Full perimeter replacement runs $150–$400."
      },
      {
        heading: "The real numbers: estimate vs. actual cost",
        content: "Let's put real numbers to this. Consider a typical 25-square residential roof replacement on a home built in the early 2000s with storm damage.\n\nThe adjuster's initial estimate:\n\n• Tear-off (1 layer): $1,125\n• New architectural shingles: $4,500\n• Felt underlayment: $625\n• Ridge cap: $375\n• Pipe boot replacement (1 visible): $85\n• Haul debris: $562\n• O&P (20%): $1,454\n• Total initial estimate: $8,726\n\nWhat the crew finds during tear-off:\n\n• 3 sheets of rotted decking along the eave: $209\n• Corroded step flashing at the chimney (24 LF): $210\n• Missing ice and water shield in both valleys (180 SF): $333\n• 2 additional cracked pipe boots: $170\n• Missing drip edge along the rakes (45 LF): $191\n• O&P on additional items (20%): $223\n• Total hidden damage: $1,336\n\nThe actual cost is now $10,062, a gap of $1,336. On more complex roofs with multiple penetrations, steep pitches, or older construction, this gap can easily reach $2,500–$4,000.\n\nMultiply that across every insurance job you do. If you're running 8–12 insurance roofs per month and the average gap is $2,000, that's $192,000–$288,000 per year in work you're doing but not getting paid for, unless you submit supplements."
      },
      {
        heading: "How supplements bridge the gap",
        content: "A supplement is the formal mechanism for closing the gap between the initial estimate and the actual cost. It's a documented request to the insurance carrier saying: your adjuster estimated the visible damage accurately, but our crew found additional concealed damage during tear-off that needs to be covered.\n\nA well-documented supplement includes:\n\n• Photographs of each concealed damage finding, taken during tear-off before new materials cover it up\n• A professional narrative explaining what was found, where it was located, why it was concealed, and why the repair is necessary\n• Xactimate line items with the correct codes, quantities, and current pricing\n• Building code references where applicable\n\nWhen submitted properly, supplements have a high approval rate. Adjusters expect them because they know their surface inspection doesn't catch everything. The key word is 'properly.' A supplement with clear photos, a detailed narrative, and accurate Xactimate formatting gets approved. A supplement with a blurry photo and 'found some bad decking' gets denied.\n\nThe difference between contractors who consistently recover supplement revenue and those who don't comes down to documentation quality and submission speed."
      },
      {
        heading: "Real scenarios: estimate vs. final with supplements",
        content: "Three scenarios based on common job types:\n\nScenario 1: Simple ranch home, 20 squares\n• Initial estimate: $7,200\n• Hidden damage: 2 sheets rotted decking, 2 cracked pipe boots, missing drip edge on front eave\n• Supplement value: $680 + O&P = $816\n• Final cost with supplement: $8,016\n• Revenue recovered: 11% above initial estimate\n\nScenario 2: Two-story colonial, 30 squares, chimney and dormers\n• Initial estimate: $12,800\n• Hidden damage: 4 sheets rotted decking, corroded step flashing at chimney and 2 dormers, missing ice and water shield in valleys, 3 cracked pipe boots\n• Supplement value: $2,180 + O&P = $2,616\n• Final cost with supplement: $15,416\n• Revenue recovered: 20% above initial estimate\n\nScenario 3: Complex multi-level, 35 squares, multiple layers\n• Initial estimate: $14,500\n• Hidden damage: 6 sheets rotted decking, second layer of shingles, deteriorated ice and water shield, corroded flashing at 2 walls, 4 cracked pipe boots, missing drip edge full perimeter\n• Supplement value: $4,340 + O&P = $5,208\n• Final cost with supplement: $19,708\n• Revenue recovered: 36% above initial estimate\n\nIn every scenario, the supplement represents real work the contractor has to do regardless. The only question is whether they get paid for it."
      },
      {
        heading: "How to systematically capture the difference on every job",
        content: "Recovering supplement revenue can't happen only when someone in the office remembers. It needs to be a systematic part of your production workflow.\n\nHere's what a systematic supplement process looks like:\n\n• Train every crew to recognize and document hidden damage during tear-off: rotted decking, corroded flashing, deteriorated pipe boots\n• Establish a documentation protocol: when damage is found, stop and photograph it before covering it with new materials. Wide-angle context shot and close-up detail shot.\n• Use a tool that makes documentation fast and easy. If it takes 20 minutes per finding, your crew won't do it. If it takes 30 seconds to snap a photo and tag the damage type, they'll do it every time.\n• Generate the supplement report the same day. Don't let findings sit in someone's camera roll for a week.\n• Track supplement status for every job: submitted, pending, approved, denied. Follow up weekly.\n\nThe contractors who build this into their standard workflow recover supplements on 70–90% of their insurance jobs. Those who treat it as an afterthought recover on maybe 10–20%."
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
    highlight: { label: "Storm Season Tip", value: "Same-Day Documentation", subtext: "Contractors who document damage during tear-off recover 2-3x more in supplements" },
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
        title: "What Storm Damage Roof Repairs Typically Cost",
        rows: [
          { label: "Tear-off and disposal (25 SQ avg)", value: "$1,125 - $1,875" },
          { label: "New architectural shingles (25 SQ)", value: "$4,500 - $6,250" },
          { label: "Underlayment and starter strip", value: "$625 - $950" },
          { label: "Ridge cap and ventilation", value: "$375 - $800" },
          { label: "Pipe boots (3-5 typical)", value: "$255 - $425" },
          { label: "Drip edge replacement", value: "$150 - $400" },
          { label: "Common supplement items (decking, flashing, I&WS)", value: "$800 - $2,500" },
        ],
        total: { label: "Typical Total (before O&P)", value: "$7,830 - $13,200", color: "text-indigo-600" },
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
        content: "Understanding the insurance claim process helps you work effectively with both your insurance company and your contractor. Here is the typical timeline from storm to completed repair.\n\nStep 1: File the claim promptly. Contact your insurance company within 24-48 hours of the storm. Most policies have time limits for reporting damage, and delays can complicate your claim. Your insurer will assign a claim number and schedule an adjuster visit.\n\nStep 2: Get an independent contractor inspection. Before the adjuster arrives, have a qualified contractor inspect your roof. They should document all visible damage with photos and provide you with a written assessment. This gives you a baseline to compare against the adjuster's findings.\n\nStep 3: The adjuster inspection. The insurance adjuster will visit your property, inspect the roof, and write an initial estimate using Xactimate. A good practice is to have your contractor present during this inspection so they can point out damage the adjuster might miss. The adjuster's estimate covers only what they can see from the surface.\n\nStep 4: Review the initial estimate. Your contractor should review the adjuster's Xactimate estimate with you. They can identify items that may have been missed or undervalued. If significant visible damage was overlooked, your contractor can request a re-inspection before work begins.\n\nStep 5: Authorize repairs and begin work. Once you're satisfied with the scope, sign a contract with your chosen contractor and schedule the work. Your insurance company issues the first payment (minus your deductible), often held in escrow if you have a mortgage.\n\nStep 6: Tear-off reveals hidden damage. This is the critical phase. When the crew removes the existing roofing materials, they frequently discover concealed damage: rotted decking, corroded flashing, deteriorated pipe boots, missing ice and water shield. This damage was invisible during both your contractor's inspection and the adjuster's visit.\n\nStep 7: Your contractor submits a supplement. The supplement is a formal request for additional insurance payment to cover the concealed damage. It includes photos taken during tear-off, a professional narrative, and Xactimate line items. A well-documented supplement submitted promptly has a high approval rate.\n\nStep 8: Supplement approval and final payment. The insurance company reviews the supplement, may request additional information or a re-inspection, and issues additional payment for approved items. The entire process from claim filing to final supplement approval typically takes 4-8 weeks."
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
    title: "Best Roofing CRM in 2026: What to Look For and What's Missing",
    metaTitle: "Best Roofing CRM in 2026: Features and Options",
    metaDescription: "Compare the best roofing CRMs in 2026: JobNimbus, AccuLynx, Leap and RoofLink. What features matter, what CRMs miss, and how to capture supplement revenue.",
    publishedDate: "2026-03-17",
    externalLinks: [
      { text: "NRCA: Technology Resources", url: "https://www.nrca.net" },
      { text: "Verisk Xactimate", url: "https://www.verisk.com/insurance/products/xactimate/" },
    ],
    highlight: { label: "CRM Blind Spot", value: "$2,000+/job", subtext: "Supplement revenue that CRMs don't help you recover" },
    images: {
      0: { src: "/blog/best-roofing-crm/roofing-office.jpg", width: 1200, height: 800, alt: "Roofing contractor using CRM software on a computer screen" },
    },
    visuals: {
      1: { type: "matrix", data: {
        headers: ["Feature", "JobNimbus", "AccuLynx", "Leap", "RoofLink"],
        rows: [
          { feature: "Lead tracking and pipeline", values: [true, true, true, true] },
          { feature: "Estimate and proposal generation", values: [true, true, true, true] },
          { feature: "Production scheduling", values: [true, true, true, true] },
          { feature: "Material ordering integration", values: [true, true, false, true] },
          { feature: "Photo upload and storage", values: [true, true, true, true] },
          { feature: "Built-in financing options", values: [false, true, true, false] },
          { feature: "Xactimate estimate integration", values: [false, true, false, false] },
          { feature: "Insurance claim tracking", values: [false, true, false, false] },
          { feature: "Supplement documentation and narratives", values: [false, false, false, false] },
          { feature: "AI-generated supplement reports", values: [false, false, false, false] },
          { feature: "Xactimate CSV export for supplements", values: [false, false, false, false] },
          { feature: "Field crew damage capture tool", values: [false, false, false, false] },
        ],
      }},
      2: { type: "compare", data: {
        before: { label: "What Your CRM Does", items: ["Tracks leads from first contact to close", "Generates estimates and proposals", "Schedules production crews", "Stores job photos and documents", "Manages customer communication", "Reports on sales pipeline and revenue"] },
        after: { label: "What Your CRM Misses", items: ["Documenting hidden damage during tear-off", "Generating supplement narratives from field data", "Mapping findings to Xactimate line codes", "Creating insurance-ready PDF supplement reports", "Exporting Xactimate-compatible CSV files", "Tracking supplement status and recovery rates"] },
      }},
      4: { type: "calculator", data: {
        title: "The Revenue Impact of Adding Supplement Tools",
        rows: [
          { label: "Insurance roofs per month", value: "10 jobs" },
          { label: "Jobs with supplementable hidden damage", value: "8 jobs (80%)" },
          { label: "Average supplement recovery per job", value: "$2,100" },
          { label: "Monthly supplement revenue (with proper tools)", value: "$16,800" },
          { label: "Monthly supplement revenue (without tools)", value: "$2,100 (1-2 jobs)" },
          { label: "Revenue difference per month", value: "$14,700" },
          { label: "Cost of supplement tool (monthly)", value: "$149" },
        ],
        total: { label: "Net Annual Revenue Gain", value: "$174,612", color: "text-emerald-600" },
      }},
      5: { type: "tip", data: {
        type: "info",
        title: "The Complete Roofing Tech Stack",
        text: "Your CRM handles the customer journey from lead to signed contract. Your estimating tool handles pricing and proposals. Your supplement tool handles the revenue recovery after tear-off. Together, they cover the full lifecycle of an insurance roofing job: win the job, price the job, and get paid fully for the job.",
      }},
    },
    related: ["companycam-alternative-roofing-supplements","roofing-software-comparison","best-roof-estimating-software","roofing-supplement-template"],
    sections: [
      {
        heading: "What does a roofing CRM actually do?",
        content: "A customer relationship management (CRM) system for roofing companies is a centralized platform that tracks every interaction with a homeowner from the first phone call or website inquiry through the completed job and beyond. At its core, a roofing CRM replaces the spreadsheets, sticky notes, and scattered text messages that most growing roofing companies rely on before they invest in software.\n\nThe primary functions of a roofing CRM include:\n\n• Lead management: Capturing incoming leads from phone calls, web forms, canvassing, and referrals, then tracking each lead through your sales pipeline (new lead, appointment set, inspection completed, estimate sent, contract signed, job scheduled, job complete).\n\n• Contact and job records: Maintaining a complete history for each homeowner and job, including contact information, property details, inspection notes, photos, estimates, contracts, invoices, and communication logs.\n\n• Production management: Scheduling crews, tracking job status, managing material orders, and coordinating the workflow from contract signing through final inspection.\n\n• Communication tools: Sending automated text messages and emails to homeowners at each stage of the process (appointment reminders, job status updates, payment requests).\n\n• Reporting and analytics: Tracking key metrics like lead conversion rate, average job value, revenue by salesperson, and pipeline value.\n\nFor roofing companies doing more than a handful of jobs per month, a CRM is essential. Without one, leads fall through the cracks, follow-ups get missed, and the owner spends their evenings trying to remember which jobs need scheduling and which invoices haven't been sent.\n\nBut here is the important distinction that most CRM marketing overlooks: a CRM is designed to manage the customer relationship and the sales process. It helps you win jobs and manage production. It does not help you recover the full revenue from the jobs you've already won. That's a different problem entirely, and it's the one most roofing companies don't realize they have."
      },
      {
        heading: "Top roofing CRM features to evaluate in 2026",
        content: "If you're evaluating roofing CRMs, these are the features that matter most for a roofing-specific workflow. Generic CRMs (HubSpot, Salesforce) can be adapted for roofing, but purpose-built options save significant setup time and include industry-specific functionality.\n\n• Lead capture and pipeline management is the foundation. Your CRM should automatically capture leads from your website, Google Ads, and phone system, then place them into a visual pipeline you can customize to your sales stages. Look for drag-and-drop boards, automatic stage-based follow-up sequences, and the ability to assign leads to specific salespeople by territory.\n• Mobile-first design is non-negotiable. Your sales team lives in the field, not at a desk. The CRM needs a responsive mobile app that lets reps create contacts, schedule appointments, capture inspection photos, generate estimates, and send contracts from their phone or tablet while standing in the homeowner's driveway.\n• Estimating and proposal tools should integrate directly into the CRM. The best roofing CRMs let you build estimates using roof measurements (from EagleView, Hover, or manual input), apply your pricing, and generate a professional proposal that the homeowner can sign electronically on the spot. This eliminates the back-and-forth of emailing PDFs and chasing signatures.\n• Production scheduling should show you which crews are available on which days, allow you to assign jobs, and track progress from material delivery through final inspection. Bonus points if the CRM integrates with material suppliers (ABC Supply, SRS, Beacon) for one-click ordering.\n• Insurance claim tracking is critical if you do storm work. You should be able to track the claim number, adjuster name, adjuster contact information, claim status, and inspection dates alongside the job record.\n• Integrations determine how well your CRM plays with the rest of your tools. At minimum, look for integration with QuickBooks or accounting software, measurement report providers, and your email/calendar. API access is a plus for custom workflows.\n• Reporting must go beyond vanity metrics. You need to see your close rate by lead source, average job value by salesperson, revenue by month, and jobs in each pipeline stage. The best roofing CRMs provide dashboards that give you a real-time view of your business health."
      },
      {
        heading: "Popular roofing CRMs compared: JobNimbus, AccuLynx, Leap, and RoofLink",
        content: "Four platforms dominate the roofing CRM market in 2026. Each has strengths and trade-offs depending on your company size, job volume, and how much of your revenue comes from insurance work.\n\nJobNimbus is the most widely adopted roofing CRM, known for its simplicity and speed of setup. It offers a clean visual pipeline, solid mobile app, built-in estimating, and integrations with EagleView, ABC Supply, and QuickBooks. JobNimbus works well for companies that want a straightforward system without a steep learning curve. It is less specialized for insurance workflows compared to AccuLynx, but covers the core CRM functions reliably. Pricing starts around $200/month and scales with users.\n\nAccuLynx is the strongest option for insurance-focused roofing companies. It was built specifically for storm restoration contractors and includes insurance claim tracking, adjuster management, and aerial measurement integration as core features. AccuLynx also integrates with Xactimate for pulling in adjuster estimates, which is a significant advantage for insurance roofers. The platform is more complex than JobNimbus and has a steeper learning curve, but the insurance-specific features justify the investment if storm work is a significant portion of your revenue. Pricing is typically higher than JobNimbus and is quote-based.\n\nLeap (formerly Job Progress) focuses on the in-home sales experience. Its standout feature is the ability to build interactive presentations and proposals on a tablet during the sales appointment. Leap includes digital contracts, built-in financing options (through partners like GreenSky and Mosaic), and a production management module. It is strongest as a sales tool and may require supplementation with other software for production-heavy operations. Pricing is quote-based and typically mid-range.\n\nRoofLink is a newer entrant focused on connecting the roofing workflow from measurement to production. It integrates with aerial measurement providers and material suppliers, with a focus on streamlining the estimating-to-ordering pipeline. RoofLink is gaining traction with production-oriented companies that want tight integration between their estimate, material order, and crew schedule. It is less mature than JobNimbus or AccuLynx in terms of pipeline management and reporting. Pricing is competitive and scales with usage.\n\nAll four platforms do a solid job of managing leads, tracking jobs, and organizing your sales pipeline. The differences come down to which part of the business each platform optimizes for: AccuLynx for insurance, Leap for sales presentations, RoofLink for production workflow, and JobNimbus for overall simplicity."
      },
      {
        heading: "The gap every roofing CRM ignores: supplement documentation",
        content: "Here is the uncomfortable truth about every roofing CRM on the market: none of them help you document concealed damage during tear-off, generate supplement narratives, map findings to Xactimate line codes, or submit professional supplement reports to insurance adjusters.\n\nThis is not a minor feature gap. It is a revenue gap.\n\nOn a typical insurance roofing job, the adjuster's initial estimate covers visible damage identified during a surface inspection. When your crew tears off the existing roof, they almost always discover additional damage that was concealed beneath the shingles: rotted decking, corroded flashing, missing ice and water shield, cracked pipe boots, additional layers of roofing. This hidden damage is legitimate, it needs to be repaired, and your insurance policy covers it. But recovering that money requires a supplement: a documented request with photos, narratives, and Xactimate line items submitted to the insurance company.\n\nThe average supplement recovery is $1,500 to $3,200 per job. On a company doing 10 insurance roofs per month, that's $15,000 to $32,000 per month in revenue that exists on every job but only gets captured if someone documents the damage properly and submits the paperwork.\n\nYour CRM can tell you which stage the job is in. It can tell you when the crew is scheduled. It can store photos uploaded after the fact. But it cannot guide your crew through damage documentation during active tear-off. It cannot generate professional supplement narratives from field observations. It cannot map a tagged photo of rotted decking to the correct Xactimate line code (RFG SHTHN) with the appropriate quantity and regional pricing. It cannot produce an Xactimate-compatible CSV file the adjuster can import directly into their system.\n\nThis is not a criticism of CRMs. They were designed to manage customer relationships and sales pipelines, and they do that well. Supplement documentation is a fundamentally different workflow that happens at a different point in the job lifecycle (during tear-off, not during sales) and requires different capabilities (damage classification, narrative generation, Xactimate formatting)."
      },
      {
        heading: "The math: what this gap costs your company every year",
        content: "Let's put specific numbers to the CRM supplement gap. These figures are based on industry averages for insurance roofing contractors.\n\nStart with your monthly insurance job volume. A mid-size storm restoration company typically runs 8-12 insurance roofs per month. We'll use 10 as a round number.\n\nOf those 10 jobs, roughly 70-90% will have supplementable concealed damage discovered during tear-off. The most common findings are rotted decking (found on approximately 60% of tear-offs), deteriorated pipe boots (50%), corroded or missing flashing (40%), and missing ice and water shield in code-required areas (35%). Using the conservative end, 8 out of 10 jobs have supplementable damage.\n\nThe average supplement recovery ranges from $1,500 to $3,200 per job. The variation depends on roof age, complexity, regional pricing, and how thoroughly the damage is documented. We'll use $2,100 as a realistic midpoint.\n\nWith proper documentation tools and a systematic process, contractors typically submit supplements on 80-90% of eligible jobs and achieve a 70-85% approval rate. Without tools (relying on the crew to text blurry photos to the office and someone to write up the supplement days later), submission rates drop to 10-20% of eligible jobs, and approval rates fall below 50%.\n\nHere is the annual comparison:\n\n• With supplement tools: 10 jobs/month x 80% eligible x 85% submission x 80% approval x $2,100 = $11,424/month = $137,088/year\n• Without supplement tools: 10 jobs/month x 80% eligible x 15% submission x 45% approval x $2,100 = $1,134/month = $13,608/year\n• Annual revenue difference: $123,480\n\nThat is over $120,000 per year in revenue that exists on jobs you've already won, that your CRM tracked through the pipeline, that your crews completed. The work was done. The damage was real. The insurance policy covered it. The money was there. It just never got documented and submitted.\n\nAnd here's the part that should keep you up at night: your CRM dashboard shows the job as complete and the revenue as collected. There's no field for \"supplement revenue left on the table.\" The gap is invisible unless you're specifically tracking it."
      },
      {
        heading: "Building the complete roofing tech stack for 2026",
        content: "The most profitable roofing companies in 2026 are not relying on a single platform to run their entire business. They're building a tech stack where each tool does one thing exceptionally well, and the tools work together to cover the full job lifecycle.\n\nThe three layers of a complete roofing tech stack are:\n\n• Layer 1: CRM for customer management and sales. This is your JobNimbus, AccuLynx, Leap, or RoofLink. It manages leads, tracks the pipeline, generates estimates, schedules production, and stores job records. This layer covers the journey from first contact through contract signing and job scheduling. Every serious roofing company needs this.\n• Layer 2: Estimating and measurement tools. This includes aerial measurement reports (EagleView, Hover, IMGING) and Xactimate for insurance-priced estimates. Your estimating tools feed accurate measurements and pricing into your CRM proposals. Some CRMs integrate these directly; others require manual data transfer.\n• Layer 3: Supplement documentation and recovery. This is the layer almost every roofing company is missing. A supplement tool captures damage findings during tear-off, generates professional documentation, and produces Xactimate-ready output for insurance submission. This layer covers the period after the crew starts work and discovers hidden damage, the exact phase where your CRM has no workflow.\n\nThe return on investment for each layer is different. Your CRM helps you win more jobs. Your estimating tools help you price jobs accurately. Your supplement tool helps you collect the full revenue on jobs you've already won. Of the three, the supplement tool has the shortest payback period because the revenue it recovers is money you're already owed. One approved supplement pays for months of the software.\n\nThe companies that are growing fastest in the insurance roofing space are the ones that have figured out this three-layer approach. They close jobs with their CRM, price them with their estimating tools, and recover full value with their supplement tools. Each layer amplifies the others."
      },
      {
        heading: "Where Supplement Snap fits in your tech stack",
        content: "Supplement Snap was built to be that missing third layer. It doesn't replace your CRM. It doesn't compete with your estimating tool. It fills the gap that neither of them was designed to address: documenting concealed damage during tear-off and turning those findings into approved insurance supplements.\n\nHere's how it works in practice. Your CRM tracks the job through the pipeline. Your crew shows up on the scheduled date and begins tear-off. When they discover hidden damage (and they will on 70-90% of insurance jobs), they open Supplement Snap on their phone. They tap to capture a photo, select the damage type from a menu (decking, flashing, pipe boot, ice and water shield, drip edge), choose the roof area, and record a voice note describing what they found. The entire process takes about 30 seconds per finding. Voice notes work in any language. Spanish-speaking crews record their descriptions naturally, and the system auto-translates to English.\n\nFrom that field data, Supplement Snap generates everything needed for a professional supplement submission:\n\n• AI-written supplement narratives tailored to each finding, using the language and format insurance adjusters expect\n• Xactimate line items automatically mapped from the damage type, with correct codes, quantities, and current regional pricing\n• An Xactimate-compatible CSV file the adjuster can import directly into their system\n• A branded PDF report with photos, narratives, findings summary, and line item breakdown\n\nThe supplement gets submitted the same day the damage is found. No more photos lost in camera rolls. No more supplements that sit in the office for weeks. No more vague documentation that gets denied.\n\nYour CRM is essential for winning jobs and managing your business. Supplement Snap is essential for getting paid fully on the jobs your CRM helped you win. Together, they ensure that every dollar of revenue you earn actually reaches your bank account.\n\nLooking at estimating tools too? See <a href='/blog/best-roof-estimating-software'>best roof estimating software</a>."
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
    highlight: { label: "Storm Damage Market", value: "$15B+", subtext: "Annual U.S. insurance payouts for storm-related roof damage" },
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
      5: { type: "tip", data: { type: "tip", title: "Pro Tip: Seasonal Storm Preparation", text: "Build your storm response system before storm season hits. Train crews on damage documentation, pre-load your supplement workflow, and establish relationships with adjusters in your area. Contractors who respond within 48 hours of a storm event close 3x more jobs than those who wait a week or more." } },
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
        content: "The insurance claims process for storm damage roof repair follows a predictable sequence, but each stage presents opportunities for contractors who are prepared.\n\nThe process begins when the homeowner files a claim with their insurance carrier after a storm event. The carrier assigns a claim number and schedules an adjuster to inspect the property. As the contractor, your role at this stage is to perform your own inspection, document all visible damage, and provide the homeowner with a professional inspection report they can share with their adjuster.\n\nWhen the adjuster arrives, they inspect the property and write an initial estimate using Xactimate. This estimate covers only the damage visible during their inspection. If you can be present during the adjuster's inspection, do it. Walk the roof with them, point out damage they might miss, and make sure they document every affected component.\n\nThe initial estimate rarely covers the full cost of the repair. Why? Because the adjuster inspects the roof from the surface. They cannot see what is under the shingles. Rotted decking, failed underlayment, corroded flashing, deteriorated pipe boots: these are all concealed by the existing roofing materials and only become visible during tear-off.\n\nThis is where supplements come in. When your crew tears off the existing roof and discovers hidden damage, you document it and submit a supplement to the insurance company requesting additional payment. The supplement includes photos, a written narrative describing the damage, and Xactimate line items with the correct codes and quantities.\n\nA well-documented supplement is almost always approved because the damage is real, verifiable, and was concealed before tear-off. The average supplement on a storm damage job recovers $1,500 to $3,200 in additional revenue."
      },
      {
        heading: "Hidden damage found during tear-off after storms",
        content: "Hidden damage is the single biggest revenue opportunity in storm damage roof repair. Studies consistently show that 70 to 90 percent of storm damage tear-offs reveal damage that was not included in the original insurance estimate. This is not fraud or exaggeration. It is the reality of roofing: you cannot see what is under the shingles until you remove them.\n\nThe most common types of hidden damage found during tear-off include:\n\n• Rotted or deteriorated decking: Plywood or OSB sheathing that has absorbed moisture through damaged shingles. The wood is soft, spongy, or crumbling. This requires full sheet replacement before new roofing materials can be installed.\n\n• Failed or missing underlayment: Roofing felt or synthetic underlayment that has deteriorated, torn, or was never installed properly. Building codes require underlayment, so replacement is mandatory.\n\n• Corroded or damaged step flashing: Step flashing along chimneys and sidewalls that has rusted through, bent, or separated from the wall. Water follows the flashing path, so failed flashing almost always means water damage to the wall sheathing behind it.\n\n• Deteriorated pipe boots: Rubber pipe boot seals that have cracked, split, or pulled away from the pipe. Failed pipe boots are one of the most common leak sources and are almost always concealed beneath the shingle layer.\n\n• Missing or inadequate ice and water shield: In cold climates, building codes require ice and water shield in valleys, at eaves, and around penetrations. Many older roofs were installed before these requirements existed, and replacement is required by current code.\n\n• Additional layers of roofing: Some roofs have a second or even third layer of shingles installed over the original. The additional layer must be removed, and the extra labor and disposal costs should be covered by the insurance claim.\n\nEach of these findings is a legitimate supplement item. The key is documenting them properly at the moment of discovery."
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
    highlight: { label: "Hidden Damage Found", value: "70-90%", subtext: "Of insurance tear-offs reveal damage not in the original estimate" },
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
        title: "Roof Damage Repair Cost Breakdown (Typical 30 SQ Residential Roof)",
        rows: [
          { label: "Shingle replacement (localized, 5 SQ area)", value: "$1,200-$2,000" },
          { label: "Decking replacement (4-8 sheets of plywood)", value: "$700-$1,400" },
          { label: "Flashing repair/replacement (chimney + sidewall)", value: "$400-$800" },
          { label: "Pipe boot replacement (2-4 boots)", value: "$170-$600" },
          { label: "Ice and water shield (valleys + eaves)", value: "$500-$900" },
          { label: "Full tear-off and replacement (30 SQ)", value: "$10,000-$18,000" },
        ],
        total: { label: "Average Supplement Recovery (Hidden Damage)", value: "$1,500-$3,200", color: "green" },
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
        content: "Insurance claims are a critical part of roof damage repair because most significant roof repairs are funded by homeowner's insurance policies. Understanding this process helps you serve your customers better and ensures you get paid for all the work you perform.\n\nThe process typically follows these steps:\n\n• The homeowner discovers or suspects roof damage and files a claim with their insurance carrier. The carrier assigns a claim number and schedules an adjuster.\n\n• The insurance adjuster inspects the property and writes an initial estimate in Xactimate. This estimate covers the damage visible during their inspection.\n\n• The contractor reviews the adjuster's estimate and, if hired, begins the repair or replacement work.\n\n• During tear-off, the crew discovers hidden damage that was not visible during the adjuster's surface inspection. This is extremely common. Industry data shows that 70 to 90 percent of tear-offs reveal damage not included in the original estimate.\n\n• The contractor documents the hidden damage and submits a supplement to the insurance company. The supplement includes photos, a written narrative, and Xactimate line items for the additional work.\n\n• The insurance company reviews the supplement and, if properly documented, approves additional payment to cover the hidden damage repairs.\n\nThe supplement step is where most contractors either thrive or leave significant money on the table. A contractor who documents every hidden finding and submits professional supplements recovers $1,500 to $3,200 more per job than one who skips supplementing or submits weak documentation."
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
    externalLinks: [
      { text: "NRCA: Roof Inspection Guidelines", url: "https://www.nrca.net" },
      { text: "ASTM Roofing Standards", url: "https://www.astm.org" },
    ],
    highlight: { label: "Reports That Get Approved", value: "3x faster", subtext: "When they include tagged photos, narratives, and Xactimate codes" },
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
    ],
  },
  {
    slug: "xactimate-roofing-estimate-approved",
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
    "title": "Roofing Supplement Template: Format, Checklist and Example",
    "metaTitle": "Roofing Supplement Template and Checklist (Free Format)",
    "metaDescription": "A roofing supplement template you can copy: cover page, findings format, narrative wording, line items and a pre-submission checklist adjusters respond to.",
    "publishedDate": "2026-10-22",
    "midCtaAfter": 1,
    "midCtaTitle": "Capture this on the roof, not from memory.",
    "midCtaBody": "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    "related": [
      "how-to-write-a-roofing-supplement",
      "roofing-photo-documentation-checklist",
      "xactimate-codes-for-roofing-supplements",
      "roofing-supplement-denied-what-to-do"
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
    ],
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
    "slug": "companycam-alternative-roofing-supplements",
    "title": "CompanyCam Alternative for Roofing Supplements: How to Choose",
    "metaTitle": "CompanyCam Alternative for Roofers: Supplement Tools",
    "metaDescription": "Comparing photo apps with supplement-focused tools for roofers: what each does well, where gaps appear and how to choose for your crew.",
    "publishedDate": "2026-10-22",
    "related": [
      "roofing-software-comparison",
      "best-roof-estimating-software",
      "roofing-photo-documentation-checklist",
      "best-roofing-crm"
    ],
    "externalLinks": [
      {
        "text": "CompanyCam",
        "url": "https://companycam.com"
      },
      {
        "text": "NRCA Roofing Manual and Standards",
        "url": "https://www.nrca.net"
      }
    ],
    "highlight": {
      "label": "Disclosure",
      "value": "We Make One",
      "subtext": "Supplement Snap is our product. Verify every vendor's current features yourself"
    },
    "visuals": {
      "2": {
        "type": "matrix",
        "data": {
          "headers": [
            "General photo app",
            "Supplement-focused tool"
          ],
          "rows": [
            {
              "feature": "Organizes job photos by project",
              "values": [
                true,
                true
              ]
            },
            {
              "feature": "Built for many trades",
              "values": [
                true,
                false
              ]
            },
            {
              "feature": "Findings tied to roofing damage types",
              "values": [
                "Varies",
                true
              ]
            },
            {
              "feature": "Supplement narrative drafting",
              "values": [
                "Varies",
                true
              ]
            },
            {
              "feature": "Adjuster-ready PDF report",
              "values": [
                "Varies",
                true
              ]
            },
            {
              "feature": "Xactimate-style item export",
              "values": [
                "Varies",
                true
              ]
            }
          ]
        }
      },
      "4": {
        "type": "tip",
        "data": {
          "type": "info",
          "title": "Check features and pricing directly",
          "text": "Products change. Before you decide, confirm each vendor's current features, limits and pricing on their own site and try a real job with each."
        }
      }
    },
    "sections": [
      {
        "heading": "Photo apps and supplement tools solve different problems",
        "content": "General-purpose job photo apps, CompanyCam being a well-known example, are built to help crews in many trades capture, organize and share job photos. Many roofers use them every day, and they do that job well.\n\nSupplement-focused tools start from a different question: how do we turn those photos into a document an insurance adjuster will approve? That adds roofing-specific findings, written narratives, line items and a formatted report.\n\nSo the honest answer to which is better is that it depends on the problem you are trying to solve."
      },
      {
        "heading": "What a roofing company actually needs",
        "content": "Before comparing products, write down your real workflow. Most roofing companies need to do five things:\n\n1. Capture photos on the roof: Fast, with labels, and ideally without typing.\n2. Keep them organized: By job, by slope and by finding.\n3. Describe what was found: A short factual note for each photo.\n4. Turn findings into a supplement: Narratives and line items.\n5. Send something an adjuster accepts: Usually a clean PDF.\n\nA photo app covers the first two well and may help with the third. The last two are where supplement-focused tools focus. Pick the product that closes the gaps you actually have."
      },
      {
        "heading": "How the two types compare",
        "content": "The comparison below is a general guide to categories, not a claim about any single product. Features vary by vendor and change over time, so verify before you decide.\n\nIf your crew already has a photo app they like and your office writes supplements well, you may not need another tool. If supplement paperwork is where jobs slow down or money gets missed, a supplement-focused tool is worth testing."
      },
      {
        "heading": "Questions to ask any vendor",
        "content": "Use the same questions on every product you try:\n\n• How fast can a crew capture a labeled photo from the roof?\n• Does it work with a weak signal, and what happens offline?\n• Can I add a note or voice note to each photo?\n• How does it turn findings into a written supplement?\n• What does the report look like to an adjuster?\n• Can I export items in a format my estimating software accepts?\n• What do users, storage and support cost as I grow?\n• Who owns my photos and can I export them?"
      },
      {
        "heading": "How to run a fair test",
        "content": "Do not decide from a demo. Run a real job through each tool.\n\n1. Pick one active job with hidden damage.\n2. Have the same crew capture the same findings in each tool.\n3. Time how long it takes to get from photos to a sendable package.\n4. Send both packages to a trusted contact and ask which is clearer.\n5. Compare the cost of each at your volume.\n\nThe winner is the one that saves your office time and produces documentation adjusters respond to. For a broader view of tool categories, read our <a href='/blog/roofing-software-comparison'>roofing software comparison</a>, and for what to capture in the field, see the <a href='/blog/roofing-photo-documentation-checklist'>photo documentation checklist</a>."
      }
    ],
    "faq": [
      {
        "q": "Can I use a photo app for roofing supplements?",
        "a": "Yes. Many roofers do, and then write the supplement separately. A supplement-focused tool can reduce that extra work by drafting narratives and reports."
      },
      {
        "q": "What is the difference between a photo app and supplement software?",
        "a": "A photo app organizes job photos for many trades. Supplement software turns roofing findings into narratives, line items and an adjuster-ready report."
      },
      {
        "q": "Do I need both?",
        "a": "Not necessarily. If your photo app and office process already produce approved supplements, you may not. If supplement paperwork is a bottleneck, test a focused tool."
      },
      {
        "q": "How do I choose between tools?",
        "a": "Run a real job through each, time the path from photos to a sendable package and compare what adjusters respond to and what each costs."
      }
    ]
  },
  {
    slug: "document-rotted-roof-decking-tear-off",
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
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["roofing-photo-documentation-checklist", "roofing-supplement-template", "hail-damage-roof-inspection"],
  },
  {
    slug: "organize-roofing-supplement-photos-by-claim",
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
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["roofing-photo-documentation-checklist", "document-rotted-roof-decking-tear-off", "roofing-supplement-template"],
  },
  {
    slug: "supplemental-roofing-estimate-explained",
    title: "What Is a Supplemental Roofing Estimate? When It Applies and What It Includes",
    metaTitle: "What Is a Supplemental Roofing Estimate? | Supplement Snap",
    metaDescription: "A supplemental roofing estimate asks the insurer to cover damage found after the first estimate. Learn when it applies, what it includes, and how to submit one.",
    publishedDate: "2026-10-23",
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
    ],
    midCtaAfter: 1,
    midCtaTitle: "Capture this on the roof, not from memory.",
    midCtaBody: "Supplement Snap lets your crew take photos and voice notes at tear-off and drafts a report you review before sending. Your first project is free.",
    related: ["how-to-write-a-roofing-supplement", "roofing-supplement-template", "roofing-supplement-denied-what-to-do"],
  },
  {
    slug: "xactimate-roofing-estimate-example",
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
    related: ["xactimate-codes-for-roofing-supplements", "xactimate-roofing-software-explained", "roofing-supplement-template", "xactimate-roofing-estimate-approved"],
  },
  {
    slug: "xactimate-roofing-software-explained",
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
    related: ["roof-inspection-report", "roofing-photo-documentation-checklist", "roofing-software-comparison", "xactimate-roofing-software-explained"],
  },
  {
    slug: "roofing-supplement-follow-up-log",
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
    related: ["roofing-supplement-denied-what-to-do", "roofing-supplement-template", "supplemental-roofing-estimate-explained", "roofing-photo-documentation-checklist"],
  },
  {
    slug: "how-insurance-adjusters-determine-roof-damage",
    title: "How Insurance Adjusters Determine Roof Damage (and What Documentation Helps)",
    metaTitle: "How Adjusters Determine Roof Damage | Supplement Snap",
    metaDescription: "How insurance adjusters evaluate roof damage: the inspection, what they look for, how estimates are built and what documentation makes a claim easier to review.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
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
        q: "Does good documentation guarantee a claim is approved?",
        a: "No. Coverage and approval depend on the claim, the policy and the carrier. Good documentation helps the adjuster verify what was found.",
      },
    ],
    related: ["supplemental-roofing-estimate-explained", "hail-damage-roof-inspection", "roofing-photo-documentation-checklist", "roofing-supplement-follow-up-log"],
  },
  {
    slug: "what-is-the-25-percent-rule-for-roofing",
    title: "What Is the 25% Rule for Roofing? It Depends on Where You Are",
    metaTitle: "What Is the 25% Rule for Roofing? | Supplement Snap",
    metaDescription: "The 25% rule for roofing: what it generally means, why it varies by jurisdiction and code edition, and how contractors should handle it on insurance claims.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
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
    ],
    related: ["roofing-code-upgrades-ordinance-and-law", "how-insurance-adjusters-determine-roof-damage", "roofing-supplement-template", "roof-replacement-estimate-vs-final-cost"],
  },
  {
    slug: "roof-damage-report-template",
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
    related: ["roofing-photo-documentation-checklist", "roof-inspection-report", "roofing-supplement-template", "document-rotted-roof-decking-tear-off"],
  },
  {
    slug: "how-roofing-contractors-work-insurance-claims",
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
    related: ["supplemental-roofing-estimate-explained", "how-insurance-adjusters-determine-roof-damage", "roof-damage-report-template", "roofing-supplement-follow-up-log"],
  },
  {
    slug: "hail-damage-roof-insurance-claim-documentation",
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
    related: ["hail-damage-roof-inspection", "how-insurance-adjusters-determine-roof-damage", "roofing-photo-documentation-checklist", "roof-damage-report-template"],
  },
  {
    slug: "wind-damage-roof-insurance-claim-documentation",
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
    related: ["supplemental-roofing-estimate-explained", "roofing-supplement-follow-up-log", "xactimate-roofing-software-explained", "how-roofing-contractors-work-insurance-claims"],
  },
  {
    slug: "best-roofing-supplement-software",
    title: "Best Roofing Supplement Software (2026): Tools, Services and How to Choose",
    metaTitle: "Best Roofing Supplement Software (2026 Comparison)",
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
        content: "Supplement documentation software focuses on the evidence: photos tagged to findings, notes, measurements and a report you can send. Supplement Snap is built for this job. Crews capture and label damage on the roof, drafts of the written descriptions are generated for you to review, and a PDF report can be emailed to the adjuster. Team plans add an Xactimate-ready CSV export, which is a starting list you review and price yourself.\n\nJob photo apps such as CompanyCam organize photos for many trades. They are a good fit if you write the supplement separately. Roofing CRMs and estimating platforms manage leads, jobs and proposals. They solve a wider problem and may cover supplements only lightly, so check how deep their supplement features go.\n\nSee how the two approaches compare in <a href='/blog/companycam-alternative-roofing-supplements'>photo apps vs. supplement tools</a> and in <a href='/blog/roofing-software-comparison'>roofing software for contractors compared</a>.",
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
    related: ["roofing-supplement-companies-vs-software", "xactimate-roofing-software-explained", "roofing-software-comparison", "supplemental-roofing-estimate-explained"],
  },
  {
    slug: "recoverable-depreciation-roof-claims",
    title: "Recoverable Depreciation on a Roof Claim: How It Works and How Contractors Help Get It Paid",
    metaTitle: "Recoverable Depreciation on Roof Claims Explained",
    metaDescription: "ACV vs. RCV, what recoverable depreciation is, when insurers release it and what paperwork a roofing contractor needs to help the homeowner collect it.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "NAIC: Consumer insurance resources", url: "https://content.naic.org" },
      { text: "Insurance Information Institute: Homeowners insurance", url: "https://www.iii.org/article/what-covered-under-standard-homeowners-insurance-policy" },
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
    title: "Does Insurance Cover Roof Replacement? What Contractors Should Tell Homeowners",
    metaTitle: "Does Insurance Cover Roof Replacement? A Contractor Guide",
    metaDescription: "When homeowners insurance may pay for a new roof, when it usually does not, and how contractors can explain coverage without promising an outcome.",
    publishedDate: "2026-10-23",
    updatedDate: "2026-10-23",
    externalLinks: [
      { text: "Insurance Information Institute: What homeowners insurance covers", url: "https://www.iii.org/article/what-covered-under-standard-homeowners-insurance-policy" },
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
    related: ["how-insurance-adjusters-determine-roof-damage", "hail-damage-roof-insurance-claim-documentation", "roof-leak-insurance-claim-contractor-guide", "what-is-the-25-percent-rule-for-roofing"],
  },
  {
    slug: "roof-inspection-checklist",
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
    related: ["roof-inspection-report", "hail-damage-roof-inspection", "roof-damage-report-template", "document-rotted-roof-decking-tear-off"],
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
