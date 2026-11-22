import { createAnalemmaClient } from "@analemma/client";

import { ANALEMMA_INTERNAL_URL } from "$app/env/private";

/** Analemma の内部用のポートの公開 API を呼ぶ client。 */
export const cms = createAnalemmaClient({ url: ANALEMMA_INTERNAL_URL });
