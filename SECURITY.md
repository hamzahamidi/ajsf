# Security policy

## Supported versions

This policy covers the six packages published from this repository:
`@ajsf/core`, `@ajsf/material`, `@ajsf/primeng`, `@ajsf/bootstrap3`,
`@ajsf/bootstrap4` and `@ajsf/bootstrap5`. They version in lockstep, so a fix
in any one of them ships as a release of all six.

The package major matches the Angular major it targets, and every release is
cut from `main`, which tracks the newest Angular major. Security fixes
therefore ship in the next release cut from `main`. Usually that is a minor or
patch release of the major on the npm `latest` dist-tag, which
`npm view @ajsf/core version` prints.

While a release candidate series is open, `main` is ahead of `latest`: it
carries a candidate such as `19.0.0-rc.3` on the `next` dist-tag, and only the
stable release that closes the series moves `latest`. A fix made in that
window ships as the next candidate on `next` and then in that stable release,
with no release for the version on `latest` in between.
`npm view @ajsf/core dist-tags` shows both tags, and `next` keeps its last
candidate after the series closes.

There are no maintenance branches, so fixes are not backported. That includes
the earlier `@ajsf/*` majors, `0.8.0` and earlier, a release candidate that a
later candidate or a stable release has replaced, and the older
`angular6-json-schema-form` package. To pick up a fix on an older Angular
major, upgrade to the current one.

A report against an older version is still welcome. If the flaw is present in
the current major, the fix lands there.

## Reporting a vulnerability

Do not open a public issue, pull request or discussion for a vulnerability. A
public report exposes every user of the packages before a fix exists.

Report it privately through GitHub private vulnerability reporting:

1. Open the [Security tab](https://github.com/hamzahamidi/ajsf/security) of
   this repository.
2. Select **Report a vulnerability**. The form is also reachable directly at
   <https://github.com/hamzahamidi/ajsf/security/advisories/new>.
3. Describe the problem and submit the form.

A useful report includes:

- the affected package and version, and the Angular version in use
- a schema, layout or data object that triggers the problem, or the steps to
  reproduce it
- what an attacker gains, for example script execution in the page that
  renders the form

## What happens after a report

Submitting the form opens a draft GitHub security advisory that only you and
the repository maintainers can see. A maintainer acknowledges the report
there, and the follow-up stays in that advisory: confirming the problem,
agreeing on its severity and working on the fix, which can be prepared in the
advisory's temporary private fork.

The fix ships as a new release through the normal release workflow, and the
advisory is published once that release is on npm.

If the report turns out not to be a vulnerability, a maintainer explains why
in the advisory and closes it.
