const fs = require('fs');
const path = require('path');

/**
 * Reports coverage the way Codecov reports it, so the number printed locally is
 * the number the pull request gate will use.
 *
 * The two disagree by default, and it is not a bug in either. lcov's own LH and
 * LF summary counts a line as hit whenever it executed at least once. Codecov
 * additionally looks at branch data: a line that executed but whose branches
 * were not all taken is a *partial*, and a partial counts in the denominator
 * but not the numerator.
 *
 * On this repository that is the difference between 66.2% (lcov) and 56.4%
 * (Codecov) from one identical set of files, because 344 lines are partial.
 * Reading the higher number and pushing to a gate enforcing the lower one wastes
 * an afternoon, so this script only ever reports the lower one.
 *
 * Karma writes one lcov.info per project, nested under a directory named after
 * the browser, and the four projects instrument disjoint file sets. Every
 * lcov.info under the coverage directory is therefore read and combined. Should
 * a file ever appear in two reports, its lines are unioned: executed anywhere
 * counts as executed.
 */

/** A line is one of these three, and only `hit` counts towards the score. */
const HIT = 'hit';
const PARTIAL = 'partial';
const MISS = 'miss';

/**
 * Reads every `lcov.info` beneath `dir`.
 * Karma nests them under a browser directory whose name carries a version
 * number, so the path cannot be hard coded.
 */
function findLcovFiles(dir) {
  const found = [];
  if (!fs.existsSync(dir)) {
    return found;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findLcovFiles(full));
    } else if (entry.name === 'lcov.info') {
      found.push(full);
    }
  }
  return found.sort();
}

/**
 * Turns lcov text into `{ file: Map(lineNumber -> { hits, branches: number[] }) }`.
 *
 * Only the record types that matter here are read. `DA` gives a line and its
 * execution count, `BRDA` gives one branch on a line and how many times it was
 * taken, where `-` means the branch was never reached at all.
 *
 * 225 lines in this repository carry `BRDA` records with no `DA` record. They
 * are counted as executed, not as missed. Treating them as missed puts the
 * total at Codecov's exact 3840 lines but scores 53.36% against its 56.40%;
 * counting them as executed reproduces Codecov's hit count of 2166 exactly.
 * A `BRDA` record only exists because the instrumenter saw a branch there.
 */
function parseLcov(text) {
  const files = new Map();
  let current = null;

  const entry = (key) => {
    if (!current.has(key)) {
      current.set(key, { hits: 0, branches: [], hasExecutionRecord: false });
    }
    return current.get(key);
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();

    if (line.startsWith('SF:')) {
      const file = line.slice(3);
      if (!files.has(file)) {
        files.set(file, new Map());
      }
      current = files.get(file);
    } else if (line.startsWith('DA:') && current) {
      const [lineNumber, hits] = line.slice(3).split(',');
      const target = entry(Number(lineNumber));
      target.hits = Math.max(target.hits, Number(hits));
      target.hasExecutionRecord = true;
    } else if (line.startsWith('BRDA:') && current) {
      const parts = line.slice(5).split(',');
      // `-` means the branch was never reached, which is a zero for our purposes.
      const taken = parts[3] === '-' ? 0 : Number(parts[3]);
      entry(Number(parts[0])).branches.push(taken);
    } else if (line === 'end_of_record') {
      current = null;
    }
  }

  return files;
}

/** Classifies one line. This is the whole difference from the lcov summary. */
function classify(entry) {
  // A line with branch data but no execution record still ran: see parseLcov.
  const executed = entry.hits > 0 || (!entry.hasExecutionRecord && entry.branches.length > 0);
  if (!executed) {
    return MISS;
  }
  return entry.branches.some((taken) => taken === 0) ? PARTIAL : HIT;
}

