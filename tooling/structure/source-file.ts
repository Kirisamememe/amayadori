import { parseSync } from "oxc-parser";

import { matchesRule, parseDisableDirective } from "./disable-directives";
import {
  type Comment,
  type SvelteParts,
  blank,
  readSvelte,
} from "./svelte-file";

/** 理由付きの抑制が無ければ越えられない、コードの行数。 */
export const SOFT_LIMIT = 400;

/** 理由があっても越えられない、コードの行数。 */
export const HARD_LIMIT = 800;

/** 400行を超えるときに、理由付きの抑制で抑制するルール。 */
export const SOFT_LIMIT_RULE = "project/max-code-lines";

/** 抑制できないルール。 */
export const PROTECTED_RULES = [
  "project/file-length-limit",
  "project/no-standalone-comment",
  "project/require-disable-reason",
];

/** 検査するソースのファイル。 */
export type SourceFile = {
  /** リポジトリの直下から数えたパス。 */
  readonly path: string;
  /** ファイルの中身。 */
  readonly text: string;
};

const DIVIDER_LINE = /^\s*-{10,}\s*$/v;
const HAS_WORD = /[\p{L}\p{N}]/v;

const blankOutComments = (text: string, comments: readonly Comment[]) =>
  comments.reduce(
    (blanked, comment) =>
      blanked.slice(0, comment.start) +
      blank(blanked.slice(comment.start, comment.end)) +
      blanked.slice(comment.end),
    text,
  );

const splitLines = (text: string): string[] =>
  text.replaceAll("\r\n", "\n").split(/[\n\r\p{Zl}\p{Zp}]/v);

const countCodeLines = (text: string, comments: readonly Comment[]): number =>
  splitLines(blankOutComments(text, comments)).filter(
    (line) => line.trim() !== "",
  ).length;

const lineNumberOf = (text: string, index: number): number =>
  splitLines(text.slice(0, index)).length;

const isStandaloneLine = (text: string, comment: Comment): boolean => {
  const before = splitLines(text.slice(0, comment.start)).at(-1) ?? "";

  return comment.type === "Line" && before.trim() === "";
};

const isTitle = (comment: Comment): boolean =>
  !DIVIDER_LINE.test(comment.value) &&
  HAS_WORD.test(comment.value) &&
  parseDisableDirective(comment.value) === undefined;

const hasDividerFollowedByCode = (
  text: string,
  comments: readonly Comment[],
): boolean => {
  const blanked = blankOutComments(text, comments);
  const lines = comments.filter((comment) => isStandaloneLine(text, comment));

  return lines.some((top, index) => {
    const title = lines[index + 1];
    const bottom = lines[index + 2];

    return (
      title !== undefined &&
      bottom !== undefined &&
      DIVIDER_LINE.test(top.value) &&
      isTitle(title) &&
      DIVIDER_LINE.test(bottom.value) &&
      lineNumberOf(text, title.start) === lineNumberOf(text, top.start) + 1 &&
      lineNumberOf(text, bottom.start) === lineNumberOf(text, top.start) + 2 &&
      blanked.slice(bottom.end).trim() !== ""
    );
  });
};

const isSoftLimitException = (comment: Comment | undefined): boolean => {
  const directive =
    comment === undefined ? undefined : parseDisableDirective(comment.value);

  return (
    comment?.type === "Line" &&
    comment.start === 0 &&
    directive?.kind === "disable" &&
    directive.reason !== "" &&
    directive.rules.some((token) =>
      matchesRule({ rule: SOFT_LIMIT_RULE, token }),
    )
  );
};

const SVELTE_IGNORE = /^\s*svelte-ignore\s/v;
const IGNORE_REASON = /\s--\s*\S/v;

/** 抑制のコメントを調べるための入力。 */
type DirectiveCheck = {
  /** ファイルの中のコメント。 */
  readonly comments: readonly Comment[];
  /** 1行目の理由付きの抑制を許すか。 */
  readonly allowSoftLimitException: boolean;
};

