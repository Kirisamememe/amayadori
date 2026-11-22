import { readFile } from "node:fs/promises";

/** src のコードで、Node の API のサブパスを読む。 */
export const readPage = async (): Promise<string> =>
  readFile("page.md", "utf8");
