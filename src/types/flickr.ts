export type Album = {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    ogImage: string;
};

export type Photo = {
    id: string;
    title: string;
    description?: string;
    isVideo: boolean;
    /** 表示用の画像 URL。動画の場合はポスター画像として使う */
    imageUrl: string;
    originalVideoUrl: string | null;
};
