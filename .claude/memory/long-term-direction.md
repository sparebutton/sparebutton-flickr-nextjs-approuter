---
name: long-term-direction
description: 長期運用の土台は vanilla 版に決定（2026-09-18）。www.sparebutton.jp は将来 Cloudflare Workers 上の vanilla 版へ切り替える。この Next.js 版は切り替えまでの現行本番で、新規投資は最小限にする
metadata:
  type: project
---

# 長期の方針: vanilla 版へ移行する

2026-09-18 にユーザーと確認。**長期運用の土台は姉妹プロジェクトの vanilla 版**（`../../sparebutton_flickr_vanilla/sparebutton-flickr-vanilla`）。`www.sparebutton.jp` は、Vercel 上のこの Next.js 版から **Cloudflare Workers 上の vanilla 版**へ切り替える予定（Vercel を外し、GitHub + Cloudflare + Flickr だけで運用する）。

**Why:** このサイトは静的な HTML と画像が中心で、動く部分はドロワー・スティッキーヘッダー・フェードイン・画像リトライだけ。vanilla 版はそれを約 3KB の JS で実現し、ランタイム依存が 0。Next.js 版は同じ見た目に約 600KB の JS を配り、保守コストの大半が「使っていない機能（画像最適化 API など）の脆弱性アラートの消化」だった（CHANGELOG 0.2.9〜0.2.11）。vanilla 版は 1.1.0 でこちらと同水準まで引き上げ済みで、表示テキストは全ページ一致。

**How to apply:**

- 切り替えが済むまでは**こちらが本番**。表示不良などの修正は引き続きこちらに入れ、同じ修正を vanilla 版にも入れる
- 新機能や大きなリファクタはこちらに投資しない。やるなら vanilla 版で
- 切り替えの手順・確認項目・切り戻しは **vanilla 版のメモリ `domain-switch-plan`** にある。切り替え後は [[cloudflare-cache-and-purge]] の Cache Rule とパージ workflow が不要になる見込み（要検証）
- 切り替えが安定したら、このリポジトリはアーカイブする

## 関連

- [[cloudflare-cache-and-purge]] — 現在の Cloudflare → Vercel の 2 段構成
- [[flickr-original-rate-limit]] — 両方の版に入れた修正
