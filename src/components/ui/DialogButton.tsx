"use client";

import { useDialogStore } from "@/store/useDialogStore";

// props
type DialogButtonProps = {
    dialogId: string;
    className?: string;
    action: "open" | "close";
    children?: React.ReactNode;
};

// component
export const DialogButton: React.FC<DialogButtonProps> = ({ dialogId, className, action, children }) => {
    const openDialog = useDialogStore((state) => state.openDialog);
    const closeDialog = useDialogStore((state) => state.closeDialog);

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
