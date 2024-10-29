# Changelog

## [0.4.8](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.4.7...react-sdk-v0.4.8) (2024-10-29)


### 🧹 Chore

* bump minimum web peer ([#1072](https://github.com/open-feature/js-sdk/issues/1072)) ([eca8205](https://github.com/open-feature/js-sdk/commit/eca8205da7945395d19c09a4da67cd4c2d516227))


### 📚 Documentation

* add tracking sections ([#1068](https://github.com/open-feature/js-sdk/issues/1068)) ([e131faf](https://github.com/open-feature/js-sdk/commit/e131faffad9025e9c7194f39558bf3b3cec31807))

## [0.4.7](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.4.6...react-sdk-v0.4.7) (2024-10-29)


### ✨ New Features

* avoid re-resolving flags unaffected by a change event ([#1024](https://github.com/open-feature/js-sdk/issues/1024)) ([b8f9b4e](https://github.com/open-feature/js-sdk/commit/b8f9b4ebaf4bdd93669fc6da09d9f97a498174d9))
* implement tracking as per spec ([#1020](https://github.com/open-feature/js-sdk/issues/1020)) ([80f182e](https://github.com/open-feature/js-sdk/commit/80f182e1afbd3a705bf3de6a0d9886ccb3424b44))
* use mutate context hook ([#1031](https://github.com/open-feature/js-sdk/issues/1031)) ([ec3d967](https://github.com/open-feature/js-sdk/commit/ec3d967f8b9dd0854706a904a5360f0a0b843595))


### 🧹 Chore

* add js docs for context mutator hook ([#1045](https://github.com/open-feature/js-sdk/issues/1045)) ([def3fe8](https://github.com/open-feature/js-sdk/commit/def3fe8dafc3d6ed3451a493e76842b7d2e8363c))
* import type lint rule and fixes ([#1039](https://github.com/open-feature/js-sdk/issues/1039)) ([01fcb93](https://github.com/open-feature/js-sdk/commit/01fcb933d2cbd131a0f4a005173cdd1906087e18))

## [0.4.6](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.4.5...react-sdk-v0.4.6) (2024-09-23)


### 🐛 Bug Fixes

* failure to re-render on changes ([#1021](https://github.com/open-feature/js-sdk/issues/1021)) ([c927044](https://github.com/open-feature/js-sdk/commit/c927044c4934f0b8edfd2cdbbc0d60ad546b3dbc))

## [0.4.5](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.4.4...react-sdk-v0.4.5) (2024-09-04)


### ✨ New Features

* **react:** prevent rerenders when value is unchanged ([#987](https://github.com/open-feature/js-sdk/issues/987)) ([b7fc08e](https://github.com/open-feature/js-sdk/commit/b7fc08e27d225bdbf72c1985e7eef85adcd896b0))

## [0.4.4](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.4.3...react-sdk-v0.4.4) (2024-08-28)


### 🧹 Chore

* move client/ dir to web/ ([#991](https://github.com/open-feature/js-sdk/issues/991)) ([df4e72e](https://github.com/open-feature/js-sdk/commit/df4e72eabc3370801303470ca37263a0d4d9bb38))


### 📚 Documentation

* **react:** update the error message ([#978](https://github.com/open-feature/js-sdk/issues/978)) ([429c4ae](https://github.com/open-feature/js-sdk/commit/429c4ae941b66a1aa82b5aeea4bdb8b57bd05022))

## [0.4.3](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.4.2...react-sdk-v0.4.3) (2024-08-22)


### 🐛 Bug Fixes

* race condition in test provider with suspense ([#980](https://github.com/open-feature/js-sdk/issues/980)) ([0f187fe](https://github.com/open-feature/js-sdk/commit/0f187fe0b584e66b6283531eb7879c320967f921))


### 🧹 Chore

* fix flaky test timing ([ad46ade](https://github.com/open-feature/js-sdk/commit/ad46ade143b10366103d4ac199d728e8ae5ba7e8))

## [0.4.2](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.4.1...react-sdk-v0.4.2) (2024-07-29)


### ✨ New Features

* add test provider ([#971](https://github.com/open-feature/js-sdk/issues/971)) ([1c12d4d](https://github.com/open-feature/js-sdk/commit/1c12d4d548195bfc8c2f898a90ea97063aa8b3f7))

## [0.4.1](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.4.0...react-sdk-v0.4.1) (2024-06-11)


### ✨ New Features

* lower compilation target to es2015 ([#957](https://github.com/open-feature/js-sdk/issues/957)) ([c2d6c17](https://github.com/open-feature/js-sdk/commit/c2d6c1761ae19f937deaff2f011a0380f8af7350))

## [0.4.0](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.3.4...react-sdk-v0.4.0) (2024-05-13)


### ⚠ BREAKING CHANGES

* disable suspense by default, add suspense hooks ([#940](https://github.com/open-feature/js-sdk/issues/940))

### ✨ New Features

* disable suspense by default, add suspense hooks ([#940](https://github.com/open-feature/js-sdk/issues/940)) ([6bcef89](https://github.com/open-feature/js-sdk/commit/6bcef8977d0134c131af259dc0190a296e790382))
* set context during provider init on web ([#919](https://github.com/open-feature/js-sdk/issues/919)) ([7e6c1c6](https://github.com/open-feature/js-sdk/commit/7e6c1c6e7082e75535bf81b4e70c8c57ef870b77))

## [0.3.4](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.3.3...react-sdk-v0.3.4) (2024-05-01)


### 🐛 Bug Fixes

* delayed suspense causes "flicker" ([#921](https://github.com/open-feature/js-sdk/issues/921)) ([4bce2a0](https://github.com/open-feature/js-sdk/commit/4bce2a0f1a5a716160b8862f1882d24c97688288))

## [0.3.3](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.3.2...react-sdk-v0.3.3) (2024-04-23)


### 🐛 Bug Fixes

* invocation hooks not called ([#916](https://github.com/open-feature/js-sdk/issues/916)) ([2f77738](https://github.com/open-feature/js-sdk/commit/2f7773809007733d1ccaeeaa58b1799d6c1731b4))

## [0.3.2](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.3.2-experimental...react-sdk-v0.3.2) (2024-04-18)


### 🧹 Chore

* remove pre-release, update readme ([#908](https://github.com/open-feature/js-sdk/issues/908)) ([2532379](https://github.com/open-feature/js-sdk/commit/2532379f2ee5c38090a3e2c671edb2a6ca026bd5))

## [0.3.2-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.3.1-experimental...react-sdk-v0.3.2-experimental) (2024-04-11)


### 🐛 Bug Fixes

* re-render w/ useWhenProviderReady, add tests ([#901](https://github.com/open-feature/js-sdk/issues/901)) ([0f2094e](https://github.com/open-feature/js-sdk/commit/0f2094e2360ffed58a6103c00e5ba0ade6ac50eb))

## [0.3.1-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.3.0-experimental...react-sdk-v0.3.1-experimental) (2024-04-09)


### 🐛 Bug Fixes

* default options (re-renders not firing by default) ([#905](https://github.com/open-feature/js-sdk/issues/905)) ([a85e723](https://github.com/open-feature/js-sdk/commit/a85e72333fab85b3fcad87542c11fbed85ca9d85))

## [0.3.0-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.2.4-experimental...react-sdk-v0.3.0-experimental) (2024-04-08)


### ⚠ BREAKING CHANGES

* options inheritance, useWhenProviderReady, suspend by default ([#900](https://github.com/open-feature/js-sdk/issues/900))

### ✨ New Features

* options inheritance, useWhenProviderReady, suspend by default ([#900](https://github.com/open-feature/js-sdk/issues/900)) ([539e741](https://github.com/open-feature/js-sdk/commit/539e7415de8dae333fed72ae80590021d9600830))

## [0.2.4-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.2.3-experimental...react-sdk-v0.2.4-experimental) (2024-04-03)


### ✨ New Features

* query-style, generic useFlag hook ([#897](https://github.com/open-feature/js-sdk/issues/897)) ([5c17b8d](https://github.com/open-feature/js-sdk/commit/5c17b8dfcffd2f0145e5b2c79fa9dff842bbac92))


### 🔄 Refactoring

* dir restructure ([#894](https://github.com/open-feature/js-sdk/issues/894)) ([ce9f65c](https://github.com/open-feature/js-sdk/commit/ce9f65c6ec41867f67c528997cf3acef367f9260))

## [0.2.3-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.2.2-experimental...react-sdk-v0.2.3-experimental) (2024-03-25)


### 🐛 Bug Fixes

* make domain/client optional ([#884](https://github.com/open-feature/js-sdk/issues/884)) ([2b633b5](https://github.com/open-feature/js-sdk/commit/2b633b56778dde9a8955f19ca207fa0e8dced884))


### 🧹 Chore

* prompt web-sdk 1.0 ([#871](https://github.com/open-feature/js-sdk/issues/871)) ([7d50d93](https://github.com/open-feature/js-sdk/commit/7d50d931d5cda349a31969c997e7581ea4883b6a))


### 📚 Documentation

* fix invalid link fragment ([9d63803](https://github.com/open-feature/js-sdk/commit/9d638038c0062704dc701bfbba3004e89ed59e3e))
* remove emojis from react readme ([9e0e368](https://github.com/open-feature/js-sdk/commit/9e0e368d2328de2c7a4a5d91068aa75ecd70f8ed))

## [0.2.2-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.2.1-experimental...react-sdk-v0.2.2-experimental) (2024-03-06)


### 🐛 Bug Fixes

* **types:** conflicts with peer types ([#852](https://github.com/open-feature/js-sdk/issues/852)) ([fdc8576](https://github.com/open-feature/js-sdk/commit/fdc8576f472253604e26c36e10c0d315f71dbe1c))

## [0.2.1-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.2.0-experimental...react-sdk-v0.2.1-experimental) (2024-03-05)


### ✨ New Features

* maintain state in SDK, add RECONCILING ([#795](https://github.com/open-feature/js-sdk/issues/795)) ([cfb0a69](https://github.com/open-feature/js-sdk/commit/cfb0a69c42bd06bf59a7b8761fd90739872a8aeb))
* suspend on RECONCILING, mem provider fixes ([#796](https://github.com/open-feature/js-sdk/issues/796)) ([8101ff1](https://github.com/open-feature/js-sdk/commit/8101ff197ff97808d14114e56aae27023f9b09f6))

## [0.2.0-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.1.1-experimental...react-sdk-v0.2.0-experimental) (2024-02-27)


### ⚠ BREAKING CHANGES

* use "domain" instead of "clientName" ([#826](https://github.com/open-feature/js-sdk/issues/826))

### ✨ New Features

* use "domain" instead of "clientName" ([#826](https://github.com/open-feature/js-sdk/issues/826)) ([427ba88](https://github.com/open-feature/js-sdk/commit/427ba883f5b3d38e40ed3dd493c6208f2f74691e))

## [0.1.1-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.1.0-experimental...react-sdk-v0.1.1-experimental) (2024-01-31)


### ✨ New Features

* adds ErrorOptions to Error constructor ([#765](https://github.com/open-feature/js-sdk/issues/765)) ([2f59a9f](https://github.com/open-feature/js-sdk/commit/2f59a9f5a81135d81d3c6cd7a14863dc21b012b4))


### 🐛 Bug Fixes

* removed duped core types ([#800](https://github.com/open-feature/js-sdk/issues/800)) ([7cc1e09](https://github.com/open-feature/js-sdk/commit/7cc1e09a1118d0c541aeb5e43da74eb3983950a3))


### 📚 Documentation

* update react readme ([#792](https://github.com/open-feature/js-sdk/issues/792)) ([1666597](https://github.com/open-feature/js-sdk/commit/16665978394718558e3c43601737358098305a40))

## [0.1.0-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.0.6-experimental...react-sdk-v0.1.0-experimental) (2024-01-18)


### ⚠ BREAKING CHANGES

* remove generic hook, add specific type hooks ([#766](https://github.com/open-feature/js-sdk/issues/766))

### ✨ New Features

* remove generic hook, add specific type hooks ([#766](https://github.com/open-feature/js-sdk/issues/766)) ([d1d02fa](https://github.com/open-feature/js-sdk/commit/d1d02fa59de5b5b1b8866c0b5d3de1a5bc0c5a04))


### 🧹 Chore

* fix react-sdk REAMDE example, add missing `EvaluationContext` ([#762](https://github.com/open-feature/js-sdk/issues/762)) ([1e13333](https://github.com/open-feature/js-sdk/commit/1e1333381909b790d0c4fc7590613b2ae6f1aa2e))

## [0.0.6-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.0.5-experimental...react-sdk-v0.0.6-experimental) (2024-01-11)


### ✨ New Features

* suspense support, client scoping, context-sensitive re-rendering ([#759](https://github.com/open-feature/js-sdk/issues/759)) ([8f01ead](https://github.com/open-feature/js-sdk/commit/8f01ead29104d122b8126d2fee97c98556091344))


### 🧹 Chore

* fix React SDK README.md to use the resolved value instead of the resolution details ([#691](https://github.com/open-feature/js-sdk/issues/691)) ([2d1b8eb](https://github.com/open-feature/js-sdk/commit/2d1b8ebfb187db92db02ea36fa6d6ca291591b18))
* react-sdk | downgrading react peer dependency | react 18.0.0 -&gt; 16.8.0 ([#742](https://github.com/open-feature/js-sdk/issues/742)) ([2c864e4](https://github.com/open-feature/js-sdk/commit/2c864e46ccecd6d8825738f30a2d098dc66e26cf))

## [0.0.5-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.0.4-experimental...react-sdk-v0.0.5-experimental) (2023-11-27)


### 🐛 Bug Fixes

* rm NodeJS type from core, rm react core peer ([#681](https://github.com/open-feature/js-sdk/issues/681)) ([09ff7b4](https://github.com/open-feature/js-sdk/commit/09ff7b4d99ec2bfa4ef9c18cb1845af1ca14d7b9))

## [0.0.4-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.0.3-experimental...react-sdk-v0.0.4-experimental) (2023-11-21)


### 🧹 Chore

* **main:** release core 0.0.19 ([#676](https://github.com/open-feature/js-sdk/issues/676)) ([b0cbeb4](https://github.com/open-feature/js-sdk/commit/b0cbeb460cfb210d258cb7978e77f306353037d2))

## [0.0.3-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.0.2-experimental...react-sdk-v0.0.3-experimental) (2023-11-09)


### 🧹 Chore

* **main:** release core 0.0.17 ([#651](https://github.com/open-feature/js-sdk/issues/651)) ([3c9fdd9](https://github.com/open-feature/js-sdk/commit/3c9fdd9e4c6b487f25494d03ed1f413d14b2ccfb))
* **main:** release core 0.0.18 ([#661](https://github.com/open-feature/js-sdk/issues/661)) ([cf7bbf0](https://github.com/open-feature/js-sdk/commit/cf7bbf063916c639878de16e54e974607a2cd7ed))
* update spec version link ([0032a81](https://github.com/open-feature/js-sdk/commit/0032a81924012a3b464e577e4505028d6a52cf82))

## [0.0.2-experimental](https://github.com/open-feature/js-sdk/compare/react-sdk-v0.0.1-experimental...react-sdk-v0.0.2-experimental) (2023-10-31)


### Features

* extract and publish core package ([#629](https://github.com/open-feature/js-sdk/issues/629)) ([c3ee90b](https://github.com/open-feature/js-sdk/commit/c3ee90b2e0fdcec235069960e7ec03e63028b08c))
