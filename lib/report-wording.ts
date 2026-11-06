/**
 * Fixed wording that appears in every report and in the pre-filled adjuster email.
 *
 * It must not state facts about a particular claim. Whether damage was concealed, when it was discovered, or that it was
 * not visible at an earlier inspection belongs in a finding only when the contractor's own field note says so. Saying it
 * in text printed on every report claimed facts the finding did not contain.
 */
export const PDF_FOOTER_LINES = [
  "This documentation was prepared from the findings and field notes in Supplement Snap.",
  "Each finding is described as the contractor documented it.",
] as const

/** The message the send-report box starts with. It is editable before sending. */
export const DEFAULT_REPORT_EMAIL_MESSAGE =
  "Hello,\n\nPlease see the attached supplement documentation and supporting photos for this claim.\n\nThank you."