const directiveProblems = ({
  allowSoftLimitException,
  comments,
}: DirectiveCheck): string[] =>
  comments.flatMap((comment, index) => {
    const directive = parseDisableDirective(comment.value);

    if (directive === undefined) {
      return [];
    }

    const softLimitSuppressed = directive.rules.some((token) =>
      matchesRule({ rule: SOFT_LIMIT_RULE, token }),
    );

    return [
      ...(directive.rules.length === 0 ? ["ルールの名前の無い抑制がある"] : []),
      ...(directive.reason === "" ? ["`--` の後の理由の無い抑制がある"] : []),
      ...PROTECTED_RULES.filter((rule) =>
        directive.rules.some((token) => matchesRule({ rule, token })),
      ).map((rule) => `抑制できない ${rule} を抑制している`),
      ...(softLimitSuppressed &&
      !(allowSoftLimitException && index === 0 && isSoftLimitException(comment))
        ? [
            allowSoftLimitException
              ? `${SOFT_LIMIT_RULE} の抑制は、1行目に \`// oxlint-disable\` の形で書く`
              : `Svelte のコンポーネントでは ${SOFT_LIMIT_RULE} を抑制できない`,
          ]
        : []),
    ];
  });

const svelteIgnoreProblems = ({
  comments,
  markupComments,
}: SvelteParts): string[] =>
  [
    ...markupComments.map(({ data }) => data),
    ...comments.map(({ value }) => value),
  ]
    .filter((body) => SVELTE_IGNORE.test(body) && !IGNORE_REASON.test(body))
    .map(() => "`--` の後の理由の無い svelte-ignore がある");

const readSvelteParts = (text: string): SvelteParts | string => {
  try {
    return readSvelte(text);
  } catch (error: unknown) {
    return `構文を読めない:${String(error)}`;
  }
};

const checkSvelteFile = (text: string): string[] => {
  const parts = readSvelteParts(text);

  if (typeof parts === "string") {
    return [parts];
  }

  const { comments, withoutComments } = parts;
  const lines = splitLines(withoutComments).filter(
    (line) => line.trim() !== "",
  ).length;

  return [
    ...(lines > SOFT_LIMIT
      ? [
          `Svelte のコンポーネントのコードが ${String(lines)} 行あり、${String(SOFT_LIMIT)} 行を超えている(コンポーネントは抑制できないので分ける)`,
        ]
      : []),
    ...directiveProblems({ comments, allowSoftLimitException: false }),
    ...svelteIgnoreProblems(parts),
    ...(parts.runesDisabled
      ? ["`<svelte:options runes={false} />` で runes を切っている"]
      : []),
  ];
};

/** ソースのファイル1つについて、抑制できない約束の違反を集める。 */
export const checkSourceFile = ({ path, text }: SourceFile): string[] => {
  if (path.endsWith(".svelte")) {
    return checkSvelteFile(text);
  }

  const comments: readonly Comment[] = parseSync(path, text).comments;
  const lines = countCodeLines(text, comments);
  const lengthProblems =
    lines > HARD_LIMIT
      ? [
          `コードが ${String(lines)} 行あり、${String(HARD_LIMIT)} 行を超えている`,
        ]
      : [];
  const exceptionProblems =
    lines > SOFT_LIMIT
      ? [
          ...(isSoftLimitException(comments[0])
            ? []
            : [
                `コードが ${String(SOFT_LIMIT)} 行を超えるのに、1行目に理由付きの抑制が無い`,
              ]),
          ...(hasDividerFollowedByCode(text, comments)
            ? []
            : [
                `コードが ${String(SOFT_LIMIT)} 行を超えるのに、後ろにコードが続く分割の見出しが無い`,
              ]),
        ]
      : [];

  return [
    ...lengthProblems,
    ...exceptionProblems,
    ...directiveProblems({ comments, allowSoftLimitException: true }),
  ];
};
