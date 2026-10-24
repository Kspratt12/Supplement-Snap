import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Book a Demo | Supplement Snap",
  description:
    "Book a free 15-minute walkthrough of Supplement Snap. See how roofing crews capture hidden damage during tear-off and generate adjuster-ready supplement reports.",
  openGraph: {
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }],
    title: "Book a Demo | Supplement Snap",
    description:
      "Book a free 15-minute walkthrough of Supplement Snap. See how roofing crews capture hidden damage and generate supplement reports.",
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
