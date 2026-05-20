# Changelog

## [0.2.2] - 2026-05-21

### Changed

- `package.json` の `resolutions` に `brace-expansion: ^1.1.13` を追加（実体: 1.1.14）
  - `serve → serve-handler → minimatch → brace-expansion` 経由の Zero-step sequence による DoS (CVE-2026-33750, Moderate) 対応
  - `minimatch` 3.x が `^1.1.7` を要求するため 1.1.x ラインで固定（メジャー 5.x 跨ぎは互換性リスクあり）
  - `serve` 系列は devDep のため実害なし

## [0.2.1] - 2026-05-21

### Changed

- `next` を 16.1.6 → 16.2.6 にアップグレード（GitHub Dependabot alerts 対応）
  - 対象 CVE: WebSocket upgrade 経由の SSRF、Middleware/Proxy バイパス、Cache Components の DoS など
  - 本プロジェクトは `output: "export"` の SSG 構成で Vercel ホスティングのため本番への実害はないが、アラート消化のため追従
- `package.json` の `resolutions` で transitive 依存を強制更新
  - `minimatch` を `^3.1.3` に固定（実体: 3.1.5）— `serve` 経由の ReDoS (GHSA, High) 対応。`serve` はローカルプレビュー専用 devDep のため実害なし
  - `postcss` を `^8.5.10` に固定（実体: 8.5.15）— `next` 経由の XSS via `</style>` (CVE-2026-41305, Moderate) 対応。SSG ビルド時にユーザー入力 CSS を扱わないため実害なし

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
