# Contributing to ajsf

ajsf is an open project and welcomes contributions. These guidelines are provided to help you understand how the project works and to make contributing smooth and fun for everybody involved.

There are two main forms of contribution: reporting issues and performing code changes.

## Reporting Issues

If you find a problem with ajsf, report it using [GitHub issues](https://github.com/hamzahamidi/ajsf/issues/new).

Before reporting a new issue, please take a moment to check whether it has already been reported
[here](https://github.com/hamzahamidi/ajsf/issues). If this is the case, please:

- Read all the comments to confirm that it's the same issue you're having.
- Refrain from adding "same thing here" or "+1" comments. Just hit the
  "subscribe" button to get notifications for this issue.
- Add a comment only if you can provide helpful information that has not been
  provided in the discussion yet.

When creating a new issue, make sure you include:

1. As much detail as possible about your setup/environment
1. Steps to reproduce the issue/bug
1. What you expected to happen
1. What happened instead

This information will help to determine the cause and prepare a fix as fast as possible.

## Code Changes

Code contributions come in various forms and sizes, from simple bug fixes to implementation
of new features.

To send your code change, use GitHub pull requests. The workflow is as follows:

  1. Fork the project.

  1. Create a branch based on `main`.

  1. Implement your change, including tests and documentation.

  1. Run tests to make sure your change didn't break anything.

  1. Publish the branch and create a pull request.

  1. ajsf developers will review your change and possibly point out issues.
     Adapt the code under their guidance until all issues are resolved.

  1. Finally, the pull request will get merged or rejected.

See also [GitHub's guide on contributing](https://help.github.com/articles/fork-a-repo).

If you want to do multiple unrelated changes, use separate branches and pull
requests.

### Start the development environment

Let's first generate all the bundles we need to start the demo:

```bash
$ cd ajsf
$ yarn install or npm install
$ yarn start
```

You can stop the demo application.
The tricky part now is to run concurrently both the demo application & the library in watch mode.
So, first choose which library you want to change then run `$ ng build @ajsf/core --watch` for example
to build in watch mode the `@ajsf/core`.
Now let's start the demo application in watch mode too. So, open a new terminal and run `$ ng serve` and there you go.
This method is tricky but it works perfectly in all environments (I tried other methods like npm-run-all
or concurrently packages but angular-cli build doesn't restart after a failed build).
If you have a better method please send a PR.

### Commits

Each commit in the pull request should do only one thing, which is clearly
described by its commit message. Especially avoid mixing formatting changes and
functional changes into one commit. When writing commit messages, adhere to
[Angular Conventional Commit](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines).

#### Commit Message Format
Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

Any line of the commit message cannot be longer than 100 characters! This allows the message to be easier
to read on GitHub as well as in various git tools.

The footer should contain a [closing reference to an issue](https://help.github.com/articles/closing-issues-via-commit-messages/) if any.

```markdown
docs(changelog): update changelog to beta.5
```

```markdown
fix(release): need to depend on latest rxjs and zone.js

The version in our package.json gets copied to the one we publish, and users need the latest of these.
```

#### Type

Must be one of the following:

* **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* **ci**: Changes to our CI configuration files and scripts (example scopes: Circle, BrowserStack, SauceLabs)
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test**: Adding missing tests or correcting existing tests

#### Scope

The scope should be the name of the npm package affected (as perceived by the person reading the changelog generated from commit messages).

The following is the list of supported scopes:

* **ajsf/core**
* **ajsf/bs3**
* **ajsf/bs4**
* **ajsf/material**
* **locales**
* **demo**
* ...

When the commit fixes a bug, put a message in the body of the commit message
pointing to the number of the issue (e.g. "Fixes #123").

### Pull requests and branches

All work happens in branches. The main branch is only used as the target for pull
requests.

During code review you often need to update pull requests. Usually you do that
by pushing additional commits.

In some cases where the commit history of a pull request gets too cumbersome to
review or you need bigger changes in the way you approach a problem which needs
changing of commits you already did it's more practical to create a new pull
request. This new pull request often will contain squashed versions of the
previous pull request. Use that to clarify the changes contained in a pull
request and to make review easier.

When you replace a pull request by another one, add a message in the
description of the new pull request on GitHub referencing the pull request it
replaces (e.g. "Supersedes #123").
