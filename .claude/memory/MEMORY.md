<!-- MEMORY.md は .claude/memory/ 配下のメモリファイルへの索引です。
各エントリは 1 行（~150 字以内）。書式は下の既存エントリに倣うこと。
詳細な書き方は CLAUDE.md の auto-memory ガイドを参照。 -->

## project

- [Dependabot 脆弱性対応の運用パターン](dependency-vuln-handling.md) — 直接依存は bump / transitive は resolutions、SSG+Vercel で実害なくても alert 消化のため追従、GitHub Security 設定状態も記録
- [Cloudflare キャッシュ構成とデプロイ時のパージ](cloudflare-cache-and-purge.md) — HTML をエッジに 1 時間キャッシュ、デプロイ後はパージ必須（GitHub Actions で自動化）、各設定値の理由と Speed Brain の 503 挙動
- [2 Mac 運用でのメモリ slug 不一致](two-mac-memory-slug.md) — 親 dir で開くため slug が git root と食い違う。memlink.sh は git root 基準なので親 dir 側は手動リンク。別 Mac でも同じ作業が必要

## feedback

- [ダッシュボード設定の協働パターン](browser-collab-pattern.md) — 入力はユーザー、Claude は DOM を読んで検証してから実行を促す。認証情報は Claude に渡さない
