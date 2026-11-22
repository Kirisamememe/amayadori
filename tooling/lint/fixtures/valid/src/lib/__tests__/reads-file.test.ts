import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("src のテストでは、Bun と Node の API を使えること", async () => {
  expect(await readFile(new URL(import.meta.url), "utf8")).toContain("test(");
  expect(typeof Bun.version).toBe("string");
});
