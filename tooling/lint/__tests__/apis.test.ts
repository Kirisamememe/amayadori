import { describe, expect, test } from "bun:test";

import { lintFixture, ruleIdsOf } from "../fixture-lint";

describe("使える API と書き方", () => {
  test.each([
    {
      label: "console",
      file: "syntax/restricted-apis.ts",
      rule: "eslint(no-console)",
    },
    {
      label: "process.env",
      file: "syntax/restricted-apis.ts",
      rule: "node(no-process-env)",
    },
    {
      label: "引数のプロパティの書き換え",
      file: "syntax/restricted-apis.ts",
      rule: "eslint(no-param-reassign)",
    },
    {
      label: "オブジェクトリテラルへの as",
      file: "syntax/object-literal-assertion.ts",
      rule: "typescript(consistent-type-assertions)",
    },
    {
      label: "u フラグの正規表現",
      file: "syntax/regexp-u-flag.ts",
      rule: "eslint(require-unicode-regexp)",
    },
    {
      label: "失敗を受け止める `.then()` の2つ目の引数",
      file: "syntax/then-with-rejection.ts",
      rule: "promise(prefer-catch)",
    },
    {
      label: "テストでないコードの、ループの中の await",
      file: "syntax/await-in-loop.ts",
      rule: "eslint(no-await-in-loop)",
    },
    {
      label: "src での Bun のグローバル",
      file: "src/lib/uses-bun.ts",
      rule: "eslint(no-restricted-globals)",
    },
    {
      label: "src での globalThis.Bun",
      file: "src/lib/uses-global-bun.ts",
      rule: "eslint(no-restricted-properties)",
    },
    {
      label: "src での Node の API の import",
      file: "src/lib/uses-node.ts",
      rule: "eslint(no-restricted-imports)",
    },
    {
      label: "src での bun:sqlite の import",
      file: "src/lib/uses-bun-sqlite.ts",
      rule: "eslint(no-restricted-imports)",
    },
  ])("$label に診断を出すこと", ({ file, rule }) => {
    const result = lintFixture(`invalid/${file}`);

    expect(ruleIdsOf(result)).toContain(rule);
    expect(result.status).not.toBe(0);
  });
});
