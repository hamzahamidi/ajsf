#!/usr/bin/env node
/**
 * Installs the built packages into a throwaway Angular project and builds it,
 * because two things are only observable from outside this workspace.
 *
 * Peer resolution is one. The workspace has every Angular package pinned in one
 * lockfile, so it can never see what npm does with a consumer's tree. 20.0.0
 * shipped needing `npm install @angular/animations` at the exact Angular patch,
 * and that was found by installing the release into a new project, not by
 * reading a manifest: PrimeNG peers on @angular/animations, Angular 20 no
 * longer scaffolds it, and the Angular packages peer on each other by exact
 * patch, so a patch npm picks freely leaves the install unresolvable.
 *
 * AOT against the published entry points is the other. `test:material` and the
 * rest compile against dist/@ajsf/core through a tsconfig path mapping, which
 * is not the same as a consumer resolving the package by name from node_modules
 * and compiling it into their own production build.
 *
 * It packs dist/@ajsf/* rather than installing from npm, so it can run before a
 * publish. The peer ranges live in the built manifests, so the resolution above
 * is still exercised.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/** The six packages, core first: the frameworks depend on it. */
const PACKAGES = ['core', 'material', 'bootstrap3', 'bootstrap4', 'bootstrap5', 'primeng'];

/** Framework modules the smoke component imports, to make AOT compile each. */
const FRAMEWORK_MODULES = [
  ['MaterialDesignFrameworkModule', '@ajsf/material'],
  ['Bootstrap3FrameworkModule', '@ajsf/bootstrap3'],
  ['Bootstrap4FrameworkModule', '@ajsf/bootstrap4'],
  ['Bootstrap5FrameworkModule', '@ajsf/bootstrap5'],
  ['PrimengFrameworkModule', '@ajsf/primeng'],
];

/**
 * The Angular major to scaffold against, read from the workspace rather than
 * written down, so it moves with the upgrade that changes it.
 */
function angularMajor(manifest) {
  const declared = manifest.dependencies && manifest.dependencies['@angular/core'];
  if (!declared) { throw new Error('@angular/core is not a dependency of the workspace'); }
  const major = /(\d+)/.exec(declared);
  if (!major) { throw new Error(`cannot read a major out of @angular/core ${declared}`); }
  return major[1];
}

/** Refuses early when dist is absent or partial, rather than failing in npm. */
function assertBuilt(distDir, packages = PACKAGES) {
  const missing = packages.filter((p) => !fs.existsSync(path.join(distDir, p, 'package.json')));
  if (missing.length) {
    throw new Error(
      `dist/@ajsf is missing ${missing.join(', ')}. Run \`npm run build:libs\` first.`
    );
  }
  return packages.map((p) => path.join(distDir, p));
}

/** The version every built package must agree on, so a mixed dist is caught. */
function builtVersion(dirs) {
  const versions = [...new Set(dirs.map((d) => require(path.join(d, 'package.json')).version))];
  if (versions.length !== 1) {
    throw new Error(`dist/@ajsf holds more than one version: ${versions.join(', ')}`);
  }
  return versions[0];
}

/**
 * Removes `ng new`'s default bundle budgets from the scaffolded project.
 *
 * They are a scaffold default and say nothing about whether the packages
 * install and compile, which is all this checks. The smoke component imports
 * all six framework packages into one bundle, which no real consumer does, and
 * that alone is 2.29 MB against the scaffold's 1 MB error threshold.
 */
function dropBundleBudgets(app) {
  const file = path.join(app, 'angular.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const project = config.projects.smoke;
  const targets = project.architect || project.targets;
  const production = targets.build.configurations.production;
  delete production.budgets;
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
  return production;
}

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NG_CLI_ANALYTICS: 'false' },
  });

const capture = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, NG_CLI_ANALYTICS: 'false' } }).trim();

/** A standalone component importing every framework, so AOT has to compile them. */
function smokeMain() {
  const imports = FRAMEWORK_MODULES.map(([m, p]) => `import { ${m} } from '${p}';`).join('\n');
  const moduleNames = FRAMEWORK_MODULES.map(([m]) => m).join(', ');
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { JsonSchemaFormModule } from '@ajsf/core';
${imports}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonSchemaFormModule, ${moduleNames}],
  template: \`<json-schema-form
    [schema]="schema"
    [framework]="framework"
    (onSubmit)="submitted = $event"></json-schema-form>\`,
})
export class AppComponent {
  framework = 'material-design';
  submitted: any = null;
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      accept: { type: 'boolean', title: 'Accept' },
    },
    required: ['name'],
  };
}

bootstrapApplication(AppComponent, { providers: [provideAnimations()] });
`;
}

function main(argv) {
  const keep = argv.includes('--keep');
  const manifest = require(path.join(ROOT, 'package.json'));
  const major = angularMajor(manifest);
  const dirs = assertBuilt(path.join(ROOT, 'dist', '@ajsf'));
  const version = builtVersion(dirs);

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ajsf-smoke-'));
  const app = path.join(work, 'smoke');
  console.log(`[smoke] @ajsf ${version} into a new Angular ${major} project at ${work}`);

  try {
    run('npx', ['--yes', `@angular/cli@${major}`, 'new', 'smoke',
      '--skip-git', '--skip-install', '--defaults', '--style=scss'], work);

    // Packed rather than installed from npm, so this runs before a publish.
    const tarballs = dirs.map((dir) => {
      const packed = capture('npm', ['pack', dir, '--pack-destination', work], work);
      return path.join(work, packed.split('\n').pop());
    });

    run('npm', ['install'], app);

    // Exactly what docs/release-notes/<major>.md tells a consumer to do, so a
    // failure here means either the packages or those instructions are wrong.
    const core = capture('node', ['-p', "require('@angular/core/package.json').version"], app);
    console.log(`[smoke] scaffold resolved @angular/core ${core}`);
    run('npm', ['install', `@angular/animations@${core}`], app);
    run('npm', ['install', `@angular/material@${major}`, `primeng@${major}`], app);
    run('npm', ['install', ...tarballs], app);

    fs.writeFileSync(path.join(app, 'src', 'main.ts'), smokeMain());
    dropBundleBudgets(app);

    run('npx', ['ng', 'build', '--configuration', 'production'], app);

    const out = path.join(app, 'dist', 'smoke');
    if (!fs.existsSync(out)) {
      throw new Error(`the production build wrote nothing to ${out}`);
    }
    console.log(`[smoke] @ajsf ${version} installs into a new Angular ${major} project and builds`);
    return 0;
  } finally {
    if (keep) {
      console.log(`[smoke] kept ${work}`);
    } else {
      fs.rmSync(work, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`[smoke] ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  angularMajor, assertBuilt, builtVersion, smokeMain, dropBundleBudgets, PACKAGES, FRAMEWORK_MODULES,
};
