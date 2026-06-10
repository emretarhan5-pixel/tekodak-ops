import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  poweredByHeader: false,
  reactStrictMode: true,
  webpack: (config) => {
    // node_modules 2 symlink sorununu önle
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
