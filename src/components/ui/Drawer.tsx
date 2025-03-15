import { Dialog } from "@/components/ui/Dialog";

// props
type DrawerProps = {
    dialogId: string;
    position?: "left" | "right";
    className?: string;
    children?: React.ReactNode;
};

// component
export const Drawer: React.FC<DrawerProps> = ({ dialogId, position = "right", className, children }) => {
    // position
    const positionClassName =
        "left" === position
            ? "mt-0 mr-auto mb-0 ml-0 w-screen h-screen max-h-full"
            : "mt-0 mr-0 mb-0 ml-auto w-screen h-screen max-h-full";

    // animation
    const openAnimationClass = "left" === position ? "animate-slide-in-from-left" : "animate-slide-in-from-right";
    const closeAnimationClass = "left" === position ? "animate-slide-out-to-left" : "animate-slide-out-to-right";

    // render
    return (
        <Dialog
            dialogId={dialogId}
            className={className}
            positionClass={positionClassName}
            openAnimationClass={openAnimationClass}
            closeAnimationClass={closeAnimationClass}
        >
            {children}
        </Dialog>
    );
};
