import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@anthropic-ai/sdk", "twilio", "resend", "pdfjs-dist"],
};

export default nextConfig;
