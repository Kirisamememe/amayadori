import { type Component, flushSync, mount, unmount } from "svelte";

const mounted: Record<string, unknown>[] = [];

/** コンポーネントを、テストの document の body に描画する。 */
export const render = <Props extends Record<string, unknown>>(
  component: Component<Props>,
  props: Props,
): void => {
  mounted.push(mount(component, { target: document.body, props }));
  flushSync();
};

/** 描画したコンポーネントをすべて外し、body を空にする。 */
export const unmountAll = async (): Promise<void> => {
  await Promise.all(
    mounted.splice(0).map(async (instance) => unmount(instance)),
  );
  document.body.replaceChildren();
};
