export async function fetchJSON<T = unknown>(url: string): Promise<T | null> {
    const res = await fetch(url, { cache: "force-cache" }); // for SSG
    if (!res.ok) {
        // URL には api_key が含まれるため、ビルドログにはメソッド名とステータスだけを出す
        const method = new URL(url).searchParams.get("method") || url.split("?")[0];
        console.error(`Flickr API Error: ${res.status} ${method}`);
        return null;
    }
    return res.json() as Promise<T>;
}
