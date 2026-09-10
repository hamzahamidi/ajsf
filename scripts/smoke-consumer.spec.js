const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  angularMajor, assertBuilt, builtVersion, smokeMain, dropBundleBudgets, PACKAGES, FRAMEWORK_MODULES,
} = require('./smoke-consumer');

/** Writes a dist/@ajsf tree holding the named packages at the given versions. */
function dist(versions) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ajsf-smoke-spec-'));
  for (const [name, version] of Object.entries(versions)) {
    fs.mkdirSync(path.join(dir, name), { recursive: true });
    fs.writeFileSync(
      path.join(dir, name, 'package.json'),
      JSON.stringify({ name: `@ajsf/${name}`, version })
    );
  }
  return dir;
}

const allAt = (version) =>
  Object.fromEntries(PACKAGES.map((p) => [p, version]));

describe('angularMajor', () => {
  it('reads the major out of the declared range', () => {
    expect(angularMajor({ dependencies: { '@angular/core': '^20.3.30' } })).toEqual('20');
  });

  it('reads a major from a pinned exact version', () => {
    expect(angularMajor({ dependencies: { '@angular/core': '21.0.0' } })).toEqual('21');
  });

  it('refuses a workspace that does not depend on Angular', () => {
    expect(() => angularMajor({ dependencies: {} }))
      .toThrowError(/@angular\/core is not a dependency/);
  });
});

describe('assertBuilt', () => {
  it('returns one directory per package when dist is complete', () => {
    const dir = dist(allAt('20.0.0'));
    expect(assertBuilt(dir).length).toEqual(PACKAGES.length);
  });

  // The failure this replaces was a release publishing five of six packages,
  // so a partial dist has to be named rather than left to npm.
  it('names the packages that are missing', () => {
    const dir = dist({ core: '20.0.0', material: '20.0.0' });
    expect(() => assertBuilt(dir)).toThrowError(/bootstrap3, bootstrap4, bootstrap5, primeng/);
  });

  it('points at build:libs rather than just reporting absence', () => {
    expect(() => assertBuilt(dist({}))).toThrowError(/npm run build:libs/);
  });
});

describe('builtVersion', () => {
  it('returns the version every package agrees on', () => {
    const dir = dist(allAt('20.1.0'));
    expect(builtVersion(assertBuilt(dir))).toEqual('20.1.0');
  });

  // A stale package left in dist would otherwise be smoke tested against the
  // rest, and the packages version in lockstep.
  it('refuses a dist holding more than one version', () => {
    const dir = dist({ ...allAt('20.1.0'), primeng: '20.0.0' });
    expect(() => builtVersion(assertBuilt(dir)))
      .toThrowError(/more than one version/);
  });
});

describe('smokeMain', () => {
  const source = smokeMain();

  it('imports every package, so AOT has to compile all of them', () => {
    expect(source).toContain("from '@ajsf/core'");
    FRAMEWORK_MODULES.forEach(([, pkg]) => expect(source).toContain(`from '${pkg}'`));
  });

  it('declares every framework module in the component imports', () => {
    FRAMEWORK_MODULES.forEach(([mod]) => expect(source).toContain(mod));
  });

  it('renders the form component, so the templates compile too', () => {
    expect(source).toContain('<json-schema-form');
  });
});

describe('dropBundleBudgets', () => {
  /** Writes the part of a scaffolded angular.json this touches. */
  function scaffold(targetsKey) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ajsf-smoke-ng-'));
    fs.writeFileSync(path.join(dir, 'angular.json'), JSON.stringify({
      projects: {
        smoke: {
          [targetsKey]: {
            build: {
              configurations: {
                production: {
                  budgets: [{ type: 'initial', maximumWarning: '500kB', maximumError: '1MB' }],
                  outputHashing: 'all',
                },
              },
            },
          },
        },
      },
    }));
    return dir;
  }

  // The smoke component imports all six frameworks into one bundle, which is
  // 2.29 MB against the scaffold's 1 MB error threshold and says nothing about
  // whether the packages install and compile.
  it('removes the budgets that would fail the build on size alone', () => {
    const dir = scaffold('architect');
    expect(dropBundleBudgets(dir).budgets).toBeUndefined();
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'angular.json'), 'utf8'))
      .projects.smoke.architect.build.configurations.production.budgets).toBeUndefined();
  });

  it('leaves the rest of the production configuration alone', () => {
    expect(dropBundleBudgets(scaffold('architect')).outputHashing).toEqual('all');
  });

  // The CLI has used both keys for this across majors, and the script has to
  // survive the scaffold changing under it.
  it('accepts targets as well as architect', () => {
    expect(dropBundleBudgets(scaffold('targets')).budgets).toBeUndefined();
  });
});
