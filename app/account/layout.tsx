import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account | Supplement Snap",
  description: "Manage your Supplement Snap profile, password, plan and billing.",
  alternates: { canonical: "https://supplementsnap.io/account" },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
