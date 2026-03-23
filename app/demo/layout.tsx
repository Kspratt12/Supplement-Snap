import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book a Demo | Supplement Snap",
  description:
    "Book a free 15-minute walkthrough of Supplement Snap. See how roofing crews capture hidden damage during tear-off and generate adjuster-ready supplement reports.",
  openGraph: {
    title: "Book a Demo | Supplement Snap",
    description:
      "Book a free 15-minute walkthrough of Supplement Snap. See how roofing crews capture hidden damage and generate supplement reports.",
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
