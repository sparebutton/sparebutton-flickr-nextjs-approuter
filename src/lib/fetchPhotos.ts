import fs from "fs";
import path from "path";
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
const PHOTO_EXTRAS = "url_m,url_z,url_c,url_l,url_o";

// 記事の横幅は最大 640px（`max-w-screen-sm`）
const DISPLAY_WIDTH = 640;

// 派生サイズの幅が「表示に必要な幅」のこの割合以上を保てるなら、原寸ではなく派生サイズを使う
const MIN_WIDTH_RATIO = 0.8;

// Flickr がレート制限しない派生サイズ（長辺 1024px 以下）を小さい順に並べたもの。
// 長辺 1024px を超えるサイズ（`url_h` / `url_k` / `url_o` など）はここに足さないこと。
const SAFE_SIZE_SUFFIXES = ["m", "z", "c", "l"] as const; // 長辺 500 / 640 / 800 / 1024

// 自前配信する原寸の置き場（`public/` 配下）
const LOCAL_ORIGINALS_DIR = "images/photos";

// Flickr が返す写真 1 件（利用する項目のみ）
type FlickrPhoto = {
    id: string;
    title?: string;
    secret: string;
    url_o?: string;
    width_o?: string | number;
} & Partial<Record<`url_${(typeof SAFE_SIZE_SUFFIXES)[number]}`, string>> &
    Partial<Record<`width_${(typeof SAFE_SIZE_SUFFIXES)[number]}`, string | number>>;

/**
 * 表示に使う画像 URL を選ぶ。
 *
 * **長辺 1024px を超えるサイズ（`_h` / `_k` / 原寸 `_o`）は極力使わない。** Flickr のオリジンはこれらだけを
 * レート制限しており、CloudFront のキャッシュに乗っていないものを要求すると `429 Too Many Requests` を返す。
 * 1024px 以下のサイズは制限されない（同条件で `_z` / `_c` / `_b` は全て 200、`_h` / `_k` / `_o` は全て 429）。
 * 1 ページに大サイズが数十枚あると、閲覧者の環境によっては大半が broken image になる。
 *
 * Flickr の派生サイズは**長辺**を基準に縮小されるため、縦長の写真ほど幅が狭くなる
 * （例: 680×13600 のスクロールポスターは長辺 1024px 版で 51×1024 になってしまう）。
 * そこで**幅**を基準に、制限されないサイズの中で最も幅の広いものを選ぶ。それでも表示幅に対して
 * 足りない超縦長の写真だけは原寸が要るが、原寸は制限対象なので Flickr からは配信せず、
 * `public/images/photos/` に置いたコピーを自前で配信する。
 *
 * コピーのファイル名は Flickr の原寸と同じ `<id>_<原寸の secret>_o.jpg` にする。Flickr 側で画像を差し替えると
 * secret が変わって名前が合わなくなるので、古いコピーを出し続けることがない。合うコピーが無い場合は
 * Flickr の原寸 URL を使い（表示されない可能性がある）、ビルド時に警告する。
 *
 * Flickr は拡大した派生サイズを作らないので、派生サイズが原寸より大きくなることはない。
 */
function pickImageUrl(photo: FlickrPhoto): string {
    // SAFE_SIZE_SUFFIXES が長辺の昇順なので、最後に見つかったものが最も幅が広い
    let widest: { url: string; width: number } | undefined;
    for (const suffix of SAFE_SIZE_SUFFIXES) {
        const url = photo[`url_${suffix}`];
        const width = Number(photo[`width_${suffix}`]) || 0;
        if (url && width) widest = { url, width };
    }

    // 原寸が表示幅より狭い写真は、原寸の幅が出ていれば十分
    const originalWidth = Number(photo.width_o) || DISPLAY_WIDTH;
    const requiredWidth = Math.min(originalWidth, DISPLAY_WIDTH) * MIN_WIDTH_RATIO;
    if (widest && (!photo.url_o || widest.width >= requiredWidth)) {
        return widest.url;
    }

    if (!photo.url_o) return "/images/no-image.svg";

    // このファイルはビルド時（SSG）にしか実行されないので、fs で public/ を直接確認できる
    const file = path.posix.basename(new URL(photo.url_o).pathname);
    if (fs.existsSync(path.join(process.cwd(), "public", LOCAL_ORIGINALS_DIR, file))) {
        return `/${LOCAL_ORIGINALS_DIR}/${file}`;
    }

    console.warn(
        `WARNING: Flickr の原寸に頼っている写真があります（レート制限の対象で、閲覧者によっては表示されません）: ` +
            `${photo.title || "Untitled"}（${photo.id}）。原寸をダウンロードして public/${LOCAL_ORIGINALS_DIR}/${file} に置いてください`
    );
    return photo.url_o;
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
