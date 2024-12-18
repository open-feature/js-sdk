# Changelog 

## [1.6.0](https://github.com/open-feature/js-sdk/compare/core-v1.5.0...core-v1.6.0) (2024-12-12)

### ⚠ BREAKING CHANGES

The signature of the `finally` hook stage has been changed. The signature now includes the `evaluation details`, as per the [OpenFeature specification](https://openfeature.dev/specification/sections/hooks#requirement-438).
Note that since hooks are still `experimental,` this does not constitute a change requiring a new major version.
To migrate, update any hook that implements the `finally` stage to accept `evaluation details` as the second argument.

* add evaluation details to finally hook ([#1087](https://github.com/open-feature/js-sdk/issues/1087)) ([2135254](https://github.com/open-feature/js-sdk/commit/2135254c4bee52b4bcadfbf8b99a896cfd930cca))

### ✨ New Features

* add evaluation details to finally hook ([#1087](https://github.com/open-feature/js-sdk/issues/1087)) ([2135254](https://github.com/open-feature/js-sdk/commit/2135254c4bee52b4bcadfbf8b99a896cfd930cca))


### 🔄 Refactoring

* improve track interface for providers ([#1100](https://github.com/open-feature/js-sdk/issues/1100)) ([5e5b160](https://github.com/open-feature/js-sdk/commit/5e5b16022122b71760634ac90e3fd962aa831c74))

## [1.5.0](https://github.com/open-feature/js-sdk/compare/core-v1.4.0...core-v1.5.0) (2024-10-29)


### ✨ New Features

* implement tracking as per spec ([#1020](https://github.com/open-feature/js-sdk/issues/1020)) ([80f182e](https://github.com/open-feature/js-sdk/commit/80f182e1afbd3a705bf3de6a0d9886ccb3424b44))


### 🧹 Chore

* import type lint rule and fixes ([#1039](https://github.com/open-feature/js-sdk/issues/1039)) ([01fcb93](https://github.com/open-feature/js-sdk/commit/01fcb933d2cbd131a0f4a005173cdd1906087e18))

## [1.4.0](https://github.com/open-feature/js-sdk/compare/core-v1.3.0...core-v1.4.0) (2024-08-28)


### ✨ New Features

* updated the Metadata type to allow for custom properties ([#975](https://github.com/open-feature/js-sdk/issues/975)) ([16b0d74](https://github.com/open-feature/js-sdk/commit/16b0d743404da1f82d5fbada1ad5bedc0d253417))

## [1.3.0](https://github.com/open-feature/js-sdk/compare/core-v1.2.0...core-v1.3.0) (2024-06-11)


### ✨ New Features

* lower compilation target to es2015 ([#957](https://github.com/open-feature/js-sdk/issues/957)) ([c2d6c17](https://github.com/open-feature/js-sdk/commit/c2d6c1761ae19f937deaff2f011a0380f8af7350))

## [1.2.0](https://github.com/open-feature/js-sdk/compare/core-v1.1.0...core-v1.2.0) (2024-05-13)


### ✨ New Features

* set context during provider init on web ([#919](https://github.com/open-feature/js-sdk/issues/919)) ([7e6c1c6](https://github.com/open-feature/js-sdk/commit/7e6c1c6e7082e75535bf81b4e70c8c57ef870b77))


### 🐛 Bug Fixes

* removes exports of OpenFeatureClient class and makes event props readonly ([#918](https://github.com/open-feature/js-sdk/issues/918)) ([e9a25c2](https://github.com/open-feature/js-sdk/commit/e9a25c21cb17c3b5700bca652e3c0ed15e8f49b4))
* run error hook when provider returns reason error or error code ([#926](https://github.com/open-feature/js-sdk/issues/926)) ([c6d0b5d](https://github.com/open-feature/js-sdk/commit/c6d0b5da9c7f4c11319422fbe8c668a7613b044d))

## [1.1.0](https://github.com/open-feature/js-sdk/compare/core-v1.0.0...core-v1.1.0) (2024-04-02)


### ✨ New Features

* add STALE pre-defined reason ([#898](https://github.com/open-feature/js-sdk/issues/898)) ([7f4f080](https://github.com/open-feature/js-sdk/commit/7f4f0808a65318407a482261eee012bbbcfd11a8))

## [1.0.0](https://github.com/open-feature/js-sdk/compare/core-v0.0.28...core-v1.0.0) (2024-03-12)


### 🧹 Chore

* release core as 1.0.0 ([d06b285](https://github.com/open-feature/js-sdk/commit/d06b285cc3cbb6ac47a02a0d36f23831a413385d))

## [0.0.28](https://github.com/open-feature/js-sdk/compare/core-v0.0.27...core-v0.0.28) (2024-03-05)


### ✨ New Features

* use EvenEmitter3 for web-sdk ([#847](https://github.com/open-feature/js-sdk/issues/847)) ([861cf83](https://github.com/open-feature/js-sdk/commit/861cf8378271daf6205c5fc199ffc1bde8dfcc64))

## [0.0.27](https://github.com/open-feature/js-sdk/compare/core-v0.0.26...core-v0.0.27) (2024-03-05)


### ✨ New Features

* maintain state in SDK, add RECONCILING ([#795](https://github.com/open-feature/js-sdk/issues/795)) ([cfb0a69](https://github.com/open-feature/js-sdk/commit/cfb0a69c42bd06bf59a7b8761fd90739872a8aeb))


### 🐛 Bug Fixes

* allow iteration over all event types ([#844](https://github.com/open-feature/js-sdk/issues/844)) ([411c7b4](https://github.com/open-feature/js-sdk/commit/411c7b4265f2029df09219028995d621bb57ad97))

## [0.0.26](https://github.com/open-feature/js-sdk/compare/core-v0.0.25...core-v0.0.26) (2024-02-22)


### ✨ New Features

* add support for domains ([#805](https://github.com/open-feature/js-sdk/issues/805)) ([98ba00a](https://github.com/open-feature/js-sdk/commit/98ba00a28d2f97a363c35ffce84cd8db1fa53f3f))

## [0.0.25](https://github.com/open-feature/js-sdk/compare/core-v0.0.24...core-v0.0.25) (2024-01-31)


### ✨ New Features

* use interface for events ([#798](https://github.com/open-feature/js-sdk/issues/798)) ([b47b1dc](https://github.com/open-feature/js-sdk/commit/b47b1dce5b691f16d877bcac2189d95dda9d6d15))


### 🐛 Bug Fixes

* removed duped core types ([#800](https://github.com/open-feature/js-sdk/issues/800)) ([7cc1e09](https://github.com/open-feature/js-sdk/commit/7cc1e09a1118d0c541aeb5e43da74eb3983950a3))

## [0.0.24](https://github.com/open-feature/js-sdk/compare/core-v0.0.23...core-v0.0.24) (2024-01-27)


### ✨ New Features

* adds ErrorOptions to Error constructor ([#765](https://github.com/open-feature/js-sdk/issues/765)) ([2f59a9f](https://github.com/open-feature/js-sdk/commit/2f59a9f5a81135d81d3c6cd7a14863dc21b012b4))


### 🐛 Bug Fixes

* event-handler leakage ([#788](https://github.com/open-feature/js-sdk/issues/788)) ([69c7f05](https://github.com/open-feature/js-sdk/commit/69c7f05eb48341a3b3fa3c584ccf641201bb0c6e))

## [0.0.23](https://github.com/open-feature/js-sdk/compare/core-v0.0.22...core-v0.0.23) (2024-01-11)


### 🐛 Bug Fixes

* some handlers fail to run ([#753](https://github.com/open-feature/js-sdk/issues/753)) ([f4597af](https://github.com/open-feature/js-sdk/commit/f4597af79aaa04e31a61d708f03a5b5adc8a69c5))

## [0.0.22](https://github.com/open-feature/js-sdk/compare/core-v0.0.21...core-v0.0.22) (2024-01-08)


### ✨ New Features

* add PROVIDER_CONTEXT_CHANGED event (web-sdk only) ([#731](https://github.com/open-feature/js-sdk/issues/731)) ([7906bbe](https://github.com/open-feature/js-sdk/commit/7906bbedbdb822d39e5c620d6c8f0a5739a19e84))

## [0.0.21](https://github.com/open-feature/js-sdk/compare/core-v0.0.20...core-v0.0.21) (2023-12-18)


### ✨ New Features

* add named provider metadata accessor ([#715](https://github.com/open-feature/js-sdk/issues/715)) ([23d14aa](https://github.com/open-feature/js-sdk/commit/23d14aade82d25132714fd3be108cd91c9c15f49))

## [0.0.20](https://github.com/open-feature/js-sdk/compare/core-v0.0.19...core-v0.0.20) (2023-11-27)


### 🐛 Bug Fixes

* add Provider Not Ready Error ([#680](https://github.com/open-feature/js-sdk/issues/680)) ([b0054f9](https://github.com/open-feature/js-sdk/commit/b0054f920dc8a36d2eab1b5fb75433405758440e))
* rm NodeJS type from core, rm react core peer ([#681](https://github.com/open-feature/js-sdk/issues/681)) ([09ff7b4](https://github.com/open-feature/js-sdk/commit/09ff7b4d99ec2bfa4ef9c18cb1845af1ca14d7b9))

## [0.0.19](https://github.com/open-feature/js-sdk/compare/core-v0.0.18...core-v0.0.19) (2023-11-21)


### 🐛 Bug Fixes

* make hooks in client sdk only return void ([#671](https://github.com/open-feature/js-sdk/issues/671)) ([a7d0b95](https://github.com/open-feature/js-sdk/commit/a7d0b954dcd62730d508d203e0fd5bbfe3d39813))

## [0.0.18](https://github.com/open-feature/js-sdk/compare/core-v0.0.17...core-v0.0.18) (2023-11-09)


### 🐛 Bug Fixes

* missing events bundled dep ([#660](https://github.com/open-feature/js-sdk/issues/660)) ([f0e2aa6](https://github.com/open-feature/js-sdk/commit/f0e2aa617f83ce82e6e4d244b4ad618101d45459))

## [0.0.17](https://github.com/open-feature/js-sdk/compare/core-v0.0.16...core-v0.0.17) (2023-11-03)


### Bug Fixes

* remove events.js from core module ([#650](https://github.com/open-feature/js-sdk/issues/650)) ([14441b1](https://github.com/open-feature/js-sdk/commit/14441b1ad44d33ecc99942b0d48a49ccc50d9ee2))

## [0.0.16](https://github.com/open-feature/js-sdk/compare/core-v0.0.15...core-v0.0.16) (2023-10-31)


### Bug Fixes

* api docs links ([#645](https://github.com/open-feature/js-sdk/issues/645)) ([4ff3f0e](https://github.com/open-feature/js-sdk/commit/4ff3f0e94cd597538b18f785873cb3beb0e83ff2))

## [0.0.15](https://github.com/open-feature/js-sdk/compare/core-v0.0.14...core-v0.0.15) (2023-10-31)


### Bug Fixes

* publish script, compilation error in tests ([#643](https://github.com/open-feature/js-sdk/issues/643)) ([1349bee](https://github.com/open-feature/js-sdk/commit/1349bee20c8ce02829fd7f49996a5940970a210d))

## [0.0.14](https://github.com/open-feature/js-sdk/compare/core-v0.0.13...core-v0.0.14) (2023-10-31)


### Features

* add support for clearing providers ([#578](https://github.com/open-feature/js-sdk/issues/578)) ([a3a907f](https://github.com/open-feature/js-sdk/commit/a3a907f348d7ff2ac7cd42eca61cd760fdd93048))
* extract and publish core package ([#629](https://github.com/open-feature/js-sdk/issues/629)) ([c3ee90b](https://github.com/open-feature/js-sdk/commit/c3ee90b2e0fdcec235069960e7ec03e63028b08c))

## [0.0.13](https://github.com/open-feature/js-sdk/compare/shared-v0.0.12...shared-v0.0.13) (2023-10-31)


### Features

* add support for clearing providers ([#578](https://github.com/open-feature/js-sdk/issues/578)) ([a3a907f](https://github.com/open-feature/js-sdk/commit/a3a907f348d7ff2ac7cd42eca61cd760fdd93048))

## [0.0.12](https://github.com/open-feature/js-sdk/compare/shared-v0.0.11...shared-v0.0.12) (2023-10-09)


### Features

* add support for a blocking setProvider ([#577](https://github.com/open-feature/js-sdk/issues/577)) ([d1f5049](https://github.com/open-feature/js-sdk/commit/d1f50490650da78ff7936641425b1a0614833c63))

## [0.0.11](https://github.com/open-feature/js-sdk/compare/shared-v0.0.10...shared-v0.0.11) (2023-09-22)


### Features

* add provider compatibility check ([#537](https://github.com/open-feature/js-sdk/issues/537)) ([2bc5d63](https://github.com/open-feature/js-sdk/commit/2bc5d63266424a900da523f001f425b95da29ccc))
* STALE state, minor event changes ([#541](https://github.com/open-feature/js-sdk/issues/541)) ([0b5355b](https://github.com/open-feature/js-sdk/commit/0b5355b3cf7e606f9364a110a18e1c6aeca5c230))

## [0.0.10](https://github.com/open-feature/js-sdk/compare/shared-v0.0.9...shared-v0.0.10) (2023-07-31)


### Bug Fixes

* only initialize NOT_READY providers ([#507](https://github.com/open-feature/js-sdk/issues/507)) ([5e320ae](https://github.com/open-feature/js-sdk/commit/5e320ae3811e270985e867c1c85a301eacd99a49))

## [0.0.9](https://github.com/open-feature/js-sdk/compare/shared-v0.0.8...shared-v0.0.9) (2023-07-26)


### Bug Fixes

* provider js-doc improvments  ([#506](https://github.com/open-feature/js-sdk/issues/506)) ([c815bc8](https://github.com/open-feature/js-sdk/commit/c815bc83cf7999e01baa361a0bbf1f3a579e2174))

## [0.0.8](https://github.com/open-feature/js-sdk/compare/shared-v0.0.7...shared-v0.0.8) (2023-07-22)


### Features

* typesafe event emitter ([#490](https://github.com/open-feature/js-sdk/issues/490)) ([92e3a72](https://github.com/open-feature/js-sdk/commit/92e3a724bf4e53721644c2155060b2bd44a43c39))


### Bug Fixes

* race adding handler during init ([#501](https://github.com/open-feature/js-sdk/issues/501)) ([0be9c5d](https://github.com/open-feature/js-sdk/commit/0be9c5dcd9c7f8bc76d28e94b2e80617836323e5))

## [0.0.7](https://github.com/open-feature/js-sdk/compare/shared-v0.0.6...shared-v0.0.7) (2023-07-05)


### Bug Fixes

* events on anon provider/client ([#480](https://github.com/open-feature/js-sdk/issues/480)) ([c44b18e](https://github.com/open-feature/js-sdk/commit/c44b18eb9eb6d6e828af61767b9f3e39f2cef1af))

## [0.0.6](https://github.com/open-feature/js-sdk/compare/shared-v0.0.5...shared-v0.0.6) (2023-07-04)


### Bug Fixes

* named client events ([#472](https://github.com/open-feature/js-sdk/issues/472)) ([fb69b9d](https://github.com/open-feature/js-sdk/commit/fb69b9d665172de7d79c84b36adbbcf0c315b701))

## [0.0.5](https://github.com/open-feature/js-sdk/compare/shared-v0.0.4...shared-v0.0.5) (2023-06-26)


### Bug Fixes

* various event handler issues ([1dd1e17](https://github.com/open-feature/js-sdk/commit/1dd1e17361ef85e89f858d00475830bffec4173b))

## [0.0.4](https://github.com/open-feature/js-sdk/compare/shared-v0.0.3...shared-v0.0.4) (2023-06-06)


### Features

* add init/shutdown and events ([#436](https://github.com/open-feature/js-sdk/issues/436)) ([5d55ea1](https://github.com/open-feature/js-sdk/commit/5d55ea1d08267a09f36c6b1508298646ee34616c))
* add named client support ([#429](https://github.com/open-feature/js-sdk/issues/429)) ([310c6ac](https://github.com/open-feature/js-sdk/commit/310c6ac51ee06de5db75e16b64ace150bcf55fbe))
* add support for flag metadata ([#426](https://github.com/open-feature/js-sdk/issues/426)) ([029ec26](https://github.com/open-feature/js-sdk/commit/029ec26eb255a2549abcbeba12f41d4b9e57c100))


### Bug Fixes

* only shutdown providers that are not attached to any client ([#444](https://github.com/open-feature/js-sdk/issues/444)) ([7e469c4](https://github.com/open-feature/js-sdk/commit/7e469c49cab2a26b3f402eae4807365e08cd7a62))

## [0.0.3](https://github.com/open-feature/js-sdk/compare/shared-v0.0.2...shared-v0.0.3) (2023-05-01)


### Bug Fixes

* remove events exports from server ([#413](https://github.com/open-feature/js-sdk/issues/413)) ([7cac0c8](https://github.com/open-feature/js-sdk/commit/7cac0c87abfe6d6962b7f64a58b25d76ed06d4cb))

## [0.0.2](https://github.com/open-feature/js-sdk/compare/shared-v0.0.1...shared-v0.0.2) (2023-03-09)


### Bug Fixes

* add docs to EventTypes ([e9f3d32](https://github.com/open-feature/js-sdk/commit/e9f3d3209da35f77a93d601fa74be2872d405c40))
