# CLAUDE.md — Claude Code 向け索引

> 本ファイルは Claude Code が毎ターン自動ロードする索引です。
> **重要ルール**と**ドキュメント地図**のみを置き、詳細は各ソースを参照してください。

---

## 🧭 プロジェクト概要

**SPAREBUTTON (https://www.sparebutton.jp)** の Flickr コレクション表示用 Next.js サイト。Flickr API からアルバム・写真を取得し、完全 SSG として静的書き出し → Vercel デプロイ。

- **技術スタック**: Next.js 16 (App Router, `output: "export"`) / React 19 / TypeScript / Tailwind CSS v4 / Zustand
- **主要ディレクトリ**:
  - [src/app/](src/app/) — App Router ルート（`/` と `/[albumId]`）
  - [src/lib/](src/lib/) — Flickr API データ取得・ヘルパー（`fetchAlbums`, `fetchPhotos`, `flickrApi`, `fetchJSON`, `sanitizeHtml`）
  - [src/components/](src/components/) — レイアウト・UI コンポーネント
  - [src/config/](src/config/) — サイト定数・フォント設定
  - [src/stores/](src/stores/) — Zustand ストア

---

## ⚠️ 常に守るべきルール

1. **SSG 専用構成** — [next.config.ts](next.config.ts) で `output: "export"` 固定。サーバーサイド機能（Route Handlers の動的レスポンス・`revalidate` 等）は使えない。Flickr API 呼び出しは**全てビルド時**に行う前提で書く。
2. **データ取得は `src/lib/` に集約** — 旧 `hooks/useFetch*` は [src/lib/fetchAlbums.ts](src/lib/fetchAlbums.ts) / [src/lib/fetchPhotos.ts](src/lib/fetchPhotos.ts) に移動済み。React Hook ではなく純粋な非同期関数なので `use` プレフィックスを付けない。
3. **Flickr API URL は共通ヘルパー経由** — [src/lib/flickrApi.ts](src/lib/flickrApi.ts) の `buildFlickrUrl` を使い、エンドポイント・キー・形式パラメータの直書きを避ける。
    - **画像 URL は組み立てない** — Flickr はサイズごとに secret が異なるため、`extras` で受け取った `url_o` / `url_l` / `url_h` / `url_k` をそのまま使う。
    - **派生サイズは長辺基準で縮小される** — 縦長画像を長辺で選ぶと幅が足りなくなる（680×13600 → 長辺 1600px 版は 80×1600）。選択は必ず**幅**（`width_*`）で判定する。[fetchPhotos.ts](src/lib/fetchPhotos.ts) の `pickImageUrl()` を使う。
    - **`extras=description` を使わない** — `flickr.photos.getInfo` と値が食い違う（全文字間に U+200B が入る写真がある / 外部リンクの `rel` が異なる）。説明文は `getInfo` から取る。
4. **HTML サニタイズは `sanitizeHtml.ts`** — 改行→`<br>` 変換、外部リンクへの `target="_blank"`/`rel` 付与、タグ除去は [src/lib/sanitizeHtml.ts](src/lib/sanitizeHtml.ts) を使う。コンポーネント内で重複実装しない。
5. **Tailwind CSS v4 の新構文に従う**
    - important 修飾子: `!font-bold` ❌ → `font-bold!` ✅
    - backdrop 擬似要素: `[&::backdrop]:` ❌ → `backdrop:` ✅
    - PostCSS プラグインは `@tailwindcss/postcss`
6. **環境変数はサーバー（ビルド）側のみ** — `FLICKR_API_KEY` / `FLICKR_USER_ID` / `FLICKR_COLLECTION_ID` はクライアントに露出させない。`NEXT_PUBLIC_` プレフィックスを付けず、ビルド時取得の関数内でのみ参照する。
7. **`useEffect` の依存配列を省略しない** — [src/components/ui/Dialog.tsx](src/components/ui/Dialog.tsx) で過去に依存漏れバグが発生済み。新規追加時は ESLint exhaustive-deps を守る。
8. **要素の可視性を JS やイベントに依存させない** — [src/components/ui/ImageFadein.tsx](src/components/ui/ImageFadein.tsx) で `opacity-0` が静的 HTML に焼き込まれ、ハイドレーション未完了・JS 取得失敗時に画像が透明のまま残る不具合が発生済み。完全 SSG なので **JS が動かなくても中身が見える初期状態**にし、演出はマウント後に足す。`opacity-0` / `invisible` / `h-0` 等を初期 state で描画していないか確認する。
    - マウント後も同様。**「隠しておいてイベントで戻す」を書かない**（イベントを取りこぼすと戻らず、リロードするまで消えたままになる）。「常に見える状態に、演出だけを一度足す」形にする。`onLoad` で `opacity-0` → `opacity-100` に戻す実装が典型的な NG 例で、代わりに `load` 時に `animate-fade-in` を一度当てる。
    - React の `onLoad` は**ハイドレーション前に発火した `load` を取りこぼす**。画像の読み込み完了を見るときは `img.complete` の確認か DOM の `load` の直接購読を使う。

---

## 📚 ドキュメント地図

| タスク | 読むべきドキュメント |
|---|---|
| 初回セットアップ・実行方法 | [README.md](README.md) |
| 変更履歴・過去の経緯 | [CHANGELOG.md](CHANGELOG.md) |

---

## 📝 更新ポリシー

| タイミング | 更新対象 |
|---|---|
| 機能追加・仕様変更 | [CHANGELOG.md](CHANGELOG.md) に日付付きで追記 |
| 設定値・定数変更 | [src/config/Site.ts](src/config/Site.ts) 等のソース + CHANGELOG |
| プロジェクト固有の地雷を踏んだ | このファイルの「常に守るべきルール」に追記 |

### CHANGELOG.md のスタイル

既存エントリ（[CHANGELOG.md](CHANGELOG.md)）が `## [x.y.z] - YYYY-MM-DD` + `### Refactored / Changed / Removed / Added` 形式なので、これに合わせる。

---

## 🧠 永続メモリ

ユーザー・環境・プロジェクトに関する永続情報は [.claude/memory/](.claude/memory/) に保存されています。[MEMORY.md](.claude/memory/MEMORY.md) が索引です。CLAUDE.md には書かず、メモリ側に集約してください。
