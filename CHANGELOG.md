# Changelog

## [0.2.14] - 2026-09-18

このリポジトリは同日に本番でなくなった（`www.sparebutton.jp` は vanilla 版が配信）。切り戻し先として vanilla 版と揃えておくための変更。

### Changed

- **原寸が要る 3 枚を自前配信に**（[public/images/photos/](public/images/photos/)、計約 6 MB）。680×13600 / 680×7705 のスクロールポスターと 680×1764 の 1 枚は、1024px 以下の派生サイズでは幅が足りず、0.2.12 でも Flickr の原寸 URL（レート制限の対象）に残していた。検証でもこの 3 枚だけが 429 で表示されないことがあった
  - [fetchPhotos.ts](src/lib/fetchPhotos.ts) の `pickImageUrl()` は、原寸が必要な写真について `public/images/photos/` に Flickr の原寸と同じ名前（`<id>_<原寸の secret>_o.jpg`）のファイルがあればそれを使う。Flickr 側で画像を差し替えると secret が変わって名前が合わなくなるため、古いコピーを出し続けることがない
  - 合うコピーが無い写真は従来どおり Flickr の原寸 URL を使い、ビルド時に `WARNING` でファイル名つきで知らせる
  - 結果: 716 枚の内訳は `_z` 434 / `_b` 217 / `_c` 61 / 500px 1 / 自前配信 3。**Flickr の 1024px 超に頼る写真は 0 枚**

### Verified

- `yarn lint` 0 件、`tsc --noEmit` 通過、`yarn build` 成功（36 ページ。`.next/cache` の fetch キャッシュから組み立てられ、Flickr API は呼んでいない = ログに API エラー 0 件）
- WebKit（WKWebView）で書き出し（`serve out`）を確認: `/72157659578261540` 3/3（680×13600 と 680×7705 が原寸でデコードされる）、`/72157660925233922` 58/58、`error` イベント 0 件

## [0.2.13] - 2026-09-18

姉妹プロジェクト（vanilla 版）と書き出し結果を機械的に比較して見つかった 2 件。

### Fixed

- トップページの `og:image` / `twitter:image` が `http://localhost:3000/images/og-image.png` になっており、SNS のプレビュー画像が壊れていた問題を修正（[layout.tsx](src/app/layout.tsx)）
  - `metadata` に `metadataBase` が無く、相対パスの `/images/og-image.png` がビルド時の既定値 `http://localhost:3000` で解決されていた。`yarn build` のたびに出ていた `metadataBase property in metadata export is not set` の警告がこれで、警告どまりと見て放置されていた
  - `metadataBase: new URL(Site.url)` を設定。アルバムページは Flickr の絶対 URL を使っているため影響を受けていなかった
- Flickr API の失敗時に、`api_key` を含む URL 全体がエラーログに出ていた問題を修正（[fetchJSON.ts](src/lib/fetchJSON.ts)）
  - Vercel のビルドログに API キーが残りえた。メソッド名と HTTP ステータスだけを出すように変更（例: `Flickr API Error: 503 flickr.photos.getInfo`）。戻り値（失敗時 `null`）やリトライなしの挙動は変えていない

### Verified

- `yarn lint` 0 件、`yarn build` 成功（36 ページ）。`metadataBase` の警告は 0 件に
- `out/index.html` の `og:image` / `twitter:image` が `https://www.sparebutton.jp/images/og-image.png` になり、書き出し全体に `localhost` を含むファイルが無いことを確認。アルバムページの OGP は変化なし
- `fetch` を 503 に差し替えて `fetchJSON` を呼び、ログに API キーが含まれないこと・戻り値が `null` のままであることを確認

## [0.2.12] - 2026-09-18

### Fixed

