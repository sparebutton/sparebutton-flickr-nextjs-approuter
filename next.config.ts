import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // SSG
    output: "export",
    images: { unoptimized: true },
};

export default nextConfig;
