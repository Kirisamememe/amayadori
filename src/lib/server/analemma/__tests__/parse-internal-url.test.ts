import { describe, expect, test } from "bun:test";

import { parseInternalUrl } from "../parse-internal-url";

describe("Analemma の内部用のポートの URL", () => {
  test.each([
    { value: "http://127.0.0.1:8788", parsed: "http://127.0.0.1:8788" },
    { value: "http://analemma:8788/", parsed: "http://analemma:8788" },
    { value: "https://cms.internal", parsed: "https://cms.internal" },
  ])("$value を origin にして受け入れること", ({ parsed, value }) => {
    expect(parseInternalUrl(value)).toBe(parsed);
  });

  test.each([
    { label: "設定していない値", value: undefined },
    { label: "空の値", value: "" },
    { label: "URL でない値", value: "127.0.0.1:8788" },
    { label: "http と https でない URL", value: "ftp://127.0.0.1:8788" },
    { label: "資格情報の入った URL", value: "http://user:pass@127.0.0.1:8788" },
    { label: "パスの付いた URL", value: "http://127.0.0.1:8788/base" },
    { label: "クエリの付いた URL", value: "http://127.0.0.1:8788/?token=x" },
    { label: "空のクエリの付いた URL", value: "http://127.0.0.1:8788/?" },
    { label: "フラグメントの付いた URL", value: "http://127.0.0.1:8788/#a" },
    { label: "空のフラグメントの付いた URL", value: "http://127.0.0.1:8788/#" },
  ])("$label を断ること", ({ value }) => {
    expect(() => parseInternalUrl(value)).toThrow("ANALEMMA_INTERNAL_URL");
  });

  test("断るときの文言に、設定した値を出さないこと", () => {
    expect(() =>
      parseInternalUrl("http://user:secret@127.0.0.1:8788"),
    ).not.toThrow("secret");
  });
});
