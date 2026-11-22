# 決めたことと理由(tooling)

## lint の設定

設定は `.oxlintrc.json`。型付きのルールは fixture では確かめられない(fixture は型を使わずに検査する)。

- **自作のルール**(`tooling/lint/rules/`)
  - `no-standalone-comment`:単独の行のコメントとブロックコメントを禁止し、行末のコメントは40文字までにする。lint への指示(`oxlint-disable` など)と `@ts-expect-error` は除く。TSDoc は宣言・型のプロパティ・メンバーの直前にだけ書ける。分割の見出し(10本以上の `-` の罫線・見出しの行・罫線の3行)は、コードが200行を超えるファイルでだけ許し、400行を超えるファイルには1つ以上を求める。行数は、空行とコメントだけの行を除いて数える。見出しの行は、文字か数字を含み、lint への指示ではないものに限り、40文字までにする。必須の条件を満たすのは、後ろにコードが続く見出しだけ。改行は LF・CRLF・CR・U+2028・U+2029 のどれでも1行と数える。TSDoc と宣言のあいだに見出しを挟むと、宣言の直前に無い TSDoc の診断を出す。
  - `tsdoc-role-only`:TSDoc の説明とタグを、それぞれ1行・1文・60文字までにし、条件・例・補足・理由の言い回しと、`@param`・`@returns`・`@deprecated` 以外のタグを禁止する。言い回しは正規表現で見る(「割り切ったこと」)。バッククォートで囲んだ部分は言い回しの検査から外す。
  - `no-markup-test`:テストで、test id による検索、DOM のたどり方(`querySelector` など)、クラス名や HTML の中身、スナップショットを禁止する。
  - `max-code-lines`・`file-length-limit`:ファイルのコードの行数(空行とコメントだけの行を除く)に上限を設ける。同じ実装を、400行(`max-code-lines`。1行目に理由付きで抑制できる)と800行(`file-length-limit`。抑制できない)の2つの名前で使う。Oxlint の `eslint/max-lines` は、複数行のコメントや CR だけの改行で数え方が食い違ったので使わない。
  - `require-disable-reason`:lint の抑制に、ルールの名前と `--` の後の理由を求める。ルールの名前と説明の区切りは、Oxlint と同じ読み方にする。抑制できないルール(`file-length-limit`・`no-standalone-comment`・このルール自身)の抑制を止め、`max-code-lines` の抑制は1行目の `// oxlint-disable` の形だけを許す。
  - `no-focused-test`:`test.only`・`describe.skip`・`test.todo`・`test.if` などを禁止する。
  - `test-location`:テストのファイルを `__tests__` の直下に置かせ、`__tests__` にはテストのファイルだけを置かせ、`__tests__` の中にフォルダを作らせない。
  - `max-exported-functions`:コードの行数(空行とコメントだけの行を除く)が200行を超えるファイルは、export できる関数を2つまでにする(型は数えない)。200行以下なら、数は問わない(ユーザーが決めた。理由は直下の `DECISIONS.md` の「ファイルの長さ」)。境目の200行は、分割の見出しを使える行数(`no-standalone-comment` の `dividerAllowedAfter`)と同じ値にする。数えるのは、arrow function・function 宣言・function 式だけで、呼び出しの結果(関数を返す関数の戻り値など)は数えない。`src/lib/` と `tooling/` にだけ掛ける。SvelteKit の route のファイル(`+page.server.ts` など)と `hooks.server.ts` は、SvelteKit が決めた名前の関数(`load`・`handle`・`handleError`・`init` など)を export するので、数をこちらで決められない。
  - `no-inline-parameter-type`:関数の引数に、インラインのオブジェクト型を書かせず、名前付きの型にさせる。`max-exported-functions` と同じ範囲に掛ける。
  - `no-dynamic-import`:`import()` による動的な import を禁止する。境界を守る `no-restricted-imports` は動的な import を見ないので、`import()` なら Bun や Node の API を、`src/` から読めてしまう。
- **CMS のリポジトリから持ってこなかったルール**:lint の自作のルールと検査は、CMS(Analemma)のものと同じ考え方で作り、このリポジトリに合わないものは持ってこなかった。
  - try/catch を入口だけに許すルール:失敗をどこで受け止めるかを、このサイトではまだ決めていない(Analemma が落ちているときに、ページをどう見せるかなど)。SvelteKit は、throw した失敗をエラーのページとログにするので、throw するだけなら今のままで足りる。
  - ワークスペースの外への相対 import を止めるルール:このリポジトリはワークスペースを持たない。
  - 関数を export する `.ts` に、隣のテストを求めるルール:`.svelte` のテンプレートは Oxlint から見えないので、コンポーネントに当てられない。ロジックの `.ts` だけに掛けるかは、コードが増えてから決める。
