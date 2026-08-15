const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const readManifest = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const LIBRARIES = [
  'projects/ajsf-core',
  'projects/ajsf-material',
  'projects/ajsf-bootstrap3',
  'projects/ajsf-bootstrap4',
];

describe('package guards', () => {
  it('keeps the root package private so it can never be published', () => {
    expect(readManifest('package.json').private).toBe(true);
  });

  it('keeps every library publishable', () => {
    LIBRARIES.forEach((lib) => {
      expect(readManifest(`${lib}/package.json`).private).toBe(false);
    });
  });

  it('holds all four libraries at the same version', () => {
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
