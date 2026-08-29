const fs = require('fs');
const path = require('path');

const PACKAGES = ['ajsf-core', 'ajsf-material', 'ajsf-bootstrap3', 'ajsf-bootstrap4', 'ajsf-bootstrap5', 'ajsf-primeng'];
const ANGULAR_PEERS = [
  '@angular/core', '@angular/common', '@angular/forms',
  '@angular/platform-browser', '@angular/material', '@angular/cdk',
];

const VERSION = /^(\d+)\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function parse(version) {
  const match = VERSION.exec(version);
  if (!match) {
    throw new Error(
      `[set-version] "${version}" is not a valid version, expected 16.0.0 or 0.9.0-rc.0`
    );
  }
  return { major: Number(match[1]), prerelease: version.includes('-') };
}

/**
 * Retargets the Angular version keywords in place.
 *
 * `Angular<N>`, `Angular <N>` and `ng<N>` move with the major. Everything else
 * keeps its position. Dropping the older majors is deliberate: npm indexes
 * keywords per published version, so the 14.0.0 tarball keeps saying Angular14
 * and only the current one needs to describe the current target.
 */
function retargetKeywords(keywords, angularMajor) {
  const versioned = /^(Angular ?|ng)\d+$/;
  const rest = keywords.filter((word) => !versioned.test(word));
  return [
    ...rest.slice(0, 2),
    `Angular${angularMajor}`,
    `Angular ${angularMajor}`,
    `ng${angularMajor}`,
    ...rest.slice(2),
  ];
}

/**
 * Retargets the workspace manifest's keywords, and nothing else.
 *
 * The root is `private: true` and never published, so its version must stay at
 * 0.0.0 (scripts/package-guards.spec.js asserts that) and it has no peer
 * ranges. Its keywords were still listing Angular6 through Angular14 while the
 * four published packages had moved on, because this script only ever walked
 * projects/.
 */
function setRootKeywords(rootFile, angularMajor) {
  if (angularMajor === null) {
    return null;
  }
  const manifest = JSON.parse(fs.readFileSync(rootFile, 'utf8'));
  if (!Array.isArray(manifest.keywords)) {
    return manifest;
  }
  manifest.keywords = retargetKeywords(manifest.keywords, angularMajor);
  fs.writeFileSync(rootFile, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/**
 * Copies the installed Angular CLI's own Node requirement onto the workspace
 * manifest, so `engines` cannot drift behind the Angular major.
 *
 * It is read from the CLI rather than written from a table because the floor
 * moves on its own schedule: Angular 17 wants `^18.13.0 || >=20.9.0` and
 * Angular 18 wants `^18.19.1 || ^20.11.1 || >=22.0.0`. A table would be one
 * more thing to remember, and it was already wrong: the root claimed
 * `^16.14.0 || >=18.10.0` while the toolchain had long since dropped Node 16.
 *
 * Returns null when the CLI is not installed, because `npm ci` has to be able
 * to run before this is meaningful.
 */
function syncNodeEngine(rootFile, cliManifestFile) {
  let cliEngines;
  try {
    cliEngines = JSON.parse(fs.readFileSync(cliManifestFile, 'utf8')).engines;
  } catch (error) {
    return null;
  }
  if (!cliEngines || !cliEngines.node) {
    return null;
  }
  const manifest = JSON.parse(fs.readFileSync(rootFile, 'utf8'));
  if (!manifest.engines || manifest.engines.node === cliEngines.node) {
    return manifest;
  }
  manifest.engines.node = cliEngines.node;
  fs.writeFileSync(rootFile, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

function setVersion(nextVersion, angularMajor, packagesDir) {
  const { major, prerelease } = parse(nextVersion);

  if (angularMajor !== null && major !== angularMajor) {
    throw new Error(
      `[set-version] "${nextVersion}" has major ${major}, ` +
      `which does not match Angular ${angularMajor}`
    );
  }

  return PACKAGES.map((pkg) => {
    const file = path.join(packagesDir, pkg, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));

    manifest.version = nextVersion;

    if (manifest.dependencies && manifest.dependencies['@ajsf/core']) {
      manifest.dependencies['@ajsf/core'] = prerelease ? nextVersion : `^${nextVersion}`;
    }

    // Keywords say which Angular a package targets, so they move with the major
    // rather than being remembered separately.
    if (angularMajor !== null && Array.isArray(manifest.keywords)) {
      manifest.keywords = retargetKeywords(manifest.keywords, angularMajor);
    }

    if (angularMajor !== null && manifest.peerDependencies) {
      for (const peer of ANGULAR_PEERS) {
        if (manifest.peerDependencies[peer]) {
          manifest.peerDependencies[peer] = `^${angularMajor}.0.0`;
        }
      }
    }

    fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
    return manifest;
  });
}

if (require.main === module) {
  const [nextVersion, angularMajor] = process.argv.slice(2);
  if (!nextVersion) {
    console.error('[set-version] usage: node scripts/set-version.js <version> [angularMajor]');
    process.exit(1);
  }
  const major = angularMajor ? Number(angularMajor) : null;
  try {
    setVersion(nextVersion, major, path.join(__dirname, '..', 'projects'));
    // The workspace manifest is private and keeps version 0.0.0, but its
    // keywords describe the same target and drifted to Angular14 while the four
    // published packages moved on.
    const rootFile = path.join(__dirname, '..', 'package.json');
    setRootKeywords(rootFile, major);
    syncNodeEngine(
      rootFile,
      path.join(__dirname, '..', 'node_modules', '@angular', 'cli', 'package.json')
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`[set-version] set ${nextVersion}${major ? ` for Angular ${major}` : ''}`);
}

module.exports = { setVersion, setRootKeywords, retargetKeywords, syncNodeEngine, PACKAGES };
