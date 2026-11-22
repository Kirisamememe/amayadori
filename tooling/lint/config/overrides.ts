import type { OxlintOverride } from "oxlint";

import { IMPORT_EXTENSIONS } from "./core-rules.ts";
import { LONG_FILE_CODE_LINES } from "./project-rules.ts";
import {
  RUNTIME_GLOBALS,
  RUNTIME_PATTERNS,
  restrictApis,
} from "./restricted-apis.ts";

/** 相対 import に拡張子を求める `import/extensions` の options。 */
type ExtensionRule = ["error", "never", Record<string, unknown>];

const requireExtensions = (
  extensions: Record<string, "always">,
): ExtensionRule => [
  "error",
  "never",
  {
    checkTypeImports: true,
    ignorePackages: true,
    pattern: { ...IMPORT_EXTENSIONS, ...extensions },
  },
];

/** 実行環境・テスト・場所ごとの設定。 */
export const OVERRIDES: readonly OxlintOverride[] = [
  {
    files: ["tooling/**", "*.mjs", "*.config.ts"],
    env: { node: true },
    globals: { Bun: "readonly" },
  },
  {
    files: ["**/src/lib/**", "tooling/**"],
    rules: {
      "project/max-exported-functions": [
        "error",
        { max: 2, limitedAfter: LONG_FILE_CODE_LINES },
      ],
      "project/no-inline-parameter-type": "error",
    },
  },
  {
    files: ["tooling/lint/**/*.mjs"],
    rules: {
      "typescript/no-unsafe-argument": "off",
      "typescript/no-unsafe-assignment": "off",
      "typescript/no-unsafe-call": "off",
      "typescript/no-unsafe-member-access": "off",
      "typescript/no-unsafe-return": "off",
      "typescript/strict-boolean-expressions": "off",
      "import/extensions": requireExtensions({ mjs: "always" }),
    },
  },
  {
    files: [
      "oxlint.config.ts",
      "oxlint.fixtures.config.ts",
      "**/tooling/lint/config/**/*.ts",
    ],
    rules: { "import/extensions": requireExtensions({ ts: "always" }) },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "eslint/no-await-in-loop": "off",
      "typescript/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "allow" },
      ],
      "typescript/no-non-null-assertion": "off",
      "unicorn/prefer-type-error": "off",
    },
  },
  {
    files: ["**/src/**"],
    env: { browser: true },
    rules: restrictApis({
      patterns: RUNTIME_PATTERNS,
      globals: RUNTIME_GLOBALS,
    }),
  },
  {
    files: ["**/src/**/__tests__/**"],
    rules: restrictApis({ patterns: [], globals: [] }),
  },
];
