---
'@k8o/create': patch
---

Pin generated projects to Node.js 26.13.1. 26.13.1 is the November 11, 2026 security release: it fixes seven high-severity HTTP/2 and TLS vulnerabilities that earlier 24.x and 26.x releases still carry. Generated web projects now require `>=26.13.1`; generated libraries, and `@k8o/create` itself, accept any Node.js 24 or later (`>=24`).
