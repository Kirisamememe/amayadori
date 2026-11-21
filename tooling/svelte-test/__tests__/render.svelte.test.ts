import { screen } from "@testing-library/dom";
import { expect, test } from "bun:test";
import { flushSync } from "svelte";

import Toggle from "../fixtures/toggle.svelte";
import { render } from "../render";

test("描画したコンポーネントを、訪問者に見えるもので探して操作できる", () => {
  render(Toggle, { label: "開く" });

  expect(screen.queryByText("開いた")).toBeNull();

  screen.getByRole("button", { name: "開く" }).click();
  flushSync();

  expect(screen.getByText("開いた")).toBeDefined();
});

test("前のテストで描画したコンポーネントは残らない", () => {
  expect(screen.queryByRole("button")).toBeNull();
});

test("runes をテストの中で使える", () => {
  const counter = $state({ count: 0 });
  const double = $derived(counter.count * 2);

  counter.count = 2;

  expect(double).toBe(4);
});
