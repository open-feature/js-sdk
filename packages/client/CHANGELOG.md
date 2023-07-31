# Changelog


## [0.3.11](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.10-experimental...web-sdk-v0.3.11) (2023-07-31)


### Bug Fixes

* only initialize NOT_READY providers ([#507](https://github.com/open-feature/js-sdk/issues/507)) ([5e320ae](https://github.com/open-feature/js-sdk/commit/5e320ae3811e270985e867c1c85a301eacd99a49))

## [0.3.10](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.9-experimental...web-sdk-v0.3.10) (2023-07-26)


### Bug Fixes

* re-release web-sdk ([15491ba](https://github.com/open-feature/js-sdk/commit/15491bada9a62cfa27b028074716c414d364ad96))

## [0.3.8-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.7-experimental...web-sdk-v0.3.8-experimental) (2023-07-24)


### Features

* typesafe event emitter ([#490](https://github.com/open-feature/js-sdk/issues/490)) ([92e3a72](https://github.com/open-feature/js-sdk/commit/92e3a724bf4e53721644c2155060b2bd44a43c39))


### Bug Fixes

* onContextChanged not running for named providers ([#491](https://github.com/open-feature/js-sdk/issues/491)) ([1ab0cc6](https://github.com/open-feature/js-sdk/commit/1ab0cc6bb250b27dd2cf6462aa3d831fcf8526f3))
* race adding handler during init ([#501](https://github.com/open-feature/js-sdk/issues/501)) ([0be9c5d](https://github.com/open-feature/js-sdk/commit/0be9c5dcd9c7f8bc76d28e94b2e80617836323e5))

## [0.3.7-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.6-experimental...web-sdk-v0.3.7-experimental) (2023-07-05)


### Bug Fixes

* events on anon provider/client ([#480](https://github.com/open-feature/js-sdk/issues/480)) ([c44b18e](https://github.com/open-feature/js-sdk/commit/c44b18eb9eb6d6e828af61767b9f3e39f2cef1af))

## [0.3.6-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.5-experimental...web-sdk-v0.3.6-experimental) (2023-07-04)


### Bug Fixes

* named client events ([#472](https://github.com/open-feature/js-sdk/issues/472)) ([fb69b9d](https://github.com/open-feature/js-sdk/commit/fb69b9d665172de7d79c84b36adbbcf0c315b701))

## [0.3.5-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.4-experimental...web-sdk-v0.3.5-experimental) (2023-06-29)


### Bug Fixes

* various event handler issues ([1dd1e17](https://github.com/open-feature/js-sdk/commit/1dd1e17361ef85e89f858d00475830bffec4173b))

## [0.3.4-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.3-experimental...web-sdk-v0.3.4-experimental) (2023-06-08)


### Bug Fixes

* updated typedoc config to support monorepos ([#447](https://github.com/open-feature/js-sdk/issues/447)) ([05b100d](https://github.com/open-feature/js-sdk/commit/05b100dca540dfa6317a01cb238af6d9a1c1c2ef))

## [0.3.3-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.2-experimental...web-sdk-v0.3.3-experimental) (2023-06-06)


### Features

* add init/shutdown and events ([#436](https://github.com/open-feature/js-sdk/issues/436)) ([5d55ea1](https://github.com/open-feature/js-sdk/commit/5d55ea1d08267a09f36c6b1508298646ee34616c))
* add named client support ([#429](https://github.com/open-feature/js-sdk/issues/429)) ([310c6ac](https://github.com/open-feature/js-sdk/commit/310c6ac51ee06de5db75e16b64ace150bcf55fbe))
* add support for flag metadata ([#426](https://github.com/open-feature/js-sdk/issues/426)) ([029ec26](https://github.com/open-feature/js-sdk/commit/029ec26eb255a2549abcbeba12f41d4b9e57c100))


### Bug Fixes

* bundlers wrongly resolving server/client modules ([#445](https://github.com/open-feature/js-sdk/issues/445)) ([6acddd5](https://github.com/open-feature/js-sdk/commit/6acddd529703364effa029341496900fc8671f6b))
* only shutdown providers that are not attached to any client ([#444](https://github.com/open-feature/js-sdk/issues/444)) ([7e469c4](https://github.com/open-feature/js-sdk/commit/7e469c49cab2a26b3f402eae4807365e08cd7a62))

## [0.3.2-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.1-experimental...web-sdk-v0.3.2-experimental) (2023-05-01)


### Bug Fixes

* remove events exports from server ([#413](https://github.com/open-feature/js-sdk/issues/413)) ([7cac0c8](https://github.com/open-feature/js-sdk/commit/7cac0c87abfe6d6962b7f64a58b25d76ed06d4cb))

## [0.3.1-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.0-experimental...web-sdk-v0.3.1-experimental) (2023-04-03)


### Bug Fixes

* import cycle ([#395](https://github.com/open-feature/js-sdk/issues/395)) ([ac0f10d](https://github.com/open-feature/js-sdk/commit/ac0f10d04e61d37965fe25bc8d5f7efa0ba717d6))

## [0.3.0-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.2.0-experimental...web-sdk-v0.3.0-experimental) (2023-04-03)


### ⚠ BREAKING CHANGES

* use bundled event emitter type ([#389](https://github.com/open-feature/js-sdk/issues/389))

### Features

* use bundled event emitter type ([#389](https://github.com/open-feature/js-sdk/issues/389)) ([47d1634](https://github.com/open-feature/js-sdk/commit/47d16341106a79e86d78a8dc40fd9b9491b7fc5a))


### Bug Fixes

* fix readme typo ([a23f899](https://github.com/open-feature/js-sdk/commit/a23f899d688606f624af3baf93e8eabd1cd26096))

## [0.2.0-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.1.0-experimental...web-sdk-v0.2.0-experimental) (2023-03-22)


### ⚠ BREAKING CHANGES

* use node style events, add initialize ([#379](https://github.com/open-feature/js-sdk/issues/379))

### Features

* use node style events, add initialize ([#379](https://github.com/open-feature/js-sdk/issues/379)) ([6625918](https://github.com/open-feature/js-sdk/commit/662591861140cb9b387b3810aa2b2353f7af257e))

## [0.1.0-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.0.2-experimental...web-sdk-v0.1.0-experimental) (2023-03-13)


### ⚠ BREAKING CHANGES

* remove context from client interfaces ([#373](https://github.com/open-feature/js-sdk/issues/373))

### Bug Fixes

* remove context from client interfaces ([#373](https://github.com/open-feature/js-sdk/issues/373)) ([a692a32](https://github.com/open-feature/js-sdk/commit/a692a329ac73f8c9e507dd58b8390533a7648375))

## Changelog

### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @openfeature/shared bumped from 0.0.1 to 0.0.2
