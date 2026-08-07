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

// 画像 URL はサイズごとに secret が異なり組み立てられないため、API が返す url_* をそのまま使う。
// url_* を要求すると width_* / height_* も一緒に返る。
//
// なお `description` も extras で取得できるが、`flickr.photos.getInfo` の値と一致しないため使わない
// （全文字の間に U+200B が挿入される写真がある / 外部リンクの rel 属性が異なる）。
const PHOTO_EXTRAS = "url_l,url_h,url_k,url_o";

// 記事の横幅は最大 640px（`max-w-screen-sm`）。Retina で 2 倍を確保するため 1280px を下限とする。
const MIN_WIDTH = 1280;

// Flickr の派生サイズ（長辺基準）を小さい順に並べたもの
const SIZE_SUFFIXES = ["l", "h", "k"] as const; // 長辺 1024 / 1600 / 2048

// Flickr が返す写真 1 件（利用する項目のみ）
type FlickrPhoto = {
    id: string;
    title?: string;
    secret: string;
    url_o?: string;
    width_o?: string | number;
} & Partial<Record<`url_${(typeof SIZE_SUFFIXES)[number]}`, string>> &
    Partial<Record<`width_${(typeof SIZE_SUFFIXES)[number]}`, string | number>>;

/**
 * 表示に使う画像 URL を選ぶ。
 *
 * Flickr の派生サイズは**長辺**を基準に縮小されるため、縦長の写真では長辺で選ぶと幅が足りなくなる
 * （例: 680×13600 のスクロールポスターは長辺 1600px 版で 80×1600 になってしまう）。
 * そこで「幅が MIN_WIDTH 以上を保てる最小の派生サイズ」を選び、該当が無ければ原寸を使う。
 * 原寸より大きくなる選択はしないので、変更前より画質が落ちることはない。
 */
function pickImageUrl(photo: FlickrPhoto): string {
    const originalWidth = Number(photo.width_o) || 0;

    for (const suffix of SIZE_SUFFIXES) {
        const url = photo[`url_${suffix}`];
        const width = Number(photo[`width_${suffix}`]) || 0;
        if (url && width >= MIN_WIDTH && (!originalWidth || width < originalWidth)) {
            return url;
        }
    }

    return photo.url_o || "/images/no-image.svg";
}

// アルバム内のすべての写真を取得
export async function fetchPhotos(albumId: string): Promise<Photo[]> {
    // すでにキャッシュされている場合、それを返す
    if (globalThis.__photosCache?.[albumId]) {
        return globalThis.__photosCache[albumId];
    }

    // `flickr.photosets.getPhotos` でアルバムの写真リストを取得
    const photosData = await fetchJSON<{ photoset?: { photo?: FlickrPhoto[] } }>(
        buildFlickrUrl("flickr.photosets.getPhotos", {
            photoset_id: albumId,
            user_id: USER_ID || "",
            extras: PHOTO_EXTRAS,
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
                };
            }>(
                buildFlickrUrl("flickr.photos.getInfo", {
                    photo_id: photo.id,
                })
            );

            const isVideo = photoData?.photo?.media === "video";

            return {
                id: photo.id,
                title: photo.title || "Untitled",
                description: photoData?.photo?.description?._content || "",
                isVideo,
                imageUrl: pickImageUrl(photo),
                originalVideoUrl: isVideo
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
