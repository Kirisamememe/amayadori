import type { AnalemmaClient } from "@analemma/client";

import kinds, { about, note } from "#lib/server/kinds/kinds";

/** トップページに並べる、固定ページへのリンク。 */
export type FixedPageLink = {
  /** ページの URL のパス。 */
  readonly href: string;
  /** ページのタイトル。 */
  readonly title: string;
};

/** 自己紹介のページを描くために、ブラウザへ返す項目。 */
export type AboutView = {
  /** 種類の名前。 */
  readonly kind: "about";
  /** ページのタイトル。 */
  readonly title: string;
  /** 見出し。 */
  readonly headline: string;
  /** 本文の段落。 */
  readonly paragraphs: readonly string[];
  /** Web サイトの URL。 */
  readonly website: string | undefined;
};

/** メモのページを描くために、ブラウザへ返す項目。 */
export type NoteView = {
  /** 種類の名前。 */
  readonly kind: "note";
  /** ページのタイトル。 */
  readonly title: string;
  /** 本文の段落。 */
  readonly paragraphs: readonly string[];
};

/** 固定ページを描くために、ブラウザへ返す項目。 */
export type FixedPageView = AboutView | NoteView;

const KIND_NAMES = new Set<string>(kinds.map(({ name }) => name));
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/v;
const MAX_SLUG_LENGTH = 100;

const toPath = (kind: string, slug: string): string => `/${kind}/${slug}`;

const toParagraphs = (text: string | undefined): string[] =>
  (text ?? "")
    .split(/\n\s*\n/v)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");

/** 公開している固定ページのうち、このサイトが描ける種類のものへのリンクを返す。 */
export const listFixedPageLinks = async (
  cms: AnalemmaClient,
): Promise<FixedPageLink[]> =>
  (await cms.fixedPages.list())
    .filter(({ kind }) => KIND_NAMES.has(kind))
    .map(({ kind, slug, title }) => ({ href: toPath(kind, slug), title }));

/** 固定ページの URL の、種類と slug。 */
export type FixedPageAddress = {
  /** 種類の名前。 */
  readonly kind: string;
  /** slug。 */
  readonly slug: string;
};

/** 種類と slug で引いた公開している固定ページの、描くのに要る項目を返す。 */
export const loadFixedPageView = async (
  cms: AnalemmaClient,
  { kind, slug }: FixedPageAddress,
): Promise<FixedPageView | undefined> => {
  if (slug.length > MAX_SLUG_LENGTH || !SLUG.test(slug)) {
    return undefined;
  }

  switch (kind) {
    case about.name: {
      const page = await cms.fixedPages.get(about, slug);

      return page === undefined
        ? undefined
        : {
            kind: "about",
            title: page.title,
            headline: page.content.headline,
            paragraphs: toParagraphs(page.content.body),
            website: page.content.website,
          };
    }
    case note.name: {
      const page = await cms.fixedPages.get(note, slug);

      return page === undefined
        ? undefined
        : {
            kind: "note",
            title: page.title,
            paragraphs: toParagraphs(page.content.body),
          };
    }
    default:
      return undefined;
  }
};
