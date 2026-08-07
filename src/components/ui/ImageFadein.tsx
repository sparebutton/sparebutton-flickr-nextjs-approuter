"use client";

import { useEffect, useRef, useState } from "react";
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
    // SSR / ハイドレーション時は不透明のまま描画する。
    // 書き出し HTML に opacity-0 を残すと、JS が動かなかった場合に画像が永久に透明になるため。
    const [isFadeReady, setIsFadeReady] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 読み込み済み（キャッシュ等）ならフェードイン不要。onLoad を取りこぼしても表示されたままにする
        if (imgRef.current?.complete) {
            setIsLoaded(true);
            return;
        }
        // 未読み込みのものだけ透明にし、onLoad でフェードインさせる
        setIsFadeReady(true);
    }, []);

    const isVisible = !isFadeReady || isLoaded;

    return (
        <div className={`bg-image ${containerClassName}`}>
            <Image
                ref={imgRef}
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={`transition-opacity ${isVisible ? "opacity-100" : "opacity-0"} ${className}`}
                onLoad={() => setIsLoaded(true)}
            />
        </div>
    );
};
