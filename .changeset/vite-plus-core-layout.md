---
'@k8o/create': patch
---

Generated repos resolve `vite` to vite-plus's own core, the layout `vp migrate` writes: the catalog points `vite` at `@voidzero-dev/vite-plus-core`, an override hands that core to every package that asks for `vite`, and a peer rule accepts its version number. Installs no longer warn that Vitest's `vite` peer is unmet. The web playground runs on `vp dev` / `vp build` with vite-plus's `defineConfig`, and `.vitest/`, where Vitest 5 writes attachments and reports, is ignored.