- **TSDoc のタグの検査**(eslint-plugin-jsdoc):`@param` の名前が引数と合うこと(`check-param-names`)、1つでも書いたら全部の引数に書くこと(`require-param`)、何も返さない関数に `@returns` を書かないこと(`require-returns-check`)、タグに型を書かないこと(`no-types`。型は TypeScript が持つ)。
- **使える API の制限**
  - `src/` では、`bun`・`bun:*`(`bun:test` を除く)・`node:*` の import と、`Bun` のグローバル・`globalThis.Bun` を禁止する。`src/` には、ブラウザに届くコードと、サーバー側のコードが混ざる。サーバー側のコードも Web 標準で書けば、ブラウザに届くコードと書き方がそろい、adapter を替えても動く。`node:fs/promises` のようなサブパスも止める(`node:*` だけではサブパスが pattern をすり抜けた。tsconfig は `src/` にも Bun の型を入れているので、型検査では止まらない)。
  - `src/` のテスト(`src/**/__tests__/`)では、Bun と Node の import とグローバルを許す。テストは Bun で動き、ブラウザにもサーバー側のコードにも入らないので、上の目的に当たらない。
  - `console`(ログの出し方は、まだ決めていない)、`process.env`(環境変数は `src/env.ts` で定義し、`$app/env/private` から読む)、引数のプロパティの書き換えを禁止する。
- **足したルール**:`no-unnecessary-condition`(要らない `?.` や条件)、`no-abusive-eslint-disable`(ルールを指定しない抑制)。
  - `typescript/return-await`(`in-try-catch`):`try`・`finally` の中と `await using` の後で、`await` を省いた `return` に診断を出す。省くと、返した処理が終わる前に後始末が走る。型は同じ `Promise` なので型検査では止まらない。
- **変えた設定**
  - `no-underscore-dangle`:`_tag` だけ許す。想定内の失敗を `_tag` 付きの判別共用体で表すため。
  - `switch-exhaustiveness-check`:網羅している switch に `default` を書けないようにし、判別共用体でない値の switch には `default` を求める。`default` があると、`_tag` の値を足したときに扱い忘れが見つからない。
  - `require-unicode-regexp`:正規表現に `v` フラグを求める。和文を扱うので、サロゲートペアや Unicode のプロパティを正しく扱える必要がある。
  - `no-await-in-loop`:有効にする。ループの中の直列の I/O(N+1)を見つける。
  - `consistent-type-assertions`:オブジェクトリテラルへの `as` を禁止する。`as` を付けると余計なプロパティの検査が効かなくなり、キーの綴り間違いが素通りする。
  - `no-warning-comments`:探す語を `FIXME`・`XXX` だけにし、`TODO` は書けるようにする。直す条件がはっきりした「後で戻すこと」を、その場に残すため。
  - `no-unused-vars`:`await using` で受けた変数は、使っていなくても診断を出さない(`ignoreUsingDeclarations`)。
  - `import/extensions`:`.svelte` の import には拡張子を求める。`#lib/*.svelte` と `#lib/*` の対応を分けている(直下の `DECISIONS.md` の「SvelteKit の設定」)ので、拡張子が無いと `.ts` を探してしまう。
- **テストでも緩めないルール**
  - `no-unsafe-*`:bun-types は、非対称の matcher(`expect.any()` など)の型を `any` の別名にしている。テストで使うと `no-unsafe-*` に掛かるので、非対称の matcher は使わず、`toMatchObject` や具体的な値で確かめる。
  - `await-thenable`:Bun 1.4 の `expect(…).rejects`・`resolves` は、Promise が settled になるまでその場で待つ。`await` を付けずに書けば、このルールにも掛からない。
- **テストで緩めるルール**:テストは製品のコードより lint を緩めてよい。テストの書き方とぶつかる一般のルールは、テストのファイルの `overrides` で外し、テストを曲げない。テストのためのルール(`no-focused-test`・`no-markup-test`・`test-location`)と、抑制できないルールは緩めない。
  - `no-non-null-assertion`:テストでは、あると分かっている値を読む場面が多い。無ければテストが落ちるので、それで足りる。
  - `no-await-in-loop`:テストでは、順に待つこと自体を確かめたい場面がある。
  - `consistent-type-assertions`:プロパティの一部だけを持つ作り物を `as` で作れるようにする。
  - `unicorn/prefer-type-error`:テストの中で throw する値の型は、テストの都合で決める。
- **自作のルールのファイル(`tooling/lint/**/*.mjs`)で変えるルール**
  - `import/extensions`:`.mjs` の拡張子を付ける。Node の ES モジュールは、相対 import に拡張子が無いと読み込めない。
  - `typescript/no-unsafe-*` と `strict-boolean-expressions` を外す。Oxlint は JS プラグインへ型の無い構文木を渡すので、型付きのルールを当てても意味が無い。
