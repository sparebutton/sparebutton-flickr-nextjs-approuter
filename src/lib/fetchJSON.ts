export async function fetchJSON<T = unknown>(url: string): Promise<T | null> {
    const res = await fetch(url, { cache: "force-cache" }); // for SSG
    if (!res.ok) {
        console.error(`Flickr API Error: Failed to fetch ${url}`);
        return null;
    }
    return res.json() as Promise<T>;
}
