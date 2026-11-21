/** Bun で動いているかを見分ける。 */
export const onBun = (): boolean => globalThis.Bun !== undefined;
