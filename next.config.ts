import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**': ['./data/articles/**'],
  },
};

export default nextConfig;
