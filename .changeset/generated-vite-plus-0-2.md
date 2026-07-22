---
'@k8o/create': patch
---

Move the generated-project pins to vite-plus 0.2.4 + typescript 6.0.3. Scaffolded projects were still pinned to vite-plus 0.1.24 with typescript 7, so `vp pack` hit the same rolldown-plugin-dts `useCaseSensitiveFileNames` crash that PR #25 fixed for this repo. Generated libraries publish `.d.mts` types and cannot disable dts, so the coherent set keeps dts working by staying on the typescript ^5 || ^6 line its tooling supports.
