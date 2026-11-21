import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { plugin } from "bun";
import { afterEach } from "bun:test";
import { compile, compileModule } from "svelte/compiler";

import { unmountAll } from "./render";

const SVELTE_FILE = /\.svelte$/v;
const SVELTE_MODULE = /\.svelte(?:\.test)?\.ts$/v;
const CLIENT_ENTRY = "/index-client.js";

const transpiler = new Bun.Transpiler({ loader: "ts" });
const isComponentRun = import.meta.resolve("svelte").endsWith(CLIENT_ENTRY);

const refuse = (path: string): never => {
  throw new Error(
    `${path} を読むには、Svelte のブラウザ版が要ります。Svelte を読むテストは *.svelte.test.ts に置き、bun run test で流してください。`,
  );
};

if (isComponentRun) {
  GlobalRegistrator.register();
  afterEach(async () => {
    await unmountAll();
  });
}

plugin({
  name: "svelte-test",
  setup: (build) => {
    build.onLoad({ filter: SVELTE_FILE }, async ({ path }) => {
      if (!isComponentRun) {
        refuse(path);
      }

      const { js } = compile(await Bun.file(path).text(), {
        filename: path,
        generate: "client",
        dev: true,
        css: "injected",
        runes: true,
      });

      return { contents: js.code, loader: "js" };
    });
    build.onLoad({ filter: SVELTE_MODULE }, async ({ path }) => {
      if (!isComponentRun) {
        refuse(path);
      }

      const { js } = compileModule(
        transpiler.transformSync(await Bun.file(path).text()),
        { filename: path, generate: "client", dev: true },
      );

      return { contents: js.code, loader: "js" };
    });
  },
});
