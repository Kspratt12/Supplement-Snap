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

type EventProps = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: EventProps }
    ) => void
  }
}

export function trackEvent(event: AnalyticsEvent, props?: EventProps) {
  if (typeof window !== "undefined" && window.plausible) {
    if (props) window.plausible(event, { props })
    else window.plausible(event)
  }
}
