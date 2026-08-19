"use client";

import { useEffect } from "react";

// iOS の WebKit は画像ロードの一時的な失敗（電波の瞬断・リソース逼迫など）を自動で
// リトライせず、broken image（「?」アイコン）のまま確定させる。ページ内のどの画像でも
// 起きるため、コンポーネント単位ではなく document 全体で error を監視して回収する。
//
// 表示を JS に依存させているわけではない（失敗した画像はどのみち見えない）。
// JS が動かない環境では単にリトライが省略されるだけで、既存の表示は変わらない。

// リトライは計 2 回まで（初回ロードと合わせて最大 3 回試行）
const MAX_RETRIES = 2;

// リトライ間隔の基準（2 回目はこの 2 倍待つ）
const RETRY_BASE_DELAY_MS = 1500;

export const ImageLoadRetry: React.FC = () => {
    useEffect(() => {
        const timers = new Set<number>();

        const retry = (img: HTMLImageElement) => {
            if (!img.src) return;

            const count = Number(img.dataset.retry || "0");
            if (count >= MAX_RETRIES) return;
            img.dataset.retry = String(count + 1);

            const timer = window.setTimeout(() => {
                timers.delete(timer);
                // 同一 URL の再設定は WebKit が失敗結果をメモリキャッシュから返すことが
                // あるため、クエリを変えて確実に再リクエストさせる（Flickr の画像 CDN は
                // クエリ付きでも同じ画像を返すことを確認済み）。
                const url = new URL(img.src);
                url.searchParams.set("retry", String(count + 1));
                img.src = url.toString();
            }, RETRY_BASE_DELAY_MS * (count + 1));
            timers.add(timer);
        };

        // ハイドレーション前に失敗が確定した画像は error イベントがもう発火しないため、
        // マウント時に走査して回収する（complete かつ naturalWidth === 0 が失敗の印）。
        for (const img of Array.from(document.images)) {
            if (img.complete && img.naturalWidth === 0) retry(img);
        }

        // 以後の失敗を監視する。error はバブルしないので capture で拾う。
        const handleError = (event: Event) => {
            if (event.target instanceof HTMLImageElement) retry(event.target);
        };
        document.addEventListener("error", handleError, true);

        return () => {
            document.removeEventListener("error", handleError, true);
            timers.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    return null;
};
