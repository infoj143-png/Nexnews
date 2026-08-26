'use client';

import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Check, MessageSquare, Send, Globe } from 'lucide-react';

interface ArticleActionsProps {
  title: string;
  slug: string;
}

export const ArticleActions: React.FC<ArticleActionsProps> = ({ title, slug }) => {
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Array<{ name: string; date: string; text: string }>>([
    {
      name: 'Alex Rivera',
      date: '2 hours ago',
      text: 'This is a game-changer for autonomous software workflows. Interested to see how developers handle state persistence!'
    },
    {
      name: 'Dr. Michael Vance',
      date: '4 hours ago',
      text: 'Fascinating breakdown. The performance metrics across multimodal benchmarks speak for themselves.'
    }
  ]);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://nexnews.ai/news/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && authorName.trim()) {
      setComments([
        {
          name: authorName,
          date: 'Just now',
          text: commentText
        },
        ...comments
      ]);
      setCommentText('');
    }
  };

  return (
    <div className="space-y-8 mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
      {/* Social Sharing Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Share2 className="w-4 h-4 text-blue-600" />
          <span>Share Article</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-500 hover:shadow-xs transition-all border border-slate-200 dark:border-slate-700"
          >
            X / Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-700 hover:shadow-xs transition-all border border-slate-200 dark:border-slate-700"
          >
            Facebook
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:shadow-xs transition-all border border-slate-200 dark:border-slate-700"
          >
            LinkedIn
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Comment Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Discussion ({comments.length})</span>
          </h3>
        </div>

        {/* Comment Input Form */}
        <form onSubmit={handleCommentSubmit} className="space-y-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Your Name..."
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <textarea
            required
            rows={3}
            placeholder="Share your views on this story..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Comment</span>
            </button>
          </div>
        </form>

        {/* Comment Stream */}
        <div className="space-y-3">
          {comments.map((c, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</span>
                <span className="text-[10px] text-slate-400">{c.date}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
