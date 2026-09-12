# Agent instructions

Notes for AI coding agents working in this repository. Humans may find the traps section useful too.

`@ajsf/*` is a JSON Schema form builder for Angular, published as six packages from one Angular CLI workspace: `@ajsf/core` plus the `@ajsf/material`, `@ajsf/bootstrap3`, `@ajsf/bootstrap4`, `@ajsf/bootstrap5` and `@ajsf/primeng` framework packages. All six version in lockstep.

## Environment

The repository targets **Angular 22.1 on Node 24.21.0** (`.nvmrc`) with TypeScript 6.0.
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
npm run build:libs           # build all six packages into dist/@ajsf/
npm run build:demo           # build the libraries and the demo app
npm start                    # serve the demo
npm run test:scripts         # tests for scripts/, plain jasmine, fast
npm run smoke:consumer       # install the built packages into a throwaway app
```

`smoke:consumer` needs `dist/@ajsf` (run `build:libs` first) and refuses with
the packages it is missing rather than failing inside npm. It scaffolds a new
Angular project with the CLI, packs `dist/@ajsf/*`, installs the tarballs
following the release notes for that major, and runs a production build. Pass
`--keep` to leave the project behind for inspection. The release workflow runs
it in `verify`, so a publish is gated on the packages being installable.

All six libraries run on Vitest through `@angular/build:unit-test`:

```bash
npm run test:core -- --no-watch
```

Substitute `test:bs3`, `test:bs4`, `test:bs5`, `test:material`, `test:primeng` for the
others. Add `--code-coverage` for a report.

⚠️ **Read the builder's own schema before passing a flag.** It has moved twice.
`--browsers` must be absent rather than empty: leaving it out selects jsdom.
`--no-progress` was rejected outright under Angular 20 and is accepted under
21, which added a `progress` option. Angular 21 also renamed every coverage
option, dropping the `code` prefix: `codeCoverage` became `coverage` and
`codeCoverageReporters` became `coverageReporters`. The old names do not warn,
they fail with `Data path "" must NOT have additional properties`. The schema
is at `node_modules/@angular/build/src/builders/unit-test/schema.json`.

Use `npm run coverage` rather than running the suites by hand when you want
coverage. `scripts/run-coverage.js` reads each suite's builder from
`angular.json`, removes `dist/test-out` before every suite, and stages the
reports; see Coverage for why each of those matters.

⚠️ **The suites cannot tell you whether a consumer can install the packages.**
They compile `@ajsf/core` through a tsconfig path mapping, and the workspace
pins every Angular package in one lockfile, so npm's resolution in someone
else's tree is invisible to them. 20.0.0 published needing
`npm install @angular/animations` at the exact Angular patch, which was found by
installing it into a new project. `smoke:consumer` is that check, and it packs
`dist` rather than installing from npm so it can run before a publish.

⚠️ **A `ng new` bundle budget failure is not a size regression.** The smoke
component imports all six framework packages into one bundle, which no real
consumer does, and that alone is 2.29 MB against the scaffold's 1 MB error
threshold. The script deletes the budgets for that reason. Do not chase the
number.

## Versioning

**The package major always equals the Angular major it targets.** `@ajsf/* 16.x` is for Angular 16. Minor and patch are free.

Never edit a version by hand. One script sets the version, the internal `@ajsf/core` range and the Angular peer ranges together, and hand editing them separately is how a package ships resolving to the previous core:

```bash
npm run version:set -- 16.1.0 16      # version, then the Angular major
npm run version:set -- 16.0.0-rc.1 16 # prerelease, publishes to the next dist-tag
```

It refuses to write anything when the version is malformed or when the two arguments disagree.

**A consumer visible break cannot have its own major.** The major is spent on
Angular, and `version:set` refuses a version whose major disagrees with the
Angular major it is given, so there is no `21.0.0` to put a breaking change in
while the release targets Angular 20. Such a change either ships in a minor
marked `!`, or waits for the next Angular major. The four `fix(core)!:`
changes before 19.0.0 waited; the Bootstrap 4 class corrections in 20.1.0 did
not, because the classes they replaced were not a contract (see Constraints).

## Releasing

Publishing is automated through `.github/workflows/release.yml` and npm OIDC Trusted Publishing. There is no npm token.

⚠️ **Release only when the published product changes.** A new version is for things a consumer of `@ajsf/*` can observe: widget behaviour, the public API, dependencies, supported Angular range. CI configuration, workflows, test suites, lint setup, contributor docs and internal refactors do not get a release, however large the diff. They land on `main` without touching the version and the release workflow correctly does nothing. The repository root README is the exception: `postbuild:core` ships it as the `@ajsf/core` package page (see Traps), so editing it is a product change and a patch release carries it to npm.

1. Open a PR containing only the `npm run version:set` bump.
2. Merge it. The trigger is the version **changing** in that push, so any merge that leaves it alone is a no-op. A version sitting in the repository ahead of what is on npm is fine and does not start a release.
3. The `verify` job builds, runs all six suites, ungated, and uploads `dist` as an artifact. CI has already run those suites on the same commit, but `verify` keeps them because `workflow_dispatch` reaches it with no CI run behind it.
4. Approve the `npm-publish` deployment. Nothing reaches npm before this, and by now the build is green.
5. `release` publishes the artifact `verify` built, `core` first, then the five framework packages, and tags the commit.

The `release` job deliberately runs a **newer Node than `.nvmrc`**. It publishes prebuilt tarballs and compiles nothing, but it needs an npm recent enough for OIDC, and current npm requires Node 22 or later. Pinning it to `.nvmrc` made `npm i -g npm@latest` fail with `EBADENGINE` before any publish ran.

A version containing a hyphen goes to the `next` dist-tag, everything else to `latest`. Do not create release tags by hand: the workflow writes them, so a tag always means the version shipped.

**Write `docs/release-notes/<major>.md` before promoting a major.** GitHub generates a release page from the previous tag, which for a stable release is its own last candidate, so the page would show the version bump and nothing from the series it completes. A stable release generates from the last stable tag instead and appends that file on the major's first stable release, `X.0.0`. Later releases of the same major do not repeat it. Prereleases are unaffected and keep listing what landed since the previous candidate.

There is no CHANGELOG.md and no changelog script. The release pages are the record. `conventional-changelog -p angular` was removed because it emits no BREAKING CHANGES section from a `!` subject without a `BREAKING CHANGE:` footer, and no commit in this repository has ever carried one.

## Coverage

Run it with `npm run coverage`, never by invoking the suites yourself. CI runs the
same `scripts/run-coverage.js`, so there is one implementation. It uploads to Codecov
from the `20.x` matrix leg only: both legs run the same tests on the same commit, so a
second upload is a duplicate.

⚠️ **Two things about the Vitest coverage path will mislead you, and the script exists
to handle both.**

`dist/test-out` is where the unit-test builder puts the bundle it collects V8 coverage
over, and it never cleans it. Accumulated run directories inflate the report: with 23
of them present a suite looked healthy while a clean tree produced almost nothing. The
script removes it before every suite, and `coverage:clean` removes it too.

Angular 21 writes one report per project, at `coverage/<project>/lcov.info`, so the
suites no longer overwrite each other. Until 20 they all wrote `coverage/lcov.info` and
wiped `coverage/` first, and the script staged each report outside `coverage/` to
survive that. The staging is gone; do not reintroduce it.

A `vitest.config.ts` at the root is loaded through the builder's `runnerConfig`
option. It sets `restoreMocks`, because Vitest leaves a `vi.spyOn` in place between
tests and spying on an already spied method returns the same spy, so call counts
accumulate. Four `console.error` assertions in `utility.functions.spec.ts` saw 6, 8,
12 and 14 calls where they expected 2, 2, 4 and 2. An `afterEach` in a setup file did
not hold once coverage was enabled; the runner config does.

Do not add `coverageExclude` for the `chunk-*.js` entry in the lcov. It looks like
bundling noise and is not: the source entries are remapped from that chunk, so
excluding it drops the report from 57 source files to 1.

**Codecov authenticates with OIDC, like the npm publishing flow, and there is no `CODECOV_TOKEN` in use.** `codecov-action@v7` mints a short lived credential from `id-token` and passes it to the CLI as `CC_TOKEN`. A run log reports it as a non-zero `Token length:`, so that line is how you tell a real upload from one going out tokenless, which Codecov rejects with `Token required because branch is protected`. The job has to declare `id-token: write`, because it is not in the default permission set.

This replaced a `CODECOV_TOKEN` secret. The note that used to sit here claimed the CLI ignores the OIDC credential and falls back to tokenless (`codecov-action#1461`); v7 does not do that, and the claim went unchecked because the secret was already working. Fork pull requests are the case with no credential to mint: the action derives `CC_FORK` itself and skips minting, so the step is skipped rather than left to attempt an upload that can only be rejected.

⚠️ **Never give the upload step `continue-on-error` or `fail_ci_if_error: false`.** It carried both from #361 to #370 and reported success on every run while Codecov rejected every upload with `Token required because branch is protected`. Nine pull requests merged before anyone noticed. A step that cannot fail cannot tell you it is broken.

## Linting

⚠️ **Nothing is linted.** `npm run lint` runs `ng lint`, `angular.json` has no `lint`
target, and the command exits with `Cannot find "lint" target`. tslint 6.1.3 is
installed and never invoked, and tslint itself was deprecated in 2019.

58 `tslint:disable-next-line` comments were removed in that light: they suppressed
rules nothing was running, so they read as "linted, with exceptions" when the truth
was "not linted at all".

Whoever wires up `angular-eslint` should configure two things rather than suppress
them per file, because both are deliberate:

- **Component and directive selectors have no prefix.** `checkbox-widget`,
  `material-input-widget`, `[ace-editor]`. They are public API, named in consumer
  layout schemas, and the freeze forbids renaming them, so the selector rules have
  to be configured to accept them.
- **`format-regex.constants.ts` holds six regexes past any line limit.** They cannot
  be shortened without becoming less readable.

## Constraints

- **The public API is frozen** while the Angular upgrade is in progress. Do not remove or rename any export from a `public_api.ts`. In particular `@ajsf/material` must keep exporting `FlexLayoutRootComponent` and `FlexLayoutSectionComponent`, and keep the `flex-layout-root-widget` and `flex-layout-section-widget` selectors those components declare. Consumer layout schemas reach this feature through `type` values such as `flex` and `section`, which must keep resolving. `ng-jsf-flex-layout` is a demo example schema for the feature, not a widget name.
- **Framework-emitted CSS class names are not a compatibility surface.** The
  classes a framework component appends to `htmlClass`, `labelHtmlClass` and
  `fieldHtmlClass` exist so that CSS library's own styling applies. When the
  library renames or deletes one, the correct class changes with it, and that
  is a fix rather than a break, however much consumer CSS was written against
  the old name. Decided for 20.1.0, which replaced seven Bootstrap 3 class
  names in `@ajsf/bootstrap4` in a minor. Mark such a change `!` so the
  release page says so, and table the replaced names in that package's
  README, which ships as its npm page. What is frozen is the item above:
  exports, the component selectors, and the layout `type` values that resolve
  to them.

- **`activeClass` and `style.selected` apply to the label, not the control.**
  That is what makes the toggle-button idiom work, where the label is the
  button. Since the Bootstrap 4 and 5 checkbox and radio widgets moved to
  sibling markup, the label no longer wraps the input for plain checks, so
  those two options style a label that does not contain the control.
  Redefining what they target is a consumer visible option change and needs
  its own decision, not a quiet fix.

- **Do not upgrade Angular as a side effect** of another change. Angular majors move one at a time, in their own PR.
- `@ajsf/core` uses `any` widely by design, because it processes arbitrary JSON Schema. Do not "fix" that.

## Commits and branches

- Angular commit conventions (`feat:`, `fix:`, `test:`, `build:`, `ci:`, `docs:`, `refactor:`, `chore:`). A release page lists commit subjects verbatim, so the subject is what a consumer reads. Mark a consumer visible behaviour change `!`, as in `fix(core)!:`.
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

**A release pull request describes the release, not the work being released.** The
bump carries only a version change, and every fix in it already had its own reviewed
pull request. Re-narrating them puts the reviewer's attention in the wrong place and is
how a 95 word description becomes 254. Say what publishes, at what version, and that
main was verified. Leave `## Compatibility` out unless the bump itself moves a peer
range: the notes belong on the pull request that made the change.

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

There is a third case, and Angular 22 produced it: the rendered output changed
because a dependency changed its own markup. PrimeNG 22's slider renders an
internal `<input>` that PrimeNG 21's did not, and `countControls` matches both
`p-slider` and `input`, so `primeng/jsf-fields-range` went from 1 control to 2
and `primeng/rjsf-numbers` from 8 to 10. The arithmetic is what proves it:
exactly one extra control per `range` field, one in the first schema and two in
the second. Re-recording is right there, but only with that evidence and only
for the entries that moved, never by regenerating the file.

## Traps

Each of these cost real debugging time. They look like bugs in your code and are not.

- **The framework suites test `dist/@ajsf/core`, not the core source.**
  `tsconfig.json` maps `@ajsf/core` to `dist/@ajsf/core`, so `test:material`,
  `test:primeng` and the three Bootstrap suites run whatever `build:libs` last
  wrote there, however old. A core fix can pass `test:core` and then appear not to work in a
  framework suite that is really running a week old build. Run
  `npm run build:libs` after touching core and before reading a framework
  suite's verdict. CI is immune: the workflow builds before it tests.

- **The root `README.md` is the published `@ajsf/core` README.** `postbuild:core`
  copies it into `dist/@ajsf/core`, so a change to the repository root README
  ships on the `@ajsf/core` npm page from the next publish. `@ajsf/core` has no
  `projects/ajsf-core/README.md` of its own; the other five packages copy their
  own `projects/ajsf-*/README.md`. A root README edit is a published-product
  change, not a contributor-only doc, and it reaches consumers only when a
  version publishes.

- **Every command has a second invocation path, and it is the one that rots.**
  CI was updated through the whole Vitest migration while `release.yml`,
  `npm run coverage` and `npm run stats` were not. The release job still
  restated the six suites with their Karma flags, so `20.0.0-rc.0` reached the
  release job and failed there, having passed CI on the same commit. Whenever
  you change how something is run, grep for every other caller before deciding
  you are finished. `scripts/workflow-guards.spec.js` asserts the ones that
  bit. It parses the workflows with js-yaml and reads only what the steps run:
  CI and release must run `node scripts/run-coverage.js` exactly, with no extra
  argument, since the divergence that caused the failure was arguments; no
  other path may reach the suites; no retired Karma flag survives; every
  `npm run` target exists; every binary a script calls comes from a declared
  dependency rather than merely being present in `node_modules/.bin`; and the
  release package count matches `angular.json`. Local composite actions under
  `.github/actions` are read too, and both `.yml` and `.yaml` count.

- **`npm view pkg@missing-version` exits 0** with empty stdout. Only a missing *package* exits non-zero. Any "is this published" check must test the output, not the exit code, or it reports "already published" forever.
- **`private: true` cannot be verified locally.** npm authenticates before it checks the flag, so an unauthenticated `npm publish` reports `ENEEDAUTH` whether or not the package is private, and `--dry-run` packs and exits 0 regardless. `scripts/package-guards.spec.js` asserts it instead.
- **A tag pushed with `GITHUB_TOKEN` does not trigger another workflow**, by design, to prevent recursion. Any "create a tag, let the tag start a release" design silently never runs.
- **`jasmine` is only the `test:scripts` runner, not a test framework for the libraries.** `npm run test:scripts` runs it directly over `scripts/*.spec.js` as a plain Node runner. The libraries use Vitest, so `jasmine.createSpy`, `spyOn`, `withContext`, `waitForAsync` and `done` callbacks do not work in a `projects/**` spec: use `vi.fn`, `vi.spyOn`, a message argument to `expect`, `async`/`await`, and a returned promise. `jasmine@7` also fails at run time on Node 16 with `ReferenceError: structuredClone is not defined`, which arrived in Node 17, so it stays pinned to 4.
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

- **Do not add an `@angular/*` entry to `tsconfig.json` paths.** One sat there
  from 2020 (`"@angular/*": ["./node_modules/@angular/*"]`) doing nothing under
  webpack, and broke `ng serve` the moment the application builder brought the
  Vite dev server in. A path mapping resolves Angular to an absolute file,
  which bypasses dependency prebundling, so `main.js` carried a second copy of
  the core runtime beside the prebundled one: 9.4 MB served instead of 2.4 MB.
  Two runtimes have separate instruction state, so the compiled template ran
  against an empty one and the demo failed to bootstrap with `ASSERTION ERROR:
  Array must be defined`, a blank page and no other clue. Only the dev server
  is affected, because the production build has nothing to prebundle and
  dedupes to one copy, which is why it went unnoticed. `scripts/package-guards.spec.js`
  asserts the mapping stays gone. The `@ajsf/*` mappings are fine: those point
  at `dist`, which is the intended source for them.

- **TypeScript 6 turns strict on by default, and this codebase is not strict.**
  `tsconfig.json` never set `strict` or `noImplicitAny`, which was fine while
  the default was off. Under TypeScript 6 the same file produces `TS7006:
  Parameter implicitly has an 'any' type` across `validator.functions.ts` and
  others. `@ajsf/core` uses `any` widely by design, so `tsconfig.json` now sets
  `strict: false` explicitly rather than annotating the codebase. Verify the
  default before assuming: `tsc --noEmit` on a one line file with no tsconfig
  strictness reports TS7006 under 6 and nothing under 5.9.

- **TypeScript 6 deprecates `baseUrl`, and removing it breaks `paths`.**
  `TS5101` says it stops working in 7. Dropping it then gives `TS5090:
  Non-relative paths are not allowed when 'baseUrl' is not set`, because every
  `paths` target needs a leading `./`. Both are in `tsconfig.json`, already
  fixed; the point is that the second error only appears once you fix the
  first.

- **The Angular 22 migration writes two options that contradict each other.**
  It adds an `extendedDiagnostics` block suppressing
  `nullishCoalescingNotNullable` and `optionalChainNotNullable`, and separately
  sets `strictTemplates: false`, and the compiler rejects the pair with
  `NG4003`. The suppressions only apply under strict templates, so they are the
  half to delete. It writes them into every tsconfig it touches, which is the
  six `tsconfig.lib.json`, the six `tsconfig.spec.json` and `demo/tsconfig.app.json`:
  fixing only the lib ones builds the libraries and then fails every suite.

- **`$safeNavigationMigration(...)` in a template is not a mistake.** The
  Angular 22 `safe-optional-chaining` migration wraps optional chaining
  expressions in it, 339 times across 48 files here. The compiler resolves it;
  it does not appear in built output. Do not unwrap it by hand.

- **`@angular/flex-layout` is deprecated and stops at `15.0.0-beta.42`.** It has no Angular 16 or later release and never will. Removing it is tracked work, not an incidental cleanup.
