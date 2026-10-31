import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev-only "N" badge sat on the folded index rail (bottom left); build errors still show.
  devIndicators: false,
  // Course figures for the belortzio drill: viewable in the app, kept out of search results.
  async headers() {
    return [{ source: '/belortzioak-irudiak/:file*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] }];
  },
};

export default nextConfig;
