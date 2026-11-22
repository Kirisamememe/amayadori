import { error } from "@sveltejs/kit";

import { cms } from "#lib/server/analemma/cms";
import { loadFixedPageView } from "#lib/server/fixed-pages/load-fixed-pages";

import type { PageServerLoad } from "./$types";

/** 公開している固定ページを引く load。 */
export const load: PageServerLoad = async ({ params }) => {
  const page = await loadFixedPageView(cms, params);

  if (page === undefined) {
    error(404, "ページが見つかりません");
  }

  return { page };
};