- Safari（Mac / iPhone）で多くの写真が「?」（broken image）になる問題を修正（[fetchPhotos.ts](src/lib/fetchPhotos.ts) の `pickImageUrl()`）
  - **真因は Flickr オリジンのレート制限**。対象は**長辺 1024px を超えるサイズ**（`_h` 1600 / `_k` 2048 / 原寸 `_o`）で、CloudFront のキャッシュに乗っていないものを要求するとオリジン（`server: Jubilee`）が `429 Too Many Requests` を返す（`x-cache: Error from cloudfront`、本文なし）。1024px 以下のサイズは制限されない
  - 従来は 716 枚中 **689 枚を原寸、27 枚を `_h` / `_k` で配信**しており、全写真が制限対象だった（原寸の幅が 680px 前後の写真が多く、「幅 1280px 以上の派生サイズ」が存在しないため `url_o` に落ちていた）。1 ページに最大 50 枚あり、制限に掛かると先頭の十数枚以降が全滅する
  - 0.2.8 で「iOS WebKit の一時失敗」と判断したのは誤りで、あのとき見えていた症状もこの 429 だった可能性が高い。[ImageLoadRetry.tsx](src/components/ui/ImageLoadRetry.tsx) のリトライ（1.5 秒 → 3 秒）は制限中に再要求するだけなので 429 のまま終わる（リトライ自体は保険として残す）
  - 選択ルールを変更: 制限されないサイズ（`url_m` 500 / `url_z` 640 / `url_c` 800 / `url_l` 1024）の中で最も幅の広いものを使う。それが表示に必要な幅（`min(原寸幅, 640px)` の 80%）に届かない超縦長の写真だけ原寸を使う。`MIN_WIDTH = 1280`（Retina 2 倍）の方針は、1024px 超が使えない以上達成できないため廃止
  - 結果: 1024px 超は **716 枚 → 3 枚**（1 ページ最大 2 枚。680×13600 / 680×7705 のスクロールポスターと 680×1764）。内訳は `_z` 434 / `_b` 217 / `_c` 61 / 500px 1 / `_o` 3
  - 画質への影響: 記事の表示幅は最大 640px。原寸 680px の写真は 640px（−6%）、縦長の 680×907 は 600px（−12%）、原寸 1360px 以上だった写真は 1024px（表示幅の 1.6 倍）になる

### Verified

- WKWebView（Safari と同じ WebKit + CFNetwork）でページを開き、全画像の `complete` / `naturalWidth` と `error` イベントを採取するスクリプトで検証。失敗時は同じ URL を `fetch()` してステータスを取得
  - 本番: `/72157650954683821` **0/26**、`/72157660152529176` **13/50**、`/72157680224496746` **1/5**（失敗は全て 429）
  - サイズ別の直接比較（同一ページ・未要求の写真）: `_z` 6/6・`_c` 6/6・`_b` 6/6 成功、`_h` 0/6・`_k` 0/2・`_o` 0/6
  - 途中の案（原寸だけを避けて `_h` / `_k` は使う）は `/72157680224496746` が 0/5 で失敗し、1024px 超すべてが対象だと判明した
  - 修正後の書き出し（`serve out`）を全 34 ページ総なめ: **683 枚中 680 枚成功**（`_z` 430 / `_b` 189 / `_c` 61 は全て成功）。失敗は原寸に残した 3 枚だけで、いずれも 429。検証時は調査のプローブで制限の枠を使い切った最悪条件だった
- `yarn lint` 0 件、`yarn build` 成功（36 ページ）

### Notes

- curl での再現には `Accept-Encoding: gzip, deflate, br` が必要。CloudFront のキャッシュキーに `Accept-Encoding` が含まれるため、付けないと別枠のキャッシュに HIT してオリジンまで届かず、常に 200 に見える（0.2.8 の「378/378 成功」もこれが理由だった可能性が高い）
- 制限の枠は IP だけでなくクライアントごとに分かれているらしく、ヘッダを揃えても結果が変わらない。同時刻に curl は `_h` が 200・`_o` が 429、WKWebView は両方 429、内蔵 Chromium は `_o` も 200 だった。**curl や Chrome で通っても Safari で通る保証にならない**ので、検証は WebKit で行う
- Flickr へのログインでは解消しない。ログイン後に一部のページが表示されるようになったのは、その画像が CloudFront のキャッシュに乗っただけ（未接触のアルバムは直後も全滅だった）
- 原寸に残した 3 枚は引き続き制限対象。確実に出したい場合は `public/` に置いて自前配信する手がある

## [0.2.11] - 2026-09-14

### Changed

