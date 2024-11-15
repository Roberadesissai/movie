import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // This will ignore ESLint errors during production builds
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      (warning: { message: string }) =>
        warning.message.includes("@typescript-eslint/no-unused-vars") ||
        warning.message.includes("@typescript-eslint/no-explicit-any") ||
        warning.message.includes("prefer-const") ||
        warning.message.includes("react/no-unescaped-entities") ||
        warning.message.includes("react/jsx-no-undef") ||
        warning.message.includes("react-hooks/exhaustive-deps") ||
        warning.message.includes("@next/next/no-img-element")
    ];
    return config;
  }
};

export default nextConfig;
