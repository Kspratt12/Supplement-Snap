/**
 * Containment switch for automatic follow-up emails (scheduling in /api/send-report and sending in /api/email-followup).
 *
 * Off by default: follow-ups run only when AUTOMATIC_FOLLOWUPS_ENABLED is exactly "true". A missing, empty, "false" or any
 * other value means nothing is scheduled and nothing is sent. Removing the variable therefore DISABLES follow-ups.
 * Rows already scheduled in the database are left as they are; they simply do not run while this is off.
 */
export const FOLLOWUPS_ENV = "AUTOMATIC_FOLLOWUPS_ENABLED"

export function automaticFollowUpsEnabled(): boolean {
  return process.env[FOLLOWUPS_ENV] === "true"
}
