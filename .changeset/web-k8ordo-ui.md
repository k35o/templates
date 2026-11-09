---
'@k8o/create': minor
---

The `web` kind builds on @k8ordo/ui instead of @k8o/arte-odyssey. The library package depends on `@k8ordo/ui` (peer `>=2`), and the playground drops Tailwind CSS for CSS Modules held to the @k8ordo/ui tokens by better-css-modules, whose type generation and check run in `typecheck` and `check`.
