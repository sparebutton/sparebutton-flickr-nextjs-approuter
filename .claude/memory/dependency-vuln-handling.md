---
name: dependency-vuln-handling
description: Dependabot 脆弱性アラート対応の確立パターン。直接依存は bump、transitive は package.json の resolutions で固定。SSG+Vercel のため多くの Node 系 CVE は実害なしだが alert 消化のため追従する。GitHub Security 設定状態も記録
metadata:
  type: project
---

# Dependabot 脆弱性アラート対応の運用パターン

2026-05-21 のセッションで 40 件のアラートを 0 件まで消化した際に確立した対応フロー。

## 対応の分岐

- **直接依存** (`dependencies` / `devDependencies` に明記): `package.json` のバージョン文字列を bump → `yarn install`
  - 例: `next` 16.1.6 → 16.2.6
- **transitive 依存** (yarn.lock のみに出現): `package.json` の `resolutions` フィールドで強制更新
  - 例: `minimatch ^3.1.3`, `postcss ^8.5.10`, `brace-expansion ^1.1.13`
  - 親パッケージが要求する semver range と整合する範囲で固定する（メジャー跨ぎは互換性リスク）

**Why:** transitive 依存は `package.json` を直接書き換えても消えない。yarn 1.x の `resolutions` が唯一の即時対応手段

**How to apply:** `yarn why <pkg>` で依存元を辿り、推移経路を CHANGELOG に記録する

## 実害判定（このプロジェクト固有）

`output: "export"` の SSG + Vercel ホスティング構成のため、以下の CVE カテゴリは**本番に実害なし**:

- Next.js のランタイム Node サーバ系（SSRF / Middleware bypass / Cache Components DoS 等） — 本番に Node サーバが存在しない
- `serve` (devDep) 経由のローカル限定ツール系（minimatch / brace-expansion の ReDoS / DoS）
- `postcss` の XSS via `</style>` — ユーザー入力 CSS を扱わない

**Why:** GitHub Advisory にも "Vercel-hosted deployments are not affected" と明記されているケースが多い

**How to apply:** 実害なしと判定できても **必ず追従する**。Dependabot はバージョン文字列だけで判定するため、放置すると alert が溜まり続ける。アラート 0 件状態の維持が運用ポリシー

## CHANGELOG 記載スタイル

セッション内では `[0.2.1]` `[0.2.2]` で運用。`## [x.y.z] - YYYY-MM-DD` + `### Changed` セクションに以下を含める:

- 対象パッケージとバージョン推移
- 該当 CVE / GHSA ID（特定できる場合）
- 実害有無の判定（"実害なしだがアラート消化のため追従" 等）

## GitHub Security 設定状態（2026-05-21 時点）

**有効化済み**:
- Dependency graph / Dependabot alerts
- Dependabot malware alerts
- Dependabot security updates ← **新規脆弱性で自動 PR が来る**
- Grouped security updates ← **複数 CVE は 1 PR にまとまる**
- Secret Protection / Push protection（`.env.local` 等の誤コミット防止）
- Private vulnerability reporting
- Copilot Autofix

**未設定**:
- `.github/dependabot.yml`（Dependabot version updates）— **脆弱性以外の通常 minor/patch 更新は手動対応**
- CodeQL — SSG + 入力なしで価値中、保留中

**How to apply:** 次回以降の脆弱性アラートは自動 PR で届く想定。レビューしてマージするだけで済む。通常バージョン更新（脆弱性なし）は手動で `yarn upgrade` が必要

## 関連

- [[user-context]] が無いので別途追加検討余地
- CLAUDE.md ルール 1（SSG 専用構成）が実害判定の根拠
