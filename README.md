# OpenFeature SDK for NodeJS

![Experimental](https://img.shields.io/badge/experimental-breaking%20changes%20allowed-yellow)
![Alpha](https://img.shields.io/badge/alpha-release-red)
[![codecov](https://codecov.io/gh/open-feature/node-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY)](https://codecov.io/gh/open-feature/node-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/open-feature/node-sdk/badge.svg)](https://snyk.io/test/github/open-feature/node-sdk)

## Alpha Checklist

- [x] spec compliant
- [x] contains test suite which verifies behavior consistent with spec
- [x] contains test suite with reasonable coverage
- [x] automated publishing
- [ ] comprehensive readme

## Installation

```
$ npm install @openfeature/nodejs-sdk   // installs the latest version
```

## Development

### Installation and Dependencies

Install dependencies with `npm ci`. `npm install` will update the package-lock.json with the most recent compatible versions.

We value having as few runtime dependencies as possible. The addition of any dependencies requires careful consideration and review.

### Testing

Run tests with `npm test`.

### Packaging

Both ES modules and CommonJS modules are supported, so consumers can use both `require` and `import` functions to utilize this module. This is accomplished by building 2 variations of the output, under `dist/esm` and `dist/cjs`, respectively. To force resolution of the `dist/esm/**.js*` files as modules, a package json with only the context `{"type": "module"}` is included at a in a `postbuild` step. Type declarations are included at `/dist/types/`
