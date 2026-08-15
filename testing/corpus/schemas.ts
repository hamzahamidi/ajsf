declare const require: any;

export interface CorpusSchema {
  /** File name without the .json extension, as used by the demo's example picker. */
  name: string;
  /** The whole parsed object, passed to json-schema-form's single `form` input. */
  form: any;
}

/**
 * Four of the example schemas are not valid JSON: they embed JavaScript event
 * handlers, and the demo falls back to `eval` for those (see
 * `demo.component.ts`, `generateForm`). Webpack's JSON loader parses at build
 * time, so including them here would break the build rather than the test.
 * They are skipped, and `EXPECTED_SKIPPED` keeps that honest: if the count
 * ever changes, `corpus.spec.ts` fails and someone has to look.
 */
export const SKIPPED_NOT_JSON = [
  'jsf-events',
  'rjsf-custom-array',
  'rjsf-validation',
  'rjsf-widgets',
];

export function loadCorpus(): CorpusSchema[] {
  // The exclusion has to live in this regex, not in a .filter() below.
  // require.context resolves at build time, so webpack's JSON loader parses
  // every match while bundling. Filtering afterwards is too late: the four
  // JavaScript-bearing files break the build, and karma then reports
  // "Executed 0 of 0 SUCCESS" rather than an error.
  //
  // Webpack statically analyses this call, so the pattern must be a literal
  // and cannot be built from SKIPPED_NOT_JSON. The spec asserts the two agree.
  const context = require.context(
    '../../demo/assets/example-schemas',
    false,
    /^\.\/(?!jsf-events|rjsf-custom-array|rjsf-validation|rjsf-widgets)[^/]*\.json$/
  );
  return context
    .keys()
    .sort()
    .map((key: string) => ({
      name: key.replace(/^\.\//, '').replace(/\.json$/, ''),
      form: context(key),
    }));
}
