import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the configured public origin and host-only session cookies intact.
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
