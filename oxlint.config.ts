import { defineConfig } from "oxlint";

import { CORE_RULES } from "./tooling/lint/config/core-rules.ts";
import { OVERRIDES } from "./tooling/lint/config/overrides.ts";
import { PROJECT_RULES } from "./tooling/lint/config/project-rules.ts";

export default defineConfig({
  categories: {
    correctness: "error",
    pedantic: "error",
    perf: "error",
    suspicious: "error",
  },
  env: { builtin: true },
  ignorePatterns: [
    "node_modules/**",
    ".svelte-kit/**",
    "build/**",
    "tooling/lint/fixtures/**",
    "bun.lock",
  ],
  jsPlugins: [
    {
      name: "prefer-arrow-functions",
      specifier: "eslint-plugin-prefer-arrow-functions",
    },
    { name: "jsdoc-js", specifier: "eslint-plugin-jsdoc" },
    { name: "jsdoc-type", specifier: "./tooling/lint/jsdoc-type-plugin.mjs" },
    { name: "project", specifier: "./tooling/lint/plugin.mjs" },
    { name: "stylistic", specifier: "@stylistic/eslint-plugin" },
  ],
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
    typeAware: true,
  },
  plugins: [
    "eslint",
    "typescript",
    "oxc",
    "import",
    "unicorn",
    "promise",
    "node",
  ],
  rules: { ...CORE_RULES, ...PROJECT_RULES },
  overrides: [...OVERRIDES],
});
