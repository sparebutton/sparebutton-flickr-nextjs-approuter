"use client";

import { useState } from "react";
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
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`bg-image ${containerClassName}`}>
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={`transition-opacity ${isLoaded ? "opacity-100" : "opacity-0"} ${className}`}
                onLoadingComplete={() => setIsLoaded(true)}
            />
        </div>
    );
};
