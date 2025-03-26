"use client";

import Link from "next/link";
import Image from "next/image";
import { Drawer } from "@/components/ui/Drawer";
import { DialogButton } from "@/components/ui/DialogButton";
import { Album } from "@/types/flickr";
import { useDialogStore } from "@/stores/useDialogStore";

// props
type NavDrawerProps = {
    albums: Album[];
};

// component
export const NavDrawer: React.FC<NavDrawerProps> = ({ albums }) => {
    const closeDialog = useDialogStore((state) => state.close);

    // render
    return (
        <Drawer dialogId="drawer" className="max-w-screen-sm">
            <div className="h-full flex flex-col">
                <div className="flex justify-end">
                    <DialogButton
                        dialogId="drawer"
                        action="close"
                        className="flex justify-center items-center size-12 text-black"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </DialogButton>
                </div>
                <div className="h-full overflow-y-auto">
                    <ul className="flex flex-wrap px-3 pb-3">
                        {albums.map((album) => (
                            <li key={album.id} className="w-1/5 xs:w-1/6">
                                <Link
                                    href={`/${album.id}`}
                                    className="block hover:opacity-75 transition-opacity"
                                    onClick={() => {
                                        closeDialog("drawer");
                                    }}
                                >
                                    <Image
                                        src={album.thumbnail}
                                        alt={album.title}
                                        width={150}
                                        height={150}
                                        className="w-full aspect-square object-cover bg-image"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Drawer>
    );
};
