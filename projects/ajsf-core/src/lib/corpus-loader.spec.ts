import { loadCorpus, SKIPPED_NOT_JSON } from '../../../../testing/corpus/schemas';

describe('corpus loader', () => {
  it('loads the example schemas', () => {
    const corpus = loadCorpus();
    expect(corpus.length).toBeGreaterThan(0);
  });

  it('gives every entry a name and a parsed object', () => {
    loadCorpus().forEach(entry => {
      expect(entry.name).toBeTruthy();
      expect(entry.form).toBeTruthy();
      expect(typeof entry.form).toEqual('object');
    });
  });

  it('skips exactly the four schemas that are not valid JSON', () => {
    const names = loadCorpus().map(e => e.name);
    SKIPPED_NOT_JSON.forEach(skipped => expect(names).not.toContain(skipped));
    expect(SKIPPED_NOT_JSON.length).toEqual(4);
  });

  it('covers the schemas the demo can actually load as JSON', () => {
    // 84 files on disk, 4 of which embed JavaScript and are eval'd by the demo.
    expect(loadCorpus().length).toEqual(80);
  });
});
