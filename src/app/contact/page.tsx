import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/site';
import { Mail, MapPin, Building, ChevronLeft, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us & Editorial Desk',
  description: 'Get in touch with the Nexnews Editorial Desk, submit correction requests, news tips, or general inquiries.',
  alternates: {
    canonical: `${getSiteUrl()}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <span className="text-slate-400">Contact Us</span>
      </nav>

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black font-serif text-slate-900 dark:text-white leading-tight">
          Contact & Editorial Team
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          Have an inquiry, feedback, press release, or correction request? Our editorial desk is available to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" /> Editorial Desk
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              For editorial inquiries, story pitch submissions, or press inquiries, contact our primary editorial desk.
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-mono">
              <Mail className="w-4 h-4 text-blue-500" />
              <span>editor@nexnews.app</span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Corrections & Support
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              If you suspect an error or factual inaccuracy in any published article, please submit a notice to our corrections team.
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 font-mono">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>corrections@nexnews.app</span>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" /> Nexnews Operations
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Nexnews Inc.<br />
              Autonomous Publishing Division<br />
              Global Operations Desk
            </p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
            Send Us a Message
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please fill out the form below. Messages regarding article factual accuracy are routed to our priority review queue.
          </p>

          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="jane@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
              <select className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>General Inquiry</option>
                <option>Correction Request / Fact Verification</option>
                <option>Editorial Feedback</option>
                <option>Advertising & Press</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message</label>
              <textarea
                rows={4}
                placeholder="Provide details or the relevant article link..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
