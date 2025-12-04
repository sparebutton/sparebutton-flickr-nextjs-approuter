import Link from "next/link";
import Image from "next/image";
import { useFetchAlbums } from "@/hooks/useFetchAlbums";
import { Site } from "@/config/Site";
import { NavDrawer } from "@/components/NavDrawer";
import type { Metadata } from "next";

// Meta
export const metadata: Metadata = {
    title: Site.name_jp,
    description: Site.description,
    openGraph: {
        title: Site.name_jp,
        description: Site.description,
        url: Site.url,
        siteName: Site.name_jp,
        images: [
            {
                url: Site.ogImage,
                width: 1200,
                height: 630,
                alt: Site.name_jp,
            },
        ],
        type: "website",
    },
};

// component
export default async function Home() {
    const albums = await useFetchAlbums();

    // render
    return (
        <>
            <NavDrawer albums={albums} />
            <main>
                <ul className="flex flex-wrap">
                    {albums.map((album) => (
                        <li key={album.id} className="w-1/5 sm:w-1/6 md:w-1/7 lg:w-1/8 xl:w-1/9 2xl:w-1/10">
                            <Link href={`/${album.id}`} className="block hover:opacity-75 transition-opacity">
                                <Image
                                    src={album.thumbnail}
                                    alt={album.title}
                                    width={320}
                                    height={320}
                                    className="w-full aspect-square object-cover bg-image"
                                    priority={true}
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            </main>
        </>
    );
}