/** Combines parsed reports, unioning any file that appears in more than one. */
function combine(parsedReports) {
  const merged = new Map();
  for (const report of parsedReports) {
    for (const [file, lines] of report) {
      if (!merged.has(file)) {
        merged.set(file, new Map());
      }
      const target = merged.get(file);
      for (const [lineNumber, entry] of lines) {
        const existing = target.get(lineNumber);
        if (!existing) {
          target.set(lineNumber, { hits: entry.hits, branches: [...entry.branches] });
          continue;
        }
        existing.hits = Math.max(existing.hits, entry.hits);
        // Union the branches positionally: taken anywhere counts as taken.
        entry.branches.forEach((taken, index) => {
          existing.branches[index] = Math.max(existing.branches[index] || 0, taken);
        });
      }
    }
  }
  return merged;
}

/** Totals, plus a per file breakdown sorted by how much is missing. */
function summarize(merged) {
  let hits = 0;
  let partials = 0;
  let misses = 0;
  const files = [];

  for (const [file, lines] of merged) {
    let fileHits = 0;
    let filePartials = 0;
    let fileMisses = 0;
    for (const entry of lines.values()) {
      const verdict = classify(entry);
      if (verdict === HIT) {
        fileHits++;
      } else if (verdict === PARTIAL) {
        filePartials++;
      } else {
        fileMisses++;
      }
    }
    const total = fileHits + filePartials + fileMisses;
    files.push({
      file,
      total,
      hits: fileHits,
      partials: filePartials,
      misses: fileMisses,
      uncovered: filePartials + fileMisses,
      coverage: total ? (fileHits / total) * 100 : 100,
    });
    hits += fileHits;
    partials += filePartials;
    misses += fileMisses;
  }

  const total = hits + partials + misses;
  files.sort((a, b) => b.uncovered - a.uncovered);

  return {
    total,
    hits,
    partials,
    misses,
    coverage: total ? (hits / total) * 100 : 100,
    files,
  };
}

/** Reads a coverage directory and returns the summary. */
function summarizeDirectory(dir) {
  const lcovFiles = findLcovFiles(dir);
  const parsed = lcovFiles.map((file) => parseLcov(fs.readFileSync(file, 'utf8')));
  return { ...summarize(combine(parsed)), reports: lcovFiles };
}

function main(argv) {
  const dir = path.join(__dirname, '..', 'coverage');
  const minIndex = argv.indexOf('--min');
  const min = minIndex === -1 ? null : Number(argv[minIndex + 1]);
  const showFiles = argv.includes('--files');

  const result = summarizeDirectory(dir);

  if (!result.reports.length) {
    console.error(`[coverage] no lcov.info found under ${dir}. Run the suites with --code-coverage first.`);
    return 1;
  }

  console.log(`[coverage] ${result.reports.length} reports, ${result.total} lines`);
  console.log(`  hit      ${String(result.hits).padStart(5)}`);
  console.log(`  partial  ${String(result.partials).padStart(5)}  (executed, but not every branch taken)`);
  console.log(`  missed   ${String(result.misses).padStart(5)}`);
  console.log(`  coverage ${result.coverage.toFixed(2)}%`);

  if (showFiles) {
    console.log('');
    console.log('  uncov   cov%  file');
    for (const file of result.files.filter((f) => f.uncovered > 0).slice(0, 25)) {
      console.log(
        `  ${String(file.uncovered).padStart(5)}  ${file.coverage.toFixed(0).padStart(4)}%  ${file.file}`
      );
    }
  }

  if (min !== null) {
    if (Number.isNaN(min)) {
      console.error('[coverage] --min needs a number');
      return 1;
    }
    if (result.coverage + 1e-9 < min) {
      console.error(`[coverage] FAIL ${result.coverage.toFixed(2)}% is below the ${min}% minimum`);
      return 1;
    }
    console.log(`[coverage] OK ${result.coverage.toFixed(2)}% meets the ${min}% minimum`);
  }

  return 0;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { parseLcov, classify, combine, summarize, summarizeDirectory, findLcovFiles, HIT, PARTIAL, MISS };
