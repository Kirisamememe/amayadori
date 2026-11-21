import { screen } from "@testing-library/dom";
import { expect, test } from "bun:test";

test("見出しを描画すること", () => {
  expect(screen.getByTestId("title")).toHaveClass("title");
  expect(document.body.querySelector("h1")?.className).toBe("title");
  expect(document.body).toMatchSnapshot();
});
