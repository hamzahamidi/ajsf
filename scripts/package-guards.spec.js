const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const readManifest = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const LIBRARIES = [
  'projects/ajsf-core',
  'projects/ajsf-material',
  'projects/ajsf-bootstrap3',
  'projects/ajsf-bootstrap4',
  'projects/ajsf-bootstrap5',
  'projects/ajsf-primeng',
];

describe('tsconfig guards', () => {
  const tsconfig = JSON.parse(
    fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8').replace(/^\s*\/\/.*$/gm, '')
  );

  // A "@angular/*": ["./node_modules/@angular/*"] mapping sat here from 2020
  // until it met the Vite dev server. It resolves Angular to an absolute path,
  // which bypasses dependency prebundling, so main.js carried a second copy of
  // the core runtime beside the prebundled one. Two runtimes meant the
  // compiled template ran against empty instruction state and the demo failed
  // to bootstrap with "ASSERTION ERROR: Array must be defined", in `ng serve`
  // only: the production build has nothing to prebundle and dedupes to one.
  it('maps no @angular package, which would give the dev server two runtimes', () => {
    const mapped = Object.keys(tsconfig.compilerOptions.paths || {})
      .filter((p) => p.startsWith('@angular'));
    expect(mapped)
      .withContext(`these bypass Vite prebundling: ${mapped.join(', ')}`)
      .toEqual([]);
  });
});

describe('package guards', () => {
  it('keeps the root package private so it can never be published', () => {
    expect(readManifest('package.json').private).toBe(true);
  });

  it('keeps the root version at 0.0.0 so it cannot read as a library version', () => {
    // The releases page carried this number for years (15.0.0, 14.0.0) while
    // npm served @ajsf/* 0.8.0 and 0.7.0. Pinning it at 0.0.0 makes it
    // obviously not a release.
    expect(readManifest('package.json').version).toEqual('0.0.0');
  });

  it('keeps every library publishable', () => {
    LIBRARIES.forEach((lib) => {
      expect(readManifest(`${lib}/package.json`).private).toBe(false);
    });
  });

  it('holds all libraries at the same version', () => {
    const versions = LIBRARIES.map((lib) => readManifest(`${lib}/package.json`).version);
    expect(new Set(versions).size)
      .withContext(`versions drifted: ${JSON.stringify(versions)}`)
      .toEqual(1);
  });

  it('points every framework package at the current core version', () => {
    const core = readManifest('projects/ajsf-core/package.json').version;
    LIBRARIES.filter((lib) => !lib.endsWith('core')).forEach((lib) => {
      const range = readManifest(`${lib}/package.json`).dependencies['@ajsf/core'];
      expect(range)
        .withContext(`${lib} depends on @ajsf/core ${range} but core is ${core}`)
        .toMatch(new RegExp(`^[~^]?${core.replace(/\./g, '\\.')}$`));
    });
  });
});
