/**
 * Lightweight analytics helper using Plausible Analytics.
 * Tracks custom events without logging personal data.
 */

type AnalyticsEvent =
  | "demo_request_submitted"
  | "signup_completed"
  | "login_completed"
  | "checkout_started"
  | "subscription_active"
  | "waitlist_joined"
  | "checklist_printed"
  | "cta_click"
  | "project_created"
  | "pdf_downloaded"
  | "upgrade_modal_viewed"

type EventProps = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: EventProps }
    ) => void
  }
}

/**
 * Sends one event to Plausible. Never throws: analytics being blocked, missing or broken must not affect the app.
 * Callers pass no personal data (no names, emails, claim details, project ids, photo links or document contents).
 */
export function trackEvent(event: AnalyticsEvent, props?: EventProps) {
  try {
    if (typeof window !== "undefined" && window.plausible) {
      if (props) window.plausible(event, { props })
      else window.plausible(event)
    }
  } catch {
    // ignore: analytics must never block the app
  }
}
