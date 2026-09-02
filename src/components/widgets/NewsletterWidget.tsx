'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export const NewsletterWidget: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        setEmail('');
      } else {
        setErrorMsg(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      console.error('Error subscribing to newsletter:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 border border-blue-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-2">
        <Sparkles className="w-4 h-4" />
        <span>Daily AI Digest</span>
      </div>

      <h3 className="text-xl font-bold font-serif mb-2">
        Get Breaking News Delivered to Your Inbox
      </h3>

      <p className="text-xs text-slate-300 leading-relaxed mb-4">
        Join over 45,000 tech leaders and analysts receiving our AI-curated morning digest.
      </p>

      {submitted ? (
        <div className="bg-emerald-900/60 border border-emerald-500 text-emerald-200 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>You&apos;re subscribed! Check your inbox for confirmation.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          {errorMsg && (
            <div className="bg-red-900/60 border border-red-500 text-red-200 p-2.5 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              disabled={loading}
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subscribing...</span>
              </>
            ) : (
              <span>Subscribe Free</span>
            )}
          </button>
        </form>
      )}

      <p className="text-[10px] text-slate-400 mt-3 text-center">
        No spam ever. Unsubscribe at any time.
      </p>
    </div>
  );
};
