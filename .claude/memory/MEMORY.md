<!-- MEMORY.md は .claude/memory/ 配下のメモリファイルへの索引です。
各エントリは 1 行（~150 字以内）。書式は下の既存エントリに倣うこと。
詳細な書き方は CLAUDE.md の auto-memory ガイドを参照。 -->

## project

- [長期の方針: vanilla 版へ移行する](long-term-direction.md) — 土台は vanilla 版に決定（2026-09-18）。www は Cloudflare Workers 上の vanilla 版へ切り替え予定。こちらは切り替えまでの現行本番で、新規投資は最小限
- [Dependabot 脆弱性対応の運用パターン](dependency-vuln-handling.md) — 直接依存は bump / transitive は resolutions（yarn upgrade は効かない）、全件は gh api で列挙（メールは 1 件のみ・解決済みでも届く）、SSG+Vercel で実害なくても alert 消化のため追従
- [Cloudflare キャッシュ構成とデプロイ時のパージ](cloudflare-cache-and-purge.md) — HTML をエッジに 1 時間キャッシュ、デプロイ後はパージ必須（GitHub Actions で自動化）、Speed Brain の 503 挙動。写真は Flickr の CloudFront 直配信で CF 非経由（画像の ? は Flickr の 429 → flickr-original-rate-limit）
- [Flickr は 1024px 超のサイズだけ 429 で制限する](flickr-original-rate-limit.md) — Safari で写真が ? になる真因（0.2.8 の「WebKit 一時失敗」は誤診）。curl / Chrome で通っても Safari で通る保証にならない。WKWebView での再現・検証手順
- [セッションは git root で開く](two-mac-memory-slug.md) — 親 dir で開くと slug が食い違い、メモリ分裂と SessionStart フック空振りが起きる。2026-08-07 に「親 dir では開かない」と決定。自動コミット/push は無い
- [本番は直っているのに直って見えないとき](stale-view-diagnosis.md) — 開きっぱなしのタブ / エッジ / ブラウザキャッシュの切り分け。iOS のキャッシュ削除は開いているタブを作り直さないのでリロードが決め手

## feedback

- [ダッシュボード設定の協働パターン](browser-collab-pattern.md) — 入力はユーザー、Claude は DOM を読んで検証してから実行を促す。認証情報は Claude に渡さない
