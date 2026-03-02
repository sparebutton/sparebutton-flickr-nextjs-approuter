/**
 * 改行を <br> に変換し、外部リンクに target="_blank" を付与
 */
export function formatDescription(html: string): string {
    return html.replace(/\n/g, "<br>").replace(/href="https?/g, 'target="_blank" href="https');
}

/**
 * HTMLタグ除去 + 改行→スペース変換（meta description 用）
 */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, "").replace(/\n/g, " ");
}
