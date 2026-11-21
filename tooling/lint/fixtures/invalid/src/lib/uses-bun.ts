/** ファイルの中身を読む。 */
export const read = async (path: string): Promise<string> =>
  Bun.file(path).text();
