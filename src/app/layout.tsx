import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BreakingTicker } from "@/components/layout/BreakingTicker";
import { Footer } from "@/components/layout/Footer";
import { AdBanner } from "@/components/ads/AdBanner";
import { getArticles } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: getSiteUrl(),
  },
  title: {
    default: "Nexnews | AI-Powered Automated News Portal",
    template: "%s | Nexnews"
  },
  description: "Stay ahead with Nexnews, an AI-powered automated news website delivering real-time coverage across Tech, World, Business, AI, and Sports.",
  keywords: ["AI news", "automated news", "breaking news", "technology news", "financial markets"],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getSiteUrl(),
    siteName: "Nexnews",
    title: "Nexnews | AI-Powered Automated News Portal",
    description: "Stay ahead with Nexnews, an AI-powered automated news website delivering real-time coverage across Tech, World, Business, AI, and Sports.",
    images: [
      {
        url: `${getSiteUrl()}/logo.png`,
        width: 512,
        height: 512,
        alt: "Nexnews Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexnews | AI-Powered Automated News Portal",
    description: "Stay ahead with Nexnews, an AI-powered automated news website delivering real-time coverage across Tech, World, Business, AI, and Sports.",
    images: [`${getSiteUrl()}/logo.png`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const articles = getArticles();
  const siteUrl = getSiteUrl();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': `${siteUrl}/#organization`,
    'name': 'Nexnews',
    'url': siteUrl,
    'logo': {
      '@type': 'ImageObject',
      'url': `${siteUrl}/logo.png`,
      'width': 512,
      'height': 512,
    },
    'sameAs': [
      'https://twitter.com/nexnews',
    ],
    'publishingPrinciples': `${siteUrl}/editorial-policy`,
    'correctionsPolicy': `${siteUrl}/corrections-policy`,
    'contactPoint': {
      '@type': 'ContactPoint',
      'email': 'editor@nexnews.app',
      'contactType': 'editorial desk',
    },
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    'url': siteUrl,
    'name': 'Nexnews',
    'description': 'AI-Powered Automated News Portal delivering real-time breaking coverage.',
    'publisher': {
      '@id': `${siteUrl}/#organization`,
    },
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Monetag Global Tag Script */}
        <Script
          id="monetag-tag"
          src="https://nap5k.com/tag.min.js"
          data-zone="11660788"
          strategy="afterInteractive"
        />

        {/* Global Header */}
        <Header />

        {/* Breaking News Ticker */}
        <BreakingTicker articles={articles} />

        {/* Global Leaderboard Ad Banner Slot (728x90 Container) */}
        <div className="max-w-7xl mx-auto px-4 w-full">
          <AdBanner slot="header" provider="adsterra" adType="adsterra-container" />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Sticky Mobile / Bottom Banner */}
        <AdBanner slot="footer-sticky" provider="adsterra" adType="adsterra-atoptions" className="hidden sm:flex" />

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
