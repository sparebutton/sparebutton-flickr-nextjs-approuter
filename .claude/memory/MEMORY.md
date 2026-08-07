<!-- MEMORY.md は .claude/memory/ 配下のメモリファイルへの索引です。
各エントリは 1 行（~150 字以内）。書式は下の既存エントリに倣うこと。
詳細な書き方は CLAUDE.md の auto-memory ガイドを参照。 -->

## project

- [Dependabot 脆弱性対応の運用パターン](dependency-vuln-handling.md) — 直接依存は bump / transitive は resolutions、SSG+Vercel で実害なくても alert 消化のため追従、GitHub Security 設定状態も記録
- [Cloudflare キャッシュ構成とデプロイ時のパージ](cloudflare-cache-and-purge.md) — HTML をエッジに 1 時間キャッシュ、デプロイ後はパージ必須（GitHub Actions で自動化）、各設定値の理由と Speed Brain の 503 挙動
- [セッションは git root で開く](two-mac-memory-slug.md) — 親 dir で開くと slug が食い違い、メモリ分裂と SessionStart フック空振りが起きる。2026-08-07 に「親 dir では開かない」と決定。自動コミット/push は無い
- [本番は直っているのに直って見えないとき](stale-view-diagnosis.md) — 開きっぱなしのタブ / エッジ / ブラウザキャッシュの切り分け。iOS のキャッシュ削除は開いているタブを作り直さないのでリロードが決め手

## feedback

- [ダッシュボード設定の協働パターン](browser-collab-pattern.md) — 入力はユーザー、Claude は DOM を読んで検証してから実行を促す。認証情報は Claude に渡さない
