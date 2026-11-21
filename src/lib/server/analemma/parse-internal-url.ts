const PROTOCOLS = new Set(["http:", "https:"]);

/** 環境変数の値を、Analemma の内部用のポートの origin として検証する。 */
export const parseInternalUrl = (value: string | undefined): string => {
  if (value === undefined || value === "") {
    throw new Error(
      "ANALEMMA_INTERNAL_URL に、Analemma の内部用のポートの URL を設定してください。",
    );
  }

  const url = URL.parse(value);

  if (url === null) {
    throw new Error("ANALEMMA_INTERNAL_URL を URL として読めません。");
  }

  if (!PROTOCOLS.has(url.protocol)) {
    throw new Error("ANALEMMA_INTERNAL_URL は http か https の URL にします。");
  }

  if (url.username !== "" || url.password !== "") {
    throw new Error("ANALEMMA_INTERNAL_URL には、資格情報を書きません。");
  }

  if (url.href !== `${url.origin}/`) {
    throw new Error(
      "ANALEMMA_INTERNAL_URL は、パス・クエリ・フラグメントの無い origin にします(例:http://127.0.0.1:8788)。",
    );
  }

  return url.origin;
};
