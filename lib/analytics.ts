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

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void
  }
}

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(event)
  }
}
