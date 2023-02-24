# Contributing

## Development

### System Requirements

node 16+, npm 8+ are recommended.

### Compilation target(s)

We target `es2015`, and publish both ES-modules and CommonJS modules.

### Installation and Dependencies

Install dependencies with `npm ci`. `npm install` will update the package-lock.json with the most recent compatible versions.

We value having as few runtime dependencies as possible. The addition of any dependencies requires careful consideration and review.

### Testing

Run tests with `npm test`.

### Integration tests

The continuous integration runs a set of [gherkin integration tests](https://github.com/open-feature/test-harness/blob/main/features/evaluation.feature) using [`flagd`](https://github.com/open-feature/flagd). These tests run with the "integration" npm script. If you'd like to run them locally, you can start the flagd testbed with
```
docker run -p 8013:8013 ghcr.io/open-feature/flagd-testbed:latest
```
and then run
```
npm run integration
```

### Packaging

Both ES modules and CommonJS modules are supported, so consumers can use both `require` and `import` functions to utilize this module. This is accomplished by building 2 variations of the output, under `dist/esm` and `dist/cjs`, respectively. To force resolution of the `dist/esm/**.js*` files as modules, a package json with only the context `{"type": "module"}` is included at a in a `postbuild` step. Type declarations are included at `/dist/types/`

For testing purposes, you can add a comment containing "/publish" in any PR. This will publish an experimental SDK version with the git SHA appended to the version number.

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
git add .
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
