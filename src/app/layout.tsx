import type { Metadata, Viewport } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RevealProvider } from "@/components/reveal";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

// High-contrast editorial serif — chosen, not defaulted. Optical sizing on,
// italic loaded for the accented word in display headlines.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL = "https://fortresstaxadvisors.com";
const DESCRIPTION =
  "Fortress Tax Advisors is a senior-led tax advisory firm for businesses, investors, and fiduciaries managing genuine complexity — planning, structuring, transactions, and controversy support. Built to Hold.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fortress Tax Advisors — Built to Hold",
    template: "%s | Fortress Tax Advisors",
  },
  description: DESCRIPTION,
  applicationName: "Fortress Tax Advisors",
  keywords: [
    "tax advisory",
    "business tax strategy",
    "entity structuring",
    "trust and estate tax",
    "transaction tax planning",
    "multi-state compliance",
    "tax controversy",
  ],
  authors: [{ name: "Fortress Tax Advisors" }],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/fortress-mark.svg", type: "image/svg+xml" }],
    shortcut: "/fortress-mark.svg",
    apple: "/fortress-mark.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Fortress Tax Advisors",
    title: "Fortress Tax Advisors — Built to Hold",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fortress Tax Advisors — Built to Hold",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "finance",
};

export const viewport: Viewport = {
  themeColor: "#11181f",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          // Add `js` before paint so reveal targets start hidden without a flash.
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <RevealProvider />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
