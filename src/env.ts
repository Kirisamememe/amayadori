import { defineEnvVars } from "@sveltejs/kit/env";

import { parseInternalUrl } from "#lib/server/analemma/parse-internal-url";

/** 起動のときに検証する、環境変数の定義。 */
export const variables = defineEnvVars({
  ANALEMMA_INTERNAL_URL: {
    description: "Analemma の内部用のポートの URL。公開 API を呼ぶ。",
    schema: parseInternalUrl,
  },
});
