import { defineKind, longText, optional, text, url } from "@analemma/client";

/** 自己紹介のページの種類。 */
export const about = defineKind({
  name: "about",
  label: "自己紹介",
  fields: {
    headline: text({ label: "見出し" }),
    body: optional(longText({ label: "本文" })),
    website: optional(url({ label: "Web サイト" })),
  },
});

/** メモのページの種類。 */
export const note = defineKind({
  name: "note",
  label: "メモ",
  fields: {
    body: longText({ label: "本文" }),
  },
});

/** このサイトが使い、デプロイのときに CLI が Analemma に送る、固定ページの種類。 */
const kinds = [about, note];

export default kinds;
