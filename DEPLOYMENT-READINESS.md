# Supplement Snap: launch readiness report

## LATEST UPDATE (launch plan): READY FOR DEPLOYMENT REVIEW, not yet ready to launch

**What changed since the sections below were written**
- The live security migration (v10) was applied by the owner. The live storage rules now show exactly the four expected rules, and the public can no longer call the plan-check function (confirmed from outside).
- The live website still runs PR #49. None of the new code is live. The live checkout still accepts a made-up plan name (confirmed); the new code rejects it.
- Pricing structure decided by the owner: Starter $99, Team $199, Pro $299, Enterprise intended $399 (top plan). The code now treats Enterprise as the top plan (everything Pro has). Enterprise still cannot be bought and the pricing page shows it only as "Planned, not available yet" at $399. No Stripe change was made.
- Existing Enterprise product and price supplied by the owner (`prod_VWuel...p09`, `price_1UVqpS...`): **NOT VERIFIED.** The one method that could check them (reading the live Stripe key onto this computer) was blocked, correctly. Their mode, amount and interval must be checked by the owner in the Stripe dashboard (see actions below). The website will not use that price until the Gap Detector is approved.
- Vercel (read-only look): Production has all the settings the code needs, except `FEEDBACK_TO_EMAIL` and `WAITLIST_NOTIFY_EMAIL`. Without them the in-app feedback box answers "Feedback is not available right now", and the waitlist form errors. Preview has **no** settings, so a Preview deployment would build but could not be logged into. Because of that, a separate practice database is not the shortest path (see plan below).
- Gap Detector: tested on a more realistic estimate layout. Fixed wrapped descriptions and "sheets"/"each" units, and added a control to pair rows that the two estimates word differently. **Limits that remain:** rows worded very differently are not matched automatically (so they show as one-sided until paired by hand); scanned PDFs are not supported; rows with tax and overhead columns are compared on quantity and unit price only. Still switched off. Not validated on real estimates.
- Checks today: 351 tests pass, `tsc` clean, lint 0 errors, build passes, 62 browser checks pass (stand-in backend), 105-page SEO crawl has 0 issues.

**Shortest safe path to launch (Starter, Team, Pro; Enterprise and the Gap Detector stay off)**
1. Owner checks Stripe (read-only look, 5 minutes).
2. Owner approves the commit groups; I commit locally.
3. Owner approves pushing a branch and clicking Merge on GitHub. Vercel then deploys to the live site.
4. Immediately after deploy, I run the public checks; the owner runs the 3 app checks plus one real purchase with their own card, then refunds it.
5. Rollback if anything is wrong: Vercel, Deployments, previous deployment, Promote. No database change is involved.

---

Updated 2026-10-29. Nothing here was deployed, committed, pushed, or applied to the live database or live Stripe.

## Conclusion: NOT READY

The code is in much better shape and every automated check passes, but three required things are still unverified because they need a practice (staging) copy with real logins and Stripe's practice mode. Those cannot be done from this computer. The exact steps are in `PREVIEW-TEST-PLAN.md`.

| Blocker | Why it blocks | What clears it |
|---|---|---|
| 1. No test with real logins and a second account | Account-to-account isolation has been proven only against the database rules in a simulated database, not the real Supabase login service, real storage or the real website | Part 2, tests 1 to 8 of `PREVIEW-TEST-PLAN.md` |
| 2. Stripe has never been tested end to end | Checkout, the webhook, cancellation and failed payments are tested only against mocks. Live Stripe prices are unverified | Part 1B and tests 14 to 20, in Stripe **test mode** |
| 3. A large pile of uncommitted work | About 60 changed and new files sit on one branch that matches the live site, so nothing is reviewed or can be rolled back piece by piece | Your approval to split it into commits and open a preview deployment |

---

## 1. What I fixed this round

1. **Security fix for photos and the paid-plan check, now tested.** I built a throwaway in-memory database, ran your real migration files on it, and tested what different users can do. That found a flaw in my own earlier fix: as written, owners could not delete even their own photos. The corrected migration (`supabase-migration-v10-storage-and-function-hardening.sql`) now:
   - lets people replace or delete **only their own** files,
   - adds a 15 MB and photo/PDF-only limit for new uploads,
   - closes the public paid-plan check.
   It is still **not applied** anywhere. It is safe to run on a practice database first.
2. **Insurance Estimate Gap Detector built in development, switched off.** Upload, PDF reading, comparison, review and correction screens, evidence with page numbers, uncertain-match confirmation, and a downloadable report now exist (details in section 4). The master switch `GAP_DETECTOR_READY` is **off**, so no one can use it, including an Enterprise account.
3. **16 lint errors earlier; now 0.** (18 harmless warnings remain.)
4. **Billing hardening** from the previous round is included (replayed or late Stripe events cannot switch plans on or off; no accidental double subscriptions; Enterprise cannot be bought).
5. **Two new dependencies** were added: `pdfjs-dist` (reads PDF text; production) and `@electric-sql/pglite` (the in-memory test database; development only). Both are pinned.

