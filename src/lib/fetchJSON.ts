export const fetchJSON = async (url: string) => {
    const res = await fetch(url, { cache: "force-cache" }); // for SSG
    if (!res.ok) {
        console.error(`Flickr API Error: Failed to fetch ${url}`);
        return null;
    }
    return res.json();
};
