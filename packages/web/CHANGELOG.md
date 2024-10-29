# Changelog


## [1.3.1](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.3.0...web-sdk-v1.3.1) (2024-10-29)


### 📚 Documentation

* add tracking sections ([#1068](https://github.com/open-feature/js-sdk/issues/1068)) ([e131faf](https://github.com/open-feature/js-sdk/commit/e131faffad9025e9c7194f39558bf3b3cec31807))

## [1.3.0](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.2.4...web-sdk-v1.3.0) (2024-10-29)


### ✨ New Features

* implement tracking as per spec ([#1020](https://github.com/open-feature/js-sdk/issues/1020)) ([80f182e](https://github.com/open-feature/js-sdk/commit/80f182e1afbd3a705bf3de6a0d9886ccb3424b44))


### 🧹 Chore

* import type lint rule and fixes ([#1039](https://github.com/open-feature/js-sdk/issues/1039)) ([01fcb93](https://github.com/open-feature/js-sdk/commit/01fcb933d2cbd131a0f4a005173cdd1906087e18))
* **main:** release core 1.5.0 ([#1040](https://github.com/open-feature/js-sdk/issues/1040)) ([fe3ad8e](https://github.com/open-feature/js-sdk/commit/fe3ad8eeb9219ff08ba287cab228016da0b88e88))


### 📚 Documentation

* update domain context terminology ([#1037](https://github.com/open-feature/js-sdk/issues/1037)) ([924802b](https://github.com/open-feature/js-sdk/commit/924802b21d70889631e1fb0fb02225a7f8d2638d))

## [1.2.4](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.2.3...web-sdk-v1.2.4) (2024-09-20)


### 🧹 Chore

* **web:** bump core peer version ([#1018](https://github.com/open-feature/js-sdk/issues/1018)) ([970335e](https://github.com/open-feature/js-sdk/commit/970335e92bbaa7bf093120da3fab03659b0c11bf))

## [1.2.3](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.2.2...web-sdk-v1.2.3) (2024-08-28)


### 🧹 Chore

* **main:** release core 1.4.0 ([#984](https://github.com/open-feature/js-sdk/issues/984)) ([01344b2](https://github.com/open-feature/js-sdk/commit/01344b28c1381d9de3aefde89be841b597a00b70))
* move client/ dir to web/ ([#991](https://github.com/open-feature/js-sdk/issues/991)) ([df4e72e](https://github.com/open-feature/js-sdk/commit/df4e72eabc3370801303470ca37263a0d4d9bb38))

## [1.2.2](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.2.1...web-sdk-v1.2.2) (2024-08-22)


### 🐛 Bug Fixes

* race condition in test provider with suspense ([#980](https://github.com/open-feature/js-sdk/issues/980)) ([0f187fe](https://github.com/open-feature/js-sdk/commit/0f187fe0b584e66b6283531eb7879c320967f921))

## [1.2.1](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.2.0...web-sdk-v1.2.1) (2024-06-12)


### 🐛 Bug Fixes

* **web-sdk:** pin core version to 1.3.0 ([#964](https://github.com/open-feature/js-sdk/issues/964)) ([3cde37a](https://github.com/open-feature/js-sdk/commit/3cde37a5ee29e71a0eb3fd8680b081d865a588f9))

## [1.2.0](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.1.0...web-sdk-v1.2.0) (2024-06-11)


### ✨ New Features

* lower compilation target to es2015 ([#957](https://github.com/open-feature/js-sdk/issues/957)) ([c2d6c17](https://github.com/open-feature/js-sdk/commit/c2d6c1761ae19f937deaff2f011a0380f8af7350))


### 🧹 Chore

* **main:** release core 1.3.0 ([#958](https://github.com/open-feature/js-sdk/issues/958)) ([25086c5](https://github.com/open-feature/js-sdk/commit/25086c5456d81fa040ce95ea1a067543408e3150))

## [1.1.0](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.0.3...web-sdk-v1.1.0) (2024-05-13)


### ✨ New Features

* set context during provider init on web ([#919](https://github.com/open-feature/js-sdk/issues/919)) ([7e6c1c6](https://github.com/open-feature/js-sdk/commit/7e6c1c6e7082e75535bf81b4e70c8c57ef870b77))


### 🐛 Bug Fixes

* remove export of OpenFeatureClient ([#794](https://github.com/open-feature/js-sdk/issues/794)) ([3d197f2](https://github.com/open-feature/js-sdk/commit/3d197f2ea74f00ef904fc6a6960160d0cf4ded9a))
* removes exports of OpenFeatureClient class and makes event props readonly ([#918](https://github.com/open-feature/js-sdk/issues/918)) ([e9a25c2](https://github.com/open-feature/js-sdk/commit/e9a25c21cb17c3b5700bca652e3c0ed15e8f49b4))
* run error hook when provider returns reason error or error code ([#926](https://github.com/open-feature/js-sdk/issues/926)) ([c6d0b5d](https://github.com/open-feature/js-sdk/commit/c6d0b5da9c7f4c11319422fbe8c668a7613b044d))
* skip reconciling event for synchronous onContextChange operations ([#931](https://github.com/open-feature/js-sdk/issues/931)) ([6c25f29](https://github.com/open-feature/js-sdk/commit/6c25f29f11ddb9d4ee617f1ed3f1d26be4f554ac))


### 🧹 Chore

* **main:** release core 1.2.0 ([#927](https://github.com/open-feature/js-sdk/issues/927)) ([692ad5b](https://github.com/open-feature/js-sdk/commit/692ad5b27a052a4c5abba81fe1caa071edd59ee7))


### 📚 Documentation

* add tip about supported usage in the install section ([#941](https://github.com/open-feature/js-sdk/issues/941)) ([f0de667](https://github.com/open-feature/js-sdk/commit/f0de66770be778d7a51063e706c9cccbba4b214e))

## [1.0.3](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.0.2...web-sdk-v1.0.3) (2024-04-18)


### 🧹 Chore

* bump spec version badge to v0.8.0 ([#910](https://github.com/open-feature/js-sdk/issues/910)) ([a7b2c4b](https://github.com/open-feature/js-sdk/commit/a7b2c4bca09112d49e637735466502adb1438ebe))

## [1.0.2](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.0.1...web-sdk-v1.0.2) (2024-04-02)


### 🐛 Bug Fixes

* return metadata for the bound provider in hookContext ([#883](https://github.com/open-feature/js-sdk/issues/883)) ([fd84025](https://github.com/open-feature/js-sdk/commit/fd84025bdfe30e8d730fa546d01c1ad6c6953189))


### 🧹 Chore

* **main:** release core 1.1.0 ([#899](https://github.com/open-feature/js-sdk/issues/899)) ([b3e5f7e](https://github.com/open-feature/js-sdk/commit/b3e5f7eb2aac5d5533c51764242e06a6ba508082))

## [1.0.1](https://github.com/open-feature/js-sdk/compare/web-sdk-v1.0.0...web-sdk-v1.0.1) (2024-03-25)


### 📚 Documentation

* add peer dep explainer ([#876](https://github.com/open-feature/js-sdk/issues/876)) ([cfd23b9](https://github.com/open-feature/js-sdk/commit/cfd23b90f0ca2673253fbbe30f4db585e746bc63))

## [1.0.0](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.16...web-sdk-v1.0.0) (2024-03-13)


### 🧹 Chore

* prompt web-sdk 1.0 ([#871](https://github.com/open-feature/js-sdk/issues/871)) ([7d50d93](https://github.com/open-feature/js-sdk/commit/7d50d931d5cda349a31969c997e7581ea4883b6a))

## [0.4.16](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.15...web-sdk-v0.4.16) (2024-03-12)


### 🧹 Chore

* **main:** release core 1.0.0 ([#869](https://github.com/open-feature/js-sdk/issues/869)) ([4191a02](https://github.com/open-feature/js-sdk/commit/4191a02dbc5b66053b63d19e2e9c5bf750aaf4bf))

## [0.4.15](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.14...web-sdk-v0.4.15) (2024-03-05)


### ✨ New Features

* use EvenEmitter3 for web-sdk ([#847](https://github.com/open-feature/js-sdk/issues/847)) ([861cf83](https://github.com/open-feature/js-sdk/commit/861cf8378271daf6205c5fc199ffc1bde8dfcc64))


### 🧹 Chore

* **main:** release core 0.0.28 ([#849](https://github.com/open-feature/js-sdk/issues/849)) ([31b92a9](https://github.com/open-feature/js-sdk/commit/31b92a97c19071334cb7cf10767be9d40be55943))

## [0.4.14](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.13...web-sdk-v0.4.14) (2024-03-05)


### ✨ New Features

* maintain state in SDK, add RECONCILING ([#795](https://github.com/open-feature/js-sdk/issues/795)) ([cfb0a69](https://github.com/open-feature/js-sdk/commit/cfb0a69c42bd06bf59a7b8761fd90739872a8aeb))
* suspend on RECONCILING, mem provider fixes ([#796](https://github.com/open-feature/js-sdk/issues/796)) ([8101ff1](https://github.com/open-feature/js-sdk/commit/8101ff197ff97808d14114e56aae27023f9b09f6))


### 🐛 Bug Fixes

* allow iteration over all event types ([#844](https://github.com/open-feature/js-sdk/issues/844)) ([411c7b4](https://github.com/open-feature/js-sdk/commit/411c7b4265f2029df09219028995d621bb57ad97))
* correct rollup to bundle all but core ([#846](https://github.com/open-feature/js-sdk/issues/846)) ([f451e25](https://github.com/open-feature/js-sdk/commit/f451e255bf97e9636fbb801acc0da6f6d40ad2b8))


### 🧹 Chore

* **main:** release core 0.0.27 ([#839](https://github.com/open-feature/js-sdk/issues/839)) ([ccbb1f9](https://github.com/open-feature/js-sdk/commit/ccbb1f9c9746af73bc17b43808072a678d05c371))

## [0.4.13](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.12...web-sdk-v0.4.13) (2024-02-22)


### ✨ New Features

* add support for domains ([#805](https://github.com/open-feature/js-sdk/issues/805)) ([98ba00a](https://github.com/open-feature/js-sdk/commit/98ba00a28d2f97a363c35ffce84cd8db1fa53f3f))


### 🧹 Chore

* **main:** release core 0.0.26 ([#823](https://github.com/open-feature/js-sdk/issues/823)) ([2fc38bd](https://github.com/open-feature/js-sdk/commit/2fc38bd8387ab7219eac15d8a1cf4f8da24855da))


### 📚 Documentation

* fix runsOn example on readme ([1096ae5](https://github.com/open-feature/js-sdk/commit/1096ae5d46cfcddd548c63d5a9901493dcdcf032))
* improved grammar, added punction to readme ([70bd33d](https://github.com/open-feature/js-sdk/commit/70bd33db72ce3689fc99cd6ca9833f1ee35d980f))

## [0.4.12](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.11...web-sdk-v0.4.12) (2024-01-31)


### ✨ New Features

* use interface for events ([#798](https://github.com/open-feature/js-sdk/issues/798)) ([b47b1dc](https://github.com/open-feature/js-sdk/commit/b47b1dce5b691f16d877bcac2189d95dda9d6d15))


### 🐛 Bug Fixes

* removed duped core types ([#800](https://github.com/open-feature/js-sdk/issues/800)) ([7cc1e09](https://github.com/open-feature/js-sdk/commit/7cc1e09a1118d0c541aeb5e43da74eb3983950a3))


### 🧹 Chore

* **main:** release core 0.0.25 ([#801](https://github.com/open-feature/js-sdk/issues/801)) ([53a89ab](https://github.com/open-feature/js-sdk/commit/53a89ab0ce9ec2b95a394e5b6c6569177abf5141))

## [0.4.11](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.10...web-sdk-v0.4.11) (2024-01-30)


### ✨ New Features

* adds ErrorOptions to Error constructor ([#765](https://github.com/open-feature/js-sdk/issues/765)) ([2f59a9f](https://github.com/open-feature/js-sdk/commit/2f59a9f5a81135d81d3c6cd7a14863dc21b012b4))


### 🧹 Chore

* **main:** release core 0.0.24 ([#770](https://github.com/open-feature/js-sdk/issues/770)) ([12b3b35](https://github.com/open-feature/js-sdk/commit/12b3b352760006ce7ccf5e53b4e326aedf8953bc))

## [0.4.10](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.9...web-sdk-v0.4.10) (2024-01-11)


### 🐛 Bug Fixes

* some handlers fail to run ([#753](https://github.com/open-feature/js-sdk/issues/753)) ([f4597af](https://github.com/open-feature/js-sdk/commit/f4597af79aaa04e31a61d708f03a5b5adc8a69c5))
* wrong context passed to named providers ([#752](https://github.com/open-feature/js-sdk/issues/752)) ([b6adbba](https://github.com/open-feature/js-sdk/commit/b6adbbac8ec32b1f07884e0e276ed1f278a1f547))


### 🧹 Chore

* **main:** release core 0.0.23 ([#755](https://github.com/open-feature/js-sdk/issues/755)) ([da478cb](https://github.com/open-feature/js-sdk/commit/da478cb0b0696e2c5dd594ccfce8e8236e6695cb))

## [0.4.9](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.8...web-sdk-v0.4.9) (2024-01-08)


### ✨ New Features

* add named provider metadata accessor ([#715](https://github.com/open-feature/js-sdk/issues/715)) ([23d14aa](https://github.com/open-feature/js-sdk/commit/23d14aade82d25132714fd3be108cd91c9c15f49))
* add PROVIDER_CONTEXT_CHANGED event (web-sdk only) ([#731](https://github.com/open-feature/js-sdk/issues/731)) ([7906bbe](https://github.com/open-feature/js-sdk/commit/7906bbedbdb822d39e5c620d6c8f0a5739a19e84))


### 🐛 Bug Fixes

* use in memory provider for e2e suites ([#740](https://github.com/open-feature/js-sdk/issues/740)) ([696bf4a](https://github.com/open-feature/js-sdk/commit/696bf4adb82339acf7d619cd5c831d6d11cec7c9))


### 🧹 Chore

* **main:** release core 0.0.21 ([#720](https://github.com/open-feature/js-sdk/issues/720)) ([7d1aca4](https://github.com/open-feature/js-sdk/commit/7d1aca4bf85c5ed4335d39542c39c1f9a16ab568))
* **main:** release core 0.0.22 ([#745](https://github.com/open-feature/js-sdk/issues/745)) ([a0cc855](https://github.com/open-feature/js-sdk/commit/a0cc85546d06ce66f881c5e80122206344f5c710))

## [0.4.8](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.7...web-sdk-v0.4.8) (2023-12-08)


### ✨ New Features

* ability to get current provider state ([#703](https://github.com/open-feature/js-sdk/issues/703)) ([5be715e](https://github.com/open-feature/js-sdk/commit/5be715e10b177949af488d992926ec494c54d97b))
* add evaluation context management to the web SDK ([#704](https://github.com/open-feature/js-sdk/issues/704)) ([95524f4](https://github.com/open-feature/js-sdk/commit/95524f41991bc51619c84181386851c7f5e6e21b))


### 🐛 Bug Fixes

* handlers should run immediately ([#701](https://github.com/open-feature/js-sdk/issues/701)) ([dba858b](https://github.com/open-feature/js-sdk/commit/dba858b454145c8119eff67c50dbad90b9deb4f4))

## [0.4.7](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.6...web-sdk-v0.4.7) (2023-11-27)


### 🧹 Chore

* **main:** release core 0.0.20 ([#682](https://github.com/open-feature/js-sdk/issues/682)) ([9629578](https://github.com/open-feature/js-sdk/commit/96295783692656cccdcc327b7236cfbdf8094fa5))

## [0.4.6](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.5...web-sdk-v0.4.6) (2023-11-21)


### 🐛 Bug Fixes

* make hooks in client sdk only return void ([#671](https://github.com/open-feature/js-sdk/issues/671)) ([a7d0b95](https://github.com/open-feature/js-sdk/commit/a7d0b954dcd62730d508d203e0fd5bbfe3d39813))


### ✨ New Features

* client in memory provider ([#617](https://github.com/open-feature/js-sdk/issues/617)) ([6051dfd](https://github.com/open-feature/js-sdk/commit/6051dfd5834c5f2b72bf1eb125b0f0e854d8c93b))


### 🧹 Chore

* **main:** release core 0.0.19 ([#676](https://github.com/open-feature/js-sdk/issues/676)) ([b0cbeb4](https://github.com/open-feature/js-sdk/commit/b0cbeb460cfb210d258cb7978e77f306353037d2))

## [0.4.5](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.4...web-sdk-v0.4.5) (2023-11-09)


### 🐛 Bug Fixes

* missing events bundled dep ([#660](https://github.com/open-feature/js-sdk/issues/660)) ([f0e2aa6](https://github.com/open-feature/js-sdk/commit/f0e2aa617f83ce82e6e4d244b4ad618101d45459))


### 🧹 Chore

* **main:** release core 0.0.18 ([#661](https://github.com/open-feature/js-sdk/issues/661)) ([cf7bbf0](https://github.com/open-feature/js-sdk/commit/cf7bbf063916c639878de16e54e974607a2cd7ed))

## [0.4.4](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.3...web-sdk-v0.4.4) (2023-11-03)


### 🧹 Chore

* **main:** release core 0.0.17 ([#651](https://github.com/open-feature/js-sdk/issues/651)) ([3c9fdd9](https://github.com/open-feature/js-sdk/commit/3c9fdd9e4c6b487f25494d03ed1f413d14b2ccfb))
* update spec version link ([eef0fc0](https://github.com/open-feature/js-sdk/commit/eef0fc0a3ad3dc56b7a57c1645d3ae4917477998))
* add setProviderAndWait examples ([#614](https://github.com/open-feature/js-sdk/issues/614)) ([6b3a4e3](https://github.com/open-feature/js-sdk/commit/6b3a4e3f93005d56f75a9251dcbb959dc696f1c2))


### 📚 Documentation

* extend yarn docs ([#647](https://github.com/open-feature/js-sdk/issues/647)) ([e72fc19](https://github.com/open-feature/js-sdk/commit/e72fc19da33ad3fa6bd35f5e59f35ae56876b7bd))

## [0.4.3](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.2...web-sdk-v0.4.3) (2023-10-31)


### Features

* extract and publish core package ([#629](https://github.com/open-feature/js-sdk/issues/629)) ([c3ee90b](https://github.com/open-feature/js-sdk/commit/c3ee90b2e0fdcec235069960e7ec03e63028b08c))


### Bug Fixes

* api docs links ([#645](https://github.com/open-feature/js-sdk/issues/645)) ([4ff3f0e](https://github.com/open-feature/js-sdk/commit/4ff3f0e94cd597538b18f785873cb3beb0e83ff2))

## [0.4.2](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.1...web-sdk-v0.4.2) (2023-10-31)


### Features

* add support for clearing providers ([#578](https://github.com/open-feature/js-sdk/issues/578)) ([a3a907f](https://github.com/open-feature/js-sdk/commit/a3a907f348d7ff2ac7cd42eca61cd760fdd93048))

## [0.4.1](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.4.0...web-sdk-v0.4.1) (2023-10-09)


### Features

* add provider compatibility check ([#537](https://github.com/open-feature/js-sdk/issues/537)) ([2bc5d63](https://github.com/open-feature/js-sdk/commit/2bc5d63266424a900da523f001f425b95da29ccc))
* add support for a blocking setProvider ([#577](https://github.com/open-feature/js-sdk/issues/577)) ([d1f5049](https://github.com/open-feature/js-sdk/commit/d1f50490650da78ff7936641425b1a0614833c63))
* STALE state, minor event changes ([#541](https://github.com/open-feature/js-sdk/issues/541)) ([0b5355b](https://github.com/open-feature/js-sdk/commit/0b5355b3cf7e606f9364a110a18e1c6aeca5c230))

## [0.4.0](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.11...web-sdk-v0.4.0) (2023-07-31)


### Features

* release first non-experimental version ([#528](https://github.com/open-feature/js-sdk/issues/528)) ([a4ba064](https://github.com/open-feature/js-sdk/commit/a4ba0645500ae82e4052362345e964c7ee226bb2))

## [0.3.11](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.10-experimental...web-sdk-v0.3.11) (2023-07-31)


### Bug Fixes

* only initialize NOT_READY providers ([#507](https://github.com/open-feature/js-sdk/issues/507)) ([5e320ae](https://github.com/open-feature/js-sdk/commit/5e320ae3811e270985e867c1c85a301eacd99a49))

## [0.3.10-experimental](https://github.com/open-feature/js-sdk/compare/web-sdk-v0.3.9-experimental...web-sdk-v0.3.10-experimental) (2023-07-26)


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