- **TypeScript の検査と lint のルールがぶつかったら、TypeScript の方を取る**:型の正しさを決めるのは型検査で、lint のルールは、書いているときにすぐ気づくための早めの知らせ。lint に合わせると、型の検査が既に保証していることのために、余計な `return` や `default` やキャストを書かされ、かえって型の検査を弱める。
- **外したルール**
  - `typescript/consistent-return`:網羅した switch で値を返す関数に、末尾の `return` を求める。`switch-exhaustiveness-check` は網羅した switch に `default` を書かせないので、両方を満たせない。返し忘れは、tsc の `noImplicitReturns` と戻り値の型が止める。
  - `unicorn/no-useless-undefined`:TypeScript では、`Promise<string | undefined>` のように `undefined` を明示しないと型が合わない場面がある。
  - `typescript/promise-function-async`:`require-await` と組み合わさると、すぐに値を返す Promise をどう書いても、どちらかのルールに引っかかる。
  - `eslint/no-inline-comments`:行末の短いコメントを許す方針と正面から食い違う。コメントは `no-standalone-comment` で扱う。
  - 同じ中身のルールが2系統あるものは、型付きの方か片方だけを残す(`require-await`・`prefer-promise-reject-errors`・`no-implied-eval`・`prefer-includes`・`prefer-string-starts-ends-with`・`no-lonely-if`・`no-negated-condition`)。1つの違反が2回報告されるのを防ぐ。
- **import の並び**:oxfmt の `sortImports` に任せる。並びは整形の仕事で、保存のたびに直る。グループは、外のパッケージ、SvelteKit のモジュール(`$app/*`)、このリポジトリの `#lib/*`、相対パスの順。`.svelte` の `<script>` の中も、oxfmt が同じく並べる。
- **ファイル名**:`unicorn/filename-case` で kebab-case を求める。SvelteKit の `+page.svelte` や `hooks.server.ts` は、診断を出さない(手で確かめた)。
- **fixture のテスト**:`tooling/lint/__tests__/` に、ルールの分類ごとのテストのファイルを置く。lint の実行と結果の読み取りは `tooling/lint/fixture-lint.ts` にまとめる。正常系は、診断が0件であることに加えて、fixture を全部 lint したことも確かめる。
- **fixture**:ルールの分類ごとのフォルダ(`comments/`・`tsdoc/`・`jsdoc/`・`functions/`・`imports/`・`syntax/`・`tests/`・`svelte/`)に分け、`src/` だけに掛かるルールの fixture は、`src/lib/` のように同じパスを再現したフォルダに置く。`tooling/lint/fixtures/` は `bun test` の対象から外す。
  - `.svelte` の fixture は、Svelte のコンパイラの警告が出ない形で書く。svelte-check の `--tsgo` は、tsconfig の `exclude` を見ずに、全部の `.svelte` にコンパイラの警告を出す(直下の `DECISIONS.md` の「TypeScript」)。

## Svelte のファイルの lint と整形

`.svelte` は、`<script>`・テンプレート・`<style>` の3つからなる。ツールごとに、見る所が違う(どれも手で確かめた)。

| ツール                             | `<script>`                            | テンプレート                               | `<style>`                |
| ---------------------------------- | ------------------------------------- | ------------------------------------------ | ------------------------ |
| Oxlint(自作のルールを含む)         | 見る。型付きのルールは流れない        | 見ない                                     | 見ない                   |
| oxfmt(`svelte: true`)              | 整形し、import も並べる               | 整形する                                   | 整形する                 |
| svelte-check(`--fail-on-warnings`) | 型エラーと、Svelte のコンパイラの警告 | 型エラーと、アクセシビリティなどの警告     | 使っていないセレクタなど |
| `tooling/structure/` のテスト      | 抑制の理由、行数                      | `svelte-ignore` の理由、行数、機械で探す語 | 行数                     |

- 足りない所:テンプレートを lint するルールが無い。ESLint の eslint-plugin-svelte(`{@html}` の禁止、`{#each}` の key の要求など)にあたるものは、Oxlint にまだ無い。Svelte のコンパイラの警告(アクセシビリティ・使っていない CSS・runes の誤った使い方など)は、svelte-check が止める。テンプレートで守りたい約束が出てきたら、`tooling/structure/` のテストで `svelte/compiler` の構文木を読んで検査するかを決める。
- 足りない所:`<script>` に、型付きのルール(`no-floating-promises` など)が流れない。ロジックを `.ts` に置くことで補う(直下の `DECISIONS.md` の「割り切ったこと」)。
- oxfmt は、`.svelte` の整形に prettier-plugin-svelte を内蔵して使い、`svelte/compiler` を実行時に読む。`svelte` を依存から外すと、整形が失敗する。

## コンポーネントのテスト

直下の `DECISIONS.md` の「コンポーネントのテスト」で決めたことを、`tooling/svelte-test/` で作る。

