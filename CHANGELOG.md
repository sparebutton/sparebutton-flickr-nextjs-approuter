# Changelog

## [0.2.0] - 2026-03-02

### Refactored

- **データ取得層の再構成**
  - `hooks/useFetchAlbums.tsx` → `lib/fetchAlbums.ts` に移動・リネーム（`use` プレフィックスはReact Hooks慣習のため削除）
  - `hooks/useFetchPhotos.tsx` → `lib/fetchPhotos.ts` に移動・リネーム
  - Flickr API URL構築の共通ヘルパー `lib/flickrApi.ts` を新設
  - `fetchJSON` にジェネリクスを追加し型安全性を向上
- **重複コードの共通化**
  - HTML変換処理（改行→`<br>`、外部リンク target 付与、タグ除去）を `lib/sanitizeHtml.ts` に抽出
- **コンポーネント改善**
  - `Header.tsx`: h1/div の重複JSXを動的タグ切り替えで統合
  - `ImageFadein.tsx`: 非推奨 `onLoadingComplete` → `onLoad` に変更
  - `Dialog.tsx`: `useEffect` 依存配列に不足していた `dialogId`, `closeAnimationClass` を追加
- **Tailwind CSS v4 構文更新**
  - `!font-bold` → `font-bold!`（important 修飾子の新構文）
  - `[&::backdrop]:` → `backdrop:`（短縮構文）

### Changed

- `next.config.ts`: サーバーサイドのみで使用する環境変数の冗長な `env` 設定を削除

### Removed

- `hooks/` ディレクトリ（`lib/` へ移動済み）
- `package.json.bak`, `yarn.lock.bak`（不要なバックアップファイル）

## [0.1.0] - Initial Release

- Flickr API を使ったアルバムコレクション表示
- Next.js App Router + SSG 構成
- Vercel デプロイ対応
