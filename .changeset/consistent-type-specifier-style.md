---
'@k8o/create': none
---

Hoist the `GenerateOptions` type import in `src/web.ts` and `src/library.ts` to a top-level `import type`. `@k8o/oxc-config` 0.2.0 enables `import/consistent-type-specifier-style`, which rejects the inline `type` specifier. Generator output is unchanged.