- `preload.ts`(`bunfig.toml` の `[test] preload`):`.svelte` を `compile`、`.svelte.ts` と `.svelte.test.ts` を `compileModule` に通す。どちらもブラウザ向け(`generate: "client"`)。runes はコンパイラの構文なので、通さないと `$state` が定義されていないと落ちる。`.svelte` は、`vite.config.ts` と同じく runes を強制してコンパイルする(しないと、ビルドで落ちる古い書き方がテストでは通った)。
- ブラウザの条件で流しているかは、`svelte` がブラウザ版に解決されるかで見分ける。条件の無い実行で Svelte のファイルを読むと、分かる文言で止める。黙ってサーバー版で動かすと、`mount` が使えない誤りか、`$effect` が流れないテストになる。
- happy-dom の document は、ブラウザの条件のある実行でだけ用意する。`fetch` や `Request` などのグローバルも happy-dom のものに替わるので、サーバー側のコードのテストに混ぜない。
- `render.ts` の `render` は、コンポーネントを body に描画し、変更を反映する(`flushSync`)。描画したコンポーネントは、preload の `afterEach` で外し、body を空にする。テストのあいだで描画した物が残らないため。
- `__tests__/render.svelte.test.ts` は、この仕組み自体(描画する・操作する・残らない・テストの中の runes)を、`fixtures/` のコンポーネントで確かめる。

## Stop hook

Claude Code では、作業の終わりに `tooling/hooks/stop-check.ts` が `bun run check` を流す(設定は `.claude/settings.json`)。エージェントは終わりの手順を忘れやすい。失敗したら作業を止めて直させ、2回目も失敗したら止め続けずに警告を出す。直せないまま堂々巡りになるのを防ぐため。

- 作業ツリーに変更が無いときは流さない。会話だけのやり取りでも、毎回 check を待たせないため。コミットした後の変更は CI が流す。
- `git status` が失敗したときは、変更があるものとして流す。

## 抑制できない約束の検査

Oxlint には、抑制のコメントを無視して実行する仕組みが無い。抑制を禁じるルールの診断さえ、コメント1つで消せてしまう。設定の `overrides` で切ることも、`foo-min.ts` のような Oxlint が飛ばす名前にすることもできる。Oxlint は `.svelte` のテンプレートと `<style>` を見ない。そこで、次の約束は `tooling/structure/` のテストでも検査する。テストは `git ls-files` で一覧にした全ソースを読む(`.ts` などは oxc-parser、`.svelte` は `svelte/compiler`)ので、抑制のコメントにも設定にも左右されない。

- コードが800行を超えない。400行を超えるなら、1行目に理由付きの `// oxlint-disable project/max-code-lines -- 理由` があり、後ろにコードが続く分割の見出しがある。
- `.svelte` は、`<script>`・マークアップ・`<style>` を合わせたコードが400行を超えない。`.svelte` のファイルの1行目は `<script>` で、理由付きの抑制を書けないので、抑制は認めない。マークアップの `<!-- -->` と `<style>` の `/* */` も、コメントとして数えない。マークアップのコメントは、`svelte/compiler` の構文木から取る(正規表現で探すと、属性の値の中の `<!--` をコメントと取り違えた)。
- コメントを空白に置き換えるときは、文字列の長さを変えない(UTF-16 で2つの単位を使う絵文字を1つの空白にすると、後ろのコメントの位置がずれ、コメントをコードの行と数えた)。
- `.svelte` で、`<svelte:options runes={false} />` を書いていない。`vite.config.ts` で runes を強制しても、コンポーネントごとに切れてしまうため。
- 抑制にルールの名前と理由があり、抑制できないルールを抑制していない。`.svelte` の `<script>` の中の抑制も同じ。
- `svelte-ignore`(Svelte のコンパイラの警告の抑制)に、`--` の後の理由がある。Svelte は、`svelte-ignore` の警告の名前の後ろに書いた文を読まないので、理由を書いても抑制は効く(手で確かめた)。
- Oxlint が飛ばす名前のソースのファイルが無い。Oxlint の設定は直下の `.oxlintrc.json` だけ(`bun run lint` は `--disable-nested-config` で入れ子の設定を読まない)。
- 守るべきルールが `.oxlintrc.json` で `error` になっていて、`overrides` で弱めていない。lint とテストで、行数の境目がそろっている。

lint のルールは、書いているときにすぐ気づくための早めの知らせとして残す。

## 用語集の検査

`tooling/structure/` のテストが、`GLOSSARY.md` の「機械で探す語」に挙げた表記を、リポジトリの文書・コメント・文字列から探す。`glossary.ts` が用語集を読み、`prose.ts` がファイルから文を取り出し、`glossary-search.ts` が探す。コミットのメッセージからは、commit-msg の hook が探す(下の「コミットのときの検査」)。