- `next` 16.3.4 → **16.3.5**（`eslint-config-next` も同バージョンへ）
  - **セキュリティ修正ではなくパッチ追従**。16.3.5 は canary からの bug fix backport のみで、CVE / GHSA の記載はない
  - 内容: `next/image` のディスク LRU キャッシュで 0 バイトエントリをスキップ / 空画像を読み書き時に拒否、`output: 'standalone'` + adapter 使用時の server NFT 出力、loading・template ファイルの script タグへの CSP nonce 付与、`use cache` の prerender signal 保持の修正
  - 本プロジェクトは `output: "export"` + `images: { unoptimized: true }` のため、上記のいずれも実際の挙動には影響しない
- Dependabot からの CVE-2026-75604（critical, Next.js Windows ホスト上の RCE）のメール通知を受けて確認したが、**0.2.9 の `next` 16.3.4 への更新ですでに解消済み**（alert #99 / #100 は 2026-09-11 にクローズ済み）。`gh api` で全件確認し open アラートは 0 件。今回の更新はその確認のついでのパッチ追従

### Verified

- `yarn lint` 0 件、`yarn build` 成功（36 ページの静的書き出し、型チェック通過）
- 本番反映を確認: Vercel の Production デプロイ成功 → `purge-cloudflare-cache` ワークフロー成功（run `34786199728` / `headSha` がローカル HEAD `7c4a29d` と一致）→ `https://www.sparebutton.jp/` が 200 / `cf-cache-status: MISS` / `x-vercel-cache: MISS` / `age: 0`（パージ直後の再取得）

## [0.2.10] - 2026-09-11

### Changed

- `js-yaml` 4.3.1 → **4.3.2**（[package.json](package.json) の `resolutions` に追加）
  - GHSA-2883-xcg3-v3hh（high）— `maxTotalMergeKeys` が空のマッピングを数えないため、YAML のマージキーを悪用して `O(N*K)` の CPU 消費を強制できる（ReDoS 類似の DoS）。`>= 4.0.0, < 4.3.2` が対象
  - **本番に実害なし**。`eslint` → `@eslint/eslintrc` の transitive な devDependency で、`yarn lint` 実行時に自分のリポジトリ内の設定ファイルを読むためだけに使われる。信頼できない YAML を解析する経路がない
  - 0.2.9 の push 直後に依存グラフが再スキャンされて現れたアラート（0.2.9 の変更が持ち込んだものではなく、`js-yaml@4.3.1` は以前から lockfile にあった）
  - 親（`@eslint/eslintrc`）の要求は `^4.3.0` なので 4.3.2 で満たせる。メジャー跨ぎ（5.x）は避けた

### Verified

- `yarn lint` 0 件、`yarn build` 成功（36 ページ、型チェック通過）
- 0.2.9 の本番反映を確認: Vercel の Production デプロイ成功 → `purge-cloudflare-cache` ワークフロー成功 → `https://www.sparebutton.jp/` が 200 / `cf-cache-status: MISS` / `age: 0`（パージ直後の再取得）
- 0.2.10 も同様に本番反映を確認（Production デプロイ成功 → パージ成功 → 200 / `cf-cache-status: MISS`）。push 後に Dependabot のアラートが 0 件になったことも確認済み
- Dependabot PR #2（`baseline-browser-mapping`）は、同じ更新を `resolutions` で先に入れたため Dependabot 自身が superseded として自動クローズ（手動対応は不要だった）

## [0.2.9] - 2026-09-11

### Changed

