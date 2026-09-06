import React from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/data';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                N
              </div>
              <span className="text-xl font-black text-white font-serif">
                Nex<span className="text-blue-500">news</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time news synthesis platform delivering breaking developments across technology, business, world affairs, and sports.
            </p>
          </div>

          {/* Quick Category Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {CATEGORIES.map(cat => (
                <li key={cat}>
                  <Link
                    href={`/category/${cat.toLowerCase()}`}
                    className="hover:text-blue-400 transition-colors block py-0.5"
                  >
                    {cat} News
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Info & Policy */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Trust & Policies</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors block py-0.5">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors block py-0.5">
                  Contact & Editorial Team
                </Link>
              </li>
              <li>
                <Link href="/editorial-policy" className="hover:text-blue-400 transition-colors block py-0.5">
                  Editorial & AI Standards
                </Link>
              </li>
              <li>
                <Link href="/corrections-policy" className="hover:text-blue-400 transition-colors block py-0.5">
                  Corrections Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Adsterra/Monetag Disclosure & Newsletter */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Monetization & Ads</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Nexnews integrates with Google AdSense, Adsterra, and Monetag ad networks. Non-intrusive ad placement rules ensure minimal Cumulative Layout Shift (CLS).
            </p>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-xs font-semibold text-slate-300 block mb-1">Publisher ID</span>
              <code className="text-[11px] text-blue-400 font-mono">PUB-NEXNEWS-2025-X89</code>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Nexnews Inc. Powered by Next.js & Nexnews Engine.</p>
          <div className="flex gap-6 flex-wrap">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/editorial-policy" className="hover:text-slate-400 transition-colors">
              Editorial Standards
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
