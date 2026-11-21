/** 文字列を UTF-8 のバイト列にする。 */
export const encode = (text: string): Uint8Array =>
  new TextEncoder().encode(text);
