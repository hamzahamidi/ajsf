# Agent instructions

Notes for AI coding agents working in this repository. Humans may find the traps section useful too.

`@ajsf/*` is a JSON Schema form builder for Angular, published as four packages from one Angular CLI workspace: `@ajsf/core` plus the `@ajsf/material`, `@ajsf/bootstrap3` and `@ajsf/bootstrap4` framework packages. All four version in lockstep.

## Environment

The repository targets **Angular 14.2 on Node 16.13.2** (`.nvmrc`) with TypeScript 4.7.

⚠️ **`nvm use` does not stick unless nvm is sourced with `--no-use`.** Without it the shell keeps the default Node and everything still appears to work, so a build or an install silently runs on the wrong version. Start every shell that touches the toolchain with:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh" --no-use
nvm use 16.13.2
```

## Commands

```bash
npm ci                       # install
npm run build:libs           # build all four packages into dist/@ajsf/
npm run build:demo           # build the libraries and the demo app
npm start                    # serve the demo
npm run test:scripts         # tests for scripts/, plain jasmine, fast
npm run changelog            # regenerate CHANGELOG.md from commit messages
```

Library tests need the headless launcher flags:

```bash
npm run test:core -- --no-watch --no-progress --browsers=ChromeHeadlessCI
```

Substitute `test:bs3`, `test:bs4`, `test:material` for the other three.

## Versioning

**The package major always equals the Angular major it targets.** `@ajsf/* 16.x` is for Angular 16. Minor and patch are free.

Never edit a version by hand. One script sets the version, the internal `@ajsf/core` range and the Angular peer ranges together, and hand editing them separately is how a package ships resolving to the previous core:

```bash
npm run version:set -- 16.1.0 16      # version, then the Angular major
npm run version:set -- 16.0.0-rc.1 16 # prerelease, publishes to the next dist-tag
```

It refuses to write anything when the version is malformed or when the two arguments disagree.

## Releasing

Publishing is automated through `.github/workflows/release.yml` and npm OIDC Trusted Publishing. There is no npm token.

⚠️ **Release only when the published product changes.** A new version is for things a consumer of `@ajsf/*` can observe: widget behaviour, the public API, dependencies, supported Angular range. CI configuration, workflows, test suites, lint setup, contributor docs and internal refactors do not get a release, however large the diff. They land on `main` without touching the version and the release workflow correctly does nothing.

1. Open a PR containing only the `npm run version:set` bump.
2. Merge it. The trigger is the version **changing** in that push, so any merge that leaves it alone is a no-op. A version sitting in the repository ahead of what is on npm is fine and does not start a release.
3. The `verify` job builds and runs all four suites, ungated, and uploads `dist` as an artifact.
4. Approve the `npm-publish` deployment. Nothing reaches npm before this, and by now the build is green.
5. `release` publishes the artifact `verify` built, `core` first, then the three framework packages, and tags the commit.

The `release` job deliberately runs a **newer Node than `.nvmrc`**. It publishes prebuilt tarballs and compiles nothing, but it needs an npm recent enough for OIDC, and current npm requires Node 22 or later. Pinning it to `.nvmrc` made `npm i -g npm@latest` fail with `EBADENGINE` before any publish ran.

A version containing a hyphen goes to the `next` dist-tag, everything else to `latest`. Do not create release tags by hand: the workflow writes them, so a tag always means the version shipped.

## Constraints

- **The public API is frozen** while the Angular upgrade is in progress. Do not remove or rename any export from a `public_api.ts`. In particular `@ajsf/material` must keep exporting `FlexLayoutRootComponent` and `FlexLayoutSectionComponent`, and the `flex-layout-root-widget`, `flex-layout-section-widget` selectors and the `ng-jsf-flex-layout` widget name must keep working. They appear in consumer layout schemas.
- **Do not upgrade Angular as a side effect** of another change. Angular majors move one at a time, in their own PR.
- `@ajsf/core` uses `any` widely by design, because it processes arbitrary JSON Schema. Do not "fix" that.

## Commits and branches

- Angular commit conventions (`feat:`, `fix:`, `test:`, `build:`, `ci:`, `docs:`, `refactor:`, `chore:`). `npm run changelog` parses them.
- **Never add `Co-Authored-By` or any agent attribution** to a commit message or a branch name.
- Base branch is `main`.
- Explain why in the commit body, not what. The diff already says what.
- **Use SSH for git operations**, not HTTPS. `origin` is `git@github.com:hamzahamidi/ajsf.git`. An HTTPS push of anything under `.github/workflows/` is rejected unless the OAuth token carries the `workflow` scope, which the `gh` login does not have by default. SSH is not subject to that.

## Writing style

- **Never use a dash character as punctuation.** No em dashes, no en dashes. Use a colon or parentheses.
- Plain and direct. Concrete numbers rather than adjectives.
- Avoid: ensure, leverage, comprehensive, robust, seamless, optimize, overall, ultimately, additionally, furthermore, moreover.
- State a build or test result only if you ran it. Otherwise say it is unverified.

## Not committed

`docs/superpowers/` holds generated design and planning documents. It is gitignored on purpose. Do not add it.

## Traps

Each of these cost real debugging time. They look like bugs in your code and are not.

- **`npm view pkg@missing-version` exits 0** with empty stdout. Only a missing *package* exits non-zero. Any "is this published" check must test the output, not the exit code, or it reports "already published" forever.
- **`private: true` cannot be verified locally.** npm authenticates before it checks the flag, so an unauthenticated `npm publish` reports `ENEEDAUTH` whether or not the package is private, and `--dry-run` packs and exits 0 regardless. `scripts/package-guards.spec.js` asserts it instead.
- **A tag pushed with `GITHUB_TOKEN` does not trigger another workflow**, by design, to prevent recursion. Any "create a tag, let the tag start a release" design silently never runs.
- **`jasmine@7` installs on Node 16 and then fails at run time** with `ReferenceError: structuredClone is not defined`, which arrived in Node 17. The repository pins jasmine 4. The same applies to `conventional-changelog-cli`, pinned to v4 because v5 needs Node 18.
- **`@angular/flex-layout` is deprecated and stops at `15.0.0-beta.42`.** It has no Angular 16 or later release and never will. Removing it is tracked work, not an incidental cleanup.
