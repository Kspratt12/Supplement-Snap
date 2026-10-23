import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account | Supplement Snap",
  description: "Create a Supplement Snap account to document roof damage and generate supplement reports.",
  alternates: { canonical: "https://supplementsnap.io/signup" },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
