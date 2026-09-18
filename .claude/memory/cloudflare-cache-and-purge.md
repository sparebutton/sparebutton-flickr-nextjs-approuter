---
name: cloudflare-cache-and-purge
description: Cloudflare の Cache Rule で HTML をエッジに 1 時間キャッシュしている。デプロイ後はパージが必要で GitHub Actions で自動化済み。各設定値を選んだ理由と Speed Brain の挙動も記録
metadata: 
  node_type: memory
  type: project
  originSessionId: b5a4b757-11dd-4ba9-ba5f-7bc585ad6472
  modified: 2026-08-19T21:45:28.540Z
---

# Cloudflare キャッシュ構成とデプロイ時のパージ

2026-08-07 導入。それ以前は HTML が一切エッジキャッシュされず（`cf-cache-status: DYNAMIC`）、ゾーン全体のキャッシュヒット率が 3.44% だった。

## 構成

`www.sparebutton.jp` は **Cloudflare（プロキシ）→ Vercel** の 2 段構成。Vercel は HTML に `cache-control: public, max-age=0, must-revalidate` を返すため、Cloudflare は既定では HTML をキャッシュしない。

Cache Rule **「Cache HTML (SSG)」**（ルール → キャッシュ ルール）:

| 項目 | 値 |
|---|---|
| 式 | `(http.host eq "www.sparebutton.jp" and not starts_with(http.request.uri.path, "/_next/"))` |
| キャッシュの適格性 | キャッシュの対象 |
| エッジ TTL | `override_origin`（キャッシュ制御ヘッダーを無視）／ 1 時間 |
| ブラウザ TTL | `respect_origin`（オリジン TTL を尊重） |

**Why:** 3 つの設定にはそれぞれ理由がある。

- **エッジ TTL が `override_origin` でないと機能しない** — `respect_origin` 系を選ぶとオリジンの `max-age=0` が勝ち、何もキャッシュされない
- **`/_next/` を除外する** — TTL 上書きは一致した全リクエストに効くため、除外しないと `/_next/static/*` の `max-age=31536000, immutable` まで 1 時間に落ちる
- **ブラウザ TTL は `respect_origin`** — `override_origin` にすると訪問者のブラウザにも焼き付き、Cloudflare のパージでは消せなくなる

キャッシュキーはデフォルトで安全。同一 URL でレスポンスが分岐しないこと（`vary` が `accept-encoding` のみ、`RSC: 1` ヘッダを付けても中身が同一）を確認済み。RSC プリフェッチは `?_rsc=<ビルド固有ハッシュ>` 付き URL なのでデプロイをまたいだ混線も起きない。

**How to apply:** ルールを変更したら `curl -sI <URL> | grep cf-cache-status` で `MISS` → `HIT` を確認し、あわせて `/_next/static/*` が `immutable` のままかを確認する。

## デプロイ時のパージ

**HTML をエッジに 1 時間持つため、デプロイ後はパージしないと最大 1 時間は旧コンテンツが配信される。**

[.github/workflows/purge-cloudflare-cache.yml](../../.github/workflows/purge-cloudflare-cache.yml) が自動化済み。Vercel が作成する GitHub Deployment の status が `success`（environment = `Production`）になったタイミングで `purge_everything` を叩く。

**Why:** `on: push` にすると Vercel のビルド完了前にパージが走り、旧コンテンツを再キャッシュするだけで意味がない。Vercel の GitHub 連携が張る Deployment を待つのが、Vercel API トークンなしで完了を検知できる唯一の手段。

**How to apply（完了確認）:** パージ run の特定は**日付で絞らず `headSha` をローカル HEAD と照合する**。

```bash
gh run list --limit 5   # Purge Cloudflare cache / event=deployment_status の行を見る
gh run view <id> --json headSha,conclusion -q '"\(.headSha) \(.conclusion)"'
git rev-parse HEAD      # 一致すれば自分の push に対応する run
curl -sS -o /dev/null -D - https://www.sparebutton.jp/ | grep -iE '^HTTP|cf-cache-status|^age:'
```

`gh run list` の `createdAt` は **UTC**。JST 早朝の push は UTC では前日の日付になるため、「今日」を JST の日付で書いて絞ると**成功している run にマッチせず永久に待つ**（2026-09-14 に実際に空振りした: run は JST 07:14 = `2026-09-13T22:14:36Z`）。パージ直後は `cf-cache-status: MISS` / `age: 0` になる。

**How to apply:** 必要な Secrets は `CLOUDFLARE_API_TOKEN`（権限: ゾーン → キャッシュ パージ → パージ / リソース: sparebutton.jp のみ）と `CLOUDFLARE_ZONE_ID`。手動実行は Actions タブの `workflow_dispatch`、またはダッシュボードの キャッシュ → 構成 → すべてをパージ。

## Speed Brain（投機プリフェッチ）の挙動

Speed Brain は**そのエッジにキャッシュ済みのページしか投機配信しない**。未キャッシュのページに `Sec-Purpose: prefetch` が来ると `503` + `cf-speculation-refused: prefetch refused: not eligible` を返す。

**Why:** キャッシュルール導入前は HTML が常に未キャッシュだったため、**全てのプリフェッチが 503** になっていた。ブラウザは通常ナビゲーションにフォールバックするので実害はないが、ネットワークログが 503 だらけになり障害と誤認しやすい。

**How to apply:** 503 を見つけても `cf-speculation-refused` ヘッダが付いていれば正常動作。アクセスのあるページから順に 200 に変わる。

## このゾーンが扱うのは HTML だけ（写真は通らない）

写真は `live.staticflickr.com`（Flickr 自身の CloudFront）から直接配信され、Cloudflare は一切関与しない。画像の表示不良では Cloudflare を容疑者から即外してよい。

2026-08-20 の「iOS だけ一部の画像が ? になる」問題で確認済み: HTML はデスクトップ/iOS UA でバイト一致（UA 分岐・Rocket Loader/Mirage/Polish の注入なし）。このとき真因を「iOS WebKit の一時失敗」とし `src/components/ui/ImageLoadRetry.tsx` を入れたが（CHANGELOG 0.2.8）、**これは誤診だった**。2026-09-18 に Mac の Safari でも再現し、真因は Flickr オリジンが長辺 1024px 超のサイズ（`_h` / `_k` / 原寸 `_o`）だけを 429 でレート制限することだと判明 → [[flickr-original-rate-limit]]。Cloudflare が無関係という結論は変わらない。

## 関連

- [[dependency-vuln-handling]] — 同じく本番構成（SSG + Vercel）に依存した判断を含む
- [[stale-view-diagnosis]] — 同じく「見え方がおかしい」ときの切り分け。あちらは古い表示、こちらは画像のロード失敗
