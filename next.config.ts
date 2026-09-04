import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  outputFileTracingIncludes: {
    '/**': ['./data/articles/**'],
  },
  async redirects() {
    return [
      {
        source: '/news/openai-unveils-gpt-5-quantum-leap-reasoning',
        destination: '/category/ai',
        permanent: true,
      },
      {
        source: '/news/global-markets-rally-central-banks-rate-cuts',
        destination: '/category/business',
        permanent: true,
      },
      {
        source: '/news/international-space-summit-agrees-lunar-protocol',
        destination: '/category/world',
        permanent: true,
      },
      {
        source: '/news/champions-league-thriller-underdogs-stun-champions-94th-minute',
        destination: '/category/sports',
        permanent: true,
      },
      {
        source: '/news/solid-state-battery-achieves-1000-mile-range-ev',
        destination: '/category/tech',
        permanent: true,
      },
      {
        source: '/news/autonomous-ai-agents-take-over-software-qa-testing',
        destination: '/category/ai',
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
