'use client';

import React, { useEffect, useRef } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export type AdSlot = 'header' | 'sidebar' | 'in-article' | 'footer-sticky';
export type AdProvider = 'adsterra' | 'monetag' | 'google-adsense' | 'custom';
export type AdType = 'adsterra-container' | 'adsterra-atoptions' | 'default';

interface AdBannerProps {
  slot: AdSlot;
  provider?: AdProvider;
  adType?: AdType;
  scriptUrl?: string;
  adClient?: string;
  adSlotId?: string;
  className?: string;
}

const SLOT_CONFIGS: Record<AdSlot, { label: string; width: string; height: string; format: string }> = {
  header: {
    label: 'Header Banner (728x90)',
    width: 'max-w-[728px] w-full',
    height: 'min-h-[90px] h-[90px]',
    format: 'Leaderboard (728x90)'
  },
  sidebar: {
    label: 'Sidebar Rectangle (300x250)',
    width: 'w-[300px]',
    height: 'min-h-[250px] h-[250px]',
    format: 'Medium Rectangle (300x250)'
  },
  'in-article': {
    label: 'In-Article Banner (728x90 / Native)',
    width: 'w-full max-w-[728px]',
    height: 'min-h-[90px] h-[90px]',
    format: 'In-Article Banner (728x90)'
  },
  'footer-sticky': {
    label: 'Bottom Sticky Mobile/Desktop Banner (320x50)',
    width: 'w-full max-w-[468px]',
    height: 'min-h-[60px] h-[60px]',
    format: 'Sticky Footer Banner'
  }
};

// Container ID and script URL for Adsterra Leaderboard Container Ad (Slot 1)
const ADSTERRA_CONTAINER_ID = 'container-ed7ceef78cd097b17c73f61248acffb1';
const ADSTERRA_CONTAINER_SCRIPT = 'https://pl31041881.profitableratecpmnetwork.com/ed7ceef78cd097b17c73f61248acffb1/invoke.js';

// Configuration for Adsterra atOptions Banner Ad (Slot 2)
const ADSTERRA_ATOPTIONS_KEY = 'c2abf76f95e9219a89f84b77f28c5079';
const ADSTERRA_ATOPTIONS_SCRIPT = 'https://www.highrevenueformat.com/c2abf76f95e9219a89f84b77f28c5079/invoke.js';

export const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  provider = 'adsterra',
  adType,
  scriptUrl,
  adClient,
  adSlotId,
  className = ''
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const config = SLOT_CONFIGS[slot];

  // Infer adType if not explicitly passed
  const effectiveAdType: AdType = adType || (
    slot === 'header' ? 'adsterra-container' :
    slot === 'in-article' ? 'adsterra-atoptions' :
    'default'
  );

  useEffect(() => {
    const container = adRef.current;
    if (!container) return;

    // Clear previous contents on mount / prop update
    container.innerHTML = '';

    if (effectiveAdType === 'adsterra-container') {
      // 1. Leaderboard Container Ad
      const div = document.createElement('div');
      div.id = ADSTERRA_CONTAINER_ID;
      container.appendChild(div);

      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = ADSTERRA_CONTAINER_SCRIPT;
      container.appendChild(script);

      return () => {
        container.innerHTML = '';
      };
    } else if (effectiveAdType === 'adsterra-atoptions') {
      // 2. Banner Script atOptions Ad
      // Create inline script to define atOptions global object
      const optionsScript = document.createElement('script');
      optionsScript.type = 'text/javascript';
      optionsScript.text = `
        atOptions = {
          'key' : '${ADSTERRA_ATOPTIONS_KEY}',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      container.appendChild(optionsScript);

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = ADSTERRA_ATOPTIONS_SCRIPT;
      container.appendChild(invokeScript);

      return () => {
        container.innerHTML = '';
      };
    } else if (scriptUrl) {
      // Custom external script injection
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      if (adClient) script.setAttribute('data-ad-client', adClient);
      if (adSlotId) script.setAttribute('data-ad-slot', adSlotId);
      container.appendChild(script);

      return () => {
        container.innerHTML = '';
      };
    }
  }, [effectiveAdType, scriptUrl, adClient, adSlotId]);

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
          {/* Default Preview Container fallback when no active ad script is loaded */}
          {effectiveAdType === 'default' && !scriptUrl && (
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
          )}
        </div>
      </div>
    </div>
  );
};
