---
name: dependency-vuln-handling
description: Dependabot 脆弱性アラート対応の確立パターン。直接依存は bump、transitive は resolutions で固定（yarn upgrade は効かない）。アラート全件は通知メールではなく gh api で列挙する。SSG+Vercel のため多くの Node 系 CVE は実害なしだが alert 消化のため追従する。GitHub Security 設定状態も記録
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

## アラートの全体像はメールではなく API で取る（2026-09-11 追記）

Dependabot の通知メールは**該当アラートの 1 件しか載らない**。2026-09-11 に届いた `sharp` のメール（high 1 件）を起点に調べたところ、実際の open アラートは 6 件（`next` の critical 2 種が重複計上で 4 件 + `sharp` + `baseline-browser-mapping`）だった。critical の方がメールに現れていない。

```bash
gh api "repos/sparebutton/sparebutton-flickr-nextjs-approuter/dependabot/alerts?state=open" \
  --jq '.[] | "\(.number)\t\(.security_advisory.severity)\t\(.dependency.package.name)\t\(.security_advisory.ghsa_id)\t\(.security_vulnerability.vulnerable_version_range) -> \(.security_vulnerability.first_patched_version.identifier // "n/a")"'
```

**Why:** メール 1 通 = アラート 1 件の対応で終えると、より深刻なものを見落とす

**How to apply:** 脆弱性メールが来たら、まず上のコマンドで open アラートを**全件**列挙してから着手する。`gh api` は URL に `?` を含むので zsh ではクォート必須（無いと `no matches found`）

## `yarn upgrade <pkg>` は transitive 依存に効かない（2026-09-11 追記）

`yarn upgrade baseline-browser-mapping` は成功と表示されるが lockfile は変わらない（yarn 1.x の `upgrade` は `package.json` に載っている直接依存しか対象にしない）。

**Why:** 「成功」と出るので更新できたと誤認しやすい

**How to apply:** transitive 依存は必ず `resolutions` に書いて `yarn install`。実行後は `grep -A2 '^<pkg>@' yarn.lock` で解決後バージョンを目視確認する

## 関連

- [[user-context]] が無いので別途追加検討余地
- CLAUDE.md ルール 1（SSG 専用構成）が実害判定の根拠
