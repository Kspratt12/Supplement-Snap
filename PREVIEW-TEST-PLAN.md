# Preview test plan (plain English)

Goal: test SupplementSnap with real logins, real uploads and Stripe's practice mode, without touching your live customers or live money.

Everything below is done in a **separate practice copy**, never on supplementsnap.io. You do not write any code. Where something needs a click in a dashboard only you can open, the exact steps are given. I (Claude) can run all of the checking once the practice copy exists, and I only need you to give me its address and test logins. Never paste real keys or passwords into a chat; read the "Sharing safely" note at the end.

---

## Part 1. Build the practice copy (about 30 minutes, one time)

### 1A. A practice database (Supabase)
1. Sign in at supabase.com. Click **New project**. Name it `supplement-snap-staging`. Pick any region. Save the database password somewhere private.
2. When it is ready, open **SQL Editor**. For each file below, in this order: open the file from the project folder, copy everything, paste it into the SQL Editor, press **Run**. Wait for "Success" before the next one.
   1. `supabase-migration-v0-baseline.sql`
   2. `supabase-migration.sql`
   3. `supabase-migration-v2.sql`
   4. `supabase-migration-v3.sql`
   5. `supabase-migration-v4-rls.sql`
   6. `supabase-migration-v5-exif.sql`
   7. `supabase-migration-v6-fix-team-policies.sql`
   8. `supabase-migration-v7-plan-limits.sql`
   9. `supabase-migration-v8-past-due-grace.sql`
   10. `supabase-migration-v9-free-project-allowance.sql`
   11. `supabase-migration-v10-storage-and-function-hardening.sql` (this is the security fix; it is safe to run here because this is the practice copy)
3. **Authentication > Providers > Email**: leave "Confirm email" **ON** for this practice project, so you can test the more secure signup behavior. Use two real inboxes you control (for example, two Gmail addresses, or `you+a@gmail.com` and `you+b@gmail.com`).
4. **Storage**: check that a bucket named `test-uploads` exists and is marked public. (The first migration creates it.)
5. Open **Project Settings > API**. You will need three values later: the project URL, the "anon" key, and the "service_role" key. Do not share the service_role key with anyone, including in chat.

### 1B. Stripe practice mode
1. In the Stripe dashboard, switch the toggle at the top to **Test mode** (a banner says "Test mode").
2. **Product catalog > Add product**, three times, each with a **recurring monthly price in USD**:
   - Starter: $99
   - Team: $199
   - Pro: $299
   (Do **not** create Enterprise yet. See "The $249 decision" in `DEPLOYMENT-READINESS.md`.)
3. Copy each price's ID (it starts with `price_`).
4. **Developers > Webhooks > Add endpoint**: after step 1C gives you the practice address, enter `https://<practice address>/api/stripe/webhook`. Choose these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. Copy the endpoint's **signing secret** (starts with `whsec_`).
5. **Settings > Billing > Customer portal**: turn on "Customers can cancel subscriptions".
6. Test cards: `4242 4242 4242 4242` works. `4000 0000 0000 0341` is attached fine but fails on the next charge (use it for the failed-payment test). Any future expiry, any 3 digits.

### 1C. A practice website (Vercel preview)
1. I will prepare a branch for the practice copy. **You approve** committing and pushing that branch (I will not do it until you say so).
2. In Vercel, the branch automatically gets its own preview address. Open the project's **Settings > Environment Variables** and add these names **for the Preview environment only** (never Production): the three Supabase values from 1A, the Stripe test secret key (`sk_test_...`), the `whsec_...` signing secret, the three Stripe price IDs, your Resend key and `RESEND_FROM_EMAIL`, your Anthropic key, `CRON_SECRET` (any long random text), `ADMIN_EMAIL`, and `NEXT_PUBLIC_SITE_URL` set to the preview address.
3. Redeploy the preview, then tell me the address.

---

## Part 2. Test checklist (I run what I can; you do the inbox and phone steps)

Mark each line PASS, FAIL or NOT DONE. Anything FAIL goes back to me.

### Accounts and isolation (needs two logins: A and B)
| # | Test | Expected |
|---|---|---|
| 1 | Sign up as A. Click the email link. Log in. | Lands on the dashboard; a Demo project exists |
| 2 | Log out, log back in; close the tab and reopen | Still the same account |
| 3 | A creates a project, uploads two photos, adds a note | Saved; reload shows them |
| 4 | Sign up as B in a different browser (or private window) | B sees **none** of A's projects |
| 5 | As B, paste A's project link (the `/app?project=...` address) | Nothing of A's loads |
| 6 | As B, open one of A's photo addresses | The photo opens (it is a public link; see risk list). Note this result |
| 7 | A invites B as a team member (needs a Team plan; see Part 3). B logs in. | B sees A's projects as read-only |
| 8 | A deletes a project | Gone from the list; its photos are removed |

### Core product
| # | Test | Expected |
|---|---|---|
| 9 | Write a damage note, tap **Generate** draft | A readable draft appears; try a note in Spanish too |
| 10 | Make a report, download the PDF, open it | Photos, notes and the draft are correct |
| 11 | Email the report to yourself | Arrives with the PDF; no odd formatting if the note contains `<b>` |
| 12 | Phone (iPhone and Android): navigation, take a photo, voice note | Everything fits; buttons easy to tap |
| 13 | Turn off Wi-Fi, add a finding, turn Wi-Fi back on | The finding syncs |

### Billing (Stripe test mode)
| # | Test | Expected |
|---|---|---|
| 14 | Log in as A, Pricing page, choose Starter, pay with the test card | Returns to the app; plan shows Starter; one subscription in Stripe |
| 15 | Try to buy again on the same account | Refused with "you already have an active plan" |
| 16 | Account page, **Manage billing**, cancel | Access continues until the period ends; Stripe shows "cancels at period end" |
| 17 | In Stripe, resend the same `checkout.session.completed` event (Developers > Events > Resend) | No second record, no second email |
| 18 | Buy Team with card `4000 0000 0000 0341`, then in Stripe advance or force a failed renewal | Account shows past due but still works; after the retries fail it ends |
| 19 | As a Starter account, try Xactimate export and email tracking | Blocked; Team account allowed |
| 20 | Pricing page | Starter $99, Team $199, Pro $299, and Enterprise shown as "Planned, not available yet" with no buy button |

### Security spot checks
| # | Test | Expected |
|---|---|---|
| 21 | Logged out, open `/dashboard` and `/app` | Sent to log in |
| 22 | Ask me to run the automated isolation script against the preview | I report PASS/FAIL |
| 23 | In Supabase SQL editor run the "who can touch files" query below | Shows only the policies from v10 |

```sql
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'storage' and tablename = 'objects';
```
Run the same query in your **live** Supabase project as well (it only reads). Send me the result with no keys in it. If the live list contains a broad "read for signed-in users" rule, it confirms the live risk and makes the v10 fix more urgent.

---

## Part 3. Before any real launch
- You approve; I make clean, reviewable commits and a pull request.
- Apply the security migration to the **live** database only after the practice copy passes (I will walk you through the SQL Editor step).
- Do the real-money check last: one real purchase with a card you control, then refund it in Stripe.

## Sharing safely
Tell me the preview web address and the two test email addresses. Do not paste passwords, API keys, the service_role key or webhook secrets into chat. If I need a value tested, you set it in Vercel and I check the result.
