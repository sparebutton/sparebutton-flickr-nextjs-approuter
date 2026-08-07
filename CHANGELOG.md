# Changelog

## [0.2.5] - 2026-08-07

### Added

- `.github/workflows/purge-cloudflare-cache.yml` — 本番デプロイ完了時に Cloudflare のキャッシュを自動パージする GitHub Actions
  - Cloudflare 側に Cache Rule「Cache HTML (SSG)」を追加し、HTML をエッジに 1 時間キャッシュするようにしたため（従来は `cf-cache-status: DYNAMIC` で HTML が一切キャッシュされず、ゾーンのヒット率は 3.44% だった）
  - トリガーは `deployment_status`。`on: push` では Vercel のビルド完了前にパージが走り旧コンテンツを再キャッシュするだけになるため、Vercel が作成する GitHub Deployment の status が `success`（environment = `Production`）になるのを待つ
  - 必要な Secrets: `CLOUDFLARE_API_TOKEN`（ゾーン → キャッシュ パージ → パージ）、`CLOUDFLARE_ZONE_ID`
  - 手動実行用に `workflow_dispatch` も有効
  - 動作検証済み: 手動実行で Cloudflare API が `HTTP 200 {"success":true}` を返し、`cf-cache-status` が `HIT` → `MISS` → `HIT` と推移することを確認。`deployment_status` トリガーの起動も、Secrets 未設定時の失敗 run（本番デプロイ成功の 2 秒後に起動）で確認済み
- `.claude/memory/cloudflare-cache-and-purge.md` — キャッシュルールの各設定値を選んだ理由、パージ運用、Speed Brain の 503 挙動を記録

## [0.2.4] - 2026-08-07

### Changed

- `next` を 16.2.6 → 16.2.11 にアップグレード（GitHub Dependabot alerts 16 件 = 8 GHSA × 2 manifest に対応）
  - 対象 CVE: Server Actions の SSRF (CVE-2026-64649) / App Router Server Actions の DoS (CVE-2026-64641) / rewrites の SSRF (CVE-2026-64645) / Turbopack 利用時の Middleware・Proxy バイパス (CVE-2026-64642) / Image Optimization API の SVG DoS (CVE-2026-64644) / レスポンスボディの Cache confusion (CVE-2026-64647, CVE-2026-64648) / Server Function エンドポイントの未認証開示 (CVE-2026-64643)
  - いずれも Server Actions・Middleware・Image Optimization API といった Node ランタイム機能が対象。本プロジェクトは `output: "export"` の SSG + `images.unoptimized` で本番に Node サーバが存在しないため実害なし
  - Dependabot PR #1 と同内容
- `package.json` の `resolutions` を更新
  - `brace-expansion` を `^1.1.16` に引き上げ（実体: 1.1.18）— 連続する非展開文字の指数時間展開による DoS (CVE-2026-13149, High) 対応。`serve → serve-handler → minimatch` 経由の devDep のため実害なし
  - `postcss` を `^8.5.18` に引き上げ（実体: 8.5.26）— Previous Source Map 自動読み込みの Path Traversal (GHSA-r28c-9q8g-f849, High) 対応。ビルド時のみ動作しユーザー入力 CSS を扱わないため実害なし
  - `sharp` `^0.35.0` を新規追加（実体: 0.35.3）— libvips 由来の脆弱性 (GHSA-f88m-g3jw-g9cj, High) 対応。`next` の optionalDependency (`^0.34.5`) を range 外に強制上書きしているが、`images.unoptimized` + SSG で sharp を経由しないため影響なし。ビルド成功を確認済み

## [0.2.3] - 2026-08-07

### Fixed

- `ImageFadein` のフェードインが JS 前提だったため、画像が表示されないことがある不具合を修正
  - 書き出し HTML に `opacity-0` が焼き込まれており、ハイドレーションが完了しないと画像を取得できていても透明のまま残っていた（リロードで直る症状の原因）
  - SSR / 初回クライアントレンダリングは `opacity-100` で描画し、マウント後に未読み込みのものだけ透明化してフェードインさせる方式に変更
  - `imgRef.current.complete` を確認し、読み込み済み（キャッシュ等）の場合は `onLoad` を取りこぼしても表示を維持
  - 検証: 書き出し 36 ページの `opacity-0` が 0 件。`<script>` を全除去した HTML（＝JS が動かない状態）でも画像が表示されることを確認

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
