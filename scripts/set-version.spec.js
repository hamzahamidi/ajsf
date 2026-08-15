const fs = require('fs');
const os = require('os');
const path = require('path');
const { setVersion } = require('./set-version');

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ajsf-'));
  const write = (name, json) => {
    fs.mkdirSync(path.join(dir, name), { recursive: true });
    fs.writeFileSync(path.join(dir, name, 'package.json'), JSON.stringify(json, null, 2));
  };
  write('ajsf-core', {
    name: '@ajsf/core', version: '0.8.0',
    keywords: ['Angular', 'ng', 'Angular14', 'Angular 14', 'ng14', 'JSON Schema'],
    dependencies: { 'lodash-es': '~4.17.21' },
    peerDependencies: { '@angular/core': '>=14.0.0', '@angular/common': '>=14.0.0', rxjs: '^7.0.0' },
  });
  write('ajsf-material', {
    name: '@ajsf/material', version: '0.8.0',
    keywords: ['Angular', 'ng', 'Angular14', 'Angular 14', 'ng14', 'material'],
    dependencies: { '@ajsf/core': '~0.8.0' },
    peerDependencies: { '@angular/material': '>=14.0.0', '@angular/cdk': '>=14.0.0' },
  });
  write('ajsf-bootstrap3', {
    name: '@ajsf/bootstrap3', version: '0.8.0',
    dependencies: { '@ajsf/core': '~0.8.0' },
    peerDependencies: { '@angular/core': '>=14.0.0', '@angular/common': '>=14.0.0' },
  });
  write('ajsf-bootstrap4', {
    name: '@ajsf/bootstrap4', version: '0.8.0',
    dependencies: { '@ajsf/core': '~0.8.0' },
    peerDependencies: { '@angular/core': '>=14.0.0', '@angular/common': '>=14.0.0' },
  });
  return dir;
}

const read = (dir, name) =>
  JSON.parse(fs.readFileSync(path.join(dir, name, 'package.json'), 'utf8'));

const ALL = ['ajsf-core', 'ajsf-material', 'ajsf-bootstrap3', 'ajsf-bootstrap4'];
const FRAMEWORKS = ['ajsf-material', 'ajsf-bootstrap3', 'ajsf-bootstrap4'];

describe('setVersion', () => {
  it('sets the version on all four packages', () => {
    const dir = fixture();
    setVersion('18.0.0', 18, dir);
    ALL.forEach(p => expect(read(dir, p).version).toEqual('18.0.0'));
  });

  it('bumps the internal @ajsf/core range in lockstep', () => {
    const dir = fixture();
    setVersion('18.0.0', 18, dir);
    FRAMEWORKS.forEach(p =>
      expect(read(dir, p).dependencies['@ajsf/core']).toEqual('^18.0.0'));
  });

  it('pins the internal @ajsf/core range exactly for a prerelease', () => {
    const dir = fixture();
    setVersion('0.9.0-rc.0', null, dir);
    FRAMEWORKS.forEach(p =>
      expect(read(dir, p).dependencies['@ajsf/core']).toEqual('0.9.0-rc.0'));
  });

  it('bounds the Angular peer ranges to the given major', () => {
    const dir = fixture();
    setVersion('18.0.0', 18, dir);
    expect(read(dir, 'ajsf-core').peerDependencies['@angular/core']).toEqual('^18.0.0');
    expect(read(dir, 'ajsf-material').peerDependencies['@angular/material']).toEqual('^18.0.0');
    expect(read(dir, 'ajsf-material').peerDependencies['@angular/cdk']).toEqual('^18.0.0');
  });

  it('leaves non-Angular dependencies alone', () => {
    const dir = fixture();
    setVersion('18.0.0', 18, dir);
    expect(read(dir, 'ajsf-core').peerDependencies.rxjs).toEqual('^7.0.0');
    expect(read(dir, 'ajsf-core').dependencies['lodash-es']).toEqual('~4.17.21');
  });

  it('leaves Angular peers alone when angularMajor is null', () => {
    const dir = fixture();
    setVersion('0.9.0', null, dir);
    expect(read(dir, 'ajsf-core').version).toEqual('0.9.0');
    expect(read(dir, 'ajsf-core').peerDependencies['@angular/core']).toEqual('>=14.0.0');
  });

  it('rejects a malformed version without writing anything', () => {
    const dir = fixture();
    expect(() => setVersion('16.0', 16, dir)).toThrowError(/not a valid version/);
    expect(() => setVersion('v16.0.0', 16, dir)).toThrowError(/not a valid version/);
    expect(() => setVersion('sixteen', 16, dir)).toThrowError(/not a valid version/);
    ALL.forEach(p => expect(read(dir, p).version).toEqual('0.8.0'));
  });

  it('rejects an Angular major that disagrees with the version major', () => {
    const dir = fixture();
    expect(() => setVersion('17.0.0', 18, dir))
      .toThrowError(/has major 17, which does not match Angular 18/);
    ALL.forEach(p => expect(read(dir, p).version).toEqual('0.8.0'));
  });

  it('retargets the Angular keywords to the given major', () => {
    const dir = fixture();
    setVersion('16.0.0', 16, dir);
    const words = read(dir, 'ajsf-core').keywords;
    expect(words).toContain('Angular16');
    expect(words).toContain('Angular 16');
    expect(words).toContain('ng16');
    expect(words).not.toContain('Angular14');
    expect(words).not.toContain('ng14');
  });

  it('leaves non-version keywords alone', () => {
    const dir = fixture();
    setVersion('16.0.0', 16, dir);
    expect(read(dir, 'ajsf-core').keywords).toContain('JSON Schema');
    expect(read(dir, 'ajsf-material').keywords).toContain('material');
    expect(read(dir, 'ajsf-core').keywords).toContain('Angular');
    expect(read(dir, 'ajsf-core').keywords).toContain('ng');
  });

  it('does not duplicate keywords when run twice', () => {
    const dir = fixture();
    setVersion('16.0.0', 16, dir);
    setVersion('16.1.0', 16, dir);
    const words = read(dir, 'ajsf-core').keywords;
    expect(words.filter(w => w === 'Angular16').length).toEqual(1);
  });

  it('leaves keywords alone when no Angular major is given', () => {
    const dir = fixture();
    setVersion('0.9.0', null, dir);
    expect(read(dir, 'ajsf-core').keywords).toContain('Angular14');
  });

  it('allows a major mismatch when no Angular major is given', () => {
    const dir = fixture();
    setVersion('0.9.0', null, dir);
    expect(read(dir, 'ajsf-core').version).toEqual('0.9.0');
  });
});
