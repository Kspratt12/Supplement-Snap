import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Choose a New Password | Supplement Snap",
  description: "Set a new password for your Supplement Snap account.",
  alternates: { canonical: "https://supplementsnap.io/reset-password" },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
