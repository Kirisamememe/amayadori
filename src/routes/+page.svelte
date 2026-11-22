<script lang="ts">
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Amayadori</title>
</svelte:head>

<h1>Amayadori</h1>

{#if data.links.length === 0}
  <p>公開しているページはまだありません。</p>
{:else}
  <ul>
    {#each data.links as link (link.href)}
      <li><a href={link.href}>{link.title}</a></li>
    {/each}
  </ul>
{/if}
