---
'@k8o/create': minor
---

Generated repos start on newer toolchain versions: vite-plus 1.4.0, @k8o/oxc-config 1.1.0, pnpm 12.17.0, Node.js 24.22.2, React 19.3.1, @vitejs/plugin-react 6.2.1, commitlint 21.2.4 and @types/node 26.6.6. @k8o/oxc-config 1.x expects Vitest's `globals` off, so the sample tests import `expect` / `test` from `vite-plus/test`, `globals` and the `vite-plus/test/globals` types are gone, and the lint override applies the `test` layer to `TEST_GLOBS`.
