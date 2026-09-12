#!/usr/bin/env node
/**
 * Runs every library suite with coverage and leaves one report per suite under
 * coverage/, for `npm run coverage` and for CI alike.
 *
 * It exists because two things about the Vitest path cannot be expressed as
 * configuration in @angular/build 20.3.36.
 *
 * The builder collects V8 coverage over its own bundled output under
 * dist/test-out/<timestamp>-<uuid>, and never cleans that directory. Stale run
 * directories accumulate and distort the report: with 23 of them present a
 * suite looked healthy while a clean tree produced almost nothing. So the
 * directory is removed before every suite.
 *
 * Angular 21 writes one report per project, at coverage/<project>/lcov.info,
 * so the suites no longer overwrite each other. Until 20 they all wrote
 * coverage/lcov.info and wiped coverage/ first, and this script staged each
 * report outside coverage/ and restored them at the end. That is gone.
 *
 * It also refuses to run rather than guessing: every suite must be on
 * `@angular/build:unit-test`, the suite list must cover every `@ajsf/*` project
 * angular.json declares, and every suite must leave a report with at least one
 * source record. The release workflow calls this script and does not upload to
 * Codecov, so a silently missing report would otherwise reach a publish.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const angular = require(path.join(root, 'angular.json'));

// npm script name paired with the angular.json project it drives.
const SUITES = [
  ['test:core', '@ajsf/core'],
  ['test:bs3', '@ajsf/bootstrap3'],
  ['test:bs4', '@ajsf/bootstrap4'],
  ['test:bs5', '@ajsf/bootstrap5'],
  ['test:material', '@ajsf/material'],
  ['test:primeng', '@ajsf/primeng'],
];

const UNIT_TEST = '@angular/build:unit-test';
// Angular 21 renamed the coverage options: codeCoverage became coverage, and
// codeCoverageReporters became coverageReporters. The old names now fail
// schema validation rather than being ignored.
const FLAGS = ['--coverage', '--no-watch'];

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
const produced = [];

// A suite on any other builder would need different flags, so fail rather than
// run it with these. This list is the seventh place the package set is written
// down, so it also has to match what angular.json actually declares.
const declared = Object.keys(angular.projects).filter((p) => p.startsWith('@ajsf/'));
const covered = SUITES.map(([, project]) => project);
const missing = declared.filter((p) => !covered.includes(p));
if (missing.length) {
  throw new Error(`run-coverage: angular.json has ${missing.join(', ')} but SUITES does not`);
}
for (const [, project] of SUITES) {
  const builder = angular.projects[project].architect.test.builder;
  if (builder !== UNIT_TEST) {
    throw new Error(`run-coverage: ${project} uses ${builder}, expected ${UNIT_TEST}`);
  }
}

for (const [script, project] of SUITES) {
  const name = script.replace('test:', '');
  process.stdout.write(`\n[coverage] ${name}\n`);

  rm(path.join(root, 'dist', 'test-out'));
  execFileSync('npm', ['run', script, '--', ...FLAGS], { cwd: root, stdio: 'inherit' });

  const report = path.join(root, 'coverage', project, 'lcov.info');
  if (!fs.existsSync(report)) {
    throw new Error(`run-coverage: ${name} produced no ${path.relative(root, report)}`);
  }
  produced.push([name, report]);
}

const reports = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); } else if (e.name === 'lcov.info') { reports.push(p); }
  }
};
walk(path.join(root, 'coverage'));
process.stdout.write(`\n[coverage] ${reports.length} report(s):\n`);
for (const r of reports.sort()) {
  const records = fs.readFileSync(r, 'utf8').split('\n').filter((l) => l.startsWith('SF:')).length;
  process.stdout.write(`  ${path.relative(root, r)}  ${records} source file(s)\n`);
}

// Listing what was produced is not the same as requiring it. The release
// workflow runs this script and does not upload to Codecov, so without this a
// suite whose report went missing or came out empty would release silently.
if (produced.length !== SUITES.length) {
  throw new Error(`run-coverage: ${produced.length} reports, expected ${SUITES.length}`);
}
const empty = produced.filter(([, f]) =>
  !fs.existsSync(f) ||
  !fs.readFileSync(f, 'utf8').split('\n').some((l) => l.startsWith('SF:')));
if (empty.length) {
  throw new Error(`run-coverage: empty or missing report for ${empty.map(([n]) => n).join(', ')}`);
}
