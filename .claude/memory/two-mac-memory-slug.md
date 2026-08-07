---
name: two-mac-memory-slug
description: ワークスペースを親 dir で開くため auto-memory の slug が git root と食い違う。memlink.sh は git root 基準なので親 dir 側のリンクは手動で張る。別 Mac でも同じ作業が必要
metadata:
  type: project
---

# 2 Mac 運用でのメモリ slug 不一致

2026-08-07 に判明。**リポジトリは 1 階層深いところにある。**

```
/Volumes/aki--/--Codes/--flickr-for-sparebutton/
  └ sparebutton_flickr_nextjs_approuter/          ← セッションはここで開かれる（git 管理外）
      └ sparebutton-flickr-nextjs-approuter/      ← git root。実体の .claude/memory/ もここ
```

このため auto-memory の slug が 2 通り存在する。

| 由来 | slug |
|---|---|
| セッションの cwd（親 dir） | `-Volumes-aki-----Codes---flickr-for-sparebutton-sparebutton-flickr-nextjs-approuter` |
| git root（`memlink.sh` の計算元） | 上記 + `-sparebutton-flickr-nextjs-approuter` |

`update-docs` の `memlink.sh` は `git rev-parse --show-toplevel` から slug を出すため、**親 dir 側のリンクは張ってくれない**。2026-08-07 に両方から同一実体へリンクを張って解消済み。

**Why:** 親 dir 側にリンクが無いまま auto-memory が書き込むと、`~/.claude/projects/<親 slug>/memory/` に**ローカルの実ディレクトリ**が新設される。そこは SSD の外なので、もう 1 台の Mac に同期されず、メモリが静かに分裂する。実害が出るまで気づけない種類の事故。

**How to apply:** 別 Mac で初めて開いたときは `memlink.sh --fix`（git root 側）に加えて、**親 dir 側の slug にも手で張る**。

```bash
ln -s "<git root>/.claude/memory" "$HOME/.claude/projects/<親 slug>/memory"
```

`ls -ld ~/.claude/projects/*flickr*/memory` で両方が同じ実体を指しているか確認できる。リンク先が存在しない場合は SSD 未マウントを疑い、**絶対に張り直さない**（空の実体を作って分裂する）。

## SessionStart フックも同じ理由で半分しか効かない

2026-08-07 に `<git root>/.claude/docs-hygiene.conf` を置き、SessionStart フック（symlink の自動確立）の門番を通した。ただしフックは `CLAUDE_PROJECT_DIR`（= セッションを開いた dir）基準で conf を探すため、**親 dir で開いたセッションでは見つからず no-op のまま**になる。

| 開き方 | conf が見つかるか | symlink 自動確立 |
|---|---|---|
| git root で開く | ○ | 効く |
| 親 dir で開く | ✕ | 効かない（手動 `memlink.sh --fix` が必要） |

**How to apply:** 自動化を効かせたいなら**git root でワークスペースを開く**。親 dir で開く運用を続けるなら、親 dir 側にも `.claude/docs-hygiene.conf` を置く必要がある（ただし親 dir は git 管理外なので別 Mac には伝播しない）。

## slug が 2 つあることの副次的な使い道

`~/.claude/projects/` には両方の slug の dir が存在し、それぞれに `<session-id>.jsonl` が入る。**コミットの出所を調べるときは両方を対象にする**（片方だけ見て「記録が無い」と判断すると誤る）。

```bash
ls -d ~/.claude/projects/*flickr*        # 2 つの slug が出る
```

**このリポジトリに自動コミット / 自動 push の仕組みは無い。** 2026-08-07 に確認済み — `.git/hooks/` は空、Claude Code の hooks は SessionStart の symlink 確認のみ、ファイル監視の常駐もなし。セッション記録に対応する `git commit` が無いコミットが現れたら、Claude Code の外（ターミナル / エディタの Git 連携 / GUI クライアント）からの操作を疑う。

**Why:** 一度「自動化があるかもしれない」と誤って推測し、意図しないデプロイを警告してしまった。実際には push されないまま 2 時間残っていた（`git ls-remote origin` で確認できる）。**推測でなく記録で確かめる。**

## 関連

- [[browser-collab-pattern]] — 同じく環境側の手作業をユーザーと分担する話
- [[stale-view-diagnosis]] — 同じく「推測せず配信側の事実を先に確認する」型の切り分け
