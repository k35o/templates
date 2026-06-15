---
'@k8o/create': patch
---

Fix `--kind web` scaffolding the wrong project. bingo's CLI arg parser only maps
certain Zod types to value-taking flags, and a `z.enum` is not one of them — so
`--kind web` was parsed as the boolean `kind: true` and silently fell through to
the `library` branch, producing a single-package repo instead of the web
monorepo. `kind` is now a union of string literals (`z.union([z.literal('library'),
z.literal('web')])`), which bingo's CLI parses correctly while keeping the exact
`'library' | 'web'` validation. A regression test asserts every option uses a
CLI-parseable Zod type.
