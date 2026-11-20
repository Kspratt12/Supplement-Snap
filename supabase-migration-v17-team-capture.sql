-- SupplementSnap migration v17: crew-to-office shared capture, per project, within existing team seats.
-- Additive only. Nothing existing is changed, moved or deleted, and no project becomes shared by itself.
--
-- What it adds:
--   projects.team_capture  boolean NOT NULL DEFAULT false  the owner turns this on for one project at a time
--   captures.created_by    uuid (defaults to the signed-in user)  who added the finding; kept as null if that account is deleted
--   public.can_contribute_to_project(project uuid)  true only when ALL of these hold for the signed-in user:
--       - the project has team_capture switched on;
--       - they are an ACTIVE member of the project owner's team, matched by their own account id (member_user_id)
--         and by their own email;
--       - their email is confirmed;
--       - the owner has a live Team, Pro or Enterprise subscription (the plans that include team seats).
--   captures_team_insert policy: such a member may ADD findings to that project, recorded as their own (created_by).
--
-- Unchanged: owners keep full control (captures_owner); members still read through captures_team_read and still cannot
-- edit or delete any finding, including their own. Seats are still counted and limited by /api/team. Removing a member
-- (or the owner's plan lapsing) stops new findings at once, including ones queued offline on the member's phone.
--
-- Rollback without data loss: turn team_capture off on the projects (UPDATE ... SET team_capture = false), or drop just the
-- policy: DROP POLICY IF EXISTS captures_team_insert ON public.captures;  The columns can stay.
-- The full undo at the end also removes created_by, which deletes the record of who added each finding.

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS team_capture boolean NOT NULL DEFAULT false;
ALTER TABLE public.captures ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.captures ALTER COLUMN created_by SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_captures_created_by ON public.captures (created_by);

CREATE OR REPLACE FUNCTION public.can_contribute_to_project(p_project uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.projects pr
      JOIN public.team_members tm ON tm.owner_id = pr.user_id
      JOIN auth.users u ON u.id = auth.uid()
     WHERE pr.id = p_project
       AND pr.team_capture
       AND pr.user_id <> auth.uid()
       AND tm.status = 'active'
       AND tm.member_user_id = auth.uid()
       AND lower(tm.member_email) = lower(u.email)
       AND u.email_confirmed_at IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM public.subscriptions s
          WHERE s.user_id = pr.user_id
            AND s.status IN ('active', 'trialing', 'past_due')
            AND s.plan IN ('team', 'pro', 'enterprise')
       )
  )
$$;

REVOKE ALL ON FUNCTION public.can_contribute_to_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_contribute_to_project(uuid) TO authenticated;

DROP POLICY IF EXISTS "captures_team_insert" ON public.captures;
CREATE POLICY "captures_team_insert" ON public.captures
  FOR INSERT TO authenticated
  WITH CHECK (public.can_contribute_to_project(project_id) AND created_by = auth.uid());

-- Check after running (expect 2 columns, 1 function, 1 policy):
-- SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('team_capture','created_by');
-- SELECT proname FROM pg_proc WHERE proname = 'can_contribute_to_project';
-- SELECT policyname FROM pg_policies WHERE tablename = 'captures' AND policyname = 'captures_team_insert';

-- ============================================================
-- UNDO (removes who-added records; prefer the data-preserving rollback above):
-- DROP POLICY IF EXISTS captures_team_insert ON public.captures;
-- DROP FUNCTION IF EXISTS public.can_contribute_to_project(uuid);
-- DROP INDEX IF EXISTS public.idx_captures_created_by;
-- ALTER TABLE public.captures DROP COLUMN IF EXISTS created_by;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS team_capture;
