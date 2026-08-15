const fs = require('fs');
const path = require('path');

const PACKAGES = ['ajsf-core', 'ajsf-material', 'ajsf-bootstrap3', 'ajsf-bootstrap4'];
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

    // Keywords say which Angular a package targets, so they move with the
    // major rather than being remembered separately. Angular<N>, Angular <N>
    // and ng<N> are retargeted in place; everything else is untouched.
    if (angularMajor !== null && Array.isArray(manifest.keywords)) {
      const versioned = /^(Angular ?|ng)\d+$/;
      const rest = manifest.keywords.filter((word) => !versioned.test(word));
      manifest.keywords = [
        ...rest.slice(0, 2),
        `Angular${angularMajor}`,
        `Angular ${angularMajor}`,
        `ng${angularMajor}`,
        ...rest.slice(2),
      ];
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
    setVersion(major === null ? nextVersion : nextVersion, major,
      path.join(__dirname, '..', 'projects'));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`[set-version] set ${nextVersion}${major ? ` for Angular ${major}` : ''}`);
}

module.exports = { setVersion, PACKAGES };
