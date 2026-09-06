import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site';
import { Shield, Lock, Eye, ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Nexnews Privacy Policy: Information on how we collect, use, and protect your data across our news publishing platform and ad network integrations.',
  alternates: {
    canonical: `${getSiteUrl()}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">Privacy Policy</span>
      </nav>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <Shield className="w-4 h-4" /> Data Protection
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white leading-tight">
          Privacy Policy
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          Last updated: February 2025. This policy explains how Nexnews collects, uses, and safeguards user data.
        </p>
      </div>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" /> 1. Information Collection
          </h2>
          <p>
            Nexnews collects non-personally identifiable information automatically, such as IP address, browser type, operating system, and pages visited via standard web logs and analytics. Personal details (such as email addresses) are collected only when voluntarily provided via newsletter signup or contact forms.
          </p>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-500" /> 2. Cookies & Advertising Partners
          </h2>
          <p>
            We partner with third-party ad networks including Google AdSense, Adsterra, and Monetag to serve advertisements on our site. These partners may use cookies, web beacons, or tracking technologies to serve non-intrusive personalized or contextual ads. You may manage cookie preferences through your browser settings.
          </p>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" /> 3. Data Protection Rights & Inquiries
          </h2>
          <p>
            You have the right to request access to or deletion of any personal data submitted to Nexnews. For privacy-related inquiries, please contact our data compliance desk at <span className="font-mono text-blue-500">privacy@nexnews.app</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
