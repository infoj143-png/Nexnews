import React from 'react';
import { Article } from '@/lib/data';
import { getArticleTrustSignals } from '@/lib/trust';
import { Bot, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ArticleTrustBadgeProps {
  article: Article;
  className?: string;
}

export const ArticleTrustBadge: React.FC<ArticleTrustBadgeProps> = ({ article, className = '' }) => {
  const trustSignals = getArticleTrustSignals(article);
  const { isAiGenerated, transparencyLabel, source, qualitativeBadges } = trustSignals;

  return (
    <div
      aria-label="Article Trust and Verification Signals"
      className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Transparency Label Pill */}
        <div className="flex items-center gap-2">
          {isAiGenerated ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100/80 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{transparencyLabel}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{transparencyLabel}</span>
            </span>
          )}
        </div>

        {/* Source Link / Attribution (if available) */}
        {source.sourceName || source.sourceUrl ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span className="text-slate-400 dark:text-slate-500">Source:</span>
            {source.sourceUrl ? (
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold transition-colors"
                title={`Verify source: ${source.sourceName || 'Original Article'}`}
              >
                <span>{source.sourceName || 'Original Source'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="font-semibold text-slate-800 dark:text-slate-200">{source.sourceName}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Synthesized from public news updates</span>
        )}
      </div>

      {/* Qualitative Verification Badges */}
      {qualitativeBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
          {qualitativeBadges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 font-medium"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