- 探すのは、「機械で探す語」に挙げた表記だけ。避けたい語の多くは、別の概念を指す正しい文にも現れる(「データベース」の中の「ベース」、「DNS のレコード」「CSRF トークン」「消印」など)。文字だけでは意味を見分けられないので、ほかの意味ではまず使わない表記と、エージェントが書きがちな言い回しだけを挙げる。
- 本物の用語集が、別の概念を指す正しい文を落とさないことを、`repository.test.ts` で確かめる。広く使う語を「機械で探す語」に足すと、このテストが落ちる。
- 読むのは「機械で探す語」の表だけで、探す表記・代わりに書くもの・探す範囲を、その表が持つ。ほかの表は人が読むためのもので、書き方を自由に変えられる。
- 用語集の表をそのまま読み、表記を足したり変えたりしても検査のコードは直さない。用語集を唯一の出どころにするため。
- 表の形が崩れると、検査が黙って語を読み落とす。そこで、「機械で探す語」の表が無いこと、表の外にある行、列の数が合わない行、空の代わりに書くもの、空の探す範囲を、誤りとして落とす。
- 探す場所は、Markdown(コードのブロックを除く)、ソースのコメントと文字列とテンプレートリテラルの本文(oxc-parser で取り出し、識別子は見ない)、`.svelte` の `<script>` の同じ所とマークアップ、JSON の文字列。`GLOSSARY.md` と `tooling/lint/fixtures/invalid/` は除く。構文を読めないソースは、黙って飛ばさずに落とす。
- マークアップは、タグや属性も含めて1つの文として探す。今の「機械で探す語」は日本語の言い回しが中心で、タグや属性の名前には現れないため。
- コメントや文字列は、1つずつ探す。全部をつないでから探すと、別々の文字列のかぎかっこが組になり、その間の語を見落とす。
- バッククォートの中(コードの名前)と、かぎかっこの中(語を引き合いに出しているところ)は探さない。閉じていないかぎかっこは、その行の終わりで閉じたものとする。
- 文字列は、ソースに書いたとおりの文字で探し、エスケープは展開しない。行の番号を元のファイルとそろえるため。
- 日本語には単語の区切りが無いので、部分一致で探す。ほかの語の一部にもなる表記は挙げない。
- 英字の語は、前後が英数字や `_` と続いているとき、または `-`・`.`・`/` を挟んで英数字と続いているときは数えない。
- 単体テストは、本物の用語集に無い作り物の語で書く。テストのファイルも、この検査の対象になるため。

## ほかのリポジトリの名前の検査

`tooling/structure/` のテストが、手元だけの一覧(メインの checkout の `.private/other-repositories.txt`)から名前を読み、リポジトリの全ファイルのパスと中身から探す。コミットのときは、git の hook が、ステージしたファイルのパスと中身と、コミットのメッセージからも探す。`private-name-list.ts` が一覧の場所をたどって読み、`private-names.ts` が探す。

- 一覧はコミットしない。一覧そのものに、非公開のリポジトリの名前が入るため。そのため、一覧の無い環境(ほかの人の手元や、Codex の sandbox)では探さない。一覧を持つ手元で `bun run check` を流せば止まるので、割り切る。
- 一覧は、このリポジトリのメインの checkout に置く。CMS(Analemma)の checkout の一覧を読まないのは、2つのリポジトリで「ほかのリポジトリ」が違うため(このリポジトリの一覧に Analemma は入らず、Analemma の一覧にこのリポジトリは入らない)。もう一方の checkout の場所をコミットするファイルに書くことにもなる。
- 一覧は、worktree ごとではなくメインの checkout に1つだけ置く。worktree から `git rev-parse --git-common-dir` でたどる。worktree を作るたびに一覧を写さずに済む。
- 探すのは、`git ls-files` の一覧(コミットしていないが無視もしていないファイルを含む)の全ファイル。文書やコメントに限らず、コードや設定も探す。用語集の検査と違って、バッククォートやかぎかっこの中も探し、`tooling/lint/fixtures/invalid/` も外さない。
- 大文字と小文字は区別しない。英字で始まる名前は、前が英数字のときは数えない。英字で終わる名前は、後ろが英数字のときは数えない。`-`・`.`・`/` や日本語と続いているときは数える。日本語の名前は部分一致で探す。
- コミットのメッセージは、commit-msg の hook が探す。check はコミットの前に流すので、その時点でメッセージはまだ無い。

## フォルダの整理

`tooling/structure/` のテストが、リポジトリの全ファイル(`git ls-files` で一覧にしたもの)を見て検査する。フォルダの中身を数えるには全体を見る必要があり、1ファイルずつ見る lint には向かない。

- 1つのフォルダに置けるのは10件まで。`__tests__` と、`AGENTS.md`・`CLAUDE.md`・`DECISIONS.md`・`README.md` は数えない。リポジトリの直下と、`.` で始まるフォルダの中は検査しない(設定ファイルの置き場所がツールで決まっているため)。`.` で始まるフォルダも、親のフォルダでは1件と数える。
- フォルダの名前は kebab-case(`__tests__` は除く)。`__tests__` の中にフォルダは作れない。
- `src/routes/` の中では、SvelteKit の route の形(`[slug]`・`[[lang]]`・`[...rest]`・`[id=matcher]`・`(group)`)も許す。パラメータと matcher の名前は、英小文字で始まる英数字(SvelteKit が `params` のキーにするので、kebab-case にできない)、グループの名前は kebab-case にする。1つのフォルダに複数のパラメータを並べる形(`[lang]-[region]`)と、文字のエスケープ(`[x+2e]well-known`)は、SvelteKit では書けるが、今は許さない。使う場面が出たら、許すかをユーザーと決める。
- 一覧は `git ls-files -z` で取る。日本語のファイル名が引用符付きで返ってくるのを避けるため。作業ツリーから消したファイルは数えない。
- わざと約束を破る fixture を置く `tooling/lint/fixtures/invalid/` は、この検査から外す。
- 並べ替えでは `localeCompare` を使わない。実行環境のロケールで順番が変わるので、文字コードの順で並べる。

