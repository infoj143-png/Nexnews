import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BreakingTicker } from "@/components/layout/BreakingTicker";
import { Footer } from "@/components/layout/Footer";
import { AdBanner } from "@/components/ads/AdBanner";

export const metadata: Metadata = {
  title: {
    default: "Nexnews | AI-Powered Automated News Portal",
    template: "%s | Nexnews"
  },
  description: "Stay ahead with Nexnews, an AI-powered automated news website delivering real-time coverage across Tech, World, Business, AI, and Sports.",
  keywords: ["AI news", "automated news", "breaking news", "technology news", "financial markets"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nexnews.ai",
    siteName: "Nexnews",
    title: "Nexnews - AI-Powered Automated News Portal",
    description: "Real-time AI automated news covering breaking stories globally."
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Global Header */}
        <Header />

        {/* Breaking News Ticker */}
        <BreakingTicker />

        {/* Global Header Ad Banner Slot */}
        <div className="max-w-7xl mx-auto px-4 w-full">
          <AdBanner slot="header" provider="adsterra" />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Sticky Mobile / Bottom Banner */}
        <AdBanner slot="footer-sticky" provider="monetag" className="hidden sm:flex" />

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
