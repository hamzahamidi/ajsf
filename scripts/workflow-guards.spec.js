const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const manifest = JSON.parse(read('package.json'));
const declaredDependencies = { ...manifest.dependencies, ...manifest.devDependencies };

/**
 * Every file that defines steps GitHub will run: the workflows and any local
 * composite action, which is the other place a stale command can hide.
 */
function definitionFiles() {
  const files = [];
  const workflows = path.join(root, '.github/workflows');
  if (fs.existsSync(workflows)) {
    fs.readdirSync(workflows)
      .filter((f) => /\.ya?ml$/.test(f))
      .forEach((f) => files.push(path.posix.join('.github/workflows', f)));
  }
  const actions = path.join(root, '.github/actions');
  if (fs.existsSync(actions)) {
    fs.readdirSync(actions).forEach((entry) => {
      ['action.yml', 'action.yaml'].forEach((name) => {
        const file = path.posix.join('.github/actions', entry, name);
        if (fs.existsSync(path.join(root, file))) { files.push(file); }
      });
    });
  }
  return files;
}

/**
 * The shell each file actually runs.
 *
 * Parsed rather than scanned, because the raw text is the wrong layer twice
 * over. These files explain at length which flags were removed, and the first
 * version of this guard reported those explanations as violations. A folded
 * scalar breaks the opposite way: `run: >` puts a newline inside what runs as
 * one command, so a text match for it finds nothing.
 */
function runSteps(file) {
  const doc = yaml.load(read(file)) || {};
  const steps = [];
  Object.values(doc.jobs || {}).forEach((job) => steps.push(...((job && job.steps) || [])));
  steps.push(...((doc.runs && doc.runs.steps) || []));
  return steps.filter((step) => step && typeof step.run === 'string').map((step) => step.run);
}

const FILES = definitionFiles();
const everyRun = FILES.flatMap((file) => runSteps(file).map((run) => [file, run]));

const CANONICAL = 'node scripts/run-coverage.js';
const RUNS_THE_SUITES = ['.github/workflows/ci.yml', '.github/workflows/release.yml'];
const scriptNames = Object.keys(manifest.scripts);

describe('suite invocation', () => {
  // release.yml restated the six suites with their Karma flags and kept them
  // after the move to Vitest, so 20.0.0-rc.0 passed CI and then failed in the
  // release job on the same commit.
  //
  // Equality, not inclusion: the divergence that caused it was arguments, and
  // a release-only flag appended to the canonical command would reproduce it
  // while still containing the command.
  it('runs the suites through the one runner, with no extra arguments', () => {
    RUNS_THE_SUITES.forEach((file) => {
      const exact = runSteps(file).map((run) => run.trim()).filter((run) => run === CANONICAL);
      expect(exact.length)
        .withContext(`${file} should run exactly "${CANONICAL}" once, found ${exact.length}`)
        .toEqual(1);
    });
  });

  const ALTERNATE = [
    [/\bng test\b/, 'invokes the CLI test target instead of the runner'],
    [/npm run test:(core|bs3|bs4|bs5|material|primeng)\b/, 'names a single suite'],
    [/\bvitest\b/, 'invokes Vitest directly instead of through the runner'],
    [/\bkarma\b/, 'Karma is gone from this repository'],
  ];

  it('reaches the suites no other way', () => {
    everyRun.forEach(([file, run]) => {
      ALTERNATE.forEach(([pattern, why]) => {
        expect(pattern.test(run))
          .withContext(`${file} ${why}: ${run.trim().split('\n')[0]}`)
          .toBe(false);
      });
    });
  });

  it('keeps npm run coverage on the same runner', () => {
    expect(manifest.scripts.coverage).toContain(CANONICAL);
  });
});

describe('retired Karma flags', () => {
  // Tombstones for the migration. The builder rejects these outright, so they
  // fail at the point of use rather than degrading quietly.
  const RETIRED = [
    ['ChromeHeadless', 'a Karma browser name; leaving --browsers out selects jsdom'],
    ['ChromiumHeadless', 'a Karma browser name; leaving --browsers out selects jsdom'],
    ['--no-progress', 'the unit-test builder has no progress option and rejects it'],
    ['--browsers', 'must be absent rather than empty, or jsdom is not selected'],
  ];

  it('appear in nothing a workflow runs', () => {
    everyRun.forEach(([file, run]) => {
      RETIRED.forEach(([token, why]) => {
        expect(run.includes(token))
          .withContext(`${file} passes ${token}, which is ${why}`)
          .toBe(false);
      });
    });
  });

  it('appear in no npm script', () => {
    Object.entries(manifest.scripts).forEach(([name, script]) => {
      RETIRED.forEach(([token, why]) => {
        expect(script.includes(token))
          .withContext(`${name} passes ${token}, which is ${why}`)
          .toBe(false);
      });
    });
  });
});

