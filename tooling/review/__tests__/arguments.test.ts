import { describe, expect, test } from "bun:test";

import {
  type InvalidArguments,
  parseReviewArguments,
  type ReviewArguments,
} from "../arguments";

const problemOf = (parsed: ReviewArguments | InvalidArguments): string =>
  parsed._tag === "Invalid" ? parsed.problem : "引数を読めてしまった";

describe("bun run review の引数を読むこと", () => {
  test("観点と、比べる元のブランチと、レビューするブランチを読むこと", () => {
    const parsed = parseReviewArguments([
      "--perspective",
      "ui",
      "--base",
      "main",
      "--head",
      "claude/pages",
    ]);

    expect(parsed).toMatchObject({
      _tag: "Parsed",
      perspective: { id: "ui" },
      base: "main",
      head: "claude/pages",
    });
  });

  test("レビューするブランチを省くと、head を undefined にすること", () => {
    expect(
      parseReviewArguments(["--perspective", "logic", "--base", "main"]),
    ).toMatchObject({ _tag: "Parsed", head: undefined });
  });

  test("--head に空の文字列を渡すと、省いたものとして読むこと", () => {
    expect(
      parseReviewArguments([
        "--perspective",
        "logic",
        "--base",
        "main",
        "--head=",
      ]),
    ).toMatchObject({ _tag: "Parsed", head: undefined });
  });

  test("知らない観点は、選べる観点を挙げて断ること", () => {
    const parsed = parseReviewArguments([
      "--perspective",
      "performance",
      "--base",
      "main",
    ]);

    expect(problemOf(parsed)).toContain(
      "logic・security・ui・conventions・wording",
    );
  });

  test("観点を省くと断ること", () => {
    expect(parseReviewArguments(["--base", "main"])._tag).toBe("Invalid");
  });

  test("比べる元のブランチを省くか、空にすると断ること", () => {
    expect(problemOf(parseReviewArguments(["--perspective", "ui"]))).toContain(
      "--base",
    );
    expect(
      parseReviewArguments(["--perspective", "ui", "--base", ""])._tag,
    ).toBe("Invalid");
  });

  test("知らない option と、option でない引数を断ること", () => {
    expect(
      parseReviewArguments([
        "--perspective",
        "ui",
        "--base",
        "main",
        "--model",
        "composer-2.5",
      ])._tag,
    ).toBe("Invalid");
    expect(
      parseReviewArguments(["--perspective", "ui", "--base", "main", "x"])._tag,
    ).toBe("Invalid");
  });
});
