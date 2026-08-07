# Changelog

## [0.2.7] - 2026-08-07

### Fixed

- `yarn lint` が動作しなかった問題を修正（Next 16 で `next lint` が削除されているため `Invalid project directory provided, no such directory: .../lint` で失敗していた）
  - ESLint 9 + `eslint-config-next` 16.2.11 を devDependencies に追加し、[eslint.config.mjs](eslint.config.mjs)（flat config）を新規作成。`lint` スクリプトを `eslint .` に変更
  - `eslint-config-next` は flat config の配列をそのまま export しているため `@eslint/eslintrc` の FlatCompat は不要
  - ビルド成果物（`.next` / `out` / `.vercel` / `.netlify` 等）を `ignores` に指定。指定前は書き出し済み JS を走査して 2655 件を報告していた
  - 検出された警告 1 件を修正: [useDialogStore.ts](src/stores/useDialogStore.ts) の未使用引数 `get` を削除
  - 現在の検出結果は 0 件（error / warning とも）

### Changed

- 表示に使う画像を、写真ごとに適正なサイズへ切り替え（[fetchPhotos.ts](src/lib/fetchPhotos.ts)）
  - 従来は常に原寸（`_o`）を配信しており、記事の最大幅 640px に対して最大 2618px の画像を送っていた
  - Flickr の派生サイズは**長辺**基準で縮小されるため、長辺で選ぶと縦長写真の幅が不足する（680×13600 のスクロールポスターは長辺 1600px 版だと 80×1600 になる）。そこで **幅**を基準に、`MIN_WIDTH`（1280px = 記事幅 640px の 2 倍）以上を保てる最小の派生サイズを選び、該当が無ければ原寸を使う `pickImageUrl()` を追加
  - 画像 URL はサイズごとに secret が異なり組み立てられないため、`extras` で受け取った `url_*` をそのまま使う。これにより `originalsecret` からの URL 組み立てと `.jpg` 決め打ちも不要になった
  - 結果: 716 枚中 27 枚が縮小（1920×1080 → 1600px 等）、689 枚は原寸のまま、**幅が不足するものは 0 枚**。実バイト例: 2618×2368 の写真で 684KB → 277KB（−60%）
  - 型 `Photo` の `originalImageUrl` を `imageUrl` にリネームし、未使用だった旧 `imageUrl`（`_q` サムネイル）を削除

### Notes

- `flickr.photosets.getPhotos` の `extras=description` は `flickr.photos.getInfo` の値と一致しないため採用を見送った（写真ごとの getInfo 呼び出しを 716 回削減できるはずだった）
  - 全文字の間に U+200B（ゼロ幅スペース）が挿入される写真がある（32 件中 3 件）
  - 外部リンクの `rel` 属性が異なる（`nofollow` / `noreferrer nofollow`、32 件中 8 件）
  - 検証: 書き出し 33 ページのテキストが本番と完全一致、U+200B は 0 件

## [0.2.6] - 2026-08-07

### Changed

- `ImageFadein` を「読み込むまで透明にしておく」方式から「読み込めたら一度だけフェードのアニメーションを流す」方式に変更
  - 0.2.3 で書き出し HTML からは `opacity-0` を除去したが、ハイドレーション後は未読み込みの画像を `opacity-0` にして `onLoad` の発火を待つ作りが残っていた。`onLoad` を取りこぼすと画像が透明のまま固定され、親の `bg-image`（`--color-image` = `neutral-200`）が見えてグレーの箱になる
  - `<img>` は読み込みが終わるまで何も描画しないため初期状態を透明にする必要がない。常に不透明のまま置き、`load` 時に既存の `animate-fade-in`（[src/css/utils/keyframes.css](src/css/utils/keyframes.css)）を一度だけ当てる方式にした。**イベントを取りこぼしても演出が省略されるだけで、画像が消えることはない**
  - React の `onLoad` はハイドレーション前に発火した `load` を取りこぼすため、DOM の `load` を直接購読する。state を持たず `classList` を直接触るのは、ハンドラ内で同期的にクラスを当てて「描画されてから透明になる」ちらつきを防ぐため
  - 併せて `containerClassName` 未指定時に `class="bg-image undefined"` となる箇所を修正
  - 検証: 書き出し 36 ページで画像を隠す指定（`opacity-0` / `invisible` / `display:none` / `visibility:hidden`）が 0 件。実ブラウザで 56 枚のアルバムを全スクロールし、全 56 枚が読み込み完了 + 全 56 枚にフェードクラス付与、スクロール中 25 時点のサンプリングで「フェード中でないのに不透明度 1 未満」の画像が 0 件であることを確認

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
