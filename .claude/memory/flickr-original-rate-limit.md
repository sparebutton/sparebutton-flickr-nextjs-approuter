---
name: flickr-original-rate-limit
description: Flickr のオリジンは長辺 1024px 超のサイズ（_h / _k / 原寸 _o）だけを 429 でレート制限する。Safari で写真が軒並み ? になった真因と、curl / Chrome では再現しない理由、WKWebView での再現・検証手順
metadata:
  type: project
---

# Flickr は長辺 1024px 超のサイズだけを 429 でレート制限する

2026-09-18 特定。「Mac / iPhone の Safari で写真が ? になる、Chrome では出る」の真因。

## 事実

- 429 を返すのは CloudFront ではなく **Flickr のオリジン**（`server: Jubilee` / `x-cache: Error from cloudfront` / 本文なし）
- 対象は **長辺 1024px 超のサイズ**（`_h` 1600 / `_k` 2048 / 原寸 `_o`）。`_b`（1024）以下は制限されない。WKWebView で同一ページ・未要求の写真を比較: `_z` `_c` `_b` は 18/18 成功、`_h` `_k` `_o` は 0/14
- CloudFront に HIT すればオリジンを通らないので 200。アクセスの少ないサイトはほぼ MISS になる
- 制限中は 1 秒 1 件の低頻度でも 429 が続き、10 分以上解けなかった。[ImageLoadRetry.tsx](../../src/components/ui/ImageLoadRetry.tsx) のリトライでは回収できない

**Why:** 0.2.8（2026-08-20）では「iOS WebKit の一時失敗」と誤診した。さらに 2026-09-18 の調査中も、最初は「原寸だけが対象」と早合点して `_h` / `_k` を使う修正を作り、WebKit での再検証で 0/5 になって気づいた。curl では `_h` が 200 で通っていたのが原因。

**How to apply:** 写真が出ない報告を受けたら、デコードや回線を疑う前に**ステータスコードを見る**。対策は 1024px 超を使わないこと（[fetchPhotos.ts](../../src/lib/fetchPhotos.ts) の `pickImageUrl()` / `SAFE_SIZE_SUFFIXES`、CHANGELOG 0.2.12）。原寸に残すのは派生サイズでは幅が足りない超縦長の 3 枚だけ。`SAFE_SIZE_SUFFIXES` に `h` / `k` を足さない。

## 再現と検証のコツ

- **検証は必ず WebKit で行う。** 制限の枠は IP だけでなくクライアントごとに分かれているらしく、ヘッダを Safari と同一にしても curl の結果は Safari と一致しない。同時刻に curl は `_h` 200・`_o` 429、WKWebView は両方 429、内蔵 Chromium（`no-store`）は `_o` も 200 だった。内蔵ブラウザは Chromium なので WebKit の代わりにならない
- **WKWebView で再現できる**（Safari と同じ WebKit + CFNetwork。Xcode があれば `swiftc` で単体バイナリにできる）。document-start の UserScript で `img` の `load` / `error` を capture で記録し、`error` 時に同じ URL を `fetch(src, { cache: 'no-store' })` してステータスを取る。CDN が `access-control-allow-origin: *` を返すので読める。lazy 画像を読ませるために window に載せて下までスクロールする
- curl で見るなら `-H 'Accept-Encoding: gzip, deflate, br'` を付ける。CloudFront のキャッシュキーに含まれるため、付けないとオリジンまで届かない。`x-cache: Hit` の 200 は何の証拠にもならない
- 調査のプローブ自体が枠を消費する。同じ IP のユーザーの Safari も巻き添えになるので回数は絞る

## 分かっていないこと

- 制限のキーと回復時間。Flickr が 2025 年に打ち出した「1024px 超の大サイズの制限」と符合するが、公式な仕様は未確認
- ユーザーが Flickr にログインした直後に一部のページが直ったが、因果はない（未接触のアルバムは直後も 0/26）。直ったページは CloudFront に乗っただけ

## 関連

- [[cloudflare-cache-and-purge]] — 写真は Cloudflare を通らない（容疑者から外してよい）
- [[stale-view-diagnosis]] — 「見え方がおかしい」ときのもう一つの切り分け
