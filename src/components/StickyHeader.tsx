"use client";

import { useEffect, useState, useRef } from "react";

// props
type StickyHeaderProps = {
    className: string;
    children: React.ReactNode;
};

export const StickyHeader: React.FC<StickyHeaderProps> = ({ className, children }) => {
    // sticky
    const [hidden, setHidden] = useState(false);
    const prevScrollTop = useRef(0);
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollTop = document.documentElement.scrollTop;
            if (currentScrollTop > prevScrollTop.current && currentScrollTop > 50) {
                // スクロールダウン時: ヘッダーを隠す
                setHidden(true);
            } else if (currentScrollTop < prevScrollTop.current) {
                // スクロールアップ時: ヘッダーを表示
                setHidden(false);
            }
            prevScrollTop.current = currentScrollTop;
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // render
    return (
        <header
            className={`z-10 sticky top-0 left-0 transition-transform duration-300 ease-in-out ${
                hidden ? "-translate-y-full" : "translate-y-0 shadow-sm"
            } ${className}`}
        >
            {children}
        </header>
    );
};
