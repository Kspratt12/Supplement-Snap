import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "Roofing Supplement Software | Document Damage, Generate Reports in Minutes",
  description:
    "Capture hidden roofing damage during tear-off, generate supplement documentation, and send adjuster-ready PDF reports in minutes. Used by roofing crews across the U.S.",
  openGraph: {
    title: "Roofing Supplement Software | Document Damage, Generate Reports in Minutes",
    description:
      "Capture hidden roofing damage during tear-off, generate supplement documentation, and send adjuster-ready PDF reports in minutes. Used by roofing crews across the U.S.",
    url: "https://supplementsnap.io",
    siteName: "Supplement Snap",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roofing Supplement Software | Document Damage, Generate Reports in Minutes",
    description:
      "Capture hidden roofing damage during tear-off, generate supplement documentation, and send adjuster-ready PDF reports in minutes. Used by roofing crews across the U.S.",
  },
  alternates: {
    canonical: "https://supplementsnap.io",
  },
  metadataBase: new URL("https://supplementsnap.io"),
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <link rel="icon" href="/favicon.png" sizes="48x48" type="image/png" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <Script
          defer
          data-domain="supplementsnap.io"
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
              url: "https://supplementsnap.io",
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "99",
                highPrice: "299",
                priceCurrency: "USD",
                offerCount: "2",
                availability: "https://schema.org/InStock",
              },
              provider: {
                "@type": "Organization",
                name: "Supplement Snap",
                url: "https://supplementsnap.io",
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
