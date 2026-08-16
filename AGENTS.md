# Agent instructions

Notes for AI coding agents working in this repository. Humans may find the traps section useful too.

`@ajsf/*` is a JSON Schema form builder for Angular, published as five packages from one Angular CLI workspace: `@ajsf/core` plus the `@ajsf/material`, `@ajsf/bootstrap3`, `@ajsf/bootstrap4` and `@ajsf/bootstrap5` framework packages. All five version in lockstep.

## Environment

The repository targets **Angular 17.3 on Node 18.17.1** (`.nvmrc`) with TypeScript 5.4.
Read the version out of `.nvmrc` rather than typing it: it moves with each
Angular major, and an older Node fails the build with a CLI version check
rather than anything that points at the real cause.

⚠️ **`nvm use` does not stick unless nvm is sourced with `--no-use`.** Without it the shell keeps the default Node and everything still appears to work, so a build or an install silently runs on the wrong version. Start every shell that touches the toolchain with:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh" --no-use
nvm use "$(cat .nvmrc)"
```

## Commands

```bash
npm ci                       # install
npm run build:libs           # build all five packages into dist/@ajsf/
npm run build:demo           # build the libraries and the demo app
npm start                    # serve the demo
npm run test:scripts         # tests for scripts/, plain jasmine, fast
npm run changelog            # regenerate CHANGELOG.md from commit messages
```

Library tests need the headless launcher flags:

```bash
npm run test:core -- --no-watch --no-progress --browsers=ChromeHeadlessCI
```

Substitute `test:bs3`, `test:bs4`, `test:bs5`, `test:material` for the others.

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
3. The `verify` job builds and runs all five suites, ungated, and uploads `dist` as an artifact.
4. Approve the `npm-publish` deployment. Nothing reaches npm before this, and by now the build is green.
5. `release` publishes the artifact `verify` built, `core` first, then the three framework packages, and tags the commit.

The `release` job deliberately runs a **newer Node than `.nvmrc`**. It publishes prebuilt tarballs and compiles nothing, but it needs an npm recent enough for OIDC, and current npm requires Node 22 or later. Pinning it to `.nvmrc` made `npm i -g npm@latest` fail with `EBADENGINE` before any publish ran.

A version containing a hyphen goes to the `next` dist-tag, everything else to `latest`. Do not create release tags by hand: the workflow writes them, so a tag always means the version shipped.

## Coverage

Karma writes `html`, `lcov` and `text-summary` into `coverage/<project>` for all five libraries. CI uploads them to Codecov from the `20.x` matrix leg only: both legs run the same tests on the same commit, so a second upload is a duplicate.

**Codecov authenticates with the `CODECOV_TOKEN` secret, not OIDC**, which is deliberate and differs from the npm publishing flow. `codecov/codecov-action` does accept `use_oidc: true`, but the CLI has a reported failure mode where it ignores the OIDC credential, falls back to tokenless and then fails on a rate limit (`codecov-action#1461`, closed with no stated fix), and fork pull requests receive no `id-token` at all. The token is the predictable option. Do not switch this to OIDC without confirming an upload actually lands.

⚠️ **Never give the upload step `continue-on-error` or `fail_ci_if_error: false`.** It carried both from #361 to #370 and reported success on every run while Codecov rejected every upload with `Token required because branch is protected`. Nine pull requests merged before anyone noticed. A step that cannot fail cannot tell you it is broken.

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
- Pull request descriptions follow a fixed shape. See below.

## Pull request descriptions

Use these four headings, in this order, as plain prose:

```markdown
## Summary

One or two sentences: what this does, and why it exists.

## Changes

What changed, in paragraphs. Group related edits into one sentence rather
than listing every file.

## Release impact

Whether this publishes, at what version, and why. Say plainly when there
is no release.

## Validation

What was run and what it reported. Past tense, concrete numbers.
```

Add `## Compatibility` when the public API or a consumer visible option is involved.

**Target 100 to 150 words.** PRs #361 to #372 run 96 to 156 after being rewritten by hand; the originals averaged 314 and were called out as much longer than needed.

⚠️ **No tables, no code fences, no warning symbols, no bold mid-sentence.** All twelve rewritten descriptions contain zero of each. Before and after output, version tables and command transcripts belong in the commit body or a review comment, not here.

Third person and declarative: "Removes the deprecated dependency", not "I removed" or "This PR removes". A reviewer reads the description to decide where to look, not instead of looking.

## Code comments

The default is no comment. Add one only for information the code cannot express: an invariant that is not obvious, an external contract, a compatibility constraint or an intentional limitation.

Before keeping a comment, all four statements must be true:

1. A clearer name, type, helper or test cannot replace it.
2. It explains why the code has to work this way. It does not narrate the next line.
3. It describes the current code without relying on the pull request or its history.
4. It fits in one short sentence. If it needs a paragraph, simplify the code or move the context to the commit body or documentation.

Delete comments about previous implementations, fixed bugs, debugging history, test results, line percentages and facts visible in the code. Keep public API documentation and short warnings whose removal could lead to a correctness bug.

## Not committed

