import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Your Password | Supplement Snap",
  description: "Request a link to reset your Supplement Snap password.",
  alternates: { canonical: "https://supplementsnap.io/forgot-password" },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
