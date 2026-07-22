---
'@k8o/create': patch
---

Ignore the pnpm-owned `.changeset/` directory in `vp` format/lint checks, both in this repo and in the scaffolded `vite.config.ts` templates. pnpm's release management writes `.changeset/ledger.yaml` (and changelog files) in its own canonical format, which the formatter would otherwise flag and break CI after every release.