## 2. What I tested and the results

| Test | Result | Evidence |
|---|---|---|
| TypeScript, lint, production build | PASS | `tsc` clean, 0 lint errors, build compiles |
| Automated tests | PASS | 345 tests in 26 files |
| **Database rules** (new): public cannot read or write; user A cannot read, change, delete or plant anything in user B's projects, captures or records; nobody can give themselves a paid plan; team members are read-only and only when active; free-plan limits hold; trigger still works after the security fix | PASS (simulated database) | 30 tests running your real migration files |
| **Photo storage rules** (new) | PASS, with a finding | With only the rules in the migration files, other users cannot touch your photos, but the owner cannot delete their own either (so the app's cleanup quietly does nothing). If the **live** database also has a broad "signed-in users can read" rule, any user could replace or delete anyone's photo. I cannot see the live rules; the query in `PREVIEW-TEST-PLAN.md` (test 23) tells us |
| Paid-plan check function | PASS after fix | Public can call it today (verified live). After the fix, public and signed-in users cannot; the app's server and the free-plan triggers still work |
| API routes without a login | PASS | Local calls plus live spot checks all refused |
| Gap Detector: reading real PDFs | PASS (synthetic) | 10 tests with generated PDFs: normal, multi-page, scanned/blank, password-protected, damaged, not a PDF, too large, too many pages |
| Gap Detector: server routes | PASS | 14 tests: refused when not signed in, refused for Starter, Team, Pro and inactive plans, refused for **everyone while the switch is off**, refused when rate-limited, bad files and malformed data rejected |
| Gap Detector: comparison engine | PASS (synthetic) | 29 tests, including 20,000 random checks against an independent calculation |
| Gap Detector: report | PASS | 7 tests: the downloaded PDF is read back and contains the findings, page numbers, disclaimers and any hand corrections |
| Gap Detector: screens in a real browser | PASS | 22 checks on a phone-size screen with the real engine and real PDFs: bad files refused, results shown, uncertain match confirmed, row corrected, report downloaded |
| Gap Detector on the **production server build** | PASS | A temporary build with the switch on read a real PDF through the real route, refused a missing login, a non-PDF and a locked PDF, and logged no document text. The switch was set back to off afterward |
| Screens with a stand-in backend | PASS | Earlier 40 checks still pass |
| SEO crawl, structured data, robots | PASS | Last full crawl: 105 pages, 0 issues |
| Real sign-up, login, uploads, AI drafts, report email | **BLOCKED** | Needs the practice copy |
| Two-account isolation on the real service | **BLOCKED** | Needs two real test logins |
| Stripe checkout, webhook, portal, failed payment in test mode | **BLOCKED** | No Stripe keys on this computer |
| Real phone testing | **BLOCKED** | Needs a phone |

## 3. Remaining security risks
- **Public photo bucket:** anyone holding a photo address can see it. Addresses are random and listing is blocked, but a leaked link is open. Making photos private would be a larger change (signed links); not done.
- **The live storage rules are unknown to me.** The migration fix is correct either way, but run the check query (test 23) in the live project.
- **Live today:** the paid-plan check function can be called by the public (fixed only by applying the migration).
- **Team access by email:** signups are auto-confirmed, so someone could register an invited person's email first and see the owner's projects (read-only). Fix: turn on email confirmation (slower signup for roofers).
- **Weak rate limiting** (it resets between servers), **no Content-Security-Policy**, and one low-risk audit warning in a library the app does not call.
- **Gap Detector files:** processed in memory only and never saved, so there is nothing stored to leak. When saving comparisons is added later it needs a private bucket and its own migration.

## 4. The Gap Detector: exactly what exists

| Part | Status |
|---|---|
| Comparison engine, deterministic, evidence-based | Built, tested on synthetic data |
| PDF text reading with page references | Built; tested on synthetic PDFs and on the production server build |
| Secure upload | Built: signed-in and entitled users only; checked **before** the file is read; PDF check by file contents, not name; 4 MB and 60-page limits; nothing saved; no text logged |
| Review and correction screens | Built; row corrections and match confirmations update the findings |
| Findings with five separate labels (verified arithmetic, observed difference, scope review, needs confirmation, not read) | Built |
| Report download | Built, tested by reading the PDF back |
| Saving comparisons for later | **Not built** (would need database tables) |
| Scanned (image-only) PDFs | **Not supported.** They are refused or reported as unreadable; no image reading |
| Accuracy on real insurance estimates | **Unknown.** Only made-up documents have been used. Real layouts (extra columns, grouped sections, wrapped descriptions) will need parser work |
| Server access rule | Closed: `GAP_DETECTOR_READY = false`. The page exists at `/dashboard/estimate-gap` but is not linked anywhere and says "Not available yet" to everyone |

**Is it ready for customers? No.** It is a working preview. Before anyone pays for it: test on several real (authorized) estimates from your own jobs, fix the parsing gaps that appear, decide the limits and price, have the practice-copy tests pass, then switch it on for a small private group first.

## 5. Pricing and Stripe

| Plan | Price in code and on the page | Status |
|---|---|---|
| Starter | $99/month, 14-day trial (set in code) | In code and on the pricing page. Live Stripe price **unverified** |
| Team | $199/month | Same |
| Pro | $299/month | Same. **Not in your intended list** |
| Enterprise | Intended $249/month | Recognized in code, **cannot be bought** (blocked by the switch, even if a Stripe price existed). The pricing page shows "Planned, not available yet". **No $249 Stripe price exists as far as I can verify, and none should be created yet** |

### The Pro versus Enterprise question, and my recommendation
Your intended structure is three plans: Starter $99, Team $199, Enterprise $249. The product also sells Pro at $299, so a $249 Enterprise would cost **less** than Pro. Options:
1. **Recommended, when the detector is ready: fold Pro into Enterprise.** Enterprise (= Team + Pro's extras: 5 users, branding, priority email replies + the detector) at $249. Close Pro to new sign-ups. Move current Pro customers to Enterprise at the lower price so nobody pays more. Result: your three tiers, no price inversion. Cost: the top tier earns $50 less per customer, so confirm the price with real customer evidence first.
2. Keep four tiers and price Enterprise **above** Pro (the $249 figure would change).
3. Add the detector to Pro at $299 and do not create Enterprise.
Until you choose and the detector is ready, **change nothing in Stripe**. Seat count, usage limits, and which Pro extras Enterprise gets are not decided; the code uses Team's seats as a placeholder.

### Evidence needed before trusting the $249 price
Customers asking for the feature unprompted; several authorized real estimates compared with results you can check by hand; people repeating use month after month; how much time or money a comparison saves; what a comparison costs you to run (very low today, because nothing is stored and no AI is used); and willingness to pay, for example 5 to 10 existing customers saying yes to a trial at that price.

### Billing behavior that is now covered by tests (mocked Stripe)
Signature required; repeated events ignored; late events cannot reactivate a cancelled plan; non-subscription invoices ignored; trial, past-due (still works while Stripe retries), unpaid and cancelled handled; no second subscription; unknown plan names become Starter, never higher.
**Not yet done against real Stripe:** all of it. See tests 14 to 20.

## 6. Environment variables needed in Vercel Production (names only)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_TEAM_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`; optional: `ADMIN_REAUTH_HOURS`, `WAITLIST_NOTIFY_EMAIL`, `FEEDBACK_TO_EMAIL`. **Leave `STRIPE_PRICE_ENTERPRISE_MONTHLY` unset.** I cannot see Vercel, so whether each is set is unverified.

## 7. Migrations
| File | State | Risk |
|---|---|---|
| v0 to v9 | Applied to live per your statements (unverifiable from here) | None new |
| v10 section 1 (own-files-only replace/delete, plus each person can read their own file records) | Proposed, **tested in a simulated database**, not applied | A team member deleting a capture the owner uploaded will no longer remove the file (the capture still deletes) |
| v10 section 2 (15 MB, photo/PDF-only for new uploads) | Proposed, not applied | Enforcement happens in Supabase's storage service, which my test database does not have, so test it on the practice copy. Check existing file types first with the query in the file |
| v10 section 3 (close the plan-check function) | Proposed, tested in a simulated database | Low |
v10 removes two old storage rules and replaces them (it does not delete tables, columns, buckets or data) and includes undo statements.

## 8. Exact next steps
1. **You:** approve making commits, and tell me when. I will split the work into reviewable groups (navigation, security, billing, lint fixes, blog accuracy, Gap Detector with its off switch, tests and docs) and open a preview deployment.
2. **You:** follow Part 1 of `PREVIEW-TEST-PLAN.md` to create the practice database, Stripe test mode and preview settings, then give me the preview address and two test emails.
3. **Me:** run the checklist, fix anything that fails, update this report.
4. **You:** run the query in test 23 on the live database and send me the result.
5. **You:** decide the Pro and Enterprise structure, and whether to turn on email confirmation.
6. If everything passes: apply v10 to live (I guide the clicks), merge to production, then run the post-deploy checks (pricing page, login, a project, a report, the Stripe webhook, and a public-key database probe).
7. Gap Detector: gather real sample estimates, improve the reader, then a private trial before switching it on.

**Rollback:** in Vercel, promote the previous deployment (instant). Database changes in v10 have undo statements. No Stripe settings change in this release.