## コミットのときの検査

コミットのときに、git の hook(`tooling/git-hooks/`)が、`bun run check` では確かめられないものを確かめる。

- pre-commit(と、merge のときの pre-merge-commit)は、ステージしたファイルのパスと中身から、ほかのリポジトリの名前を探す。名前の一覧は手元にしか無く、CI では探せないため。作業ツリーでなく、ステージした中身を読む。
- commit-msg は、commitlint でメッセージの形を確かめ、メッセージから、ほかのリポジトリの名前と、用語集の「機械で探す語」に挙げた表記を探す。メッセージは、check の時点ではまだ無い。PR では、CI も同じ検査を、PR のコミットのメッセージとタイトルに掛ける(下の「CI」)。
- 整形・lint・型検査・テスト(ファイルの中の「機械で探す語」の検索を含む)は、コミットのときには流さない。CI と `bun run check` と役割が重なるため。時間の問題ではない。

### hook の入れ方

git の `core.hooksPath` を、コミットしたフォルダ `tooling/git-hooks` にする。`bun install` が、直下の package.json の `prepare` で `install.ts` を流して設定する(Bun は install・add・remove のたびに `prepare` を流す)。

- 相対パスの `core.hooksPath` は、hook を流す worktree の直下を起点に解決される。設定は全 worktree が共有するが、どの worktree でも、その worktree のブランチにある hook が流れ、hook の無い古いブランチでは何も流れない。
- hook を入れるツールは使わない。依存が増えるうえに、どれも worktree と合わない。lefthook と simple-git-hooks は、全 worktree が共有する `.git/hooks` に hook を書くので、ある worktree で入れた hook が、ほかの worktree でも流れ、その worktree のブランチにある hook と食い違う。lefthook 2.2.2 が書く hook は、lefthook の実行ファイルが見つからないと、メッセージを出すだけでコミットを通す。husky は、hook を置くフォルダが gitignore した生成物で、そのフォルダをまだ作っていない worktree では、黙って hook が流れない。
- `install.ts` は、パッケージの直下が git のリポジトリの直下のときだけ設定する。tarball をほかのリポジトリの中に展開したときに、そのリポジトリの設定を変えないため。

### コミットのメッセージの形

設定は直下の `commitlint.config.ts`。`@commitlint/config-conventional` を extends し、type と scope の一覧はこの設定にだけ書く。

- commitlint は、CLI のファイルを Bun で直接流す。bin の shebang は node で、`bun --bun run` は一時フォルダに `node` の symbolic link を作るので、書き込めない sandbox では Node で動いて失敗する。
- config-conventional のルールのうち、日本語の件名に合わないものを変えた。
  - `subject-case` を外す。日本語の文字に大文字と小文字が無いので、英語の語で始まる件名(「README を直す」「Svelte を上げる」など)を落とした。
  - `subject-full-stop` で止める文字を `。` にする。
  - `header-max-length`(文字の数で100)を外し、1行目を半角に換算して100文字までにするルール(`header-max-width`)を足す。文字の数で数えると、日本語だけの1行目は、英語の200文字分の幅まで通る。
  - `body-max-line-length`・`footer-max-line-length` を外す。日本語の文は空白で区切らないので、決まった文字の数で折り返すと、語や文の途中に改行が入る。
  - `body-leading-blank`・`footer-leading-blank` を、warning から error にする。warning ではコミットが通ってしまうため。
  - 件名に日本語(ひらがな・カタカナ・漢字)を求めるルール(`subject-japanese`)を足す。
- 足したルールは `tooling/git-hooks/commit-rules.ts` に置き、幅の上限もルールの中に書く。commitlint のルールは `(parsed, when, value)` の3つの引数で呼ばれ、設定から値を受け取ると `max-params` に掛かるため。
- テストは、例のメッセージを CLI に渡して、通らなかったルールの名前を確かめる。`@commitlint/lint` を直接呼ぶと、parser の設定の型が `unknown` で、型のキャスト無しには渡せない。

### コミットのメッセージの中身

- commitlint のルールにはしない。commitlint は、merge・revert・`fixup!`・`amend!` のメッセージを、ルールを1つも流さずに通すが、ブランチの名前が入る merge のメッセージや、rebase で元のメッセージを置き換える `amend!` の本文も探したい。
- git が消すコメント(`core.commentChar` で始まる行)と、`git commit --verbose` の scissors の行から後(diff)を除いてから探す。コメントには消したファイルのパスが、diff には消した行が入るので、名前を消すためのコミットを止めないため。
- 「機械で探す語」は、探す範囲が「リポジトリ全体」の表記だけを探す。メッセージは、どのフォルダにも属さない。

