# Insurance Estimate Gap Detector: architecture findings and staged plan

Status: planning document plus Stage 1 (comparison engine). Nothing here is deployed, billed or applied to a database.

## 1. What the application already has (inspected, not assumed)

| Area | What exists | Reusable for this feature? |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript, Tailwind, Vercel | Yes |
| Auth | Supabase Auth. Browser uses the anon key and a session. Every private API route calls `getAuthenticatedUser` (`lib/auth-utils.ts`) and ignores any user id sent by the client. | Yes, the same pattern |
| Ownership model | `projects.user_id = auth.uid()`; `captures` belong to a project; team members get read-only access through `team_members` | Yes. A comparison project should be owned the same way |
| Database | Row Level Security on every table. Owner-only policies. Plan limits enforced by triggers (v7 to v9). | Pattern yes; new tables are needed |
| Storage | One PUBLIC bucket, `test-uploads`, with photo URLs stored in the database. | **No.** Insurance estimates are sensitive, so they need a new PRIVATE bucket and signed URLs |
| PDF output | `jspdf` creates PDFs in the browser; `docx` creates Word files | Yes for a report |
| PDF reading | **Nothing.** No PDF text-extraction library is installed. | A new dependency is needed (decision below) |
| AI | Anthropic SDK, model `claude-sonnet-5-5`, used for drafts and translation behind login, plan and rate limits | Optional. The engine does not need it |
| Plans | `lib/plan.ts`: `free, starter, team, pro`. `can.*` helpers gate features server-side. `planFromPriceId` maps Stripe price ids from env vars. | Pattern yes |
| Tests | Vitest, 235+ tests, with route tests that mock auth, plan and email | Yes |

Duplicate work avoided: there is no existing comparison, estimate parsing or private document storage to duplicate.

## 2. Design principles (from the brief)

1. Facts, observations and uncertainty are kept apart. Every finding has one of five categories:
   `verified_arithmetic`, `observed_difference`, `scope_review`, `needs_confirmation`, `not_extracted`.
2. Money and quantities are whole numbers (ten-thousandths of a dollar, thousandths of a unit). No floating point and no language model does arithmetic.
3. Two rows are treated as the same item only when their code matches, or their wording is very close **and** units are comparable **and** no scope word (install only, remove and replace, detach and reset ...) or size/number in the description disagrees. Otherwise it is an "uncertain match" the user must confirm. No difference is asserted for an unconfirmed pair.
4. Every finding carries the exact source rows and page numbers. The engine never edits or invents text, prices, quantities, codes or page references.
5. A row missing from one estimate is reported as scope to review, never as money owed. Nothing guarantees approval, payment or recovery.
6. If a document has no readable text, the comparison is refused and says why. Partial documents are compared, with the gaps listed.

## 3. Stages

| Stage | Contents | Risk | Status |
|---|---|---|---|
| 1 | Pure comparison engine in `lib/estimate-gap/` with 27 tests on synthetic data | None (no database, storage, billing or UI) | **Done** |
| 2 | PDF text extraction (needs a dependency decision) and a private storage bucket | Medium: new dependency, new bucket, migration | Needs approval |
| 3 | Database tables for comparisons, documents, extracted rows, corrections and findings, with owner-only RLS | Medium: migration | Needs approval |
| 4 | Dashboard workflow: upload both files, progress, review and correct rows, confirm matches, view findings with page references | Medium: new UI, kept isolated from the roofing workflow | After 2 and 3 |
| 5 | Report export (PDF) from confirmed findings only | Low once 1 to 4 work | After 4 |
| 6 | Entitlement and Stripe changes for a higher tier | High: billing | Needs approval, kept separate |

### Stage 2 decisions needed
- **Extraction library.** Options: `pdfjs-dist` (maintained by Mozilla, runs in the browser or Node, reads text with page numbers) is the leading option. Reading in the browser means the document never needs to be sent to a third party for text extraction. A scanned PDF has no text layer; reading it would need OCR or a vision model, which is **not** part of the first version. Scanned files are refused with a clear message.
- **Limits.** Suggested defaults for the first version: PDF only, 15 MB per file, 60 pages per file. These are proposals, not requirements already in the product.

### Stage 3 proposed data model (NOT created; for review)
All tables keyed to `auth.users(id)`, RLS owner-only, no public policies.
- `estimate_comparisons(id, user_id, title, created_at)`
- `estimate_documents(id, comparison_id, user_id, role insurer|contractor, storage_path, original_name, page_count, status, error, created_at)`
- `estimate_lines(id, document_id, user_id, page, raw, code, description, quantity_milli, unit, unit_price_tt, total_tt, confidence, issues jsonb, corrected_by_user)`
- `estimate_match_decisions(comparison_id, user_id, insurer_line_id, contractor_line_id, decision confirmed|rejected)`
- Findings are recomputed from lines and decisions each time (the engine is deterministic), so they need not be stored. A saved report snapshot can be stored later.
- Private bucket `estimate-documents`: object path `<user_id>/<comparison_id>/<uuid>.pdf`; policies restrict read, insert and delete to `(storage.foldername(name))[1] = auth.uid()::text`; no public access; access by short-lived signed URL (suggest 5 minutes) created by a server route that first checks ownership.

