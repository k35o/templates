---
'@k8o/create': minor
---

Generated projects use TypeScript 7.0.2, the version @k8ordo/ui and @k8ordo/i18n ask for as a peer. The `web` kind's library package drops `@vitejs/plugin-react`: it runs no dev server, and under TypeScript 7 the plugin's types no longer check against vite-plus's `defineConfig`.
