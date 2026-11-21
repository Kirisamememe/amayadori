import { parse } from "svelte/compiler";

/** ソースのファイルの中のコメント。 */
export type Comment = {
  /** コメントの形。 */
  readonly type: "Block" | "Line";
  /** `//` や `/*` を除いた本文。 */
  readonly value: string;
  /** 始まりの位置。 */
  readonly start: number;
  /** 終わりの位置。 */
  readonly end: number;
};

/** マークアップの `<!-- -->` のコメント。 */
export type MarkupComment = {
  /** `<!--` と `-->` を除いた本文。 */
  readonly data: string;
  /** 始まりの位置。 */
  readonly start: number;
  /** 終わりの位置。 */
  readonly end: number;
};

/** Svelte のコンポーネントを、検査のために読み分けた結果。 */
export type SvelteParts = {
  /** `<script>` の中身だけを残し、ほかを空白にした文字列。 */
  readonly scripts: string;
  /** `<script>` と `<style>` の中身を空白にした文字列。 */
  readonly markup: string;
  /** `<script>` の中のコメント。 */
  readonly comments: readonly Comment[];
  /** マークアップのコメント。 */
  readonly markupComments: readonly MarkupComment[];
  /** `<svelte:options>` で runes を切っているか。 */
  readonly runesDisabled: boolean;
  /** マークアップ・`<style>`・`<script>` のコメントを空白にした文字列。 */
  readonly withoutComments: string;
};

/** ファイルの中の範囲。 */
type Range = {
  /** 始まりの位置。 */
  readonly start: number;
  /** 終わりの位置。 */
  readonly end: number;
};

/** 開きと閉じのタグを含む、`<script>` の範囲と属性。 */
type ScriptTag = Range & {
  /** 開きのタグの属性。 */
  readonly attributes: readonly Range[];
};

const SCRIPT_CLOSE = "</script";
const CSS_COMMENT = /\/\*[\s\S]*?\*\//gv;

/** 改行を残し、長さを変えずに、文字を空白にする。 */
export const blank = (text: string): string =>
  text.replaceAll(/[^\n\r\p{Zl}\p{Zp}]/gv, (character) =>
    " ".repeat(character.length),
  );

const keepOnly = (text: string, ranges: readonly Range[]): string =>
  ranges.reduce(
    (kept, { end, start }) =>
      kept.slice(0, start) + text.slice(start, end) + kept.slice(end),
    blank(text),
  );

const blankRanges = (text: string, ranges: readonly Range[]): string =>
  ranges.reduce(
    (blanked, { end, start }) =>
      blanked.slice(0, start) +
      blank(blanked.slice(start, end)) +
      blanked.slice(end),
    text,
  );

const blankMatches = (text: string, pattern: RegExp): string =>
  text.replaceAll(pattern, (match) => blank(match));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toMarkupComment = (node: Record<string, unknown>): MarkupComment[] => {
  const { data, end, start, type } = node;

  return type === "Comment" &&
    typeof data === "string" &&
    typeof start === "number" &&
    typeof end === "number"
    ? [{ data, start, end }]
    : [];
};

const findMarkupComments = (node: unknown): MarkupComment[] => {
  if (Array.isArray(node)) {
    return node.flatMap((child: unknown) => findMarkupComments(child));
  }

  return isRecord(node)
    ? [
        ...toMarkupComment(node),
        ...Object.values(node).flatMap((child) => findMarkupComments(child)),
      ]
    : [];
};

const scriptContent = (
  text: string,
  { attributes, end, start }: ScriptTag,
): Range => ({
  start:
    text.indexOf(
      ">",
      Math.max(start, ...attributes.map((attribute) => attribute.end)),
    ) + 1,
  end: text.lastIndexOf(SCRIPT_CLOSE, end),
});

/** Svelte のコンポーネントを、`<script>`・マークアップ・コメントに読み分ける。 */
export const readSvelte = (text: string): SvelteParts => {
  const root = parse(text, { modern: true });
  const scripts = [root.module, root.instance].flatMap((script) =>
    script ? [scriptContent(text, script)] : [],
  );
  const styles = root.css ? [root.css.content] : [];
  const comments: Comment[] = root.comments.map(
    ({ end, start, type, value }) => ({ end, start, type, value }),
  );
  const markup = blankRanges(text, [...scripts, ...styles]);
  const withoutScriptComments = blankRanges(text, comments);
  const withoutCssComments = styles.reduce(
    (current, { end, start }) =>
      current.slice(0, start) +
      blankMatches(current.slice(start, end), CSS_COMMENT) +
      current.slice(end),
    withoutScriptComments,
  );
  const markupComments = findMarkupComments(root.fragment);

  return {
    scripts: keepOnly(text, scripts),
    markup,
    comments,
    markupComments,
    runesDisabled: root.options?.runes === false,
    withoutComments: blankRanges(withoutCssComments, markupComments),
  };
};
