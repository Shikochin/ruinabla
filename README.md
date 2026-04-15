# Rui∇abla

Records of Light and Dust.

Rui∇abla means Ruin + Nabla( ∇).

## Tech Stack

- [Vue](https://vuejs.org)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev)
- [MDXjs](https://mdxjs.com)
- [Shiki 式](https://shiki.style)
- [Pinia](https://pinia.vuejs.org)

## Develop

```sh
bun install

export OPAQUE_SERVER_SETUP="$(npx @serenity-kit/opaque@latest create-server-setup)"

bun dev

bun new

bun run build
```

Set `OPAQUE_SERVER_SETUP` in your local env and deployment env before running auth flows. Keep the same value permanently. Rotating it invalidates existing OPAQUE password records.

## License

Code: Unlicense

Content: CC BY-SA 4.0
