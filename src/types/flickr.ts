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
    imageUrl: string;
    description?: string;
    isVideo: boolean;
    originalImageUrl: string;
    originalVideoUrl: string | null;
};
