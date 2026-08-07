"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// props
type ImageFadeinProps = {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    containerClassName?: string;
};

// component
export const ImageFadein: React.FC<ImageFadeinProps> = ({ src, alt, width, height, className, containerClassName }) => {
    const imgRef = useRef<HTMLImageElement>(null);

    // 「読み込むまで透明にしておく」のではなく「読み込めたら一度だけフェードのアニメーションを流す」方式。
    // img は読み込みが終わるまで何も描画しないので初期状態を透明にする必要がなく、
    // load を取りこぼしても画像が透明のまま残らない（演出が省略されるだけで済む）。
    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        // ハイドレーション前に読み込みが終わっていた場合はフェード不要
        if (img.complete) return;

        // React の onLoad はハイドレーション前に発火した load を取りこぼすため DOM のイベントを直接購読する。
        // state を持たず classList を直接触るのは、load ハンドラ内で同期的にクラスを当てて
        // 「描画されてから透明になる」ちらつきを避けるため。
        const handleLoad = () => img.classList.add("animate-fade-in");
        img.addEventListener("load", handleLoad, { once: true });

        return () => img.removeEventListener("load", handleLoad);
    }, []);

    return (
        <div className={`bg-image ${containerClassName ?? ""}`}>
            <Image
                ref={imgRef}
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={className}
            />
        </div>
    );
};
