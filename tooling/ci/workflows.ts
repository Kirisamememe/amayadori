import type { SourceFile } from "../structure/source-file";

const PINNED_REFERENCE = /^[\w.\-]+\/[\w.\-\/]+@(?<sha>[0-9a-f]{40})$/v;
const READ_ONLY = new Set(["read", "none"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const recordsOf = (value: unknown): Record<string, unknown>[] =>
  isRecord(value)
    ? Object.values(value).filter((entry) => isRecord(entry))
    : Array.isArray(value)
      ? value.filter((entry: unknown) => isRecord(entry))
      : [];

const permissionProblems = (workflow: Record<string, unknown>): string[] => {
  const { permissions } = workflow;

  if (!isRecord(permissions)) {
    return ["最上位で、権限ごとに permissions を決めていない"];
  }

  return Object.entries(permissions)
    .filter(([, level]) => typeof level !== "string" || !READ_ONLY.has(level))
    .map(
      ([scope]) => `最上位の permissions の ${scope} が read か none でない`,
    );
};

const jobProblems = (job: Record<string, unknown>): string[] =>
  "permissions" in job ? ["job で permissions を決めている"] : [];

const versionComment = (sha: string): RegExp =>
  new RegExp(String.raw`@${sha}["']?\s+# v\d+(?:\.\d+)*\s*$`, "mv");

/** action の参照を確かめるための入力。 */
type ReferenceCheck = {
  /** workflow のファイルの中身。 */
  readonly text: string;
  /** `uses` に書いた値。 */
  readonly uses: unknown;
};

const referenceProblems = ({ text, uses }: ReferenceCheck): string[] => {
  const reference = typeof uses === "string" ? uses : "";
  const sha = PINNED_REFERENCE.exec(reference)?.groups?.["sha"];

  if (sha === undefined) {
    return [`コミットの SHA で固定していない action:${reference}`];
  }

  return versionComment(sha).test(text)
    ? []
    : [`行末にバージョンを書いていない action:${reference}`];
};

/** workflow の権限と actions の固定を確かめ、守っていない所を集める。 */
export const checkWorkflow = ({ path, text }: SourceFile): string[] => {
  const workflow: unknown = Bun.YAML.parse(text);

  if (!isRecord(workflow)) {
    return [`${path}: workflow を読めない`];
  }

  const jobs = recordsOf(workflow["jobs"]);
  const uses = jobs.flatMap((job) => [
    ...("uses" in job ? [job["uses"]] : []),
    ...recordsOf(job["steps"])
      .filter((step) => "uses" in step)
      .map((step) => step["uses"]),
  ]);

  return [
    ...permissionProblems(workflow),
    ...jobs.flatMap((job) => jobProblems(job)),
    ...uses.flatMap((reference) =>
      referenceProblems({ text, uses: reference }),
    ),
  ].map((problem) => `${path}: ${problem}`);
};
