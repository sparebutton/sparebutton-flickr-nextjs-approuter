import { notFound } from "next/navigation";
import { useFetchAlbums } from "@/hooks/useFetchAlbums";
import { useFetchPhotos } from "@/hooks/useFetchPhotos";
import { Photo } from "@/types/flickr";
import Link from "next/link";
import Image from "next/image";
import { Site } from "@/config/Site";
import { NavDrawer } from "@/components/NavDrawer";
import { ImageFadein } from "@/components/ui/ImageFadein";

// 明示的に SSG にする
export const dynamic = "force-static";

// SSG: アルバムごとのページを事前にビルド
export async function generateStaticParams() {
    const albums = await useFetchAlbums();
    return albums.map((album) => ({
        albumId: album.id.toString(),
    }));
}

// Meta
export async function generateMetadata({ params }: { params: Promise<{ albumId: string }> }) {
    const albumId = (await params).albumId;
    const albums = await useFetchAlbums();
    const album = albums.find((a) => a.id === albumId);

    if (!album) {
        return { title: "Not Found", description: "アルバムが見つかりませんでした。" };
    }

    // description をサニタイズ（HTMLタグ除去、改行コードを半角スペースに）
    const sanitizeDescription = album.description.replace(/<[^>]*>?/gm, "").replace(/\n/g, " ");

    return {
        title: `${album.title} | ${Site.name}`,
        description: sanitizeDescription,
        openGraph: {
            title: `${album.title} | ${Site.name}`,
            description: sanitizeDescription,
            url: `${Site.url}/${album.id}`,
            siteName: Site.name,
            images: [
                {
                    url: album.ogImage,
                    alt: album.title,
                },
            ],
            type: "article",
        },
    };
}

// component
export default async function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
    const albumId = (await params).albumId;
    const albums = await useFetchAlbums();
    const album = albums.find((a) => a.id === albumId);

    // アルバムが見つからない場合は 404 ページ
    if (!album) return notFound();

    // `getPhotos()` を使ってアルバムの写真を取得
    const photos: Photo[] = await useFetchPhotos(albumId);

    // render
    return (
        <>
            <NavDrawer albums={albums} />
            <main className="px-3">
                <article className="max-w-screen-sm mx-auto">
                    <h1 className="mt-20 mb-10 text-lg !font-bold">{album.title}</h1>
                    <div
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                            __html: album.description
                                .replace(/\n/g, "<br>")
                                .replace(/href="https?/g, 'target="_blank" href="https'),
                        }}
                    />

                    {/* photos */}
                    <div className="mt-20 space-y-24">
                        {photos.map((photo, index) => (
                            <section key={photo.id}>
                                {photo.isVideo ? (
                                    <video
                                        controls
                                        poster={photo.originalImageUrl}
                                        className="w-full h-auto rounded-xl"
                                    >
                                        <source src={photo.originalVideoUrl || undefined} type="video/mp4" />
                                    </video>
                                ) : index < 2 ? (
                                    <Image
                                        src={photo.originalImageUrl}
                                        alt={photo.title}
                                        width={800}
                                        height={800}
                                        className="w-full h-auto shadow rounded-xl"
                                        priority={true}
                                    />
                                ) : (
                                    <ImageFadein
                                        src={photo.originalImageUrl}
                                        alt={photo.title}
                                        width={800}
                                        height={800}
                                        className="w-full h-auto"
                                        containerClassName="shadow rounded-xl overflow-hidden"
                                    />
                                )}
                                <div
                                    className="mt-3 text-xs leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: photo.description
                                            ? photo.description
                                                  .replace(/\n/g, "<br>")
                                                  .replace(/href="https?/g, 'target="_blank" href="https')
                                            : "",
                                    }}
                                />
                            </section>
                        ))}
                    </div>
                </article>
            </main>

            <hr className="mt-24 mb-6 border-neutral-200" />

            <aside>
                <nav>
                    <ul className="flex flex-wrap px-3">
                        {albums.map((album) => (
                            <li key={album.id} className="w-1/6 sm:w-1/8 md:w-1/10 lg:w-1/12 xl:w-1/14 2xl:w-1/16">
                                <Link href={`/${album.id}`} className="block hover:opacity-75 transition-opacity">
                                    <Image
                                        src={album.thumbnail}
                                        alt={album.title}
                                        width={320}
                                        height={320}
                                        className="w-full aspect-square object-cover"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
}
