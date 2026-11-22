# tooling

理由は同じフォルダの `DECISIONS.md` にある。

- lint の設定は `.oxlintrc.json`、自作のルールは `tooling/lint/rules/` の `comments/`・`tests/`・`modules/`(`tooling/lint/plugin.mjs` がまとめる)。Oxlint は `.svelte` の `<script>` も lint するが、テンプレートと `<style>` は見ない。型付きのルールは `<script>` にも流れない。
- フォルダの中身の数と名前は、lint ではなく `tooling/structure/` のテストが検査する(1ファイルずつ見る lint では、フォルダ全体を数えられない)。`src/routes/` の中では、SvelteKit の `[slug]`・`(group)` などの形も許す。
- ファイルの長さと抑制の理由は、lint に加えて `tooling/structure/` のテストも検査する。`.svelte` は、`<script>`・マークアップ・`<style>` を合わせて数え(`tooling/structure/svelte-file.ts` が読み分ける)、`svelte-ignore` にも `--` の後の理由を求める。`<svelte:options runes={false} />` も止める。
- `GLOSSARY.md` の「機械で探す語」に挙げた表記は、`tooling/structure/` のテストが文書・コメント・文字列(`.svelte` のマークアップを含む)から探す。コミットのメッセージからは、commit-msg の hook が探す。表記を足すときは、別の概念を指す正しい文まで落とさないかを確かめ、落としそうな文を `tooling/structure/__tests__/repository.test.ts` の例に足す。「機械で探す語」の表の見出しや書き方を変えるときは、`tooling/structure/glossary.ts` も合わせて直す。
- ほかのリポジトリの名前は、`tooling/structure/` のテストが、リポジトリの全ファイル(パスと中身)から探す。コミットのときは、git の hook が、ステージしたファイル(パスと中身)とコミットのメッセージからも探す。名前の一覧は、メインの checkout の `.private/other-repositories.txt` に置き、コミットしない(`.private/` は `.gitignore` にある)。worktree からは `git rev-parse --git-common-dir` でたどる。1行に1つの名前を書き、空行と `#` で始まる行は読まない。大文字と小文字は区別しない。一覧が無いときは何も探さない。名前そのものは、コミットするファイルに書かない。
- `tooling/lint/jsdoc-type-plugin.mjs` は eslint-plugin-jsdoc を別の名前で読み込むだけのファイル。`require-jsdoc` を「export する関数と型」と「型の各プロパティ」の2通りの設定で同時に使うため。
- ルールを足したり外したり変えたりしたら、`tooling/lint/fixtures/` の `valid/` と `invalid/` の、ルールの分類ごとのフォルダに fixture を足し、`tooling/lint/__tests__/` の、ルールの分類に合うテストのファイルで確かめる(lint の実行は `tooling/lint/fixture-lint.ts` にまとめてある)。`src/` だけに掛かるルールの fixture は、`src/lib/` のように同じパスを再現したフォルダに置く。`.svelte` の fixture は `svelte/` に置き、Svelte のコンパイラの警告が出ない形で書く(svelte-check が fixture も検査するため)。理由は `tooling/DECISIONS.md` に書く。
- fixtures はどの tsconfig にも入れず、`oxlint.fixtures.config.mjs` で型を使わずに検査する。型付きのルールは fixture では確かめられない。`bun test` は fixtures を実行しない(`bunfig.toml` と、package.json の `test:unit`)。
- 型付きのルールは tsrs で動く。型エラーの判定は svelte-check(中で TS 7.1 の `tsc` を流す)だけで行う。tsrs で困ったら、ユーザーに報告する。`oxlint-tsgolint` に入れ替えると、TS 7.0 と 7.1 の型検査器の食い違いがそのまま残るので、入れ替えるかはユーザーと決める。
- TypeScript の検査と lint のルールがぶつかったら、TypeScript の方を取り、lint のルールを外すか変える。外したら、理由を `tooling/DECISIONS.md` に書く。
- コンポーネントのテストのための preload と `render` は `tooling/svelte-test/` にある。`*.svelte.test.ts` だけを、ブラウザの条件を付けて流す(package.json の `test:components`)。
- Claude Code では、作業の終わりに `tooling/hooks/stop-check.ts` が `bun run check` を流す(設定は `.claude/settings.json`)。
- git の hook は `tooling/git-hooks/` にある(中身は同じ名前の `.ts`。pre-merge-commit は `pre-commit.ts` を流す)。`bun install` が、`install.ts` で git の `core.hooksPath` をこのフォルダにする。worktree でも、その worktree のブランチにある hook が流れる。
- pre-commit と pre-merge-commit は、ステージしたファイルのパスと中身から、ほかのリポジトリの名前を探す。整形・lint・型検査・テストは流さない(CI と `bun run check` に任せる)。
- commit-msg は、commitlint(設定は直下の `commitlint.config.ts`、足したルールは `commit-rules.ts`)と、メッセージの中の、ほかのリポジトリの名前と「機械で探す語」の検索を流す。commitlint は Bun で流す。足したルールが `Bun.stringWidth` を使うので、Node では動かない。
- hook を飛ばさない。`git commit --no-verify`(`-n`)を使わず、`core.hooksPath` を外さず、hook を飛ばすための環境変数や設定も足さない。通らなければ直してからコミットする。hook の側に無理があるなら、ユーザーに報告する。
- CI は `.github/workflows/` にある(理由は `tooling/DECISIONS.md` の「CI」)。job の `check`(`check.yml`)は、PR と main への push で `bun install --frozen-lockfile` と `bun run check` を流す。job の `commit-messages`(`commit-messages.yml`)は、PR で、PR のコミットのメッセージと、main に残る PR のタイトル(` (#番号)` を足した1行目)を、`tooling/ci/check-pull-request-messages.ts` で確かめる。
- job の名前(`check`・`commit-messages`)は、main の ruleset で、通ることを必須にする check として登録した名前。変えるときは、ruleset も直す(ユーザーに頼む)。
- `commit-messages` は、メッセージを commit-msg の hook のスクリプトに1件ずつ渡すだけ。メッセージの検査を変えるときは `tooling/git-hooks/` を直し、CI の側に検査を書き足さない。
- 手元との違い:CI には、ほかのリポジトリの名前の一覧が無いので、名前を探さない(ファイルからも、メッセージからも)。名前を探すのは、手元の `bun run check` とコミットのときの hook だけ。PR のタイトルと、GitHub の画面で作ったコミットのメッセージは hook を通らないので、名前が無いかを自分で見る。
- workflow では、actions をコミットの SHA で固定し、行末のコメントにバージョンを書く(`uses: owner/repo@<SHA> # v1.2.3`)。`permissions` は最上位に、権限ごとに `read` か `none` で書き、job では決めない。どちらも `tooling/structure/` のテストが(`tooling/ci/workflows.ts` で YAML を読んで)確かめる。PR のタイトルのような外から来る値は、`${{ }}` で `run` に直接書かず、環境変数で渡す。
