<script lang="ts">
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{data.page.title} | Amayadori</title>
</svelte:head>

<p><a href="/">Amayadori</a></p>

{#if data.page.kind === "about"}
  <h1>{data.page.headline}</h1>
{:else}
  <h1>{data.page.title}</h1>
{/if}

{#each data.page.paragraphs as paragraph, index (index)}
  <p>{paragraph}</p>
{/each}

{#if data.page.kind === "about" && data.page.website !== undefined}
  <p><a href={data.page.website}>{data.page.website}</a></p>
{/if}
