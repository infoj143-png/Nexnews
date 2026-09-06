import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site';
import { FileText, Shield, Scale, ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Nexnews Terms of Service: Guidelines, terms, and legal disclaimer governing access to our news platform.',
  alternates: {
    canonical: `${getSiteUrl()}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">Terms of Service</span>
      </nav>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <Scale className="w-4 h-4" /> Legal Terms
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white leading-tight">
          Terms of Service
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          Last updated: February 2025. Please review these terms carefully before using Nexnews.
        </p>
      </div>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> 1. Acceptance of Terms
          </h2>
          <p>
            By accessing or browsing Nexnews, you agree to be bound by these Terms of Service and applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
          </p>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" /> 2. Intellectual Property & Fair Use
          </h2>
          <p>
            All original headlines, synthetic news summaries, and editorial layouts created by Nexnews are copyrighted. Third-party trademarks, news sources, and media cited remain the property of their respective owners under fair use guidelines.
          </p>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-500" /> 3. Disclaimer of Warranties
          </h2>
          <p>
            Nexnews content is provided &quot;as is&quot; for informational purposes. While we strive for absolute accuracy using automated synthesis and verification protocols, Nexnews makes no warranties, expressed or implied, regarding completeness, financial advice, or medical guidance.
          </p>
        </section>
      </div>
    </div>
  );
}
