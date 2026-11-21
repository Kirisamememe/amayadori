<script lang="ts">
  let { title }: { title: string } = $props();

  const log = (): void => {
    // oxlint-disable-next-line eslint/no-console
    console.info(title);
  };
</script>

<button type="button" onclick={log}>{title}</button>
