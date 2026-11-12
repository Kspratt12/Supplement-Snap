import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "See Supplement Snap in Action | Supplement Snap",
  description:
    "Try the interactive demo, read a sample report or start a free project to see how roofing crews capture hidden damage during tear-off and build supplement reports.",
  openGraph: {
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Supplement Snap" }],
    title: "See Supplement Snap in Action | Supplement Snap",
    description:
      "Try the interactive demo, read a sample report or start a free project.",
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
