"use client";

import { useEffect, useRef } from "react";
import { useDialogStore } from "@/store/useDialogStore";

// props
type DialogProps = {
    dialogId: string;
    className?: string;
    positionClassName?: string;
    openAnimationClassName?: string;
    closeAnimationClassName?: string;
    children?: React.ReactNode;
};

// component
export const Dialog: React.FC<DialogProps> = ({
    dialogId,
    className,
    positionClassName,
    openAnimationClassName,
    closeAnimationClassName,
    children,
}) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const isOpen = useDialogStore((state) => state.openDialogs[dialogId]);
    const closeDialog = useDialogStore((state) => state.closeDialog);

    // position
    if (!positionClassName) {
        positionClassName = "m-auto";
    }

    // animation
    if (!openAnimationClassName) {
        openAnimationClassName = "animate-fade-in";
    }
    if (!closeAnimationClassName) {
        closeAnimationClassName = "animate-fade-out";
    }

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
                        if (e.animationName === closeAnimationClassName) dialog.close();
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
                        ? openAnimationClassName + " [&::backdrop]:animate-fade-in"
                        : closeAnimationClassName + " [&::backdrop]:animate-fade-out"
                }
                ${positionClassName} ${className}`}
            onClick={handleBackdropClick}
        >
            {children}
        </dialog>
    );
};
