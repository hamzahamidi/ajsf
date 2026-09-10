const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const manifest = JSON.parse(read('package.json'));

const WORKFLOW_DIR = '.github/workflows';
const WORKFLOWS = fs.readdirSync(path.join(root, WORKFLOW_DIR)).filter((f) => f.endsWith('.yml'));

/**
 * A workflow with its comment lines removed.
 *
 * These files explain at length which flags were removed and why, so a scan
 * of the raw text reports the retired flags this guard exists to ban. Only
 * what the workflow actually runs counts.
 */
const workflow = (file) =>
  read(path.join(WORKFLOW_DIR, file))
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');

/** The one way to run the library suites. Anything else is a second path. */
const SUITE_RUNNER = 'node scripts/run-coverage.js';

/** Both places that run them: CI on every push, release before it publishes. */
const RUNS_THE_SUITES = ['ci.yml', 'release.yml'];

/** Binaries a script may call without being a declared dependency. */
const SHELL = new Set(['cp', 'echo', 'rm', 'mkdir', 'node', 'npm', 'npx', 'true']);

/** The leading command of each `&&` separated segment of an npm script. */
function commands(script) {
  return script.split(/&&|\|\|/)
    .map((segment) => segment.trim().split(/\s+/)[0])
    .filter(Boolean);
}

const scriptNames = Object.keys(manifest.scripts);

describe('suite invocation', () => {
  // release.yml restated the six suites with their Karma flags and kept them
  // after the move to Vitest, where --no-progress and --browsers fail schema
  // validation. 20.0.0-rc.0 got as far as the release job before anyone found
  // out, because CI had been updated through every migration and release.yml
  // never had.
  it('runs the suites through the one runner, in CI and at release', () => {
    RUNS_THE_SUITES.forEach((file) => {
      expect(workflow(file).includes(SUITE_RUNNER))
        .withContext(`${file} does not call ${SUITE_RUNNER}`)
        .toBe(true);
    });
  });

  it('restates no individual suite in a workflow', () => {
    WORKFLOWS.forEach((file) => {
      expect(workflow(file))
        .withContext(`${file} invokes a suite directly instead of the runner`)
        .not.toMatch(/\bng test\b/);
      expect(workflow(file))
        .withContext(`${file} names a single suite instead of the runner`)
        .not.toMatch(/npm run test:(core|bs3|bs4|bs5|material|primeng)\b/);
    });
  });

  it('keeps npm run coverage on the same runner', () => {
    expect(manifest.scripts.coverage).toContain(SUITE_RUNNER);
  });
});

describe('retired Karma flags', () => {
  const RETIRED = [
    ['ChromeHeadless', 'a Karma browser name; leaving --browsers out selects jsdom'],
    ['ChromiumHeadless', 'a Karma browser name; leaving --browsers out selects jsdom'],
    ['--no-progress', 'the unit-test builder has no progress option and rejects it'],
    ['--browsers', 'must be absent rather than empty, or jsdom is not selected'],
    ['karma', 'Karma is gone from this repository'],
  ];

  it('appear in no workflow', () => {
    WORKFLOWS.forEach((file) => {
      RETIRED.forEach(([token, why]) => {
        expect(workflow(file).includes(token))
          .withContext(`${file} still passes ${token}, which is ${why}`)
          .toBe(false);
      });
    });
  });

  it('appear in no npm script', () => {
    Object.entries(manifest.scripts).forEach(([name, script]) => {
      RETIRED.forEach(([token, why]) => {
        expect(script.includes(token))
          .withContext(`${name} still passes ${token}, which is ${why}`)
          .toBe(false);
      });
    });
  });
});

describe('command references', () => {
  // A workflow naming a script that was renamed fails only when that workflow
  // runs, which for the release path means at a release.
  it('resolve every npm script a workflow runs', () => {
    WORKFLOWS.forEach((file) => {
      [...workflow(file).matchAll(/npm run ([\w:-]+)/g)].forEach(([, name]) => {
        expect(scriptNames)
          .withContext(`${file} runs npm run ${name}, which does not exist`)
          .toContain(name);
      });
    });
  });

  it('resolve every npm script another script runs', () => {
    Object.entries(manifest.scripts).forEach(([name, script]) => {
      [...script.matchAll(/npm run ([\w:-]+)/g)].forEach(([, called]) => {
        expect(scriptNames)
          .withContext(`${name} runs npm run ${called}, which does not exist`)
          .toContain(called);
      });
    });
  });

  // `npm run stats` piped a production build into webpack-bundle-analyzer and
  // kept doing so after esbuild replaced webpack and the package was dropped,
  // so the script referenced a binary that was no longer installed. Running it
  // is a full production build, too slow to belong here; this asks the cheaper
  // question of whether what it calls is present.
  it('resolve every binary an npm script calls', () => {
    Object.entries(manifest.scripts).forEach(([name, script]) => {
      commands(script).forEach((command) => {
        if (SHELL.has(command)) { return; }
        expect(fs.existsSync(path.join(root, 'node_modules', '.bin', command)))
          .withContext(`${name} calls ${command}, which is not installed`)
          .toBe(true);
      });
    });
  });
});

describe('release package count', () => {
  // The publish list read "bootstrap3 bootstrap4 material" when bootstrap5 was
  // added, so the new package was skipped while the job reported success. The
  // list is derived from dist now, but the count it is checked against is
  // still written down, and a seventh package would make it wrong.
  it('matches the number of packages the workspace publishes', () => {
    const projects = Object.keys(JSON.parse(read('angular.json')).projects)
      .filter((p) => p.startsWith('@ajsf/'));
    const declared = /-ne (\d+)/.exec(workflow('release.yml'));
    expect(declared).withContext('release.yml no longer checks a package count').not.toBeNull();
    expect(Number(declared[1]))
      .withContext(`release.yml expects ${declared[1]} packages, angular.json declares ${projects.length}`)
      .toEqual(projects.length);
  });
});
