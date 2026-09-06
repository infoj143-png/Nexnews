import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site';
import { BookOpen, ShieldCheck, CheckCircle2, ChevronLeft, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Editorial Policy & AI Transparency',
  description: 'Read the Nexnews Editorial Policy: Our standards for AI news generation, source attribution, fact-checking, and journalistic integrity.',
  alternates: {
    canonical: `${getSiteUrl()}/editorial-policy`,
  },
};

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">Editorial Policy</span>
      </nav>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <BookOpen className="w-4 h-4" /> Journalistic Standards & E-E-A-T
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white leading-tight">
          Editorial & AI Transparency Policy
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          At Nexnews, transparency and accuracy are essential to maintaining public trust. This document outlines our principles regarding AI news generation, source attribution, and editorial standards.
        </p>
      </div>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> 1. Autonomous AI Synthesis
          </h2>
          <p>
            Nexnews utilizes advanced Large Language Models (LLMs) to synthesize breaking news from verified real-time Google Trends feeds and established public RSS channels. Articles generated via our automated system are designated with standard metadata and clear trust indicators.
          </p>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 2. Factuality & Hallucination Prevention
          </h2>
          <p>
            To prevent AI hallucinations or false reporting:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <li>AI prompts enforce strict constraints prohibiting the fabrication of facts, quotes, or statistics.</li>
            <li>Articles are generated strictly using information retrieved from source feeds or verified web contexts.</li>
            <li>When primary source details are unverified, our system uses qualified attribution phrasing rather than absolute claims.</li>
          </ul>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" /> 3. Source Attribution & Copyright
          </h2>
          <p>
            Respecting original reporting is paramount. Nexnews requires that synthesized articles include explicit source citations and links to original news providers wherever possible. We do not claim ownership over underlying facts reported by third-party media outlets.
          </p>
        </section>

        <section className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" /> 4. Human Oversight & Corrections
          </h2>
          <p>
            While articles are published automatically to deliver fast coverage, our human editorial team reviews flagged articles, monitors reader feedback, and promptly implements updates or corrections in according with our Corrections Policy.
          </p>
        </section>
      </div>
    </div>
  );
}
