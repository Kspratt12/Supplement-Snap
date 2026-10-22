import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Account | Supplement Snap",
  alternates: { canonical: "https://supplementsnap.io/signup" },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
