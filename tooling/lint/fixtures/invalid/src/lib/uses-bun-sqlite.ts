import { Database } from "bun:sqlite";

/** メモリの DB を開く。 */
export const open = (): Database => new Database(":memory:");
