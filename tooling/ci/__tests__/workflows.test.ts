import { describe, expect, test } from "bun:test";

import { checkWorkflow } from "../workflows";

const SHA = "0123456789abcdef0123456789abcdef01234567";

const check = (lines: readonly string[]): string[] =>
  checkWorkflow({ path: "w.yml", text: `${lines.join("\n")}\n` });

const workflow = (
  permissions: readonly string[],
  steps: readonly string[],
): string[] =>
  check([
    "on: pull_request",
    ...permissions,
    "jobs:",
    "  check:",
    "    runs-on: ubuntu-26.04",
    "    steps:",
    ...steps,
  ]);

const READ = ["permissions:", "  contents: read"];
const PINNED = `      - uses: actions/checkout@${SHA} # v7.0.1`;

describe("workflow の権限", () => {
  test("最上位で読み取りだけの権限を決め、SHA で固定していれば受け入れること", () => {
    expect(workflow(READ, [PINNED, "      - run: bun run check"])).toEqual([]);
  });

  test.each([
    { label: "permissions が無い", permissions: [] },
    { label: "write-all", permissions: ["permissions: write-all"] },
    {
      label: "書き込みの権限",
      permissions: ["permissions:", "  contents: write"],
    },
  ])("$label に診断を出すこと", ({ permissions }) => {
    expect(workflow(permissions, [PINNED])).toHaveLength(1);
  });

  test("job で権限を上書きしたら、診断を出すこと", () => {
    expect(
      check([
        "on: pull_request",
        ...READ,
        "jobs:",
        "  check:",
        "    permissions:",
        "      contents: read",
        "    runs-on: ubuntu-26.04",
        "    steps:",
        PINNED,
      ]),
    ).toEqual(["w.yml: job で permissions を決めている"]);
  });
});

describe("action の固定", () => {
  test.each([
    {
      label: "タグで参照した action",
      step: "      - uses: actions/checkout@v7",
    },
    {
      label: "引用符で囲んだキーの、タグで参照した action",
      step: "      - 'uses': actions/checkout@v7",
    },
    {
      label: "行末にバージョンの無い action",
      step: `      - uses: actions/checkout@${SHA}`,
    },
  ])("$label に診断を出すこと", ({ step }) => {
    expect(workflow(READ, [step])).toHaveLength(1);
  });

  test("引用符で囲んだ値も、SHA と行末のバージョンがあれば受け入れること", () => {
    expect(
      workflow(READ, [`      - uses: "actions/checkout@${SHA}" # v7.0.1`]),
    ).toEqual([]);
  });

  test("再利用する workflow を呼ぶ job の uses も確かめること", () => {
    expect(
      check([
        "on: pull_request",
        ...READ,
        "jobs:",
        "  call:",
        "    uses: owner/repo/.github/workflows/a.yml@main",
      ]),
    ).toHaveLength(1);
  });
});
