import { Roboto, Noto_Sans_JP } from "next/font/google";

export const roboto = Roboto({
    variable: "--font-roboto",
    subsets: ["latin"],
});

export const notoSansJP = Noto_Sans_JP({
    variable: "--font-noto-sans-jp",
    subsets: ["latin"],
});
