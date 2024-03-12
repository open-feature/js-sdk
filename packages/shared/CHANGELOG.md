# Changelog

## [1.1.0](https://github.com/open-feature/js-sdk/compare/core-v1.0.0...core-v1.1.0) (2024-03-12)


### ✨ New Features

* add named provider metadata accessor ([#715](https://github.com/open-feature/js-sdk/issues/715)) ([23d14aa](https://github.com/open-feature/js-sdk/commit/23d14aade82d25132714fd3be108cd91c9c15f49))
* add PROVIDER_CONTEXT_CHANGED event (web-sdk only) ([#731](https://github.com/open-feature/js-sdk/issues/731)) ([7906bbe](https://github.com/open-feature/js-sdk/commit/7906bbedbdb822d39e5c620d6c8f0a5739a19e84))
* add support for clearing providers ([#578](https://github.com/open-feature/js-sdk/issues/578)) ([a3a907f](https://github.com/open-feature/js-sdk/commit/a3a907f348d7ff2ac7cd42eca61cd760fdd93048))
* add support for domains ([#805](https://github.com/open-feature/js-sdk/issues/805)) ([98ba00a](https://github.com/open-feature/js-sdk/commit/98ba00a28d2f97a363c35ffce84cd8db1fa53f3f))
* adds ErrorOptions to Error constructor ([#765](https://github.com/open-feature/js-sdk/issues/765)) ([2f59a9f](https://github.com/open-feature/js-sdk/commit/2f59a9f5a81135d81d3c6cd7a14863dc21b012b4))
* extract and publish core package ([#629](https://github.com/open-feature/js-sdk/issues/629)) ([c3ee90b](https://github.com/open-feature/js-sdk/commit/c3ee90b2e0fdcec235069960e7ec03e63028b08c))
* maintain state in SDK, add RECONCILING ([#795](https://github.com/open-feature/js-sdk/issues/795)) ([cfb0a69](https://github.com/open-feature/js-sdk/commit/cfb0a69c42bd06bf59a7b8761fd90739872a8aeb))
* use EvenEmitter3 for web-sdk ([#847](https://github.com/open-feature/js-sdk/issues/847)) ([861cf83](https://github.com/open-feature/js-sdk/commit/861cf8378271daf6205c5fc199ffc1bde8dfcc64))
* use interface for events ([#798](https://github.com/open-feature/js-sdk/issues/798)) ([b47b1dc](https://github.com/open-feature/js-sdk/commit/b47b1dce5b691f16d877bcac2189d95dda9d6d15))


### 🐛 Bug Fixes

* add Provider Not Ready Error ([#680](https://github.com/open-feature/js-sdk/issues/680)) ([b0054f9](https://github.com/open-feature/js-sdk/commit/b0054f920dc8a36d2eab1b5fb75433405758440e))
* allow iteration over all event types ([#844](https://github.com/open-feature/js-sdk/issues/844)) ([411c7b4](https://github.com/open-feature/js-sdk/commit/411c7b4265f2029df09219028995d621bb57ad97))
* api docs links ([#645](https://github.com/open-feature/js-sdk/issues/645)) ([4ff3f0e](https://github.com/open-feature/js-sdk/commit/4ff3f0e94cd597538b18f785873cb3beb0e83ff2))
* event-handler leakage ([#788](https://github.com/open-feature/js-sdk/issues/788)) ([69c7f05](https://github.com/open-feature/js-sdk/commit/69c7f05eb48341a3b3fa3c584ccf641201bb0c6e))
* make hooks in client sdk only return void ([#671](https://github.com/open-feature/js-sdk/issues/671)) ([a7d0b95](https://github.com/open-feature/js-sdk/commit/a7d0b954dcd62730d508d203e0fd5bbfe3d39813))
* missing events bundled dep ([#660](https://github.com/open-feature/js-sdk/issues/660)) ([f0e2aa6](https://github.com/open-feature/js-sdk/commit/f0e2aa617f83ce82e6e4d244b4ad618101d45459))
* publish script, compilation error in tests ([#643](https://github.com/open-feature/js-sdk/issues/643)) ([1349bee](https://github.com/open-feature/js-sdk/commit/1349bee20c8ce02829fd7f49996a5940970a210d))
* remove events.js from core module ([#650](https://github.com/open-feature/js-sdk/issues/650)) ([14441b1](https://github.com/open-feature/js-sdk/commit/14441b1ad44d33ecc99942b0d48a49ccc50d9ee2))
* removed duped core types ([#800](https://github.com/open-feature/js-sdk/issues/800)) ([7cc1e09](https://github.com/open-feature/js-sdk/commit/7cc1e09a1118d0c541aeb5e43da74eb3983950a3))
* rm NodeJS type from core, rm react core peer ([#681](https://github.com/open-feature/js-sdk/issues/681)) ([09ff7b4](https://github.com/open-feature/js-sdk/commit/09ff7b4d99ec2bfa4ef9c18cb1845af1ca14d7b9))
* some handlers fail to run ([#753](https://github.com/open-feature/js-sdk/issues/753)) ([f4597af](https://github.com/open-feature/js-sdk/commit/f4597af79aaa04e31a61d708f03a5b5adc8a69c5))


### 🧹 Chore

* expose transaction context propagation to the server sdk only ([#590](https://github.com/open-feature/js-sdk/issues/590)) ([2cdf175](https://github.com/open-feature/js-sdk/commit/2cdf175b29a64c3dc6e828f178509d25a20730a7))
* fix grammatical issues in the readme ([aaf25d2](https://github.com/open-feature/js-sdk/commit/aaf25d269b87a569ea0788c23e6326b18d799389))
* **main:** release core 0.0.14 ([#640](https://github.com/open-feature/js-sdk/issues/640)) ([cbcb009](https://github.com/open-feature/js-sdk/commit/cbcb009836ac3d12152579c15206eee11abbae52))
* **main:** release core 0.0.15 ([#644](https://github.com/open-feature/js-sdk/issues/644)) ([5cae939](https://github.com/open-feature/js-sdk/commit/5cae93925a9301149b969e0f3872a8f865c8d1f8))
* **main:** release core 0.0.16 ([#646](https://github.com/open-feature/js-sdk/issues/646)) ([fc58318](https://github.com/open-feature/js-sdk/commit/fc583187cab6832393bdee20d02146ff520f6036))
* **main:** release core 0.0.17 ([#651](https://github.com/open-feature/js-sdk/issues/651)) ([3c9fdd9](https://github.com/open-feature/js-sdk/commit/3c9fdd9e4c6b487f25494d03ed1f413d14b2ccfb))
* **main:** release core 0.0.18 ([#661](https://github.com/open-feature/js-sdk/issues/661)) ([cf7bbf0](https://github.com/open-feature/js-sdk/commit/cf7bbf063916c639878de16e54e974607a2cd7ed))
* **main:** release core 0.0.19 ([#676](https://github.com/open-feature/js-sdk/issues/676)) ([b0cbeb4](https://github.com/open-feature/js-sdk/commit/b0cbeb460cfb210d258cb7978e77f306353037d2))
* **main:** release core 0.0.20 ([#682](https://github.com/open-feature/js-sdk/issues/682)) ([9629578](https://github.com/open-feature/js-sdk/commit/96295783692656cccdcc327b7236cfbdf8094fa5))
* **main:** release core 0.0.21 ([#720](https://github.com/open-feature/js-sdk/issues/720)) ([7d1aca4](https://github.com/open-feature/js-sdk/commit/7d1aca4bf85c5ed4335d39542c39c1f9a16ab568))
* **main:** release core 0.0.22 ([#745](https://github.com/open-feature/js-sdk/issues/745)) ([a0cc855](https://github.com/open-feature/js-sdk/commit/a0cc85546d06ce66f881c5e80122206344f5c710))
* **main:** release core 0.0.23 ([#755](https://github.com/open-feature/js-sdk/issues/755)) ([da478cb](https://github.com/open-feature/js-sdk/commit/da478cb0b0696e2c5dd594ccfce8e8236e6695cb))
* **main:** release core 0.0.24 ([#770](https://github.com/open-feature/js-sdk/issues/770)) ([12b3b35](https://github.com/open-feature/js-sdk/commit/12b3b352760006ce7ccf5e53b4e326aedf8953bc))
* **main:** release core 0.0.25 ([#801](https://github.com/open-feature/js-sdk/issues/801)) ([53a89ab](https://github.com/open-feature/js-sdk/commit/53a89ab0ce9ec2b95a394e5b6c6569177abf5141))
* **main:** release core 0.0.26 ([#823](https://github.com/open-feature/js-sdk/issues/823)) ([2fc38bd](https://github.com/open-feature/js-sdk/commit/2fc38bd8387ab7219eac15d8a1cf4f8da24855da))
* **main:** release core 0.0.27 ([#839](https://github.com/open-feature/js-sdk/issues/839)) ([ccbb1f9](https://github.com/open-feature/js-sdk/commit/ccbb1f9c9746af73bc17b43808072a678d05c371))
* **main:** release core 0.0.28 ([#849](https://github.com/open-feature/js-sdk/issues/849)) ([31b92a9](https://github.com/open-feature/js-sdk/commit/31b92a97c19071334cb7cf10767be9d40be55943))
* **main:** release shared 0.0.13 ([#634](https://github.com/open-feature/js-sdk/issues/634)) ([ac7b43f](https://github.com/open-feature/js-sdk/commit/ac7b43fafb1af045459de25325ac1391520458f8))
* release/use 1.0 core ([#859](https://github.com/open-feature/js-sdk/issues/859)) ([307b9c5](https://github.com/open-feature/js-sdk/commit/307b9c5526d1ffd940a7889fd128d0ae54334ca3))
* remove unused source file from tsconfig ([#612](https://github.com/open-feature/js-sdk/issues/612)) ([8e873a3](https://github.com/open-feature/js-sdk/commit/8e873a3d2b6b2ada0ce7913a00ee1988226a7e05))

## [1.0.0](https://github.com/open-feature/js-sdk/compare/core-v0.0.28...core-v1.0.0) (2024-03-11)

### No changes

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