### Security requirements for stages 2 to 4
- Server route for every read or write; user id taken from the verified token, never from the request.
- File type checked by content (PDF header), not only the name; size and page limits enforced server-side.
- Original file kept untouched; extracted rows stored separately, with corrections marked as such.
- Logs must not contain document text or amounts.

## 4. Pricing and the proposed $249 "Enterprise" plan

### What exists today
| Plan | Price | Entitlements in code (`lib/plan.ts`) |
|---|---|---|
| Free | $0 | Demo project plus 1 project, 3 captures per project |
| Starter | $99 | Unlimited projects, 1 user, email reports |
| Team | $199 | Up to 3 users, Xactimate-style CSV export, email open tracking |
| Pro | $299 | Up to 5 users, custom branding, priority email replies |

### The proposal and the conflict that needs your decision
The request lists Starter $99, Team $199 and Enterprise $249. The product **already has a Pro plan at $299**. A $249 plan would sit between Team and Pro, and would be cheaper than Pro while adding a premium feature. These cannot all be true at once, so one of these must be chosen before any billing work:
1. **Enterprise replaces Pro** (customers on Pro would need a defined path; a price drop from $299 to $249 for a bigger feature set).
2. **Enterprise is a new tier between Team and Pro.** Then Pro should include the detector as well, otherwise Pro (more expensive) would have less.
3. **The detector is added to Pro** and no new tier is created.
4. **Enterprise is priced above Pro** (the $249 figure changes).

Also undecided, and not to be invented: seat count, how many comparisons or pages per month, whether Enterprise includes Team/Pro features such as branding and tracking, and whether it has a free trial. The pricing page currently promises a 14-day trial with a card at checkout; whether that applies to a new tier is a Stripe configuration decision.

### Code and Stripe changes a new tier would require (none made)
- `lib/plan.ts`: add the plan to the `Plan` type; **`normPlan` currently turns any unknown plan name into `starter`, so an enterprise customer would silently be treated as Starter until it is added**; add `can.estimateGap`; add to `MAX_INVITES`; `planFromPriceId` and a new env var for its price id.
- `app/api/create-checkout-session/route.ts`: map the new plan name to its price id.
- Stripe: create the product and price in the dashboard (not done, requires approval). Webhook plan mapping follows `planFromPriceId`.
- `app/pricing/page.tsx`, homepage structured data, account page: show the tier only after the detector exists and has passed testing.
- Tests: `plan.test.ts` entitlements, webhook plan mapping.

### Current status of the $249 tier
**Proposed only.** No Stripe price was created, nothing is advertised, no entitlement was added, no customer can buy it. The detector must not be shown on the pricing page until Stages 2 to 5 are built and tested.

## 5. Limits to state to users from day one
- Works on text-based PDFs in a recognizable row layout (description, quantity, unit, amounts). Scans and unusual layouts are refused or partly read, and the gaps are listed.
- Rows with several amount columns (tax, overhead and profit, depreciation) are compared on quantity and unit price; their totals are not read.
- Matching is conservative; uncertain pairs need confirmation.
- Results are observations for professional review, not a coverage determination.

## 6. Billing code status (added with the billing review)

Implemented in code, with no Stripe or database change:
- `enterprise` is a recognized plan everywhere plan names are read (`lib/plan.ts`, account and dashboard labels, team seat message, webhook, checkout).
- `GAP_DETECTOR_READY` in `lib/plan.ts` is `false`. While it is false, `isPlanPurchasable("enterprise")` is false, checkout refuses the plan ("not available yet") even if `STRIPE_PRICE_ENTERPRISE_MONTHLY` exists, and `can.estimateGap` is false for everyone.
- Placeholders that need your decision: Enterprise gets Team's features (Xactimate export, open tracking) so it never has less than a cheaper plan; its seat count is set equal to Team's (`MAX_INVITES.enterprise = 2`); it has no branding and no usage limits.
- The pricing page shows Enterprise as "Planned, not available yet" at the intended $249, with no checkout button and no feature promises beyond a plain description. The Pro plan ($299) is untouched.

To turn Enterprise on later (all required): finish Stages 2 to 5, test on real documents, create the Stripe price, set `STRIPE_PRICE_ENTERPRISE_MONTHLY` in Vercel, flip `GAP_DETECTOR_READY` to `true`, and replace the "planned" panel with a real card and checkout button.

## 7. Status update (development build, switched off)

Built since the first plan, all behind the off switch `GAP_DETECTOR_READY = false`:
- Stage 2 (reading): `lib/estimate-gap/extract.ts` reads text-based PDFs in memory with `pdfjs-dist`. Nothing is stored, so no private bucket and no migration were needed for this version.
- Stage 4 (screens): `/dashboard/estimate-gap` (not linked anywhere) with upload, review and correction, match confirmation, findings with evidence, and report download.
- Stage 5 (report): `lib/estimate-gap/report.ts`.
- Server routes: `/api/estimate-gap/status`, `/extract`, `/compare`, each checking login and entitlement before reading anything.
Not built: Stage 3 (saving comparisons in the database), scanned-PDF reading, and any testing on real estimates. Hosting limit: requests are capped at about 4.5 MB by the host, so each PDF is limited to 4 MB and is sent one at a time.