## CI

GitHub Actions の workflow を、`.github/workflows/` に2つ置く。job の名前(`check`・`commit-messages`)は、main の ruleset で、通ることを必須にする check として登録した名前なので、変えるときは ruleset も直す。

- **`check`**(`check.yml`):PR と main への push で、`bun install --frozen-lockfile` と `bun run check` を流す。手元と同じ手順で、ビルドまで流す。ビルドが検証する `ANALEMMA_INTERNAL_URL` は、job の `env` で渡す(秘密でない、手元の既定と同じ値。直下の `DECISIONS.md` の「環境変数」)。
- **`commit-messages`**(`commit-messages.yml`):PR で、PR のコミットのメッセージと、PR のタイトルを確かめる。main は「Squash and merge」だけにする予定で、main に残るのはタイトルになるため。
- **workflow を分ける**:`commit-messages` は、PR のタイトルを直したとき(`edited`)にも流す必要がある。`check` を同じ workflow に置くと、タイトルや本文を直すたびに `check` も流れる。job の `if` で `check` を飛ばすと、飛ばした job は通ったものとして扱われ、落ちていた `check` が、タイトルを直しただけで通ったことになる。同じ理由で、本文だけを直したときも `commit-messages` を飛ばさない。

### メッセージの検査

- **同じ検査を2か所に書かない**:`tooling/ci/check-pull-request-messages.ts` は、メッセージを1件ずつ一時ファイルに書き、commit-msg の hook のスクリプト(`tooling/git-hooks/commit-msg.ts`)にそのまま渡す。hook の検査を変えれば、CI の検査も変わる。`#` で始まる行の扱いも hook と同じになる。
- **範囲は PR のコミットだけ**:`git rev-list` で、`pull_request` イベントが渡す base の SHA から head の SHA までをたどる。main に入ったコミットは、入るときに確かめてある。検査を厳しくしても、過去のコミットで PR が落ちないようにするため。履歴をたどるので、checkout は `fetch-depth: 0` にする。
- **PR のタイトルは、main に残る1行目として確かめる**:「Squash and merge」は、タイトルの後ろに ` (#番号)` を足して1行目にする。確かめるのは番号を足した1行目なので、半角に換算した幅は番号まで含めて数える。
- **PR の本文は確かめない**:main に残るのはタイトルだけにする前提(squash のコミットのメッセージを、PR のタイトルだけにする設定)。本文も main に残す設定にするなら、本文も確かめる。
- **タイトルは環境変数と標準入力で渡す**:`${{ }}` で `run` に直接書くと、タイトルがシェルのスクリプトの一部として展開され、タイトルに書いたコマンドが流れる(script injection)。引数でなく標準入力で渡すのは、`-` で始まるタイトルを option と読ませないため。
- **ほかのリポジトリの名前は探さない**:CI には名前の一覧が無い(一覧は手元にだけ置くため)。名前は、手元の `bun run check` とコミットのときの hook が探す。

### 守りの設定

- **`permissions` は `contents: read` だけ**:どちらの job も、リポジトリを読むだけで何も書かない。既定の権限はリポジトリの設定で決まり、書き込みを含む設定にもできる。最上位で、権限ごとに `read` か `none` を書き、job では決めないことを、`tooling/structure/` のテストが確かめる(`tooling/ci/workflows.ts` が YAML を読んで確かめる。行を正規表現で探すと、`write-all` や job での上書き、引用符で囲んだキーを見落とした)。
- **checkout の `persist-credentials: false`**:token を `.git/config` に残さない。後の step(依存の install で流れる script を含む)から token を読めないようにする。
- **actions はコミットの SHA で固定する**:タグは付け替えられるので、同じタグでも別のコードが流れうる。SHA だけでは何のバージョンか読めないので、行末のコメントにバージョンを書く(設定ファイルにコメントを書かない約束の例外。直下の `DECISIONS.md`)。形は `tooling/structure/` のテストが確かめる。上げるときは、SHA とコメントを一緒に直す。
- **`concurrency`**:PR は番号ごとにまとめ、新しい実行が古い実行を止める。main への push の実行は SHA ごとに分け、新しい実行で古い実行を止めない。main のどのコミットにも結果を残すため。
- **runner を `ubuntu-26.04` に固定する**:`ubuntu-latest` は GitHub が切り替えるので、Node や git のバージョンが知らないうちに変わる(svelte-check は Node で動く)。
- **`timeout-minutes`**:既定の6時間は長すぎる。`check` は15分、`commit-messages` は5分にする。
- **依存を cache しない**:`bun install` は速く、cache の action を足すほどではない。CI で遅くなったら見直す。

## 割り切ったこと

