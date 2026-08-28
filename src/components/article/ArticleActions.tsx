'use client';

import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Check, MessageSquare, Send } from 'lucide-react';

interface ArticleActionsProps {
  title: string;
  summary?: string;
  slug: string;
}

export const ArticleActions: React.FC<ArticleActionsProps> = ({ title, summary, slug }) => {
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
  const [currentUrl, setCurrentUrl] = useState<string>(`https://nexnews-nu.vercel.app/news/${slug}`);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const shareUrl = currentUrl;
  const shareText = summary ? `${title} - ${summary}` : title;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
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

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      bgColor: 'hover:bg-emerald-600 hover:text-white',
      borderColor: 'border-slate-200 dark:border-slate-700',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      bgColor: 'hover:bg-blue-600 hover:text-white',
      borderColor: 'border-slate-200 dark:border-slate-700',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'Reddit',
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
      bgColor: 'hover:bg-orange-600 hover:text-white',
      borderColor: 'border-slate-200 dark:border-slate-700',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l3.018.636a1.247 1.247 0 0 1 1.004-.722zm-9.034 7.646c-.687 0-1.248.561-1.248 1.249 0 .688.561 1.249 1.248 1.249.688 0 1.249-.561 1.249-1.249 0-.688-.561-1.249-1.249-1.249zm7.043 0c-.688 0-1.249.561-1.249 1.249 0 .688.561 1.249 1.249 1.249.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.248-1.249zm-5.592 3.864a.278.278 0 0 0-.196.475c.983.984 2.573.984 3.556 0a.278.278 0 0 0-.393-.393c-.767.767-2.003.767-2.77 0a.273.273 0 0 0-.197-.082z"/>
        </svg>
      )
    },
    {
      name: 'Twitter / X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      bgColor: 'hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900',
      borderColor: 'border-slate-200 dark:border-slate-700',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'Quora',
      href: `https://www.quora.com/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`,
      bgColor: 'hover:bg-red-700 hover:text-white',
      borderColor: 'border-slate-200 dark:border-slate-700',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12 2.373 0 4.58-.69 6.438-1.879l1.832.55.55-1.832A11.944 11.944 0 0 0 24 12c0-6.627-5.373-12-12-12zm.743 17.135c-.933 1.107-1.748 1.491-2.613 1.491-1.314 0-2.095-.886-2.095-2.38 0-3.328 2.659-6.903 5.483-6.903 1.558 0 2.457.997 2.457 2.47 0 2.05-1.163 4.137-3.232 5.322zm.989-5.322c0-.776-.416-1.219-1.053-1.219-1.558 0-3.187 2.411-3.187 4.656 0 .748.332 1.163.914 1.163.748 0 1.579-.693 2.383-1.884 1.053-1.524.943-2.716.943-2.716z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-8 mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
      {/* Social Sharing Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Share2 className="w-4 h-4 text-blue-600" />
          <span>Share Article</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {socialPlatforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all border ${platform.borderColor} ${platform.bgColor} shadow-2xs hover:shadow-xs`}
              title={`Share on ${platform.name}`}
            >
              {platform.icon}
              <span>{platform.name}</span>
            </a>
          ))}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            title="Copy article link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <LinkIcon className="w-3.5 h-3.5" />}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
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
