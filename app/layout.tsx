import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roofing Supplement Software | Supplement Snap",
  description:
    "Capture hidden roofing damage during tear-off, generate supplement documentation, and send adjuster-ready reports in minutes.",
  openGraph: {
    title: "Roofing Supplement Software | Supplement Snap",
    description:
      "Capture hidden roofing damage during tear-off, generate supplement documentation, and send adjuster-ready reports in minutes.",
    url: "https://supplement-snap.vercel.app",
    siteName: "Supplement Snap",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roofing Supplement Software | Supplement Snap",
    description:
      "Capture hidden roofing damage during tear-off, generate supplement documentation, and send adjuster-ready reports in minutes.",
  },
  metadataBase: new URL("https://supplement-snap.vercel.app"),
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <Script
          defer
          data-domain="supplementsnap.com"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Supplement Snap",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Capture hidden roofing damage during tear-off, generate supplement documentation, and send adjuster-ready reports in minutes.",
              url: "https://supplement-snap.vercel.app",
              offers: {
                "@type": "Offer",
                price: "49",
                priceCurrency: "USD",
                priceValidUntil: "2027-12-31",
                availability: "https://schema.org/InStock",
              },
              provider: {
                "@type": "Organization",
                name: "Supplement Snap",
                url: "https://supplement-snap.vercel.app",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
