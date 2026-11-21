import { readFileSync } from "node:fs";

/** ファイルの中身を読む。 */
export const read = (path: string): string => readFileSync(path, "utf8");
