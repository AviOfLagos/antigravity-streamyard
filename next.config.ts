import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["livekit-server-sdk"],
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
