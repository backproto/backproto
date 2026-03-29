import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@puraxyz/sdk"],
  async rewrites() {
    return [
      // OpenAI-compatible drop-in path
      { source: "/v1/chat/completions", destination: "/api/chat" },
      { source: "/v1/models", destination: "/api/health" },
    ];
  },
  async headers() {
    const corsHeaders = [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Methods", value: "POST, GET, OPTIONS" },
      {
        key: "Access-Control-Allow-Headers",
        value: "Content-Type, Authorization, X-Provider-Key",
      },
    ];
    return [
      { source: "/v1/:path*", headers: corsHeaders },
      { source: "/api/:path*", headers: corsHeaders },
    ];
  },
};

export default nextConfig;