- **TSDoc の言い回しの検査**:`tsdoc-role-only` は条件・例・補足・理由の言い回しを正規表現で見るので、すり抜けも誤検知もある。文の意味を読むには、日本語の構文の解析が要る。すり抜けはセルフレビューで見て、誤検知は言い回しを外して直す。
- **字下げのコードのブロック**:用語集の検査は、Markdown の、4つの空白で字下げしたコードのブロックを扱わない。コードはフェンスで書くので、受け入れる。
- **`import()` のほかの読み込み**:`no-dynamic-import` は `import()` だけを止める。`import.meta.require` や `node:module` の `createRequire` を使えば、境界の外のモジュールを読み込めるが、普通は書かない形なので止めていない。
- **`-m` で書いたメッセージの `#` の行**:git は、エディタを開かないとき(`-m`・`-F`)はコメントを消さないが、commit-msg の検査は `#` で始まる行を読まない。エディタで書いたときの git のコメントと見分けられないため。commitlint も同じ扱いをする。`core.commentChar` を `auto` にしたときも、`#` として扱う。どちらも、普通の使い方では起きないので受け入れる。
- **commitlint の既定の除外**:commitlint は、本文のどこかに `Merge branch …` のような行があるメッセージや、`1.2.3` だけのメッセージを、形を確かめずに通す。普通のメッセージには現れず、通っても、名前と「機械で探す語」の検索は流れるので、受け入れる。
- **既にある hook**:`install.ts` は、ほかの `core.hooksPath` があれば置き換える(前の値を出す)。そのため、`.git/hooks` の hook も流れなくなる。このリポジトリでは、ほかの hook を使っていない。
- **PATH に Bun が無い環境**:hook は `bun` を PATH から探すので、PATH を引き継がない GUI の git クライアントなどでは、hook が失敗してコミットできない。黙って通すより安全なので受け入れる。
- **PR のタイトルの句点**:確かめるのは ` (#番号)` を足した1行目なので、タイトルを `。` で終えても `subject-full-stop` では止まらない。main の1行目は番号で終わり、句点では終わらないので受け入れる。
- **hook を通らないメッセージの中の名前**:PR のタイトルと本文、GitHub の画面で作ったコミット(レビューの提案の取り込みなど)のメッセージは、手元の hook を通らない。CI にも名前の一覧が無い。一覧を CI に渡すと、一覧そのものを GitHub に預けることになり、見つけた名前も公開のログに出る。PR はエージェントが作るので、タイトルは、作る前に手元で `tooling/ci/check-pull-request-messages.ts` に通す(直下の `AGENTS.md`)。PR の本文は、どの検査も読まない。GitHub の画面で作ったコミットのメッセージは、CI が形を確かめるが、名前は探さない。どちらも書いた人が見る。本文を手元で探す仕組みは、足さないとユーザーが決めた。
- **CSS の文字列の中の `/*`**:`.svelte` の行数を数えるとき、`<style>` のコメントは正規表現で探すので、`content: "/*"` のような文字列をコメントの始まりと取り違える。細工した CSS でだけ起き、行数の上限を少しすり抜けるだけなので受け入れる。
- **コンポーネントのテストの並行**:コンポーネントのテストは、1つの document を共有し、テストのたびに全部を外す。`test.concurrent` で並べると、先に終わったテストの後始末が、ほかのテストの描画まで消す。`bun test` は既定で順に流し、並行にするのはわざわざ書いたときだけなので受け入れる。
- **テストを分ける条件**:`test:components` は、パスに `.svelte.test.ts` を含むファイルを選ぶ(`bun test` の引数は部分一致)。`.svelte.test.tsx` のような名前は両方に当たるが、Svelte では `.tsx` を使わないので受け入れる。
- **Markdown のフェンスの端の場合**:用語集の検査は、引用(`>`)の中のフェンスや、情報文字列にバッククォートを含む不正なフェンスを、CommonMark と違う形で読む。普通の文書には現れないので受け入れる。
- **squash の画面で書き換えたメッセージ**:「Squash and merge」の画面では、main に残るメッセージを書き換えられる。CI が確かめるのは PR のタイトルなので、書き換えた中身は誰も確かめない。merge するのはユーザーだけで、既定ではタイトルがそのまま入るので受け入れる。
- **PR が検査そのものを変えること**:`check` と `commit-messages` は、PR のブランチの workflow と検査のコードで流れる。PR が検査を常に通る形に変えても、必須の check は通る。merge するのはユーザーだけで、レビューで見るので受け入れる。外の人の PR を受けるようになったら、検査のコードの変更にユーザーのレビューを求めるかを決める。
- **ログの workflow command**:commitlint は、通らなかったメッセージの行をそのままログに出す。メッセージに `::warning::` のような行があると、GitHub Actions が workflow command として読みうる(確かめていない)。job の権限は読み取りだけで、秘密も渡していない。環境変数や PATH を変える command は GitHub が既定で止めているので、偽の注釈が出るくらいで済む。受け入れる。
