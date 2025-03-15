"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Site } from "@/config/Site";
import { StickyHeader } from "@/components/StickyHeader";
import { DialogButton } from "@/components/DialogButton";

// component
export const Header = () => {
    // Homme判定
    const pathname = usePathname();
    const isHome = pathname === "/";

    // render
    return (
        <>
            <StickyHeader
                className="backdrop-blur bg-white/60 flex justify-between items-center h-12"
                showClassName="shadow-sm"
            >
                {isHome ? (
                    <h1>
                        <Link href="/">
                            <div className="px-3 flex items-center h-12">
                                <Image
                                    src="/images/sitename.svg"
                                    alt={Site.name}
                                    width={128}
                                    height={16}
                                    className="h-5 w-auto"
                                    priority={true}
                                />
                            </div>
                        </Link>
                    </h1>
                ) : (
                    <div>
                        <div className="px-3 flex items-center h-12">
                            <Link href="/">
                                <Image
                                    src="/images/sitename.svg"
                                    alt={Site.name}
                                    width={128}
                                    height={16}
                                    className="h-5 w-auto"
                                    priority={true}
                                />
                            </Link>
                        </div>
                    </div>
                )}
                <DialogButton
                    dialogId="drawer"
                    action="open"
                    className="cursor-pointer flex justify-center items-center size-12 text-black"
                >
                    <span className="material-icons">menu</span>
                </DialogButton>
            </StickyHeader>
        </>
    );
};
