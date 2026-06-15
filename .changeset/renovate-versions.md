---
'@k8o/create': minor
---

Generated repos now stay current via Renovate. The dependency and toolchain
versions written into scaffolded repos are centralized in a single source of
truth (`src/versions.ts`) and tracked by a Renovate custom manager, so Renovate
opens PRs to bump them.

The README now documents what each kind emits (file trees for `library` and
`web`) and every entry point (`vp` / `pnpm` / `npm create @k8o`, `npx`).

Cleanups: the generated `library` CI runs `pnpm typecheck` as its own step, the
generated `.gitignore` covers `*.tgz`, a dead `customConditions` was removed from
the library `tsconfig.json`, the changeset `$schema` is pinned to a major range,
and an empty `--description` no longer produces a malformed README.
