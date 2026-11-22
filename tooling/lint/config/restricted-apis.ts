import type { AllowWarnDeny } from "oxlint";

/** `no-restricted-imports` で止める、モジュールの名前の形。 */
type RestrictedPattern = {
  /** gitignore の書き方の、モジュールの名前の形。 */
  readonly group: readonly string[];
  /** 診断の文言。 */
  readonly message: string;
};

/** `no-restricted-globals` で止めるグローバル。 */
type RestrictedGlobal = {
  /** グローバルの名前。 */
  readonly name: string;
  /** 診断の文言。 */
  readonly message: string;
};

/** API の使い方を制限する、3つのルールの設定。 */
export type RestrictedApis = {
  /** 止めるモジュールの名前の形。 */
  readonly patterns: readonly RestrictedPattern[];
  /** 止めるグローバル。 */
  readonly globals: readonly RestrictedGlobal[];
};

const RUNTIME =
  "Bun と Node の API は src/ では使いません。ブラウザに届くコードと、Web 標準で書くサーバーのコードの置き場所です。";

/** src/ で止める、Bun と Node のモジュール。 */
export const RUNTIME_PATTERNS: readonly RestrictedPattern[] = [
  {
    group: ["bun", "bun:*", "!bun:test", "node:*", "node:*/**"],
    message: RUNTIME,
  },
];

/** src/ で止める、Bun のグローバル。 */
export const RUNTIME_GLOBALS: readonly RestrictedGlobal[] = [
  { name: "Bun", message: RUNTIME },
];

/** 3つのルールの設定を組み立てる。 */
export const restrictApis = ({
  patterns,
  globals,
}: RestrictedApis): Record<string, [AllowWarnDeny, ...unknown[]]> => ({
  "eslint/no-restricted-imports": ["error", { patterns }],
  "eslint/no-restricted-globals": ["error", ...globals],
  "eslint/no-restricted-properties": [
    "error",
    ...globals.map(({ name, message }) => ({
      object: "globalThis",
      property: name,
      message,
    })),
  ],
});
