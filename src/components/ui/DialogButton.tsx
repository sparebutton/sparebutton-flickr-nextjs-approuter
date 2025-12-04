"use client";

import { useDialogStore } from "@/stores/useDialogStore";

// props
type DialogButtonProps = {
    dialogId: string;
    className?: string;
    action: "open" | "close";
    children?: React.ReactNode;
};

// component
export const DialogButton: React.FC<DialogButtonProps> = ({ dialogId, className, action, children }) => {
    const openDialog = useDialogStore((state) => state.open);
    const closeDialog = useDialogStore((state) => state.close);

    const handleClick = () => {
        if ("open" === action) {
            openDialog(dialogId);
        } else if ("close" === action) {
            closeDialog(dialogId);
        }
    };

    // render
    return (
        <button className={className} onClick={handleClick}>
            {children}
        </button>
    );
};
