import { describe, expect, test } from "bun:test";

import { findBadDirectories, findCrowdedDirectories } from "../directories";

describe("中身が多すぎるフォルダ", () => {
  test("上限を超えたフォルダだけを、中身の数と一緒に返すこと", () => {
    const paths = [
      "src/a.ts",
      "src/b.ts",
      "src/c.ts",
      "src/inner/d.ts",
      "lib/a.ts",
    ];

    expect(findCrowdedDirectories({ limit: 3, paths })).toEqual([
      { directory: "src", entries: 4 },
    ]);
  });

  test("__tests__ と文書は数えないこと", () => {
    const paths = [
      "src/a.ts",
      "src/__tests__/a.test.ts",
      "src/AGENTS.md",
      "src/CLAUDE.md",
      "src/DECISIONS.md",
      "src/README.md",
    ];

    expect(findCrowdedDirectories({ limit: 1, paths })).toEqual([]);
  });

  test("リポジトリの直下と、. で始まるフォルダの中は、件数を検査しないこと", () => {
    const paths = ["a.ts", "b.ts", ".github/workflows/a.yml", ".github/b.yml"];

    expect(findCrowdedDirectories({ limit: 1, paths })).toEqual([]);
  });
});

describe("フォルダの名前", () => {
  test("kebab-case でない名前を返すこと", () => {
    const paths = [
      "src/myFeature/a.ts",
      "src/my_feature/a.ts",
      "src/ok-name/a.ts",
    ];

    expect(findBadDirectories(paths)).toEqual([
      "src/myFeature",
      "src/my_feature",
    ]);
  });

  test("__tests__ の中のフォルダを返すこと", () => {
    const paths = ["src/__tests__/deep/a.test.ts", "src/__tests__/b.test.ts"];

    expect(findBadDirectories(paths)).toEqual(["src/__tests__/deep"]);
  });

  test("__tests__ と、. で始まるフォルダは受け入れること", () => {
    const paths = ["src/__tests__/a.test.ts", ".claude/settings.json"];

    expect(findBadDirectories(paths)).toEqual([]);
  });
});

describe("SvelteKit の routes のフォルダの名前", () => {
  test("routes の中では、パラメータとグループの形を受け入れること", () => {
    const paths = [
      "src/routes/posts/[slug]/+page.svelte",
      "src/routes/[[lang]]/+page.svelte",
      "src/routes/files/[...rest]/+page.svelte",
      "src/routes/items/[itemId=integer]/+page.svelte",
      "src/routes/(site)/+layout.svelte",
    ];

    expect(findBadDirectories(paths)).toEqual([]);
  });

  test("routes の外の、パラメータの形の名前を返すこと", () => {
    expect(findBadDirectories(["src/lib/[slug]/a.ts"])).toEqual([
      "src/lib/[slug]",
    ]);
  });

  test("routes の中でも、決まった形でない名前を返すこと", () => {
    const paths = [
      "src/routes/[Slug]/+page.svelte",
      "src/routes/(Site)/+page.svelte",
      "src/routes/[slug/+page.svelte",
      "src/routes/My_Page/+page.svelte",
    ];

    expect(findBadDirectories(paths)).toEqual([
      "src/routes/(Site)",
      "src/routes/My_Page",
      "src/routes/[Slug]",
      "src/routes/[slug",
    ]);
  });
});
