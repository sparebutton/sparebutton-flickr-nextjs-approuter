import { Photo } from "@/types/flickr";
import { fetchJSON } from "@/lib/fetchJSON";
import { buildFlickrUrl, USER_ID } from "@/lib/flickrApi";

// メモリキャッシュを作成（SSGビルド時のみ保持）
declare global {
    var __photosCache: Record<string, Photo[]> | null;
}

if (!globalThis.__photosCache) {
    globalThis.__photosCache = {};
}

// アルバム内のすべての写真を取得
export async function fetchPhotos(albumId: string): Promise<Photo[]> {
    // すでにキャッシュされている場合、それを返す
    if (globalThis.__photosCache?.[albumId]) {
        return globalThis.__photosCache[albumId];
    }

    // `flickr.photosets.getPhotos` でアルバムの写真リストを取得
    const photosData = await fetchJSON<{
        photoset?: {
            photo?: Array<{ id: string; title: string; server: string; secret: string }>;
        };
    }>(
        buildFlickrUrl("flickr.photosets.getPhotos", {
            photoset_id: albumId,
            user_id: USER_ID || "",
            extras: "title,description,url_l,media",
        })
    );

    if (!photosData?.photoset?.photo) {
        console.error(`Flickr API Error: Failed to fetch photos for album ${albumId}`);
        return [];
    }

    // 各写真の詳細情報を取得
    const photos: Photo[] = await Promise.all(
        photosData.photoset.photo.map(async (photo) => {
            const photoData = await fetchJSON<{
                photo?: {
                    description?: { _content?: string };
                    media?: string;
                    originalsecret?: string;
                };
            }>(
                buildFlickrUrl("flickr.photos.getInfo", {
                    photo_id: photo.id,
                })
            );

            return {
                id: photo.id,
                title: photo.title || "Untitled",
                description: photoData?.photo?.description?._content || "",
                isVideo: photoData?.photo?.media === "video",
                imageUrl: `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_q.jpg`,
                originalImageUrl: `https://live.staticflickr.com/${photo.server}/${photo.id}_${photoData?.photo?.originalsecret}_o.jpg`,
                originalVideoUrl:
                    photoData?.photo?.media === "video"
                        ? `https://www.flickr.com/photos/${USER_ID}/${photo.id}/play/site/${photo.secret}/`
                        : null,
            };
        })
    );

    // キャッシュに保存（SSGビルド中の重複呼び出しを防ぐ）
    if (globalThis.__photosCache) {
        globalThis.__photosCache[albumId] = photos;
    }

    return photos;
}
