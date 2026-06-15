---
'@k8o/create': patch
---

Stop the CI `Changeset` job from failing on dependency-bump and release PRs. The
job now skips (which branch protection treats as success) when the actor is
`renovate[bot]` or the head branch is `changeset-release/main`, matching the rest
of the k8o repos. Applied to both this repo's own CI and the `ci.yml` emitted into
generated `library` / `web` repos.
