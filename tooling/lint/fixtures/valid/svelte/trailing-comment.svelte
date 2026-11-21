<script lang="ts">
  /** コンポーネントが受け取る値。 */
  type Props = {
    /** 見出しの文言。 */
    title: string;
  };

  let { title }: Props = $props(); // 見出しだけを受け取る
</script>

<h1>{title}</h1>
