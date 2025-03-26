import { Album } from "@/types/flickr";
import { fetchJSON } from "@/lib/fetchJSON";

const API_KEY = process.env.FLICKR_API_KEY;
const USER_ID = process.env.FLICKR_USER_ID;
const COLLECTION_ID = process.env.FLICKR_COLLECTION_ID;

// メモリキャッシュを作成（SSGビルド時のみ保持）
declare global {
    var __albumsCache: Album[] | null;
}

if (!globalThis.__albumsCache) {
    globalThis.__albumsCache = null;
}

// コレクションからすべてのアルバム情報を取得
export async function useFetchAlbums(): Promise<Album[]> {
    // すでにキャッシュされている場合、それを返す
    if (globalThis.__albumsCache) {
        return globalThis.__albumsCache;
    }

    // コレクション情報を取得
    const data = await fetchJSON(
        `https://www.flickr.com/services/rest/?method=flickr.collections.getTree&api_key=${API_KEY}&user_id=${USER_ID}&collection_id=${COLLECTION_ID}&format=json&nojsoncallback=1`
    );

    if (!data?.collections?.collection) {
        console.error("Flickr API Error: flickr.collections.getTree data is undefined");
        return [];
    }

    // 各アルバムの情報を取得（並列リクエスト、エラー時のフォールバックあり）
    const albums: PromiseSettledResult<Album>[] = await Promise.allSettled(
        (data.collections.collection[0]?.set || []).map(async (album: any) => {
            const albumId = album.id;
            const albumTitle = album.title || "Untitled Album";
            const albumDescription = album.description || "";
            // アルバムの代表画像を取得
            const albumData = await fetchJSON(
                `https://www.flickr.com/services/rest/?method=flickr.photosets.getInfo&api_key=${API_KEY}&photoset_id=${albumId}&user_id=${USER_ID}&format=json&nojsoncallback=1`
            );

            if (!albumData?.photoset) {
                console.error(`Flickr API Error: Failed to fetch album info for ${albumId}`);
                return {
                    id: albumId,
                    title: albumTitle,
                    description: albumDescription,
                    thumbnail: "/images/no-image.svg",
                    ogImage: "/images/no-image.svg",
                };
            }

            const { primary, server, secret } = albumData.photoset;

            return {
                id: albumId,
                title: albumTitle,
                description: albumDescription,
                thumbnail: primary
                    ? `https://live.staticflickr.com/${server}/${primary}_${secret}_n.jpg`
                    : "/images/no-image.svg",
                ogImage: primary
                    ? `https://live.staticflickr.com/${server}/${primary}_${secret}_b.jpg`
                    : "/images/no-image.svg",
            };
        })
    );

    // `Promise.allSettled` の結果をフィルタリングして取得
    const filteredAlbums = albums
        .filter((result) => result.status === "fulfilled")
        .map((result) => (result as PromiseFulfilledResult<Album>).value);

    // キャッシュに保存（SSGビルド中の重複呼び出しを防ぐ）
    globalThis.__albumsCache = filteredAlbums;

    return filteredAlbums;
}
