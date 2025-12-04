// app/layout.tsx
import type { Metadata } from "next";
import { Site } from "@/config/Site";
import "@/css/app.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Body } from "@/components/ui/Body";
import { notoSansJP } from "@/config/Fonts";

export const metadata: Metadata = {
    title: Site.name,
    description: Site.description,
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <Body className={`text-text bg-bg min-h-screen ${notoSansJP.className} antialiased`}>
                <Header />
                {children}
                <Footer />
            </Body>
        </html>
    );
}
