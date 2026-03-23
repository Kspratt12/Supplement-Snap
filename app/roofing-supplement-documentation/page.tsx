import type { Metadata } from "next"
import Link from "next/link"
import { NavLinks } from "../../lib/nav-links"
import { SiteFooter } from "../../lib/site-footer"

export const metadata: Metadata = {
  title: "Roofing Supplement Documentation | Supplement Snap",
  description:
    "What documentation do insurance adjusters need for roofing supplements? Photos, damage descriptions, locations, and supporting notes, captured during tear-off.",
}

export default function SupplementDocumentationPage() {
  return (
    <div className="bg-white text-zinc-900">
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Roofing Supplement Documentation
        </h1>

        <p className="mt-6 text-base leading-relaxed text-zinc-600">
          Insurance adjusters approve supplements based on the quality of the documentation they receive. A supplement request without clear evidence is likely to be denied or delayed. Understanding what adjusters expect, and capturing it during tear-off, is the key to getting supplements approved.
        </p>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">What documentation adjusters expect</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Clear photos</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Close-up photos of the exposed damage taken during tear-off. Photos should clearly show the type and extent of damage. Multiple angles help. Adjusters rely heavily on photographic evidence.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Written damage descriptions</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              A professional, factual description of each finding. Explain what was discovered, the type of damage, and that it was concealed beneath existing materials. Avoid subjective or exaggerated language.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Location of damage</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Specify exactly where on the roof the damage was found: front slope, back slope, valley, chimney, eave edge, hip, or ridge. Adjusters need to understand the scope and location of each finding.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Supporting notes</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Additional context from the field crew: severity of damage, measurements if available, and any relevant observations. These notes add credibility and help the adjuster understand the full picture.
            </p>
          </div>
        </div>

        <h2 className="mt-12 text-xl font-bold text-zinc-900">How crews can capture this during tear-off</h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          The best documentation is captured the moment damage is exposed. During tear-off, crews should photograph each finding, note the damage type and roof area, and add a brief field note describing what they see. This information needs to be organized by project so the office can generate a clean supplement report without chasing down scattered photos and text messages.
        </p>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Mobile-friendly tools allow crews to do this from the roof without slowing down the job. The goal is to make documentation part of the tear-off workflow, not an afterthought.
        </p>

        <div className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h2 className="text-xl font-bold text-zinc-900">Capture supplement documentation from the field</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
            Supplement Snap makes it easy for crews to document hidden damage during tear-off. Photos, notes, and AI-generated supplement narratives, all saved by project.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup" className="w-full rounded-lg bg-indigo-600 px-7 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="w-full rounded-lg border border-zinc-300 bg-white px-7 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto">
              View Pricing
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
