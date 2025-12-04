import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // SSG
    output: "export",
    images: { unoptimized: true },
    // 環境変数
    env: {
        FLICKR_API_KEY: process.env.FLICKR_API_KEY,
        FLICKR_USER_ID: process.env.FLICKR_USER_ID,
        FLICKR_COLLECTION_ID: process.env.FLICKR_COLLECTION_ID,
    },
};

export default nextConfig;
