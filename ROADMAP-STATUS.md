# Supplement Snap: roadmap status (2026-11-19)

Nothing here is deployed, merged or applied to the live database. All testing used made-up data, an in-memory database
and mocked Supabase/AI/email. No live service was called.

## Branches

| Branch | State | What it holds |
|---|---|---|
| `supplement-letter-generator` | Committed, **push blocked** (GitHub sign-in needed on this laptop) | Free letter/email generator page (approved to push) |
| `evidence-integrity` | Committed locally, not pushed (needs separate approval) | Capture-to-report fixes, mark-up, shot tags, provenance labels, migration v16 features |
| `security-v13`, `support-draft` (remote) | Untouched drafts from before | Left as they were |

## What changed for customers (evidence-integrity)

1. **No half-saved findings.** If any photo will not upload, the finding is no longer saved with that photo silently
   dropped. The photos that did upload are removed again and the whole finding (all original photos, note, tags) is kept
   on the phone and retried. The same happens when the connection drops during the save. A refusal (for example a deleted
   project) keeps everything in the form. If the phone cannot store the finding either, the form is no longer cleared.
2. **Honest save messages:** "Saved to your account" versus "Saved on this device only, not to your account yet".
3. **Findings waiting on the phone stay visible** after a refresh or reopen, marked waiting/uploading/failed. They have
   no server actions and are **never put in the report, PDF, CSV or email**; the report says how many were left out.
4. Waiting findings retry every minute while online, not only on a "back online" event (retry cap unchanged).
5. A finding saved offline keeps the time it was saved on the phone as its recorded date (ignored if the clock is in the future).
6. **Photo details no longer drift to the wrong photo** (they did after a partial upload or adding photos to an older finding).
7. **Provenance:** the PDF labels camera data "From the photo file" and explains that it comes from EXIF and is not verified.
8. **Optional Wide / Close-up tag** per photo with a non-blocking hint; shown in the report and PDF.
9. **Mark-up fixed on phones** (finishing a circle or arrow threw an error), drawn at full resolution, button visible on
   touch screens, and the marked-up copy is added to the finding as an extra photo. The original is never changed.
10. A single AI draft that fails to save now says so.
11. Report review line: how many findings have no photo or no explanation (sending is still allowed).
12. **Needs migration v16** (controls stay hidden until it runs): report reordering, numbered roof-diagram pins drawn on the
    PDF diagram, and requested/approved amounts plus a follow-up date with a Due marker (user-entered, in-app only, no email).

## Roadmap status

| # | Item | Status | Why |
|---|---|---|---|
| 1 | Offline audio queue | **Deferred** | Voice notes use the browser's speech service, which needs a connection. Queuing recordings for later transcription needs a paid transcription provider (new service and cost) and an audio-capable storage rule, and the privacy policy says audio is not stored. Needs your decision on provider, cost and policy wording. |
| 2 | Capture provenance | **Done (labeling)** | Camera data attributed to the photo file, device save time kept for offline findings. No new location prompt was added. |
| 3 | Wide-to-detail guidance | **Done** | Optional tags and hint, never blocking |
| 4 | Photo mark-up | **Done** | See 9 above |
| 5 | Roof-diagram pins | **Built, needs v16** | |
| 6 | Discontinued shingle / ITEL | **Blocked** | No licensed data source or API access. Nothing was invented. |
| 7 | Reviewed, evidence-linked report | **Partial** | Review summary, missing-photo/explanation flags, labels, ordering (v16). The report already matched the PDF. |
| 8 | Xactimate codes / ESX | **Blocked** | Codes and ESX need licensed data/format access. The CSV still leaves codes blank and says it is not import-tested. |
| 9 | Code / manufacturer references | **Deferred** | Needs verified sources per item; not generated |
| 10 | Carrier-estimate comparison | **Exists, off** | The Gap Detector is built behind `GAP_DETECTOR_READY=false`; needs real authorized estimates to validate |
| 11 | Follow-up and amount tracking | **Built, needs v16** | Reuses the existing manual claim status |
| 12-13 | Shared crew/office workspaces, subcontractor uploads | **Waiting on your decision** | Conflicts with the earlier "no shared capture across logins" rule |
| 14 | JobNimbus / AccuLynx / CompanyCam / Roofr | **Blocked** | Needs approved API access and accounts |
| 15 | Pricing proposal | **Proposal only** (below) | No prices or entitlements changed |
| 16 | Sample report / customer proof | **Unchanged** | The labeled fictional sample stays; no real customer proof exists yet |

## Pricing proposal (no change made)

Measure the funnel first (visits, signups, first project, first PDF, paid). If people stall before paying:
- **Annual option** at about two months free on Starter and Team. Lowest risk; one new Stripe price per plan.
- **Seasonal pause** (keep data, stop billing for up to 3 months) suits roofers' storm seasons and reduces cancellations.
- A cheaper capped tier needs usage counting the app does not have; only consider it if price is shown to be the barrier.

## Release / rollback checklist

Letter generator (`supplement-letter-generator`):
1. Sign in to GitHub on this laptop, push, open the PR, check the Vercel preview page on a phone, merge.
2. Rollback: Vercel, Deployments, promote the previous deployment. No database change.

Evidence integrity (`evidence-integrity`), after your approval:
1. Push and open a PR. Preview has no settings, so test on a practice copy with real logins, per `PREVIEW-TEST-PLAN.md`.
2. On a real phone: airplane mode save, reconnect and check it uploads once; one photo failing (weak signal) keeps the
   whole finding; refresh shows waiting findings; mark-up a photo with a finger and add it to the finding; PDF photo lines.
3. Merge. Rollback is a Vercel promote; no database change is needed for this part.
4. Separately, when ready: run `supabase-migration-v16-...sql` on the practice copy, check reorder/pins/tracking, then on
   live. Undo statements are in the file; the controls hide again on their own after an undo.

## Not verified

- Real phones and browsers (camera, IndexedDB eviction, iOS Safari storage limits, finger drawing), real Supabase storage
  and row security, and the Vercel build environment. Browser storage can be cleared by the phone or the user; a finding
  on the device only is safe until it uploads, not forever.
- Dependency advisories reported by `npm audit` (not changed): next 16.4.2 (moderate, affects `'use cache'`, which the app
  does not use; 16.4.6 fixes it), pdfjs-dist (high, used only by the switched-off Gap Detector; fix is a major upgrade),
  zod (indirect). The Next.js build stops once with an upgrade notice; re-running continues.
