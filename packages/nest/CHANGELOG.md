# Changelog

## [0.2.0-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.1.5-experimental...nestjs-sdk-v0.2.0-experimental) (2024-05-19)


### ⚠ BREAKING CHANGES

* rename FeatureClient decorator to OpenFeatureClient ([#949](https://github.com/open-feature/js-sdk/issues/949))

### ✨ New Features

* rename FeatureClient decorator to OpenFeatureClient ([#949](https://github.com/open-feature/js-sdk/issues/949)) ([a531238](https://github.com/open-feature/js-sdk/commit/a531238124510e6aa150ff619972f8880346507b))

## [0.1.5-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.1.4-experimental...nestjs-sdk-v0.1.5-experimental) (2024-05-13)


### 🐛 Bug Fixes

* removes exports of OpenFeatureClient class and makes event props readonly ([#918](https://github.com/open-feature/js-sdk/issues/918)) ([e9a25c2](https://github.com/open-feature/js-sdk/commit/e9a25c21cb17c3b5700bca652e3c0ed15e8f49b4))


### 🧹 Chore

* remove node 16 ([#875](https://github.com/open-feature/js-sdk/issues/875)) ([c1878e4](https://github.com/open-feature/js-sdk/commit/c1878e4effac3c8c9aa8a34cee4214f628a1e4ca))
* **deps:** update dependency supertest to v7 ([#939](https://github.com/open-feature/js-sdk/issues/939)) ([9083df8](https://github.com/open-feature/js-sdk/commit/9083df8463d6f970111dedee114aedc0a20e2a3c))

## [0.1.4-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.1.3-experimental...nestjremove node 16 ([#875](https://github.com/open-feature/js-sdk/issues/875)) ([c1878e4](https://github.com/open-feature/js-sdk/commit/c1878e4effac3c8c9aa8a34cee4214f628a1e4ca))


### 🐛 Bug Fixes

* removes exports of OpenFeatureClient class and makes event props readonly ([#918](https://github.com/open-feature/js-sdk/issues/918)) ([e9a25c2](https://github.com/open-feature/js-sdk/commit/e9a25c21cb17c3b5700bca652e3c0ed15e8f49b4))


### 🧹 Chore

* **deps:** update dependency supertest to v7 ([#939](https://github.com/open-feature/js-sdk/issues/939)) ([9083df8](https://github.com/open-feature/js-sdk/commit/9083df8463d6f970111dedee114aedc0a20e2a3c))

## [0.1.4-experimental](https://github.com/open-feature/js-sdk/compare/s-sdk-v0.1.4-experimental) (2024-04-18)


### 🧹 Chore

* bump spec version badge to v0.8.0 ([#910](https://github.com/open-feature/js-sdk/issues/910)) ([a7b2c4b](https://github.com/open-feature/js-sdk/commit/a7b2c4bca09112d49e637735466502adb1438ebe))

## [0.1.3-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.1.2-experimental...nestjs-sdk-v0.1.3-experimental) (2024-04-02)


### 🐛 Bug Fixes

* **deps:** resolve CVE-2024-29041 with nest update ([#889](https://github.com/open-feature/js-sdk/issues/889)) ([042ec5f](https://github.com/open-feature/js-sdk/commit/042ec5f70863ecc974371481be24f08c65321f7c))


### 📚 Documentation

* remove duplicate npm install section ([fd0fcfc](https://github.com/open-feature/js-sdk/commit/fd0fcfcfc815803a967e971b7e575c24e46c93bc))

## [0.1.2-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.1.1-experimental...nestjs-sdk-v0.1.2-experimental) (2024-03-06)


### 🐛 Bug Fixes

* **types:** conflicts with peer types ([#852](https://github.com/open-feature/js-sdk/issues/852)) ([fdc8576](https://github.com/open-feature/js-sdk/commit/fdc8576f472253604e26c36e10c0d315f71dbe1c))

## [0.1.1-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.1.0-experimental...nestjs-sdk-v0.1.1-experimental) (2024-03-05)


### ✨ New Features

* context propagation ([#837](https://github.com/open-feature/js-sdk/issues/837)) ([b1abef1](https://github.com/open-feature/js-sdk/commit/b1abef1a2bc2bf27de48a09b44167a2644b62943))
* maintain state in SDK, add RECONCILING ([#795](https://github.com/open-feature/js-sdk/issues/795)) ([cfb0a69](https://github.com/open-feature/js-sdk/commit/cfb0a69c42bd06bf59a7b8761fd90739872a8aeb))

## [0.1.0-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.0.5-experimental...nestjs-sdk-v0.1.0-experimental) (2024-02-25)


### ⚠ BREAKING CHANGES

* **nestjs:** add domains ([#831](https://github.com/open-feature/js-sdk/issues/831))

### ✨ New Features

* **nestjs:** add domains ([#831](https://github.com/open-feature/js-sdk/issues/831)) ([840d7ac](https://github.com/open-feature/js-sdk/commit/840d7acaa3725bade9e8458ad9ced8e20fae1a5e))


### 🧹 Chore

* **deps:** update dependency @types/supertest to v6 ([#782](https://github.com/open-feature/js-sdk/issues/782)) ([53479d1](https://github.com/open-feature/js-sdk/commit/53479d1edd3aad40f3d3fc3662cef6a317f78bbe))

## [0.0.5-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.0.4-experimental...nestjs-sdk-v0.0.5-experimental) (2024-01-31)


### ✨ New Features

* adds ErrorOptions to Error constructor ([#765](https://github.com/open-feature/js-sdk/issues/765)) ([2f59a9f](https://github.com/open-feature/js-sdk/commit/2f59a9f5a81135d81d3c6cd7a14863dc21b012b4))


### 🐛 Bug Fixes

* **nest:** add peer deps for nestjs-core and rxjs 9 ([#784](https://github.com/open-feature/js-sdk/issues/784)) ([a452bdd](https://github.com/open-feature/js-sdk/commit/a452bdd4a86884417099a8c8ee7d77c53b16eaa7))
* removed duped core types ([#800](https://github.com/open-feature/js-sdk/issues/800)) ([7cc1e09](https://github.com/open-feature/js-sdk/commit/7cc1e09a1118d0c541aeb5e43da74eb3983950a3))


### 📚 Documentation

* Nest SDK ([#750](https://github.com/open-feature/js-sdk/issues/750)) ([a21634d](https://github.com/open-feature/js-sdk/commit/a21634dce97100ab8a79710dc03d35fa99491032))
* update nestjs readme examples ([#787](https://github.com/open-feature/js-sdk/issues/787)) ([c6a357a](https://github.com/open-feature/js-sdk/commit/c6a357aa5ced91a464a861b4c5a2de0aadeb4e66))

## [0.0.4-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.0.3-experimental...nestjs-sdk-v0.0.4-experimental) (2024-01-18)


### ✨ New Features

* add logger, event handlers and hooks to nest sdk ([#761](https://github.com/open-feature/js-sdk/issues/761)) ([80a9ba1](https://github.com/open-feature/js-sdk/commit/80a9ba1e5120f1adaadb7b98f5f88b9f03b02682))

## [0.0.3-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.0.2-experimental...nestjs-sdk-v0.0.3-experimental) (2024-01-08)


### ✨ New Features

* context propagation for nestjs ([#736](https://github.com/open-feature/js-sdk/issues/736)) ([1fa53c9](https://github.com/open-feature/js-sdk/commit/1fa53c9058904664b95ecf96178e414f1d70b845))

## [0.0.2-experimental](https://github.com/open-feature/js-sdk/compare/nestjs-sdk-v0.0.1-experimental...nestjs-sdk-v0.0.2-experimental) (2023-12-13)


### ✨ New Features

* implement draft for a Nest.js SDK ([#718](https://github.com/open-feature/js-sdk/issues/718)) ([ef874e0](https://github.com/open-feature/js-sdk/commit/ef874e0365bdd96a7baf0447103554ff6176f28e))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @openfeature/core bumped from * to 0.0.21
    * @openfeature/server-sdk bumped from * to 1.8.0
