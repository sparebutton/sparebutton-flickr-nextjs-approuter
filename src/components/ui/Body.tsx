"use client";

import { useDialogStore } from "@/stores/useDialogStore";

// props
type BodyProps = {
    className?: string;
    children?: React.ReactNode;
};

// component
export const Body: React.FC<BodyProps> = ({ className, children }) => {
    const isDialogOpen = useDialogStore((state) => state.isOpen);

    // render
    return <body className={`${className} ${isDialogOpen ? "overflow-hidden" : ""}`}>{children}</body>;
};
