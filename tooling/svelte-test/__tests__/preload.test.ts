import { afterAll, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dirname, "../../..");
const fixture = join(import.meta.dirname, "../fixtures/toggle.svelte");
const temporaryRoot = mkdtempSync(join(tmpdir(), "amayadori-preload-"));

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

test("ブラウザの条件の無いテストで Svelte のファイルを読むと、テストの置き場所を示して止まること", () => {
  const testFile = join(temporaryRoot, "reads-svelte.test.ts");

  writeFileSync(
    testFile,
    [
      'import { expect, test } from "bun:test";',
      `import Toggle from ${JSON.stringify(fixture)};`,
      'test("読む", () => { expect(Toggle).toBeDefined(); });',
      "",
    ].join("\n"),
  );

  const result = spawnSync(process.execPath, ["test", testFile], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  expect(result.status).not.toBe(0);
  expect(`${result.stdout}${result.stderr}`).toContain(
    "*.svelte.test.ts に置き",
  );
});
