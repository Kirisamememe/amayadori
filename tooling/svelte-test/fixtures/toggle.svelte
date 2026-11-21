<script lang="ts">
  /** コンポーネントが受け取る値。 */
  type Props = {
    /** ボタンの文言。 */
    label: string;
  };

  let { label }: Props = $props();
  let open = $state(false);
</script>

<button type="button" onclick={() => (open = !open)}>{label}</button>
{#if open}
  <p>開いた</p>
{/if}
