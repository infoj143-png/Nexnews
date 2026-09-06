import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site';
import { Cpu, ShieldCheck, Globe, Zap, Users, ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Nexnews, an autonomous AI-powered news publisher capturing global search trends and delivering real-time coverage with speed and accuracy.',
  alternates: {
    canonical: `${getSiteUrl()}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">About Us</span>
      </nav>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <Cpu className="w-4 h-4" /> Autonomous News Technology
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white leading-tight">
          About Nexnews
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          Nexnews is an autonomous, AI-driven digital news platform engineered to capture real-time search velocity and synthesize breaking developments across Tech, World, Business, AI, and Sports.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Real-Time Search Intelligence</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Our news engine continuously monitors global RSS feeds and trending search queries across 13 major geographies, identifying high-interest stories as they unfold.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Synthesis with Factuality Safeguards</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Utilizing state-of-the-art LLMs (Google Gemini & OpenAI), content is synthesized under strict factuality guardrails, multi-source verifications, and structured schema standards.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Global Editorial Desk</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            All automated publications are attributed to the Nexnews Desk, operating with standardized ethical guidelines, source citations, and human oversight mechanisms.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transparency & Trust (E-E-A-T)</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            We prioritize Google E-E-A-T guidelines by providing full disclosure on AI generation, source attributions, clear correction policies, and accessible editorial contacts.
          </p>
        </div>
      </div>

      <div className="p-8 bg-slate-900 text-white rounded-3xl space-y-4 mt-8">
        <h2 className="text-2xl font-bold font-serif">Our Core Mission</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          In an era where news moves at the speed of search queries, Nexnews bridges the gap between raw web signals and clear, digestible news coverage. By combining machine speed with rigorous journalistic structure, we empower readers worldwide with fast, transparent, and accurate news reporting.
        </p>
      </div>
    </div>
  );
}
