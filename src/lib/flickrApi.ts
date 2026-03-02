const FLICKR_BASE_URL = "https://www.flickr.com/services/rest/";

export const API_KEY = process.env.FLICKR_API_KEY;
export const USER_ID = process.env.FLICKR_USER_ID;
export const COLLECTION_ID = process.env.FLICKR_COLLECTION_ID;

/**
 * Flickr API の REST URL を構築する
 */
export function buildFlickrUrl(method: string, params?: Record<string, string>): string {
    const searchParams = new URLSearchParams({
        method,
        api_key: API_KEY || "",
        format: "json",
        nojsoncallback: "1",
        ...params,
    });
    return `${FLICKR_BASE_URL}?${searchParams.toString()}`;
}
