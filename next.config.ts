import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The dev-only "N" badge sat on the folded index rail (bottom left); build errors still show.
  devIndicators: false,
};

export default nextConfig;
