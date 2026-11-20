-- SupplementSnap migration v18: opt-in follow-up reminder emails to the project OWNER only. PROPOSED; additive.
-- Sending stays off until FOLLOWUP_REMINDERS_SEND=true is set on the server and the daily job is scheduled.
--
--   projects.reminder_opt_in  boolean NOT NULL DEFAULT false   the owner asks to be emailed on the follow-up date
--   projects.reminder_tz      text                             the owner's time zone when they opted in (IANA name)
--   follow_up_reminder_sends  one row per (project, follow-up date): the claim that makes each reminder send at most once,
--                             with status, bounded attempts and the provider's message id. Server-only (no client access).
-- A changed follow-up date is a new key, so it gets its own reminder; a cleared date or opt-out sends nothing.
-- Deleting a project deletes its send rows. Undo at the end removes the columns and the table (and their history).

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reminder_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reminder_tz text;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_reminder_tz_len;
ALTER TABLE public.projects ADD CONSTRAINT projects_reminder_tz_len CHECK (reminder_tz IS NULL OR length(reminder_tz) BETWEEN 1 AND 64);

CREATE TABLE IF NOT EXISTS public.follow_up_reminder_sends (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  follow_up_on date NOT NULL,
  status text NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  last_error text,
  provider_message_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, follow_up_on)
);
ALTER TABLE public.follow_up_reminder_sends ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.follow_up_reminder_sends FROM PUBLIC, anon, authenticated;

-- UNDO:
-- DROP TABLE IF EXISTS public.follow_up_reminder_sends;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_reminder_tz_len;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS reminder_tz;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS reminder_opt_in;
