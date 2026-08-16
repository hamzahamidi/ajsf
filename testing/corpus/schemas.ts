import { CORPUS, SKIPPED_NOT_JSON } from './schemas.generated';

export interface CorpusSchema {
  /** File name without the .json extension, as the demo's example picker uses. */
  name: string;
  /** The whole parsed object, passed to json-schema-form's single `form` input. */
  form: any;
}

export { SKIPPED_NOT_JSON };

/**
 * The index is generated rather than discovered. Angular 15 stopped providing
 * require.context, so the previous approach failed at run time with
 * "__webpack_require__(...).context is not a function". Explicit imports work
 * on every Angular version and survive the later move to Vitest.
 *
 * Run `npm run corpus:index` after adding or removing an example schema.
 */
export function loadCorpus(): CorpusSchema[] {
  return CORPUS;
}
