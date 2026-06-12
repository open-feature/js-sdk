# Changelog

## [0.0.10](https://github.com/open-feature/js-sdk/compare/angular-sdk-v1.3.0...angular-sdk-v0.0.10) (2026-06-12)


### ✨ New Features

* Angular 21 support ([#1316](https://github.com/open-feature/js-sdk/issues/1316)) ([7d1bfb2](https://github.com/open-feature/js-sdk/commit/7d1bfb20dd01f5b3abab5ad04e01561a55565e75))
* Angular SDK ([#997](https://github.com/open-feature/js-sdk/issues/997)) ([105fd95](https://github.com/open-feature/js-sdk/commit/105fd95e344822ffcfc54d328a28676b6f27f38e))
* **angular/directive:** export FeatureFlagDirectiveContext ([#1346](https://github.com/open-feature/js-sdk/issues/1346)) ([4b7de27](https://github.com/open-feature/js-sdk/commit/4b7de278d0433f4b7e184ecbe3d9e71aa3c2a5a4))
* **angular:** add Angular 18 support ([#1063](https://github.com/open-feature/js-sdk/issues/1063)) ([e62d6d4](https://github.com/open-feature/js-sdk/commit/e62d6d4b7e4a5d0f40592a2c73e7124d22eec98e))
* **angular:** add angular 19 to peerDependencies ([4893d6f](https://github.com/open-feature/js-sdk/commit/4893d6f0003fbdcdcd4c7c061e9aed49e20b8976))
* **angular:** add docs for setting evaluation context in angular ([#1170](https://github.com/open-feature/js-sdk/issues/1170)) ([24f1b23](https://github.com/open-feature/js-sdk/commit/24f1b230bf1d57971a336ac21b9ee46e8baf0cab))
* **angular:** add option for initial context injection ([aafdb43](https://github.com/open-feature/js-sdk/commit/aafdb4382f113f96a649f5fc0cecadb4178ada67))
* **angular:** add provideOpenFeature() standalone provider function ([#1409](https://github.com/open-feature/js-sdk/issues/1409)) ([cddf9a9](https://github.com/open-feature/js-sdk/commit/cddf9a9ce0ecd865e6fd5d25266c3f62c61e8665))
* expose js sdk identity on client metadata ([#1376](https://github.com/open-feature/js-sdk/issues/1376)) ([6c437e7](https://github.com/open-feature/js-sdk/commit/6c437e78662786749cba8bfe5051edbd5e6a85e1))
* support Angular 20 ([#1220](https://github.com/open-feature/js-sdk/issues/1220)) ([aa232a9](https://github.com/open-feature/js-sdk/commit/aa232a9d6a8dfa416380ccdecd71843d3e361048))
* support type-safe flag keys via module augmentation ([#1349](https://github.com/open-feature/js-sdk/issues/1349)) ([fb2ed4a](https://github.com/open-feature/js-sdk/commit/fb2ed4a7d64d9b8437975a0ef6cb4fe6a12dd671))
* support type-safe variant values for InMemoryProvider ([#1356](https://github.com/open-feature/js-sdk/issues/1356)) ([431f899](https://github.com/open-feature/js-sdk/commit/431f899191a2f7693fea9fab40f7cfb1f22f61f8))


### 🐛 Bug Fixes

* angular tests in main ([#1251](https://github.com/open-feature/js-sdk/issues/1251)) ([f42011d](https://github.com/open-feature/js-sdk/commit/f42011d1f8f6949022ceefbd6491fca2baa65dce))
* **angular:** add license and url field to package.json ([b2784f5](https://github.com/open-feature/js-sdk/commit/b2784f53b85a11c58abb8e2a0f87a31890885c54))
* **angular:** add package description ([#1026](https://github.com/open-feature/js-sdk/issues/1026)) ([dc63ca8](https://github.com/open-feature/js-sdk/commit/dc63ca8b9d6fe8c16089e95f0e336d5e3f759f3b))
* **angular:** fix race condition on initialization ([#1052](https://github.com/open-feature/js-sdk/issues/1052)) ([12eaa97](https://github.com/open-feature/js-sdk/commit/12eaa9758d9deb788d74488ef03f18cbd31c0cbe))
* **angular:** update docs ([#1200](https://github.com/open-feature/js-sdk/issues/1200)) ([b6ea588](https://github.com/open-feature/js-sdk/commit/b6ea5884f2ab9f4f94c8b258c4cf7268ea6dbeb8))
* copy license to package correctly ([#1011](https://github.com/open-feature/js-sdk/issues/1011)) ([458d278](https://github.com/open-feature/js-sdk/commit/458d278345fe8681a966fca3852b2e607bdafccb))
* fix release of angular sdk ([4a370cc](https://github.com/open-feature/js-sdk/commit/4a370cc73f15f2188ca6aac4c5ae8c842e854b73))


### 🧹 Chore

* add npm keywords for angular ([#1015](https://github.com/open-feature/js-sdk/issues/1015)) ([6b11165](https://github.com/open-feature/js-sdk/commit/6b11165aa102e62fb8cd4dd218643e2ef0e733cf))
* **angular:** add repository to package.json ([#1093](https://github.com/open-feature/js-sdk/issues/1093)) ([35f000e](https://github.com/open-feature/js-sdk/commit/35f000e0f3c3ff7d60c05883312691d14f01c5fd))
* **angular:** update angular package to a non-experimental version ([#1147](https://github.com/open-feature/js-sdk/issues/1147)) ([5272f76](https://github.com/open-feature/js-sdk/commit/5272f76c4075ebbd21f9b24dacac8f2d22e31ca9)), closes [#1110](https://github.com/open-feature/js-sdk/issues/1110)
* fixup test compilation issues ([da8f5d8](https://github.com/open-feature/js-sdk/commit/da8f5d858ccd9ca62cdcdeec37974c81cb0c90c4))
* format README ([#1335](https://github.com/open-feature/js-sdk/issues/1335)) ([26d0325](https://github.com/open-feature/js-sdk/commit/26d0325f6f382f4b57e5152bf55dbd2725a9ff39))
* **main:** release angular-sdk 0.0.1-experimental ([#1003](https://github.com/open-feature/js-sdk/issues/1003)) ([ed3aaa4](https://github.com/open-feature/js-sdk/commit/ed3aaa48c0f90b4b90f08c1110d1edf8ef9d62f0))
* **main:** release angular-sdk 0.0.1-experimental ([#1010](https://github.com/open-feature/js-sdk/issues/1010)) ([eb42c4c](https://github.com/open-feature/js-sdk/commit/eb42c4c9e602451bd4e28826b168b6a632776f17))
* **main:** release angular-sdk 0.0.10 ([#1143](https://github.com/open-feature/js-sdk/issues/1143)) ([40deec0](https://github.com/open-feature/js-sdk/commit/40deec04147655312acfcc629017ccc60fe74efa))
* **main:** release angular-sdk 0.0.11 ([#1167](https://github.com/open-feature/js-sdk/issues/1167)) ([7f81917](https://github.com/open-feature/js-sdk/commit/7f81917226876f22999923fbe4fd7f696ee5386e))
* **main:** release angular-sdk 0.0.12 ([#1171](https://github.com/open-feature/js-sdk/issues/1171)) ([191433e](https://github.com/open-feature/js-sdk/commit/191433e705db50af9621d31e693e1ab2ab656bfe))
* **main:** release angular-sdk 0.0.13 ([#1175](https://github.com/open-feature/js-sdk/issues/1175)) ([a259b90](https://github.com/open-feature/js-sdk/commit/a259b9097bb11ede02a019a09411a2e1151c5534))
* **main:** release angular-sdk 0.0.14 ([#1178](https://github.com/open-feature/js-sdk/issues/1178)) ([9f887a9](https://github.com/open-feature/js-sdk/commit/9f887a965c826b1c676727dfc81d2f98d6db65ac))
* **main:** release angular-sdk 0.0.15 ([#1201](https://github.com/open-feature/js-sdk/issues/1201)) ([dae36bb](https://github.com/open-feature/js-sdk/commit/dae36bba1fa5c895c9008a01e373573e9b7b46e5))
* **main:** release angular-sdk 0.0.16 ([#1221](https://github.com/open-feature/js-sdk/issues/1221)) ([28850b7](https://github.com/open-feature/js-sdk/commit/28850b7f6d915ec74596e17a5ff7c36192fcfa54))
* **main:** release angular-sdk 0.0.17 ([#1253](https://github.com/open-feature/js-sdk/issues/1253)) ([189d373](https://github.com/open-feature/js-sdk/commit/189d37385bdd5e6c636f9255d3b5cc91d70943c9))
* **main:** release angular-sdk 0.0.18 ([#1261](https://github.com/open-feature/js-sdk/issues/1261)) ([06e9330](https://github.com/open-feature/js-sdk/commit/06e93300f9f6eb7804a28d610d860cfe84eb7323))
* **main:** release angular-sdk 0.0.19 ([#1263](https://github.com/open-feature/js-sdk/issues/1263)) ([9fb9c43](https://github.com/open-feature/js-sdk/commit/9fb9c43582ed7e84043284f9efa0b7da4aed5167))
* **main:** release angular-sdk 0.0.2-experimental ([#1008](https://github.com/open-feature/js-sdk/issues/1008)) ([f74056c](https://github.com/open-feature/js-sdk/commit/f74056c02bcfaa021d4ab619116613d0db23e828))
* **main:** release angular-sdk 0.0.2-experimental ([#1012](https://github.com/open-feature/js-sdk/issues/1012)) ([8bdc164](https://github.com/open-feature/js-sdk/commit/8bdc16430ca08fbf30d2486987657724701eff67))
* **main:** release angular-sdk 0.0.20 ([#1273](https://github.com/open-feature/js-sdk/issues/1273)) ([40d6d73](https://github.com/open-feature/js-sdk/commit/40d6d73e67ee3fa6ba8ffdf5cc2e054a8d9e8227))
* **main:** release angular-sdk 0.0.3-experimental ([#1014](https://github.com/open-feature/js-sdk/issues/1014)) ([baec2fb](https://github.com/open-feature/js-sdk/commit/baec2fb350187fe9fb94aebcd97011d0658ad8cd))
* **main:** release angular-sdk 0.0.4-experimental ([#1027](https://github.com/open-feature/js-sdk/issues/1027)) ([c1374bb](https://github.com/open-feature/js-sdk/commit/c1374bb7b371b2e882e3498ffaf2f8f562d68eea))
* **main:** release angular-sdk 0.0.5-experimental ([#1053](https://github.com/open-feature/js-sdk/issues/1053)) ([5636983](https://github.com/open-feature/js-sdk/commit/56369839b6358489a197b348c98000f5fb4a4bb8))
* **main:** release angular-sdk 0.0.6-experimental ([#1064](https://github.com/open-feature/js-sdk/issues/1064)) ([7f9001e](https://github.com/open-feature/js-sdk/commit/7f9001ec0a7ca8b8216a34e431378f2afc3ee85a))
* **main:** release angular-sdk 0.0.7-experimental ([#1088](https://github.com/open-feature/js-sdk/issues/1088)) ([6016465](https://github.com/open-feature/js-sdk/commit/6016465f9a999a96d2e76d58b352b3483a68eeea))
* **main:** release angular-sdk 0.0.7-experimental ([#1091](https://github.com/open-feature/js-sdk/issues/1091)) ([2a21f4f](https://github.com/open-feature/js-sdk/commit/2a21f4fd60b6f6b5ea502b50f04a1ba480a6e0f6))
* **main:** release angular-sdk 0.0.8-experimental ([#1092](https://github.com/open-feature/js-sdk/issues/1092)) ([d521f2d](https://github.com/open-feature/js-sdk/commit/d521f2dd6eb1056f3075509088ffe8c236cf28f0))
* **main:** release angular-sdk 0.0.9-experimental ([#1094](https://github.com/open-feature/js-sdk/issues/1094)) ([5ece80e](https://github.com/open-feature/js-sdk/commit/5ece80e16a5bd9755d170bece581c61af6239263))
* **main:** release angular-sdk 1.0.0 ([#1336](https://github.com/open-feature/js-sdk/issues/1336)) ([238bc50](https://github.com/open-feature/js-sdk/commit/238bc509e9a5fe57b5f2c6bec88907318743caa7))
* **main:** release angular-sdk 1.1.0 ([#1347](https://github.com/open-feature/js-sdk/issues/1347)) ([07693eb](https://github.com/open-feature/js-sdk/commit/07693ebcfa2e51115e6e79adecf227b0c80f3bb7))
* **main:** release angular-sdk 1.2.0 ([#1367](https://github.com/open-feature/js-sdk/issues/1367)) ([dadbfa5](https://github.com/open-feature/js-sdk/commit/dadbfa54bcf195dbad4ff43378261599b2704320))
* **main:** release core 1.11.0 ([#1397](https://github.com/open-feature/js-sdk/issues/1397)) ([70ea910](https://github.com/open-feature/js-sdk/commit/70ea910c096d9f2fabb00254201e5da34afb43df))
* mention debounce hook in react/ng docs ([#1272](https://github.com/open-feature/js-sdk/issues/1272)) ([27666b8](https://github.com/open-feature/js-sdk/commit/27666b8c2d3f8131ba0b3f704ca1c87df007a5fe))
* resolve open dependabot security alerts ([#1402](https://github.com/open-feature/js-sdk/issues/1402)) ([8c9669a](https://github.com/open-feature/js-sdk/commit/8c9669adb08ff5281fd23993fd30701ad665b20a))
* test OIDC Changes with Angular Release ([#1260](https://github.com/open-feature/js-sdk/issues/1260)) ([f0a4898](https://github.com/open-feature/js-sdk/commit/f0a48986c39e31ac2eac9c5431c70db193973a58))
* Test OIDC NPM Publishing Without Token ([#1262](https://github.com/open-feature/js-sdk/issues/1262)) ([c800ff1](https://github.com/open-feature/js-sdk/commit/c800ff176abf9489c2d2b7bfd2c92c01b83855a7))
* update sdk peer ([#1142](https://github.com/open-feature/js-sdk/issues/1142)) ([8bb6206](https://github.com/open-feature/js-sdk/commit/8bb620601e2b8dc7b62d717169b585bd1c886996))


### 📚 Documentation

* **angular:** improve angular readme layout ([#1013](https://github.com/open-feature/js-sdk/issues/1013)) ([ee52da9](https://github.com/open-feature/js-sdk/commit/ee52da9a01fe71fd5b4a4734659a06c48b6dc62c))
* fix inaccuracies in package READMEs ([#1378](https://github.com/open-feature/js-sdk/issues/1378)) ([ecd3759](https://github.com/open-feature/js-sdk/commit/ecd375979e3188c0f94dfec94a1487c61388965e))
* fix readme typo ([#1174](https://github.com/open-feature/js-sdk/issues/1174)) ([21a32ec](https://github.com/open-feature/js-sdk/commit/21a32ec92ecde9ec43c9d72b5921035af13448d1))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @openfeature/web-sdk bumped from ^1.8.0 to ^1.9.0

## [1.3.0](https://github.com/open-feature/js-sdk/compare/angular-sdk-v1.2.0...angular-sdk-v1.3.0) (2026-06-10)


### ✨ New Features

* **angular:** add provideOpenFeature() standalone provider function ([#1409](https://github.com/open-feature/js-sdk/issues/1409)) ([cddf9a9](https://github.com/open-feature/js-sdk/commit/cddf9a9ce0ecd865e6fd5d25266c3f62c61e8665))
* expose js sdk identity on client metadata ([#1376](https://github.com/open-feature/js-sdk/issues/1376)) ([6c437e7](https://github.com/open-feature/js-sdk/commit/6c437e78662786749cba8bfe5051edbd5e6a85e1))


### 🧹 Chore

* fixup test compilation issues ([da8f5d8](https://github.com/open-feature/js-sdk/commit/da8f5d858ccd9ca62cdcdeec37974c81cb0c90c4))
* resolve open dependabot security alerts ([#1402](https://github.com/open-feature/js-sdk/issues/1402)) ([8c9669a](https://github.com/open-feature/js-sdk/commit/8c9669adb08ff5281fd23993fd30701ad665b20a))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @openfeature/core bumped from ^1.8.1 to ^1.11.0
    * @openfeature/web-sdk bumped from ^1.6.2 to ^1.9.0

## [Unreleased]

### ✨ New Features

* **angular:** add provideOpenFeature() standalone provider function (#1365)

### ⚠ Deprecations

* **angular:** OpenFeatureModule and forRoot() deprecated in favour of provideOpenFeature()

## [1.2.0](https://github.com/open-feature/js-sdk/compare/angular-sdk-v1.1.0...angular-sdk-v1.2.0) (2026-04-21)


### ✨ New Features

* support type-safe flag keys via module augmentation ([#1349](https://github.com/open-feature/js-sdk/issues/1349)) ([fb2ed4a](https://github.com/open-feature/js-sdk/commit/fb2ed4a7d64d9b8437975a0ef6cb4fe6a12dd671))
* support type-safe variant values for InMemoryProvider ([#1356](https://github.com/open-feature/js-sdk/issues/1356)) ([431f899](https://github.com/open-feature/js-sdk/commit/431f899191a2f7693fea9fab40f7cfb1f22f61f8))


### 📚 Documentation

* fix inaccuracies in package READMEs ([#1378](https://github.com/open-feature/js-sdk/issues/1378)) ([ecd3759](https://github.com/open-feature/js-sdk/commit/ecd375979e3188c0f94dfec94a1487c61388965e))

## [1.1.0](https://github.com/open-feature/js-sdk/compare/angular-sdk-v1.0.0...angular-sdk-v1.1.0) (2026-02-18)


### ✨ New Features

* **angular/directive:** export FeatureFlagDirectiveContext ([#1346](https://github.com/open-feature/js-sdk/issues/1346)) ([4b7de27](https://github.com/open-feature/js-sdk/commit/4b7de278d0433f4b7e184ecbe3d9e71aa3c2a5a4))

## [1.0.0](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.20...angular-sdk-v1.0.0) (2026-01-23)


🎉 This is the first stable release of the Angular SDK 🎉

With this release, we are stabilizing the API.
Any further changes in features not marked as experimental will be regarded as breaking.
Many thanks to all those who have adopted thus far, and provided their valuable feedback!

See our [stability guide](https://openfeature.dev/specification/#document-statuses) for more information.

### 🧹 Chore

* format README ([#1335](https://github.com/open-feature/js-sdk/issues/1335)) ([26d0325](https://github.com/open-feature/js-sdk/commit/26d0325f6f382f4b57e5152bf55dbd2725a9ff39))

## [0.0.20](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.19...angular-sdk-v0.0.20) (2025-12-16)


### ✨ New Features

* Angular 21 support ([#1316](https://github.com/open-feature/js-sdk/issues/1316)) ([7d1bfb2](https://github.com/open-feature/js-sdk/commit/7d1bfb20dd01f5b3abab5ad04e01561a55565e75))


### 🧹 Chore

* mention debounce hook in react/ng docs ([#1272](https://github.com/open-feature/js-sdk/issues/1272)) ([27666b8](https://github.com/open-feature/js-sdk/commit/27666b8c2d3f8131ba0b3f704ca1c87df007a5fe))

## [0.0.19](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.18...angular-sdk-v0.0.19) (2025-10-21)


### 🧹 Chore

* Test OIDC NPM Publishing Without Token ([#1262](https://github.com/open-feature/js-sdk/issues/1262)) ([c800ff1](https://github.com/open-feature/js-sdk/commit/c800ff176abf9489c2d2b7bfd2c92c01b83855a7))

## [0.0.18](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.17...angular-sdk-v0.0.18) (2025-10-20)


### 🧹 Chore

* test OIDC Changes with Angular Release ([#1260](https://github.com/open-feature/js-sdk/issues/1260)) ([f0a4898](https://github.com/open-feature/js-sdk/commit/f0a48986c39e31ac2eac9c5431c70db193973a58))

## [0.0.17](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.16...angular-sdk-v0.0.17) (2025-09-30)

### ✨ New Features

* add feature flag service for angular #1247


### 🐛 Bug Fixes

* angular tests in main ([#1251](https://github.com/open-feature/js-sdk/issues/1251)) ([f42011d](https://github.com/open-feature/js-sdk/commit/f42011d1f8f6949022ceefbd6491fca2baa65dce))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @openfeature/web-sdk bumped from ^1.5.0 to ^1.6.2

## [0.0.16](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.15...angular-sdk-v0.0.16) (2025-07-25)


### ✨ New Features

* support Angular 20 ([#1220](https://github.com/open-feature/js-sdk/issues/1220)) ([aa232a9](https://github.com/open-feature/js-sdk/commit/aa232a9d6a8dfa416380ccdecd71843d3e361048))


## [0.0.15](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.14...angular-sdk-v0.0.15) (2025-05-27)


### 🐛 Bug Fixes

* **angular:** update docs ([#1200](https://github.com/open-feature/js-sdk/issues/1200)) ([b6ea588](https://github.com/open-feature/js-sdk/commit/b6ea5884f2ab9f4f94c8b258c4cf7268ea6dbeb8))


## [0.0.14](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.13...angular-sdk-v0.0.14) (2025-05-25)


### 🐛 Bug Fixes

* **angular:** add license and url field to package.json ([b2784f5](https://github.com/open-feature/js-sdk/commit/b2784f53b85a11c58abb8e2a0f87a31890885c54))


## [0.0.13](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.12...angular-sdk-v0.0.13) (2025-04-20)


### 📚 Documentation

* fix readme typo ([#1174](https://github.com/open-feature/js-sdk/issues/1174)) ([21a32ec](https://github.com/open-feature/js-sdk/commit/21a32ec92ecde9ec43c9d72b5921035af13448d1))

## [0.0.12](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.11...angular-sdk-v0.0.12) (2025-04-11)


### ✨ New Features

* **angular:** add docs for setting evaluation context in angular ([#1170](https://github.com/open-feature/js-sdk/issues/1170)) ([24f1b23](https://github.com/open-feature/js-sdk/commit/24f1b230bf1d57971a336ac21b9ee46e8baf0cab))


## [0.0.11](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.10...angular-sdk-v0.0.11) (2025-04-11)


### ✨ New Features

* **angular:** add option for initial context injection ([aafdb43](https://github.com/open-feature/js-sdk/commit/aafdb4382f113f96a649f5fc0cecadb4178ada67))
  

## [0.0.10](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.9-experimental...angular-sdk-v0.0.10) (2025-02-13)


### 🧹 Chore

* **angular:** update angular package to a non-experimental version ([#1147](https://github.com/open-feature/js-sdk/issues/1147)) ([5272f76](https://github.com/open-feature/js-sdk/commit/5272f76c4075ebbd21f9b24dacac8f2d22e31ca9)), closes [#1110](https://github.com/open-feature/js-sdk/issues/1110)
* update sdk peer ([#1142](https://github.com/open-feature/js-sdk/issues/1142)) ([8bb6206](https://github.com/open-feature/js-sdk/commit/8bb620601e2b8dc7b62d717169b585bd1c886996))

## [0.0.9-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.8-experimental...angular-sdk-v0.0.9-experimental) (2024-11-21)


### 🧹 Chore

* **angular:** add repository to package.json ([#1093](https://github.com/open-feature/js-sdk/issues/1093)) ([35f000e](https://github.com/open-feature/js-sdk/commit/35f000e0f3c3ff7d60c05883312691d14f01c5fd))

## [0.0.8-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.7-experimental...angular-sdk-v0.0.8-experimental) (2024-11-21)


### ✨ New Features

* **angular:** add angular 19 to peerDependencies ([4893d6f](https://github.com/open-feature/js-sdk/commit/4893d6f0003fbdcdcd4c7c061e9aed49e20b8976))


## [0.0.7-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.6-experimental...angular-sdk-v0.0.7-experimental) (2024-11-21)


Note: This version did not release


## [0.0.6-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.5-experimental...angular-sdk-v0.0.6-experimental) (2024-10-28)


### ✨ New Features

* **angular:** add Angular 18 support ([#1063](https://github.com/open-feature/js-sdk/issues/1063)) ([e62d6d4](https://github.com/open-feature/js-sdk/commit/e62d6d4b7e4a5d0f40592a2c73e7124d22eec98e))


## [0.0.5-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.4-experimental...angular-sdk-v0.0.5-experimental) (2024-10-21)


### 🐛 Bug Fixes

* **angular:** fix race condition on initialization ([#1052](https://github.com/open-feature/js-sdk/issues/1052)) ([12eaa97](https://github.com/open-feature/js-sdk/commit/12eaa9758d9deb788d74488ef03f18cbd31c0cbe))


## [0.0.4-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.3-experimental...angular-sdk-v0.0.4-experimental) (2024-09-30)


### 🐛 Bug Fixes

* **angular:** add package description ([#1026](https://github.com/open-feature/js-sdk/issues/1026)) ([dc63ca8](https://github.com/open-feature/js-sdk/commit/dc63ca8b9d6fe8c16089e95f0e336d5e3f759f3b))

## [0.0.3-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.2-experimental...angular-sdk-v0.0.3-experimental) (2024-09-22)


### 🧹 Chore

* add npm keywords for angular ([#1015](https://github.com/open-feature/js-sdk/issues/1015)) ([6b11165](https://github.com/open-feature/js-sdk/commit/6b11165aa102e62fb8cd4dd218643e2ef0e733cf))


### 📚 Documentation

* **angular:** improve angular readme layout ([#1013](https://github.com/open-feature/js-sdk/issues/1013)) ([ee52da9](https://github.com/open-feature/js-sdk/commit/ee52da9a01fe71fd5b4a4734659a06c48b6dc62c))

## [0.0.2-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.1-experimental...angular-sdk-v0.0.2-experimental) (2024-09-14)


### 🐛 Bug Fixes

* copy license to package correctly ([#1011](https://github.com/open-feature/js-sdk/issues/1011)) ([458d278](https://github.com/open-feature/js-sdk/commit/458d278345fe8681a966fca3852b2e607bdafccb))

## [0.0.1-experimental](https://github.com/open-feature/js-sdk/compare/angular-sdk-v0.0.2-experimental...angular-sdk-v0.0.3-experimental) (2024-09-14)


### ✨ New Features

* Angular SDK ([#997](https://github.com/open-feature/js-sdk/issues/997)) ([105fd95](https://github.com/open-feature/js-sdk/commit/105fd95e344822ffcfc54d328a28676b6f27f38e))
