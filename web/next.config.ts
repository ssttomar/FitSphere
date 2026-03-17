import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow optimising local images served from /public
    localPatterns: [{ pathname: "/images/**" }],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
