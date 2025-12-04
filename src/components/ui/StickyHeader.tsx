"use client";

import { useEffect, useState, useRef } from "react";

// state 型
type HeaderState = "reset" | "hide" | "show";

// props
type StickyHeaderProps = {
    className?: string;
    positionClass?: "sticky" | "fixed";
    resetClass?: string;
    hideClass?: string;
    showClass?: string;
    children: React.ReactNode;
};

export const StickyHeader: React.FC<StickyHeaderProps> = ({
    className = "",
    positionClass = "sticky",
    resetClass,
    hideClass,
    showClass,
    children,
}) => {
    // ヘッダの状態管理
    const [state, setState] = useState<HeaderState>("reset");
    const prevScrollTop = useRef(0);
    const preventShow = useRef(false);
    const bounds = useRef<DOMRect | null>(null);
    const ticking = useRef(false);
    const headerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (ticking.current) return;
            ticking.current = true;

            requestAnimationFrame(() => {
                if (!headerRef.current) return;
                const scrollTop = document.documentElement.scrollTop;
                const boundary = bounds.current?.bottom || 50;

                if (scrollTop > prevScrollTop.current && scrollTop > boundary) {
                    // スクロールダウン時: ヘッダを隠す
                    setState("hide");
                } else if (scrollTop < prevScrollTop.current && scrollTop > boundary) {
                    // スクロールアップ時: ヘッダを表示（ただし制限あり）
                    if (!preventShow.current) {
                        setState("show");
                    } else {
                        setTimeout(() => {
                            preventShow.current = false;
                        }, 66);
                        setState("hide");
                    }
                } else if (scrollTop <= (bounds.current?.top || 0)) {
                    // 既定の位置に戻ったらリセット
                    setState("reset");
                }

                prevScrollTop.current = scrollTop;
                ticking.current = false;
            });
        };

        // IntersectionObserverで境界を取得
        const observer = new IntersectionObserver(([entry]) => {
            bounds.current = entry.intersectionRect;
        });

        if (headerRef.current) observer.observe(headerRef.current);
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    // クラスの決定
    const stateClass =
        state === "hide"
            ? `-translate-y-full ${hideClass}`
            : state === "show"
            ? `translate-y-0  ${showClass}`
            : `${resetClass}`;

    // render
    return (
        <header
            ref={headerRef}
            className={`${positionClass} z-10 w-full top-0 left-0 transition duration-300 ease-in-out ${stateClass} ${className}`}
        >
            {children}
        </header>
    );
};