- Dependabot の脆弱性アラート 6 件（critical 2 / high 1 / medium 1 の実体 4 種）を消化。**いずれも本番に実害はないが、運用ポリシー（アラート 0 件の維持）に従って追従**
  - `next` 16.2.11 → **16.3.4**（`eslint-config-next` も同バージョンへ）
    - GHSA-2xp9-vwfh-vxw4（critical）— Image Optimization API が AVIF を最適化する際に libheif 経由で RCE に至りうる。修正は 16.3.3 以降
    - GHSA-p293-qw3h-jr36（critical）— Windows 上でホストされたサーバーで RCE に至りうる。修正は 16.3.3 以降
    - **実害なしの根拠**: [next.config.ts](next.config.ts) が `output: "export"` + `images: { unoptimized: true }` のため、本番に Node サーバーも Image Optimization API も存在しない。ホストも Vercel（Linux）で Windows ではない
  - `sharp` 0.35.3 → **0.35.4**（[package.json](package.json) の `resolutions`。`@img/sharp-libvips-*` も 1.3.2 → 1.3.3）
    - GHSA-rgj7-g3m4-5g8c（high）— 同梱 libheif の脆弱性（CVE-2026-84383 / GHSA-g89c-p67h-r497 / GHSA-2jg2-4ch7-h545）。`< 0.35.4` が対象で、0.35.4 が libheif 1.23.2 を同梱して解消。上記 Next.js の critical と根本原因は同一
    - **実害なしの根拠**: `next` の transitive 依存だが、画像最適化を無効にしているため `sharp` による変換自体が一度も走らない
  - `baseline-browser-mapping` 2.10.31 → **2.11.22**（`resolutions` を新規追加）
    - GHSA-w5vr-8v7q-w6rv（medium）— 不正な入力で例外ではなく `process.exit()` を呼び DoS になる。`>= 2.0.0, < 2.11.0` が対象
    - **実害なしの根拠**: `next` / `browserslist` がビルド時にのみ使うツール。ランタイムには含まれない
    - `yarn upgrade <pkg>` は直接依存しか対象にしないため lockfile が更新されず、`resolutions` で固定した（transitive 依存の既定パターン）
  - Dependabot の自動 PR は `resolutions` で固定した transitive 依存には出せないため、`sharp` は手動対応。`baseline-browser-mapping` の自動 PR（#2）は本コミットで内容が重複するため不要

### Verified

- `yarn lint` 0 件、`yarn build` 成功（36 ページの静的書き出し、型チェック通過）
- `serve out`（`flickr-export`）でトップページとアルバムページを表示確認。画像の表示・コンソールエラーなし。Next 16.2 → 16.3 のマイナー更新による表示・出力の変化は認められず

## [0.2.8] - 2026-08-20

### Added

- iOS（WebKit）で一部の画像がまれに「?」（broken image）のまま残る問題への対策として、ロード失敗画像の自動リトライを追加（[ImageLoadRetry.tsx](src/components/ui/ImageLoadRetry.tsx) を新規作成し [layout.tsx](src/app/layout.tsx) に配置）
  - iOS の WebKit は画像ロードの一時的な失敗（電波の瞬断・リソース逼迫など）を自動リトライせず broken image で確定させ、失敗結果をタブのメモリキャッシュに保持することがある（リロードで直らない場合があるのはこのため）。Mac の Safari では再現せず、iPhone では失敗する画像が毎回変わる
  - `document` への capture リスナーで全画像の `error` を一括監視し、1.5 秒 → 3 秒の間隔で最大 2 回、`?retry=N` を付けて再リクエストする。同一 URL の再設定では WebKit が失敗結果をキャッシュから返すことがあるためクエリを変える（Flickr の画像 CDN がクエリ付きでも同一画像を 200 で返すことは確認済み）
  - ハイドレーション前に失敗が確定した画像は `error` イベントを取りこぼすため、マウント時に `complete && naturalWidth === 0` を走査して回収する（CLAUDE.md ルール 8 の `load` と同じ構図）
  - JS が動かない環境ではリトライが省略されるだけで表示は従来と同一（プリレンダー出力に変化なし）
  - 調査で除外した原因: **Cloudflare**（画像は `live.staticflickr.com` = Flickr 自身の CloudFront 直配信で Cloudflare を経由しない。HTML もデスクトップ / iOS UA でバイト単位一致、Rocket Loader / Mirage / Polish の注入・有効化なし）、**Flickr CDN の恒常的エラー**（ページ内全 126 画像 × 3 ラウンドの一斉取得で 378/378 成功・最大 0.73 秒）、**画像自体の破損**（該当画像は 680×453・85KB の正常な JPEG）

## [0.2.7] - 2026-08-07

### Added

- `.claude/launch.json` — Claude Code のプレビュー用サーバー定義
  - `flickr-dev`（`yarn dev` / 3000）と `flickr-export`（`serve out` / 3001）の 2 つ
  - `flickr-export` は実際に Vercel へデプロイされるものと同じ静的 HTML を検証するためのもの。dev サーバーでは書き出し結果を確認できない
- `.claude/docs-hygiene.conf` — update-docs スキルの衛生ゲート設定
  - しきい値は既定のまま。このファイルの存在自体が SessionStart フックの門番になっており、無いとメモリ symlink の自動確立が発火しない

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
