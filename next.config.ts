import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
