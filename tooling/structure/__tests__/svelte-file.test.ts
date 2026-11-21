import { describe, expect, test } from "bun:test";

import { checkSourceFile } from "../source-file";
import { readSvelte } from "../svelte-file";

const SCRIPT_OPEN = '<script lang="ts">';

const markupLines = (count: number): string =>
  Array.from({ length: count }, (_, index) => `<p>${String(index)}</p>`).join(
    "\n",
  );

const checkSvelte = (lines: readonly string[]): string[] =>
  checkSourceFile({ path: "sample.svelte", text: `${lines.join("\n")}\n` });

describe("コンポーネントの読み分け", () => {
  test("<script> の中身・マークアップ・コメントを、位置を変えずに読み分けること", () => {
    const text = [
      SCRIPT_OPEN,
      "  const title = 1; // 題",
      "</script>",
      "<!-- 注 -->",
      "<h1>{title}</h1>",
      "<style>",
      "  /* 色 */",
      "  h1 { color: red; }",
      "</style>",
    ].join("\n");
    const parts = readSvelte(text);

    expect(parts.scripts).toHaveLength(text.length);
    expect(parts.scripts).toContain("const title = 1;");
    expect(parts.scripts).not.toContain("<h1>");
    expect(parts.markup).toContain("<h1>{title}</h1>");
    expect(parts.markup).not.toContain("const title");
    expect(parts.comments.map(({ value }) => value)).toEqual([" 題"]);
    expect(parts.withoutComments).not.toContain("注");
    expect(parts.withoutComments).not.toContain("色");
    expect(parts.withoutComments).not.toContain("題");
    expect(parts.withoutComments).toContain("h1 { color: red; }");
  });
});

test("属性に > のある <script> でも、中身の始まりを取り違えないこと", () => {
  const text = [
    '<script lang="ts" generics="T extends Array<string>">',
    "  // 注",
    "  let { items }: { items: T } = $props();",
    "</script>",
  ].join("\n");
  const { comments, scripts } = readSvelte(text);

  expect(scripts.split("\n")[0]?.trim()).toBe("");
  expect(scripts).toContain("let { items }");
  expect(comments.map(({ value }) => value)).toEqual([" 注"]);
});

test("属性の値の中の <!-- や -->を、コメントと取り違えないこと", () => {
  const text = [
    '<p title="<!--">1</p>',
    "<p>2</p>",
    '<p title="-->">3</p>',
    '<p title="<!-- svelte-ignore a11y_missing_attribute -->">4</p>',
  ].join("\n");
  const parts = readSvelte(text);

  expect(parts.markupComments).toEqual([]);
  expect(parts.withoutComments).toContain("<p>2</p>");
  expect(checkSourceFile({ path: "sample.svelte", text })).toEqual([]);
});

test("UTF-16 で2つの単位を使う文字があっても、後ろのコメントの位置を取り違えないこと", () => {
  const text = [
    SCRIPT_OPEN,
    "  // 🌧🌧🌧🌧",
    "</script>",
    "<!-- 注 -->",
    "<p>本文</p>",
  ].join("\n");
  const { withoutComments } = readSvelte(text);

  expect(withoutComments).toHaveLength(text.length);
  expect(withoutComments).not.toContain("注");
  expect(withoutComments).not.toContain("-->");
});

describe("コンポーネントの長さ", () => {
  test("マークアップ・スタイル・<script> のコメントと空行を数えず、400行までなら受け入れること", () => {
    expect(
      checkSvelte([
        SCRIPT_OPEN,
        "  // 注",
        "</script>",
        "",
        "<!-- 注 -->",
        markupLines(396),
        "<style>",
        "  /* 注 */",
        "</style>",
      ]),
    ).toEqual([]);
  });

  test("コードが400行を超えたら、抑制があっても診断を出すこと", () => {
    const problems = checkSvelte([
      SCRIPT_OPEN,
      "  // oxlint-disable project/max-code-lines -- 分けられない",
      "</script>",
      markupLines(399),
    ]);

    expect(problems).toContain(
      "Svelte のコンポーネントのコードが 401 行あり、400 行を超えている(コンポーネントは抑制できないので分ける)",
    );
    expect(problems).toContain(
      "Svelte のコンポーネントでは project/max-code-lines を抑制できない",
    );
  });
});

describe("コンポーネントの中の抑制", () => {
  test("<script> の中の、理由の無い抑制に診断を出すこと", () => {
    expect(
      checkSvelte([
        SCRIPT_OPEN,
        "  // oxlint-disable-next-line eslint/no-console",
        "  console.info(1);",
        "</script>",
      ]),
    ).toEqual(["`--` の後の理由の無い抑制がある"]);
  });

  test("理由の無い svelte-ignore に、マークアップでも <script> でも診断を出すこと", () => {
    expect(
      checkSvelte([
        SCRIPT_OPEN,
        "  // svelte-ignore state_referenced_locally",
        "  let count = $state(0);",
        "</script>",
        "<!-- svelte-ignore a11y_missing_attribute -->",
        '<img src="a.png" />',
      ]),
    ).toEqual([
      "`--` の後の理由の無い svelte-ignore がある",
      "`--` の後の理由の無い svelte-ignore がある",
    ]);
  });

  test("理由のある svelte-ignore を受け入れること", () => {
    expect(
      checkSvelte([
        "<!-- svelte-ignore a11y_missing_attribute -- 飾りの画像 -->",
        '<img src="a.png" />',
      ]),
    ).toEqual([]);
  });

  test("runes を切る <svelte:options> に、診断を出すこと", () => {
    expect(
      checkSvelte(["<svelte:options runes={false} />", "<p>本文</p>"]),
    ).toEqual(["`<svelte:options runes={false} />` で runes を切っている"]);
  });

  test("読めないコンポーネントに、診断を出すこと", () => {
    expect(checkSvelte(["{#if open}"])[0]).toStartWith("構文を読めない");
  });
});