describe('npm script references', () => {
  const NPM_RUN = /npm run ([\w:-]+)/g;

  it('resolve in everything a workflow runs', () => {
    everyRun.forEach(([file, run]) => {
      [...run.matchAll(NPM_RUN)].forEach(([, name]) => {
        expect(scriptNames)
          .withContext(`${file} runs npm run ${name}, which does not exist`)
          .toContain(name);
      });
    });
  });

  it('resolve in every other script', () => {
    Object.entries(manifest.scripts).forEach(([name, script]) => {
      [...script.matchAll(NPM_RUN)].forEach(([, called]) => {
        expect(scriptNames)
          .withContext(`${name} runs npm run ${called}, which does not exist`)
          .toContain(called);
      });
    });
  });

  // `npm run <name>` is the only form the checks above recognise, so the
  // equivalents have to be spelled that way rather than left to slip past.
  it('use one npm syntax, so the checks above see them all', () => {
    const OTHER = /npm\s+(?:-{1,2}\S+\s+)*run-script\b|npm\s+-{1,2}\S+\s+run\b|npm\s+exec\b/;
    everyRun.forEach(([file, run]) => {
      expect(OTHER.test(run))
        .withContext(`${file} uses an npm form these guards do not read: ${run.trim().split('\n')[0]}`)
        .toBe(false);
    });
    Object.entries(manifest.scripts).forEach(([name, script]) => {
      expect(OTHER.test(script))
        .withContext(`${name} uses an npm form these guards do not read`)
        .toBe(false);
    });
  });
});

describe('npm script commands', () => {
  /** Shell builtins and coreutils, which no package provides. */
  const SHELL = new Set(['cp', 'echo', 'rm', 'mkdir', 'true', 'test']);

  /**
   * The leading command of each segment, with any `VAR=value` prefix dropped.
   *
   * Quoted text is emptied first, because it is data rather than command
   * structure: `coverage:clean` passes a program to `node -e` whose semicolons
   * would otherwise read as separators and its `for` loop as a command.
   *
   * This reads simple scripts, which is all this repository has. It is not a
   * shell parser, and the guards below are scoped to what it can actually see.
   */
  function segments(script) {
    return script.replace(/"[^"]*"|'[^']*'/g, '""')
      .split(/&&|\|\||[;|]/)
      .map((segment) => segment.trim().split(/\s+/).filter((word) => !/^\w+=/.test(word)))
      .filter((words) => words.length);
  }

  /** The package a bin comes from, by following the link npm wrote. */
  function providingPackage(bin) {
    const link = path.join(root, 'node_modules', '.bin', bin);
    if (!fs.existsSync(link)) { return null; }
    const target = fs.realpathSync(link);
    const marker = `node_modules${path.sep}`;
    const rel = target.slice(target.lastIndexOf(marker) + marker.length).split(path.sep);
    return rel[0].startsWith('@') ? `${rel[0]}/${rel[1]}` : rel[0];
  }

  // `npm run stats` piped a production build into webpack-bundle-analyzer and
  // kept doing so after esbuild replaced webpack and the package was dropped.
  // Running the script is a full production build, too slow to belong here;
  // this asks the cheaper question of whether what it calls is still there.
  //
  // A declared dependency rather than a present binary: a bin that arrives
  // only through someone else's dependency disappears on an unrelated upgrade.
  it('come from a declared dependency', () => {
    Object.entries(manifest.scripts).forEach(([name, script]) => {
      segments(script).forEach(([command]) => {
        if (SHELL.has(command) || ['node', 'npm', 'npx'].includes(command)) { return; }
        const provider = providingPackage(command);
        expect(provider)
          .withContext(`${name} calls ${command}, which no installed package provides`)
          .not.toBeNull();
        expect(Object.keys(declaredDependencies))
          .withContext(`${name} calls ${command}, provided by ${provider}, which package.json does not declare`)
          .toContain(provider);
      });
    });
  });

  // `node` and `npx` are exempt above, so their target is checked here instead
  // of being taken on trust.
  it('point at script files that exist', () => {
    const scripts = [
      ...Object.entries(manifest.scripts).map(([name, script]) => [name, script]),
      ...everyRun,
    ];
    scripts.forEach(([where, script]) => {
      [...script.matchAll(/node\s+(?!-)([\w./-]+\.js)/g)].forEach(([, file]) => {
        expect(fs.existsSync(path.join(root, file)))
          .withContext(`${where} runs node ${file}, which does not exist`)
          .toBe(true);
      });
    });
  });
});

describe('release package count', () => {
  // The publish list read "bootstrap3 bootstrap4 material" when bootstrap5 was
  // added, so the new package was skipped while the job reported success. The
  // list comes from dist now, but the count it is checked against is still
  // written down, and a seventh package would make it wrong.
  it('matches the number of packages the workspace publishes', () => {
    const projects = Object.keys(yaml.load(read('angular.json')).projects)
      .filter((p) => p.startsWith('@ajsf/'));
    // The step that walks dist, rather than any `-ne` in the file.
    const step = runSteps('.github/workflows/release.yml')
      .find((run) => run.includes('dist/@ajsf/*/'));
    expect(step).withContext('release.yml no longer walks dist/@ajsf').toBeDefined();
    const declared = /-ne (\d+)/.exec(step);
    expect(declared).withContext('that step no longer checks a package count').not.toBeNull();
    expect(Number(declared[1]))
      .withContext(`release.yml expects ${declared && declared[1]} packages, angular.json declares ${projects.length}`)
      .toEqual(projects.length);
  });
});
