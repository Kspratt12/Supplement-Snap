# Account deletion: manual procedure

Account deletion is handled by hand. There is no delete-account button and no automatic purge. The privacy policy says we
delete the account information, project records and photos from our own systems, cancel any subscription, and aim to finish
within 30 days of confirming the request. This page is the checklist for doing that.

Do not run any of this against production without the owner of the business present. Nothing here has been run for a real
customer yet, so test it once on a throwaway account and fix this page where reality differs.

## 1. Confirm the request
- The request must come from the email address on the account (privacy@supplementsnap.io receives requests). If it comes from
  another address, ask the person to send it from the account address or to log in and confirm.
- Reply that the request was received and note the date. The 30 days starts when the identity is confirmed.
- If the account is on a team (someone else's plan), the person deleting is a member, not the owner. Remove only that member.
  Do not delete the owner's projects.

## 2. Cancel the subscription first
- Stripe Dashboard: find the customer by the account email, open the subscription, cancel it immediately.
- Decide separately whether to delete the Stripe customer. Stripe may keep payment records it is required to keep. That is not
  verified here: check Stripe's documentation before promising anything about payment records.

## 3. Collect the photo files BEFORE deleting any rows
Photos live in the public storage bucket `test-uploads` under random file names, not in a folder per user. The only way to
find a person's photos is through the database rows that point to them. Deleting a project row in the Supabase table editor
removes the rows, not the files, so list the files first.
- Table `projects`: find every project where `user_id` is the person's id.
- Table `captures`: for every one of those projects, copy every address in `image_urls` (and `image_url`). The file name is the
  part after `test-uploads/`.
- Table `company_settings`: if the person uploaded a logo, its address is stored there. The logo is in the same bucket.
- Supabase, Storage, `test-uploads`: search for each file name and delete it.
- Photos taken by a team member are stored under that member's login. If the owner is being deleted, the member's files may not
  be removable from the owner's side. Check Storage and note any file that cannot be deleted.

### Photo files the app could not confirm removing
When someone deletes a photo, finding or project in the app, the app now checks whether the storage service confirmed removing
each file. If it did not, the person is told, and a row is written to `activity_log` with the action
"Photo files not confirmed removed" and the file names in `details`. Search `activity_log` for that action, for the account
being deleted and in general, and delete those files from Storage by hand. Do this as part of every deletion request, and now and
then without one, because those files stay reachable by their link until they are removed.

### What is NOT stored, so there is nothing to delete
- Generated PDF reports: the PDF is built in the person's browser. It is not saved on our side. What was emailed lives in the
  recipient's mailbox and in the email provider's records; `email_tracking` keeps only the recipient, subject and open count.
- Voice audio: the app has no audio recording or upload code. Voice notes are saved only as text in the finding's note.

## 4. Delete the records
Check each of these for rows belonging to the person (by `user_id`, `owner_id`, `member_email` or `project_id`), and delete them:
- `captures` (removed with their project, because of the link to projects)
- `projects`
- `subscriptions`
- `team_members` (as owner, and as a member)
- `company_settings`
- `email_tracking`
- `activity_log`
- `adjuster_contacts` (these hold other people's contact details)

Then Supabase, Authentication, Users: delete the user.
Some of these tables are removed automatically when the user is deleted and some are not. Check each table afterwards instead of
assuming.

## 5. Check and record
- Search Storage and each table once more for the person's email, project names and address.
- Reply to the person that deletion is done, and list what could not be deleted (see below).
- Keep a short private note of the date requested, the date finished and the steps taken. Do not keep the deleted data in it.

## What this does NOT cover, and must not be promised
- Backups held by Supabase, and any copies held by Stripe, Resend, Anthropic, Vercel or other providers. How long they keep
  data and whether they delete it on request has not been verified. The privacy policy says provider copies follow their own
  schedules.
- PDF reports the person already emailed to an adjuster or saved to their own device.
- Emails already sent. Sent-mail records at the email provider follow that provider's schedule.
