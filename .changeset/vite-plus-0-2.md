---
'@k8o/create': patch
---

Fix the broken build by moving the toolchain to vite-plus 0.2.4. typescript 7 broke `vp pack` on the 0.1.x line because its dts tooling only supports typescript ^5 || ^6; the package ships only a bin, so dts output is now disabled and the build runs on typescript 7 again.
