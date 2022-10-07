# Changelog

## [0.6.0](https://github.com/beeme1mr/js-sdk/compare/js-sdk-v0.5.0...js-sdk-v0.6.0) (2022-10-07)


### ⚠ BREAKING CHANGES

* errorCode as enum, reason as string (#244)
* improve generic type accuracy (#224)
* convert to chainable methods (#221)
* remove flag evaluation options from the provider interface (#185)
* context transformer and related interfaces removed.

### Features

* add client context mutation ([#207](https://github.com/beeme1mr/js-sdk/issues/207)) ([5b0442a](https://github.com/beeme1mr/js-sdk/commit/5b0442aee952e694496f3d15770a69b334015802))
* add logger ([#219](https://github.com/beeme1mr/js-sdk/issues/219)) ([763f167](https://github.com/beeme1mr/js-sdk/commit/763f16717a4dd199a84bf90302551d3b24c862af))
* add transaction propagation ([#212](https://github.com/beeme1mr/js-sdk/issues/212)) ([1d251ff](https://github.com/beeme1mr/js-sdk/commit/1d251ff99e8fc6c03c3f2fd2faa16320e01909fe))
* convert to chainable methods ([#221](https://github.com/beeme1mr/js-sdk/issues/221)) ([5253ad9](https://github.com/beeme1mr/js-sdk/commit/5253ad9b47299c375bbf1151c672454fb11b9f40))
* errorCode as enum, reason as string ([#244](https://github.com/beeme1mr/js-sdk/issues/244)) ([ce7c4ad](https://github.com/beeme1mr/js-sdk/commit/ce7c4ad80cedf5c40b6ce1e123caae737b14f6aa))
* experimental web support ([#200](https://github.com/beeme1mr/js-sdk/issues/200)) ([fd144bb](https://github.com/beeme1mr/js-sdk/commit/fd144bb13457c29102e60f2075243f52b1ce6d0b))
* improve generic type accuracy ([#224](https://github.com/beeme1mr/js-sdk/issues/224)) ([12230a5](https://github.com/beeme1mr/js-sdk/commit/12230a5cd7c4a5a1ae55f117fed5d6778118f4ee))
* remove ctx transformer, add provider hooks ([#148](https://github.com/beeme1mr/js-sdk/issues/148)) ([260432c](https://github.com/beeme1mr/js-sdk/commit/260432c4f92f16f83635dfafff30ad9bc1697a47))
* remove flag evaluation options from the provider interface ([#185](https://github.com/beeme1mr/js-sdk/issues/185)) ([e9852e4](https://github.com/beeme1mr/js-sdk/commit/e9852e4f52fd598cebb9d74f3c22abdb832ebac9)), closes [#183](https://github.com/beeme1mr/js-sdk/issues/183)


### Bug Fixes

* Add no-op tests ([#99](https://github.com/beeme1mr/js-sdk/issues/99)) ([a341f5c](https://github.com/beeme1mr/js-sdk/commit/a341f5c776035ca24b1323b4a37f5f166cdc55d7))
* Dont push experiemental branches ([#101](https://github.com/beeme1mr/js-sdk/issues/101)) ([0a7a5ec](https://github.com/beeme1mr/js-sdk/commit/0a7a5ec562d5dcfdb044ebcc25fd1fed703b68f4))
* Fix publish command ([#103](https://github.com/beeme1mr/js-sdk/issues/103)) ([4742ef1](https://github.com/beeme1mr/js-sdk/commit/4742ef14cc0ea07e3569eee56899937452a55a9c))
* Fixing error with setProvider type ([#121](https://github.com/beeme1mr/js-sdk/issues/121)) ([df5d214](https://github.com/beeme1mr/js-sdk/commit/df5d2149ef15a1e9b58b9a3280c01bd77a2b3dd8))
* update the client to conform to the provider interface ([#187](https://github.com/beeme1mr/js-sdk/issues/187)) ([f1edb29](https://github.com/beeme1mr/js-sdk/commit/f1edb296346e9feb2bd86fed71bbe24e725e0531))

## [0.5.0](https://github.com/open-feature/js-sdk/compare/js-sdk-v0.4.0...js-sdk-v0.5.0) (2022-10-03)


### ⚠ BREAKING CHANGES

* errorCode as enum, reason as string (#244)

### Features

* add transaction propagation ([#212](https://github.com/open-feature/js-sdk/issues/212)) ([1d251ff](https://github.com/open-feature/js-sdk/commit/1d251ff99e8fc6c03c3f2fd2faa16320e01909fe))
* errorCode as enum, reason as string ([#244](https://github.com/open-feature/js-sdk/issues/244)) ([ce7c4ad](https://github.com/open-feature/js-sdk/commit/ce7c4ad80cedf5c40b6ce1e123caae737b14f6aa))
* experimental web support ([#200](https://github.com/open-feature/js-sdk/issues/200)) ([fd144bb](https://github.com/open-feature/js-sdk/commit/fd144bb13457c29102e60f2075243f52b1ce6d0b))

## [0.4.0](https://github.com/open-feature/js-sdk/compare/js-sdk-v0.3.2...js-sdk-v0.4.0) (2022-09-20)


### ⚠ BREAKING CHANGES

* improve generic type accuracy (#224)
* convert to chainable methods (#221)
* remove flag evaluation options from the provider interface (#185)
* context transformer and related interfaces removed.

### Features

* add client context mutation ([#207](https://github.com/open-feature/js-sdk/issues/207)) ([5b0442a](https://github.com/open-feature/js-sdk/commit/5b0442aee952e694496f3d15770a69b334015802))
* add logger ([#219](https://github.com/open-feature/js-sdk/issues/219)) ([763f167](https://github.com/open-feature/js-sdk/commit/763f16717a4dd199a84bf90302551d3b24c862af))
* convert to chainable methods ([#221](https://github.com/open-feature/js-sdk/issues/221)) ([5253ad9](https://github.com/open-feature/js-sdk/commit/5253ad9b47299c375bbf1151c672454fb11b9f40))
* improve generic type accuracy ([#224](https://github.com/open-feature/js-sdk/issues/224)) ([12230a5](https://github.com/open-feature/js-sdk/commit/12230a5cd7c4a5a1ae55f117fed5d6778118f4ee))
* remove ctx transformer, add provider hooks ([#148](https://github.com/open-feature/js-sdk/issues/148)) ([260432c](https://github.com/open-feature/js-sdk/commit/260432c4f92f16f83635dfafff30ad9bc1697a47))
* remove flag evaluation options from the provider interface ([#185](https://github.com/open-feature/js-sdk/issues/185)) ([e9852e4](https://github.com/open-feature/js-sdk/commit/e9852e4f52fd598cebb9d74f3c22abdb832ebac9)), closes [#183](https://github.com/open-feature/js-sdk/issues/183)


### Bug Fixes

* Add no-op tests ([#99](https://github.com/open-feature/js-sdk/issues/99)) ([a341f5c](https://github.com/open-feature/js-sdk/commit/a341f5c776035ca24b1323b4a37f5f166cdc55d7))
* Dont push experiemental branches ([#101](https://github.com/open-feature/js-sdk/issues/101)) ([0a7a5ec](https://github.com/open-feature/js-sdk/commit/0a7a5ec562d5dcfdb044ebcc25fd1fed703b68f4))
* Fix publish command ([#103](https://github.com/open-feature/js-sdk/issues/103)) ([4742ef1](https://github.com/open-feature/js-sdk/commit/4742ef14cc0ea07e3569eee56899937452a55a9c))
* Fixing error with setProvider type ([#121](https://github.com/open-feature/js-sdk/issues/121)) ([df5d214](https://github.com/open-feature/js-sdk/commit/df5d2149ef15a1e9b58b9a3280c01bd77a2b3dd8))
* update the client to conform to the provider interface ([#187](https://github.com/open-feature/js-sdk/issues/187)) ([f1edb29](https://github.com/open-feature/js-sdk/commit/f1edb296346e9feb2bd86fed71bbe24e725e0531))

## [0.3.2](https://github.com/open-feature/node-sdk/compare/nodejs-sdk-v0.3.1...nodejs-sdk-v0.3.2) (2022-09-09)


### Features

* add client context mutation ([#207](https://github.com/open-feature/node-sdk/issues/207)) ([5b0442a](https://github.com/open-feature/node-sdk/commit/5b0442aee952e694496f3d15770a69b334015802))

## [0.3.1](https://github.com/open-feature/node-sdk/compare/nodejs-sdk-v0.3.0...nodejs-sdk-v0.3.1) (2022-08-26)


### Bug Fixes

* update the client to conform to the provider interface ([#187](https://github.com/open-feature/node-sdk/issues/187)) ([f1edb29](https://github.com/open-feature/node-sdk/commit/f1edb296346e9feb2bd86fed71bbe24e725e0531))

## [0.3.0](https://github.com/open-feature/js-sdk/compare/nodejs-sdk-v0.2.0...nodejs-sdk-v0.3.0) (2022-08-25)

### ⚠ BREAKING CHANGES

- remove flag evaluation options from the provider interface (#185)

### Features

- remove flag evaluation options from the provider interface ([#185](https://github.com/open-feature/js-sdk/issues/185)) ([e9852e4](https://github.com/open-feature/js-sdk/commit/e9852e4f52fd598cebb9d74f3c22abdb832ebac9)), closes [#183](https://github.com/open-feature/js-sdk/issues/183)

## [0.2.0](https://github.com/open-feature/js-sdk/compare/nodejs-sdk-v0.1.10...nodejs-sdk-v0.2.0) (2022-08-15)

### ⚠ BREAKING CHANGES

- context transformer and related interfaces removed.

### Features

- remove ctx transformer, add provider hooks ([#148](https://github.com/open-feature/js-sdk/issues/148)) ([260432c](https://github.com/open-feature/js-sdk/commit/260432c4f92f16f83635dfafff30ad9bc1697a47))

## [0.1.10](https://github.com/open-feature/js-sdk/compare/nodejs-sdk-v0.1.9...nodejs-sdk-v0.1.10) (2022-07-28)

### Bug Fixes

- Fixing error with setProvider type ([#121](https://github.com/open-feature/js-sdk/issues/121)) ([df5d214](https://github.com/open-feature/js-sdk/commit/df5d2149ef15a1e9b58b9a3280c01bd77a2b3dd8))

## [0.1.9](https://github.com/open-feature/js-sdk/compare/nodejs-sdk-v0.1.8...nodejs-sdk-v0.1.9) (2022-07-22)

### Bug Fixes

- Add no-op tests ([#99](https://github.com/open-feature/js-sdk/issues/99)) ([a341f5c](https://github.com/open-feature/js-sdk/commit/a341f5c776035ca24b1323b4a37f5f166cdc55d7))
- Don't push experimental branches ([#101](https://github.com/open-feature/js-sdk/issues/101)) ([0a7a5ec](https://github.com/open-feature/js-sdk/commit/0a7a5ec562d5dcfdb044ebcc25fd1fed703b68f4))
- Fix publish command ([#103](https://github.com/open-feature/js-sdk/issues/103)) ([4742ef1](https://github.com/open-feature/js-sdk/commit/4742ef14cc0ea07e3569eee56899937452a55a9c))
