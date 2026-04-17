import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["livekit-server-sdk"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