`docs/superpowers/` holds generated design and planning documents. It is gitignored on purpose. Do not add it.

## When behaviour differs, work out which side is wrong

A difference between your change and what was there before is not automatically your regression. Study both possibilities before "fixing" it, because the two need opposite responses:

- **You broke it.** Fix your change. Example: replacing `fxFlex` lost the `box-sizing: border-box` that directive applied, so `mat-card` padding pushed each column 32px wider and the page scrolled sideways. Production had no overflow, so the new behaviour was wrong.
- **You fixed something that was already broken.** Keep it, say so, and update whatever pinned the old behaviour. Example: `getFlexAttribute('layout')` read `(a || 'row') + b ? ' ' + b : ''`. `+` binds tighter than `?:`, so it always returned `' ' + fxLayoutWrap` and `fxLayout: 'column'` evaluated to `" undefined"`. That option had never worked.

The corpus baseline pins **current** behaviour including bugs, so a corpus failure can mean either. Read the diff before deciding, and never re-record a baseline just to make a suite green.

## Traps

Each of these cost real debugging time. They look like bugs in your code and are not.

- **`npm view pkg@missing-version` exits 0** with empty stdout. Only a missing *package* exits non-zero. Any "is this published" check must test the output, not the exit code, or it reports "already published" forever.
- **`private: true` cannot be verified locally.** npm authenticates before it checks the flag, so an unauthenticated `npm publish` reports `ENEEDAUTH` whether or not the package is private, and `--dry-run` packs and exits 0 regardless. `scripts/package-guards.spec.js` asserts it instead.
- **A tag pushed with `GITHUB_TOKEN` does not trigger another workflow**, by design, to prevent recursion. Any "create a tag, let the tag start a release" design silently never runs.
- **`jasmine@7` installs on Node 16 and then fails at run time** with `ReferenceError: structuredClone is not defined`, which arrived in Node 17. The repository pins jasmine 4. The same applies to `conventional-changelog-cli`, pinned to v4 because v5 needs Node 18.
- **`ng update` on a partial package list resolves inconsistently, and `--force` hides it.** Updating only `@angular/core`, `cli`, `material` and `cdk` leaves every other `@angular/*` package free to resolve on its own, and they land on the *next* major. On the Angular 16 step, with `--force`, that produced a mixed tree: `@angular/core` at `16.2.12` beside `@angular/common` and `@angular/compiler-cli` at `17.3.12`, TypeScript on an Angular 17 range, and `error TS2305: Module '"@angular/core"' has no exported member 'ɵIMAGE_CONFIG'`. Without `--force` the same partial list simply fails, which is the better outcome.

  **Name every `@angular/*` package on the command line and `--force` is not needed.** Read them out of `package.json` rather than typing a list from memory:

  ```bash
  npx ng update $(node -p "const p=require('./package.json');
    Object.keys({...p.dependencies,...p.devDependencies})
      .filter(n=>n.startsWith('@angular')).map(n=>n+'@18').join(' ')")
  ```

  Afterwards, compare installed against declared and run bare `ng update` to confirm nothing is still pending for the major you just crossed:

  ```bash
  node -e "const p=require('./package.json'),d={...p.dependencies,...p.devDependencies};
    Object.keys(d).filter(n=>/^@angular|^(typescript|ng-packagr|zone\.js)$/.test(n)).sort()
    .forEach(n=>console.log(n.padEnd(34),String(d[n]).padEnd(14),'->',require('./node_modules/'+n+'/package.json').version))"
  ```

- ⚠️ **OIDC cannot perform a package's first publish.** npm will not let you configure a trusted publisher for a package that does not exist yet, and there is no token in this repository, so the release workflow cannot create one. Adding a fifth package therefore fails at its own publish step while the four existing ones succeed. Before the first release that contains a new package, publish a placeholder from a machine with an npm login:

  ```bash
  # from a directory containing only a minimal package.json for the new name
  npm publish --access public          # version 0.0.0, never used by anyone
  npm deprecate "@ajsf/<name>@0.0.0" "Placeholder only, not a usable release."
  ```

  **Deprecate it straight away.** npm claims the `latest` dist-tag on a package's first publish whatever `--tag` says, so `latest` ends up on the empty stub and `npm install @ajsf/<name>` returns it. `latest` cannot be removed, only moved by a later stable release, and a release candidate goes to `next` rather than `latest`, so the stub can sit there for a while. Deprecating makes npm print a warning on install in the meantime.

  Then add the trusted publisher at `npmjs.com/package/<name>/access` with publisher GitHub Actions, organisation `hamzahamidi`, repository `ajsf`, workflow `release.yml`, environment `npm-publish` (it must match `environment:` in the release job), and only the `npm publish` permission. The workflow takes over from the next version onwards.

  Check whether a package still needs this with `npm view @ajsf/<name> version --prefer-online`. Do not trust a plain registry fetch straight after publishing: it returns 404 for several minutes while the package propagates, which looks exactly like a failed publish.

- **`@angular/flex-layout` is deprecated and stops at `15.0.0-beta.42`.** It has no Angular 16 or later release and never will. Removing it is tracked work, not an incidental cleanup.
