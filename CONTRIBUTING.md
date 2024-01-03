# Contributing

## Development

### System Requirements

node 16+, npm 8+ are recommended.

### Compilation Target(s)

We target `es2015`, and publish both ES-modules and CommonJS modules.

### Installation and Dependencies

Install dependencies with `npm ci`. `npm install` will update the package-lock.json with the most recent compatible versions.

We value having as few runtime dependencies as possible. The addition of any dependencies requires careful consideration and review.

### Modules

This repository uses [NPM workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces) to establish a simple monorepo.
Within the root project, there is one common project (`packages/shared`) which features common interfaces and code, consumed by the published modules (`packages/server` and `packages/client`).
The shared module is built and published separately, and is a peer dependency of the SDK packages.
Consumers need not install it separately, since `npm` and `yarn` automatically install required peers.
In order to prevent regressions cause by incompatibilities due to version mismatches, the SDKs are locked to a particular version of the `@openfeature/core` module, and the CI enforces that it's released before any dependant SDKs (see [the related workflow](./.github/workflows/audit-pending-releases.yml)).

### Testing

Run tests with `npm test`.

### End-to-End Tests

The continuous integration runs a set of [gherkin e2e tests](https://github.com/open-feature/test-harness/blob/main/features/evaluation.feature) using in-memory provider. These tests run with the "e2e" npm script. If you'd like to run them locally, follow the steps below:
```
npm run e2e-server
```
for the server e2e tests and
```
npm run e2e-client
```
for the client e2e tests.

### Packaging

Both ES modules and CommonJS modules are supported, so consumers can use both `require` and `import` functions to utilize this module. This is accomplished by building 2 variations of the output, under `dist/esm` and `dist/cjs`, respectively. To force resolution of the `dist/esm/**.js*` files as modules, a package json with only the context `{"type": "module"}` is included at a in a `postbuild` step. Type declarations are included at `/dist/types/`

## Pull Request

All contributions to the OpenFeature project are welcome via GitHub pull requests.

To create a new PR, you will need to first fork the GitHub repository and clone upstream.

```bash
git clone https://github.com/open-feature/js-sdk.git openfeature-js-sdk
```

Navigate to the repository folder

```bash
cd openfeature-js-sdk
```

Add your fork as an origin

```bash
git remote add fork https://github.com/YOUR_GITHUB_USERNAME/js-sdk.git
```

Makes sure your development environment is all setup by building and testing

```bash
npm install
npm test
```

To start working on a new feature or bugfix, create a new branch and start working on it.

```bash
git checkout -b feat/NAME_OF_FEATURE
# Make your changes
git add --all
git commit --signoff
git push fork feat/NAME_OF_FEATURE
```

Open a pull request against the main js-sdk repository.

### How to Receive Comments

- If the PR is not ready for review, please mark it as
  [`draft`](https://github.blog/2019-02-14-introducing-draft-pull-requests/).
- Make sure all required CI checks are clear.
- Submit small, focused PRs addressing a single concern/issue.
- Make sure the PR title reflects the contribution.
- Write a summary that helps understand the change.
- Include usage examples in the summary, where applicable.

### How to Get PRs Merged

A PR is considered to be **ready to merge** when:

- Major feedback is resolved.
- Urgent fix can take exception as long as it has been actively communicated.

Any Maintainer can merge the PR once it is **ready to merge**. Note, that some
PRs may not be merged immediately if the repo is in the process of a release and
the maintainers decided to defer the PR to the next release train.

If a PR has been stuck (e.g. there are lots of debates and people couldn't agree
on each other), the owner should try to get people aligned by:

- Consolidating the perspectives and putting a summary in the PR. It is
  recommended to add a link into the PR description, which points to a comment
  with a summary in the PR conversation.
- Tagging domain experts (by looking at the change history) in the PR asking
  for suggestion.
- Reaching out to more people on the [CNCF OpenFeature Slack channel](https://cloud-native.slack.com/archives/C0344AANLA1).
- Stepping back to see if it makes sense to narrow down the scope of the PR or
  split it up.
- If none of the above worked and the PR has been stuck for more than 2 weeks,
  the owner should bring it to the OpenFeatures [meeting](README.md#contributing).

## Design Choices

As with other OpenFeature SDKs, js-sdk follows the
[openfeature-specification](https://github.com/open-feature/spec).
