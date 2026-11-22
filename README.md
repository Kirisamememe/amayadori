# Amayadori

ユーザーの個人サイト。SvelteKit で、サーバー付きで作る。コンテンツは、ヘッドレス CMS の [Analemma](https://github.com/Kirisamememe/analemma) から、サーバー側で取る。

## 作り

```text
src/
  env.ts                  環境変数の定義と検証(defineEnvVars)
  app.html
  routes/                 ページ
  lib/
    server/
      analemma/           Analemma の公開 API を呼ぶもの(サーバー側だけ)
      kinds/              固定ページの種類の定義(client が入ってから作る)
tooling/                  lint の自作のルール・検査・git の hook・CI とレビューのスクリプト
```

- Analemma は、このサイトと同じサーバーで動く。公開 API は Analemma の内部用のポートで受け、このサイトのサーバー側からだけ呼ぶ(ブラウザからは呼ばない)。
- 固定ページの種類は、このリポジトリのコードで定義し、本番のデプロイのときに Analemma の client の CLI で送る。
- 理由は `DECISIONS.md` にある。

## 使い方

Bun 1.4 と Node.js 24 以上が要る。svelte-check は Node で動き、Oxlint は TypeScript で書いた設定(`oxlint.config.ts`)を Node の型消去で読む。エディタの Oxc の拡張が別の Node を使うときは、拡張の設定 `oxc.path.node` で Node を指定する。

```bash
bun install
```

```bash
cp .env.example .env
```

| コマンド           | すること                                                                 |
| ------------------ | ------------------------------------------------------------------------ |
| `bun run dev`      | 開発のサーバーを動かす                                                   |
| `bun run build`    | 本番のビルドを `build/` に出す                                           |
| `bun run start`    | ビルドした物を Bun で動かす(`PORT`・`HOST` で待ち受ける所を変えられる)   |
| `bun run check`    | 整形の確認・lint・型検査・テスト・ビルドを流す。CI と同じ                |
| `bun run format`   | 整形する                                                                 |
| `bun run lint:fix` | lint で直せるものを直す                                                  |
| `bun run test`     | テストを流す(コンポーネントのテストは Svelte のブラウザ版で、別に流れる) |
| `bun run review`   | 観点ごとのレビューを1回流す(`AGENTS.md` の「レビュー」)                  |

## 環境変数

| 名前                    | 中身                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `ANALEMMA_INTERNAL_URL` | Analemma の内部用のポートの URL(例:`http://127.0.0.1:8788`)。起動とビルドのときに検証する |

## コミット

コミットのメッセージは `type(scope): 日本語の件名`(`commitlint.config.ts`)。`bun install` で入る git の hook が確かめる。main には PR で入れる。
