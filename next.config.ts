import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Prevent build worker crashes in restricted environments.
  experimental: {
    webpackBuildWorker: false,
  },
};

export default nextConfig;
