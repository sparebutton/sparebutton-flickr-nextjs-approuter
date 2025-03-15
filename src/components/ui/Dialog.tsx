"use client";

import { useEffect, useRef } from "react";
import { useDialogStore } from "@/stores/useDialogStore";

// props
type DialogProps = {
    dialogId: string;
    className?: string;
    positionClass?: string;
    openAnimationClass?: string;
    closeAnimationClass?: string;
    children?: React.ReactNode;
};

// component
export const Dialog: React.FC<DialogProps> = ({
    dialogId,
    className,
    positionClass = "m-auto",
    openAnimationClass = "animate-fade-in",
    closeAnimationClass = "animate-fade-out",
    children,
}) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const isOpen = useDialogStore((state) => state.openDialogs[dialogId]);
    const closeDialog = useDialogStore((state) => state.close);

    // 状態に応じてダイアログの開閉を管理
    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog) {
            if (true === isOpen) {
                // ダイアログを開く
                dialog.showModal();
            } else if (false === isOpen && undefined !== useDialogStore.getState().openDialogs[dialogId]) {
                // アニメーション終了後にダイアログを閉じる
                //dialog.close();

                dialog.addEventListener(
                    "animationend",
                    (e) => {
                        if (e.animationName === closeAnimationClass) dialog.close();
                    },
                    { once: true }
                );
            }
        }
    }, [isOpen]);

    // バックドロップクリックでダイアログを閉じる
    const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        // ダイアログの要素の境界を取得
        const rect = dialog.getBoundingClientRect();

        // クリック位置がダイアログの外側（バックドロップ）なら閉じる
        if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        ) {
            closeDialog(dialogId);
        }
    };

    // `close` イベントで Zustand の状態を更新
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCloseDialogStore = () => {
            closeDialog(dialogId);
        };
        dialog.addEventListener("close", handleCloseDialogStore);

        return () => {
            dialog.removeEventListener("close", handleCloseDialogStore);
        };
    }, [closeDialog, dialogId]);

    // render
    return (
        <dialog
            ref={dialogRef}
            id={dialogId}
            className={`
                text-text bg-bg [&::backdrop]:bg-black/20 [&::backdrop]:backdrop-blur-xs
                ${
                    isOpen
                        ? openAnimationClass + " [&::backdrop]:animate-fade-in"
                        : closeAnimationClass + " [&::backdrop]:animate-fade-out"
                }
                ${positionClass} ${className}`}
            onClick={handleBackdropClick}
        >
            {children}
        </dialog>
    );
};
