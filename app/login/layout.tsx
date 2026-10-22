import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log In | Supplement Snap",
  alternates: { canonical: "https://supplementsnap.io/login" },
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
