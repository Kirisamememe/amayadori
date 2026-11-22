import { cms } from "#lib/server/analemma/cms";
import { listFixedPageLinks } from "#lib/server/fixed-pages/load-fixed-pages";

import type { PageServerLoad } from "./$types";

/** 公開している固定ページへのリンクを返す。 */
export const load: PageServerLoad = async () => ({
  links: await listFixedPageLinks(cms),
});
