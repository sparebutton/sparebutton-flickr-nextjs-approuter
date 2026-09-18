// app/layout.tsx
import type { Metadata } from "next";
import { Site } from "@/config/Site";
import "@/css/app.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Body } from "@/components/ui/Body";
import { ImageLoadRetry } from "@/components/ui/ImageLoadRetry";
import { notoSansJP } from "@/config/Fonts";

export const metadata: Metadata = {
    // OGP の画像など、相対パスで書いたメタデータを絶対 URL に解決する基準。
    // 未設定だとビルド時に http://localhost:3000 が使われ、SNS のプレビュー画像が壊れる。
    metadataBase: new URL(Site.url),
    title: Site.name,
    description: Site.description,
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <Body className={`text-text bg-bg min-h-screen ${notoSansJP.className} antialiased`}>
                <ImageLoadRetry />
                <Header />
                {children}
                <Footer />
            </Body>
        </html>
    );
}
