import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for development
  reactStrictMode: true,
  
  // Silence Turbopack warning (using Turbopack by default in Next.js 16)
  turbopack: {},
};

export default nextConfig;
