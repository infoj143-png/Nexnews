'use client';

import React, { useEffect, useRef } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export type AdSlot = 'header' | 'sidebar' | 'in-article' | 'footer-sticky';
export type AdProvider = 'adsterra' | 'monetag' | 'google-adsense' | 'custom';

interface AdBannerProps {
  slot: AdSlot;
  provider?: AdProvider;
  scriptUrl?: string;
  adClient?: string;
  adSlotId?: string;
  className?: string;
}

const SLOT_CONFIGS: Record<AdSlot, { label: string; width: string; height: string; format: string }> = {
  header: {
    label: 'Header Banner (728x90)',
    width: 'max-w-[728px] w-full',
    height: 'h-[90px]',
    format: 'Leaderboard (728x90)'
  },
  sidebar: {
    label: 'Sidebar Rectangle (300x250)',
    width: 'w-[300px]',
    height: 'h-[250px]',
    format: 'Medium Rectangle (300x250)'
  },
  'in-article': {
    label: 'In-Article Banner (728x90 / Native)',
    width: 'w-full max-w-[728px]',
    height: 'h-[120px]',
    format: 'In-Article Banner (Responsive)'
  },
  'footer-sticky': {
    label: 'Bottom Sticky Mobile/Desktop Banner (320x50)',
    width: 'w-full max-w-[468px]',
    height: 'h-[60px]',
    format: 'Sticky Footer Banner'
  }
};

export const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  provider = 'adsterra',
  scriptUrl,
  adClient,
  adSlotId,
  className = ''
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const config = SLOT_CONFIGS[slot];

  useEffect(() => {
    // If external ad script provided, dynamically inject inside container without causing CLS
    if (scriptUrl && adRef.current) {
      adRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.setAttribute('data-ad-client', adClient || 'ca-pub-nexnews-demo');
      if (adSlotId) script.setAttribute('data-ad-slot', adSlotId);
      adRef.current.appendChild(script);
    }
  }, [scriptUrl, adClient, adSlotId]);

  return (
    <div className={`my-4 flex flex-col items-center justify-center ${className}`}>
      {/* Badge label to prevent user confusion and maintain compliance */}
      <div className="flex items-center gap-1 text-[10px] tracking-widest text-gray-400 font-semibold uppercase mb-1">
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        <span>ADVERTISEMENT</span>
        <span className="text-gray-300">•</span>
        <span className="capitalize text-gray-400">{provider}</span>
      </div>

      {/* CLS-Protected Container with fixed aspect box */}
      <div
        className={`${config.width} ${config.height} relative overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-xs transition-colors`}
      >
        <div ref={adRef} className="w-full h-full flex items-center justify-center">
          {/* Default Preview Container when no active ad networks are connected */}
          <div className="flex flex-col items-center justify-center text-center p-3 select-none">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-sm">
              <span className="font-bold text-blue-600 dark:text-blue-400">Nexnews Ad Space</span>
              <span>— {config.format}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Ready for {provider.toUpperCase()} / Monetag / Google AdSense Injection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
