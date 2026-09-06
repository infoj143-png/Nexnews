import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site';
import { RefreshCw, CheckSquare, Clock, Mail, ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Corrections Policy',
  description: 'Read the Nexnews Corrections Policy: How we handle factual errors, issue article updates, and process reader correction requests.',
  alternates: {
    canonical: `${getSiteUrl()}/corrections-policy`,
  },
};

export default function CorrectionsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">Corrections Policy</span>
      </nav>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-semibold">
          <RefreshCw className="w-4 h-4" /> Commitment to Accuracy
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white leading-tight">
          Corrections & Updates Policy
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          Nexnews is committed to promptness, accuracy, and transparency. When an error occurs in our reporting, we correct it quickly and transparently.
        </p>
      </div>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" /> 1. Factual Error Correction Procedure
          </h2>
          <p>
            When a significant factual error is identified in a published article:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li>The error is corrected immediately in the article body text.</li>
            <li>A correction notice is appended to the bottom or top of the article detailing what was changed and when.</li>
            <li>The article schema metadata (`dateModified`) is updated to reflect the correction timestamp.</li>
          </ul>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" /> 2. Developing Stories & Minor Updates
          </h2>
          <p>
            For fast-breaking, developing news, new facts, figures, or statements are added as information becomes verified. Minor typographical or formatting edits that do not alter the factual meaning of a story do not warrant a formal correction note, but are logged under standard `dateModified` versioning.
          </p>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-500" /> 3. How to Request a Correction
          </h2>
          <p>
            If you notice a factual mistake, incorrect quote, or inaccurate detail in any Nexnews article, please email us directly with the details:
          </p>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Email format for correction notices:</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
              <li>To: corrections@nexnews.app</li>
              <li>Subject: Correction Request: [Article Title or URL]</li>
              <li>Body: Specific description of the error and link/reference to primary supporting facts.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
