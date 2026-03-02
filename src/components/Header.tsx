"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Site } from "@/config/Site";
import { StickyHeader } from "@/components/ui/StickyHeader";
import { DialogButton } from "@/components/ui/DialogButton";

// component
export const Header = () => {
    // Home判定
    const pathname = usePathname();
    const isHome = pathname === "/";
    const Tag = isHome ? "h1" : "div";

    // render
    return (
        <>
            <StickyHeader
                className="backdrop-blur bg-white/60 flex justify-between items-center h-12"
                showClass="shadow-sm"
            >
                <Tag>
                    <Link href="/">
                        <div className="px-3 flex items-center h-12">
                            <Image
                                src="/images/sitename.svg"
                                alt={Site.name_jp}
                                width={128}
                                height={16}
                                className="h-5 w-auto"
                                priority={true}
                            />
                        </div>
                    </Link>
                </Tag>
                <DialogButton
                    dialogId="drawer"
                    action="open"
                    className="flex justify-center items-center size-12 text-black"
                >
                    <span className="material-symbols-outlined">menu</span>
                </DialogButton>
            </StickyHeader>
        </>
    );
};
