<!-- MEMORY.md は .claude/memory/ 配下のメモリファイルへの索引です。
各エントリは 1 行（~150 字以内）、形式: - [Title](file.md) — one-line hook
詳細な書き方は CLAUDE.md の auto-memory ガイドを参照。 -->

## project

- [Dependabot 脆弱性対応の運用パターン](dependency-vuln-handling.md) — 直接依存は bump / transitive は resolutions、SSG+Vercel で実害なくても alert 消化のため追従、GitHub Security 設定状態も記録
- [Cloudflare キャッシュ構成とデプロイ時のパージ](cloudflare-cache-and-purge.md) — HTML をエッジに 1 時間キャッシュ、デプロイ後はパージ必須（GitHub Actions で自動化）、各設定値の理由と Speed Brain の 503 挙動
