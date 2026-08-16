const {
  parseLcov,
  classify,
  combine,
  summarize,
  HIT,
  PARTIAL,
  MISS,
} = require('./coverage-summary');

/** Builds a minimal lcov record so each spec shows only what it is about. */
function lcov(file, body) {
  return [`SF:${file}`, ...body, 'end_of_record', ''].join('\n');
}

describe('classify', () => {
  it('calls a line that never executed a miss', () => {
    expect(classify({ hits: 0, branches: [] })).toEqual(MISS);
  });

  it('calls an executed line with no branches a hit', () => {
    expect(classify({ hits: 3, branches: [] })).toEqual(HIT);
  });

  it('calls an executed line with every branch taken a hit', () => {
    expect(classify({ hits: 3, branches: [1, 2] })).toEqual(HIT);
  });

  // This single rule is the whole reason local and Codecov disagreed.
  it('calls an executed line with an untaken branch a partial', () => {
    expect(classify({ hits: 3, branches: [1, 0] })).toEqual(PARTIAL);
  });

  // 225 lines in this repository are in this shape. Counting them as missed
  // scores 53.36% against Codecov's 56.40%; counting them as executed
  // reproduces its hit count exactly.
  it('treats branch data with no execution record as executed', () => {
    expect(classify({ hits: 0, branches: [1, 0], hasExecutionRecord: false })).toEqual(PARTIAL);
    expect(classify({ hits: 0, branches: [1, 2], hasExecutionRecord: false })).toEqual(HIT);
  });

  it('still calls a line with an execution record of zero a miss', () => {
    expect(classify({ hits: 0, branches: [1, 0], hasExecutionRecord: true })).toEqual(MISS);
  });
});

describe('parseLcov', () => {
  it('reads line execution counts', () => {
    const files = parseLcov(lcov('a.ts', ['DA:1,5', 'DA:2,0']));
    expect(files.get('a.ts').get(1).hits).toEqual(5);
    expect(files.get('a.ts').get(2).hits).toEqual(0);
  });

  it('attaches branch data to its line', () => {
    const files = parseLcov(lcov('a.ts', ['DA:1,5', 'BRDA:1,0,0,3', 'BRDA:1,0,1,0']));
    expect(files.get('a.ts').get(1).branches).toEqual([3, 0]);
  });

  it('treats a branch marked - as never taken', () => {
    const files = parseLcov(lcov('a.ts', ['DA:1,5', 'BRDA:1,0,0,-']));
    expect(files.get('a.ts').get(1).branches).toEqual([0]);
  });

  it('keeps separate files apart', () => {
    const files = parseLcov(lcov('a.ts', ['DA:1,1']) + lcov('b.ts', ['DA:1,0']));
    expect(files.size).toEqual(2);
    expect(files.get('b.ts').get(1).hits).toEqual(0);
  });
});

describe('combine', () => {
  it('unions a file that appears in two reports', () => {
    const merged = combine([
      parseLcov(lcov('a.ts', ['DA:1,1', 'DA:2,0'])),
      parseLcov(lcov('a.ts', ['DA:1,0', 'DA:2,4'])),
    ]);
    expect(merged.get('a.ts').get(1).hits).toEqual(1);
    expect(merged.get('a.ts').get(2).hits).toEqual(4);
  });

  it('unions branches so one taken anywhere counts as taken', () => {
    const merged = combine([
      parseLcov(lcov('a.ts', ['DA:1,1', 'BRDA:1,0,0,1', 'BRDA:1,0,1,0'])),
      parseLcov(lcov('a.ts', ['DA:1,1', 'BRDA:1,0,0,0', 'BRDA:1,0,1,2'])),
    ]);
    expect(classify(merged.get('a.ts').get(1))).toEqual(HIT);
  });

  it('keeps disjoint reports whole, which is the real shape here', () => {
    const merged = combine([
      parseLcov(lcov('core.ts', ['DA:1,1'])),
      parseLcov(lcov('material.ts', ['DA:1,1'])),
    ]);
    expect(merged.size).toEqual(2);
  });
});

describe('summarize', () => {
  it('excludes partials from the numerator but keeps them in the denominator', () => {
    const merged = combine([
      parseLcov(lcov('a.ts', [
        'DA:1,1',                                  // hit
        'DA:2,1', 'BRDA:2,0,0,1', 'BRDA:2,0,1,0',  // partial
        'DA:3,0',                                  // miss
        'DA:4,0',                                  // miss
      ])),
    ]);
    const result = summarize(merged);
    expect(result.total).toEqual(4);
    expect(result.hits).toEqual(1);
    expect(result.partials).toEqual(1);
    expect(result.misses).toEqual(2);
    expect(result.coverage).toEqual(25);
  });

  it('reports 100% for an empty report rather than dividing by zero', () => {
    expect(summarize(new Map()).coverage).toEqual(100);
  });

  it('sorts files by how many lines are not counted as hit', () => {
    const merged = combine([
      parseLcov(lcov('small.ts', ['DA:1,0'])),
      parseLcov(lcov('big.ts', ['DA:1,0', 'DA:2,0', 'DA:3,0'])),
    ]);
    expect(summarize(merged).files[0].file).toEqual('big.ts');
  });

  it('counts a partial as uncovered in the per file breakdown', () => {
    const merged = combine([
      parseLcov(lcov('a.ts', ['DA:1,1', 'BRDA:1,0,0,1', 'BRDA:1,0,1,0'])),
    ]);
    expect(summarize(merged).files[0].uncovered).toEqual(1);
  });
});
