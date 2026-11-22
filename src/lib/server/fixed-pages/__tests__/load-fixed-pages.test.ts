import { type AnalemmaClient, createAnalemmaClient } from "@analemma/client";
import { describe, expect, test } from "bun:test";

import { listFixedPageLinks, loadFixedPageView } from "../load-fixed-pages";

type StoredPage = {
  /** 種類の名前。 */
  readonly kind: string;
  /** slug。 */
  readonly slug: string;
  /** タイトル。 */
  readonly title: string;
  /** 保存した中身。 */
  readonly content: Readonly<Record<string, unknown>>;
};

type FakeCms = {
  /** テストのために作った公開 API につないだ client。 */
  readonly cms: AnalemmaClient;
  /** 届いたリクエストのパス。 */
  readonly requests: readonly string[];
};

const PUBLISHED_AT = "2026-11-23T00:00:00.000Z";

const toSummary = ({ kind, slug, title }: StoredPage) => ({
  kind,
  slug,
  title,
  publishedAt: PUBLISHED_AT,
  updatedAt: PUBLISHED_AT,
});

const respond = (json: unknown, status = 200): Response =>
  Response.json({ json }, { status });

const NOT_FOUND = {
  defined: true,
  code: "NOT_FOUND",
  status: 404,
  message: "Not Found",
};

const isRequested =
  (input: unknown) =>
  ({ kind, slug }: StoredPage): boolean =>
    typeof input === "object" &&
    input !== null &&
    "json" in input &&
    typeof input.json === "object" &&
    input.json !== null &&
    "kind" in input.json &&
    "slug" in input.json &&
    input.json.kind === kind &&
    input.json.slug === slug;

const createFakeCms = (pages: readonly StoredPage[]): FakeCms => {
  const requests: string[] = [];
  const cms = createAnalemmaClient({
    url: "http://127.0.0.1:8788",
    fetch: async (request) => {
      const path = new URL(request.url).pathname;
      const input: unknown = await request.json();

      requests.push(path);

      if (path === "/api/public/fixedPages/list") {
        return respond({ pages: pages.map((page) => toSummary(page)) });
      }

      const page = pages.find(isRequested(input));

      return page === undefined
        ? respond(NOT_FOUND, 404)
        : respond({ ...toSummary(page), content: page.content });
    },
  });

  return { cms, requests };
};

const ABOUT: StoredPage = {
  kind: "about",
  slug: "me",
  title: "自己紹介",
  content: {
    headline: "こんにちは",
    body: "1つ目の段落。\n続きの行。\n\n  \n2つ目の段落。",
    website: "https://example.com/",
    unknownKey: "定義に無いキー",
  },
};

const NOTE: StoredPage = {
  kind: "note",
  slug: "first-note",
  title: "最初のメモ",
  content: { body: "メモの本文。" },
};

describe("固定ページへのリンク", () => {
  test("このサイトが描ける種類のページだけを、並び順のまま返すこと", async () => {
    const { cms } = createFakeCms([
      NOTE,
      { kind: "gallery", slug: "photos", title: "写真", content: {} },
      ABOUT,
    ]);

    expect(await listFixedPageLinks(cms)).toStrictEqual([
      { href: "/note/first-note", title: "最初のメモ" },
      { href: "/about/me", title: "自己紹介" },
    ]);
  });
});

describe("固定ページを描くための値", () => {
  test("自己紹介のページから、描くのに要るプロパティだけを返すこと", async () => {
    const { cms } = createFakeCms([ABOUT]);

    expect(
      await loadFixedPageView(cms, { kind: "about", slug: "me" }),
    ).toStrictEqual({
      kind: "about",
      title: "自己紹介",
      headline: "こんにちは",
      paragraphs: ["1つ目の段落。\n続きの行。", "2つ目の段落。"],
      website: "https://example.com/",
    });
  });

  test("本文と Web サイトの無い自己紹介のページでは、段落を空にし、Web サイトを undefined にすること", async () => {
    const { cms } = createFakeCms([
      { ...ABOUT, content: { headline: "こんにちは" } },
    ]);

    expect(
      await loadFixedPageView(cms, { kind: "about", slug: "me" }),
    ).toStrictEqual({
      kind: "about",
      title: "自己紹介",
      headline: "こんにちは",
      paragraphs: [],
      website: undefined,
    });
  });

  test("メモのページから、描くのに要るプロパティだけを返すこと", async () => {
    const { cms } = createFakeCms([NOTE]);

    expect(
      await loadFixedPageView(cms, { kind: "note", slug: "first-note" }),
    ).toStrictEqual({
      kind: "note",
      title: "最初のメモ",
      paragraphs: ["メモの本文。"],
    });
  });

  test("公開していないページは undefined にすること", async () => {
    const { cms } = createFakeCms([ABOUT]);

    expect(
      await loadFixedPageView(cms, { kind: "note", slug: "me" }),
    ).toBeUndefined();
  });

  test.each([
    { label: "このサイトが知らない種類", kind: "gallery", slug: "photos" },
    { label: "大文字の slug", kind: "about", slug: "Me" },
    { label: "ハイフンで終わる slug", kind: "about", slug: "me-" },
    { label: "101文字の slug", kind: "about", slug: "a".repeat(101) },
  ])(
    "$label では、Analemma を呼ばずに undefined にすること",
    async ({ kind, slug }) => {
      const { cms, requests } = createFakeCms([ABOUT]);

      expect(await loadFixedPageView(cms, { kind, slug })).toBeUndefined();
      expect(requests).toStrictEqual([]);
    },
  );
});
