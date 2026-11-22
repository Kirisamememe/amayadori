/** オブジェクト引数のプロパティに説明がない。 */
type ReadInput = {
  readonly id: string;
};

/** 識別子を返す。 */
export const read = ({ id }: ReadInput): string => id;
