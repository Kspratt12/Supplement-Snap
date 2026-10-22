import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join the Waitlist | Supplement Snap",
  description:
    "Supplement Snap is coming soon. Join the waitlist to get early access to roofing supplement documentation software.",
  robots: { index: false, follow: true },
}

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
