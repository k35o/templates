---
'@k8o/create': patch
---

Update the generated release.yml to pnpm-release-action v0.2.1. v0.1.0 created the release-PR commit via git push, leaving it unsigned, so auto-merge stayed blocked forever under rulesets with required_signatures. v0.2.1 defaults to commit-mode: github-api (GitHub signs the commit), which also makes the setup-git-user / app-slug inputs unnecessary, so they are dropped from the template.
