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
 * Every Vitest suite then writes coverage/lcov.info and wipes coverage/ before
 * doing so, which destroys the previous suite's report. The builder exposes no
 * output directory option, and the istanbul `subdir` reporter option is not
 * honoured through codeCoverageReporters, so each report is staged outside
 * coverage/ and restored once every suite has run. Karma writes per-project
 * subdirectories and does not wipe, so its reports need no staging.
 *
 * Flags differ by runner and cannot be shared: the unit-test builder's schema
 * has no `progress` option and rejects `--browsers` when jsdom is wanted,
 * while Karma needs both.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
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

const usesVitest = (project) =>
  angular.projects[project].architect.test.builder === '@angular/build:unit-test';

const VITEST_FLAGS = ['--code-coverage', '--no-watch'];
const KARMA_FLAGS = [
  '--code-coverage', '--no-watch', '--no-progress', '--browsers=ChromeHeadlessCI',
];

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ajsf-cov-'));
const staged = [];

for (const [script, project] of SUITES) {
  const vitest = usesVitest(project);
  const name = script.replace('test:', '');
  process.stdout.write(`\n[coverage] ${name} (${vitest ? 'vitest' : 'karma'})\n`);

  rm(path.join(root, 'dist', 'test-out'));
  execFileSync('npm', ['run', script, '--', ...(vitest ? VITEST_FLAGS : KARMA_FLAGS)], {
    cwd: root,
    stdio: 'inherit',
  });

  // Only the Vitest runner writes to this path, and only it wipes coverage/.
  const report = path.join(root, 'coverage', 'lcov.info');
  if (vitest && fs.existsSync(report)) {
    const to = path.join(staging, `${name}.info`);
    fs.copyFileSync(report, to);
    staged.push([name, to]);
  }
}

for (const [name, from] of staged) {
  const dir = path.join(root, 'coverage', `vitest-${name}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(from, path.join(dir, 'lcov.info'));
}
rm(staging);

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
  process.stdout.write(`  ${path.relative(root, r)}\n`);
}
