import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb", // or higher, e.g., '20mb'
    },
  },
  /* config options here */
};

export default nextConfig;
