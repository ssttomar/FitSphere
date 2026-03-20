import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: "/images/**" }],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {},
};

export default nextConfig;
