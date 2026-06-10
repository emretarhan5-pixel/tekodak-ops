import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingExcludes: {
    "*": ["node_modules 2/**", ".env 2.local"],
  },
  experimental: {
    outputFileTracingIgnorePatterns: [
      "node_modules 2",
      "**/node_modules 2/**",
      ".env 2.local",
    ],
  } as NextConfig["experimental"],
  webpack: (config) => {
    // node_modules 2 symlink sorununu önle
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
