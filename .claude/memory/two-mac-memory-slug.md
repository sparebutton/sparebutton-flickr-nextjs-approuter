---
name: two-mac-memory-slug
description: セッションは必ず git root で開く（2026-08-07 決定）。親 dir で開くと auto-memory の slug が食い違い、メモリが静かに分裂する。親 dir 側のリンクは事故時の保険として残してある
metadata:
  type: project
---

# セッションは git root で開く（2 Mac 運用でのメモリ slug 不一致）

**2026-08-07 決定: 今後このワークスペースで親 dir からセッションを開かない。** 必ず git root で開く。

```
/Volumes/aki--/--Codes/--flickr-for-sparebutton/
  └ sparebutton_flickr_nextjs_approuter/          ← ここでは開かない（git 管理外）
      └ sparebutton-flickr-nextjs-approuter/      ← ★ここで開く。git root。実体の .claude/memory/ もここ
```

**Why:** リポジトリが 1 階層深いため、開く場所によって auto-memory の slug が 2 通りに割れる。

| 由来 | slug |
|---|---|
| 親 dir | `-Volumes-aki-----Codes---flickr-for-sparebutton-sparebutton-flickr-nextjs-approuter` |
| git root（`memlink.sh` の計算元） | 上記 + `-sparebutton-flickr-nextjs-approuter` |

git root で開けば、この不一致に起因する問題（下記 2 つ）がまとめて消える。**運用ルールを 1 つ足すほうが、環境側の例外処理を増やすより安い**というのが決定の理由。

## git root で開くと解決すること

**1. メモリの分裂** — `memlink.sh` は `git rev-parse --show-toplevel` から slug を出すため、親 dir 側のリンクは張ってくれない。リンクが無いまま auto-memory が書き込むと `~/.claude/projects/<親 slug>/memory/` に**ローカルの実ディレクトリ**が新設される。そこは SSD の外なので、もう 1 台の Mac に同期されず、メモリが静かに分裂する。実害が出るまで気づけない種類の事故。

**2. SessionStart フックの空振り** — フックは `CLAUDE_PROJECT_DIR`（= セッションを開いた dir）基準で `.claude/docs-hygiene.conf` を探す。conf は git root にあるので、親 dir で開くと見つからずフックが no-op になり、symlink の自動確立が働かない。

| 開き方 | conf が見つかるか | symlink 自動確立 |
|---|---|---|
| **git root で開く** | ○ | 効く |
| 親 dir で開く | ✕ | 効かない（手動 `memlink.sh --fix` が必要） |

**How to apply:** 別 Mac で初めて開くときも git root で開く。`memlink.sh --fix` は SessionStart フックが自動で走らせる。リンク先が存在しないと言われたら SSD 未マウントを疑い、**絶対に張り直さない**（空の実体を作って分裂する）。

親 dir 側の slug にも 2026-08-07 に同一実体へのリンクを張ってある。**うっかり親 dir で開いてしまったときの保険**なので消さないこと（リンクがあれば書き込みは共有実体に届く）。

```bash
ls -ld ~/.claude/projects/*flickr*/memory   # 両方が同じ実体を指していることを確認
```

## slug が 2 つあることの副次的な使い道

`~/.claude/projects/` には両方の slug の dir が残り、それぞれに過去の `<session-id>.jsonl` が入っている。**セッション記録を遡るときは両方を対象にする**（片方だけ見て「記録が無い」と判断すると誤る）。

**このリポジトリに自動コミット / 自動 push の仕組みは無い。** 2026-08-07 に確認済み — `.git/hooks/` は空、Claude Code の hooks は SessionStart のみ、ファイル監視の常駐もなし。セッション記録に対応する `git commit` が無いコミットが現れたら、Claude Code の外（ターミナル / エディタの Git 連携 / GUI クライアント）からの操作を疑う。

**Why:** 一度「自動化があるかもしれない」と誤って推測し、意図しないデプロイを警告してしまった。実際には push されないまま 2 時間残っていた（`git ls-remote origin` で確認できる）。**推測でなく記録で確かめる。**

## 関連

- [[browser-collab-pattern]] — 同じく環境側の手作業をユーザーと分担する話
- [[stale-view-diagnosis]] — 同じく「推測せず配信側の事実を先に確認する」型の切り分け
