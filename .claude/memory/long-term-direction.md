---
name: long-term-direction
description: 2026-09-18 に www.sparebutton.jp を Cloudflare Workers 上の vanilla 版へ切り替えた。この Next.js 版はもう本番ではなく、切り戻し用に Vercel 上へ残してあるだけ。新規投資はしない
metadata:
  type: project
---

# この Next.js 版はもう本番ではない（vanilla 版へ切り替え済み）

**2026-09-18 22:29 JST、`www.sparebutton.jp` の配信を姉妹プロジェクトの vanilla 版（`../../sparebutton_flickr_vanilla/sparebutton-flickr-vanilla`、Cloudflare Workers）へ切り替えた。** Cloudflare のエッジで Worker のルート `www.sparebutton.jp/*` が先に受けるため、このリポジトリを push して Vercel にデプロイしても**本番には出ない**。apex の転送も Cloudflare の Redirect Rule に移した。DNS は未変更で、ルートを削除すればこの Next.js 版に即座に戻る（切り戻し用）。

**Why:** このサイトは静的な HTML と画像が中心で、動く部分はドロワー・スティッキーヘッダー・フェードイン・画像リトライだけ。vanilla 版はそれを約 3KB の JS で実現し、ランタイム依存が 0。Next.js 版は同じ見た目に約 600KB の JS を配り、保守コストの大半が「使っていない機能（画像最適化 API など）の脆弱性アラートの消化」だった（CHANGELOG 0.2.9〜0.2.11）。vanilla 版は 1.1.0 でこちらと同水準まで引き上げ済みで、表示テキストは全ページ一致。

**How to apply:**

- **修正や機能追加は vanilla 版に入れる。** こちらに入れても本番には反映されない。「本番を直したのに直らない」と思ったら、まず作業しているリポジトリを疑う
- こちらへの push は、Vercel のビルドで Flickr API を約 780 回消費する（上限は 1 キー 1 時間 3,600 回で vanilla 版と共有）。不要な push をしない
- 切り替えの記録・切り戻し・Vercel を外す残作業は **vanilla 版のメモリ `domain-switch-plan`** にある。[[cloudflare-cache-and-purge]] の Cache Rule とパージ workflow は、vanilla 版側の確認が済めば不要になる
- 安定を確認したら Vercel のプロジェクトを外し、このリポジトリはアーカイブする

## 関連

- [[cloudflare-cache-and-purge]] — 現在の Cloudflare → Vercel の 2 段構成
- [[flickr-original-rate-limit]] — 両方の版に入れた修正
