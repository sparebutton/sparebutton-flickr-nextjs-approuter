---
name: cloudflare-cache-and-purge
description: Cloudflare の Cache Rule で HTML をエッジに 1 時間キャッシュしている。デプロイ後はパージが必要で GitHub Actions で自動化済み。各設定値を選んだ理由と Speed Brain の挙動も記録
metadata:
  type: project
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

**How to apply:** 必要な Secrets は `CLOUDFLARE_API_TOKEN`（権限: ゾーン → キャッシュ パージ → パージ / リソース: sparebutton.jp のみ）と `CLOUDFLARE_ZONE_ID`。手動実行は Actions タブの `workflow_dispatch`、またはダッシュボードの キャッシュ → 構成 → すべてをパージ。

## Speed Brain（投機プリフェッチ）の挙動

Speed Brain は**そのエッジにキャッシュ済みのページしか投機配信しない**。未キャッシュのページに `Sec-Purpose: prefetch` が来ると `503` + `cf-speculation-refused: prefetch refused: not eligible` を返す。

**Why:** キャッシュルール導入前は HTML が常に未キャッシュだったため、**全てのプリフェッチが 503** になっていた。ブラウザは通常ナビゲーションにフォールバックするので実害はないが、ネットワークログが 503 だらけになり障害と誤認しやすい。

**How to apply:** 503 を見つけても `cf-speculation-refused` ヘッダが付いていれば正常動作。アクセスのあるページから順に 200 に変わる。

## 関連

- [[dependency-vuln-handling]] — 同じく本番構成（SSG + Vercel）に依存した判断を含む
