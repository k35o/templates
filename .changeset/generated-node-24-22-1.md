---
'@k8o/create': patch
---

Pin generated projects to Node.js 24.22.1. Scaffolded projects were pinned to 24.21.0, which still trusts eMudhra's compromised TLS intermediates (EM DV/OV/EV TLS CA - G3B and G3C, and their AAA cross-signs); 24.22.1 is the release that stops trusting them.
