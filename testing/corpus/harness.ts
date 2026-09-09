import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CorpusSchema, loadCorpus } from './schemas';
import baseline from './baseline.json';

/**
 * Set to true, run the suites, and copy the printed JSON into baseline.json.
 * Karma runs in a browser and cannot write files, so recording goes through
 * the console.
 */
const RECORD = false;

export interface CorpusResult {
  controls: number;
  error: string | null;
  /** Validity with nothing filled in, or null if the form never emitted. */
  valid: boolean | null;
}

/**
 * What every suite's host component must expose. The host owns the template
 * rather than this file, because the template's dependencies have to be known
 * at compile time and they differ per suite: ajsf-core renders through its
 * source JsonSchemaFormModule while the framework packages reach the same
 * component through dist/@ajsf/core. A single shared host cannot import
 * either without the two copies colliding as NG0300.
 */
export interface CorpusHost {
  form: any;
  framework: string;
  valid: boolean | null;
}

/**
 * Counts the form controls the framework actually rendered. Deliberately
 * counts native elements rather than AJSF internals: it is meant to notice
 * "this schema stopped rendering" across an Angular upgrade, not to assert
 * any particular widget implementation.
 */
function countControls(fixture: ComponentFixture<CorpusHost>): number {
  return fixture.nativeElement.querySelectorAll(
    'input, select, textarea, mat-select, mat-slider, p-select, p-multiselect, p-slider'
  ).length;
}

/**
 * Attaches a failure message in a way both runners accept, so this shared file
 * compiles while the six suites migrate one at a time.
 *
 * Jasmine types `expect` as taking one argument and carries `.withContext()`.
 * Vitest types it as taking an optional message and has no `.withContext()`.
 * Passing through `any` satisfies whichever `types` setting the consuming
 * project declares, and the runtime picks whichever mechanism exists.
 */
function because<T>(actual: T, message: string): any {
  const assertion = (expect as any)(actual, message);
  return typeof assertion.withContext === 'function'
    ? assertion.withContext(message)
    : assertion;
}

/**
 * `host` is the suite's own standalone component, which must render
 * json-schema-form and satisfy CorpusHost.
 *
 * The host is passed in rather than declared here so its template
 * dependencies are statically known. ajsf-core passes a host importing its
 * source JsonSchemaFormModule; each framework package passes one importing
 * its own framework module, which reaches JsonSchemaFormModule through
 * dist/@ajsf/core. Declaring one shared host here and importing
 * JsonSchemaFormModule into it would put both copies in the same TestBed and
 * fail with NG0300, "Multiple components match node with tagname
 * json-schema-form".
 */
export function runCorpus(frameworkName: string, host: Type<CorpusHost>) {
  describe(`corpus: ${frameworkName}`, () => {
    const corpus: CorpusSchema[] = loadCorpus();
    const recorded: Record<string, CorpusResult> = {};

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        // The host is standalone, so it carries json-schema-form and the
        // framework under test in its own imports. Without them the element
        // matches nothing and every schema renders zero controls while the
        // suite still reports success.
        imports: [host, NoopAnimationsModule],
        // Kept for clarity. Compiling the host ahead of time is now what
        // actually rejects an unmatched element or binding.
        schemas: [],
      }).compileComponents();
    });

    afterAll(() => {
      if (RECORD) {
        // eslint-disable-next-line no-console
        console.log(`CORPUS_BASELINE ${frameworkName} ${JSON.stringify(recorded)}`);
      }
    });

    it('has schemas to render', () => {
      expect(corpus.length).toBeGreaterThan(0);
    });

    corpus.forEach((entry) => {
      it(`renders ${entry.name}`, () => {
        const key = `${frameworkName}/${entry.name}`;
        const fixture = TestBed.createComponent(host);
        fixture.componentInstance.form = entry.form;
        fixture.componentInstance.framework = frameworkName;

        let error: string | null = null;
        let controls = 0;
        try {
          fixture.detectChanges();
          controls = countControls(fixture);
        } catch (e) {
          error = (e as Error).message || String(e);
        }
        const valid = fixture.componentInstance.valid;

        if (RECORD) {
          recorded[key] = { controls, error, valid };
          return;
        }

        const expected: CorpusResult = (baseline as any)[key];
        because(expected, `no baseline for ${key}. Re-record with RECORD = true.`)
          .toBeDefined();
        if (!expected) { return; }

        because(error, `${key} threw where the baseline did not`)
          .toEqual(expected.error);
        because(controls, `${key} rendered ${controls} controls, baseline has ${expected.controls}`)
          .toEqual(expected.controls);
        because(valid, `${key} validates as ${valid}, baseline has ${expected.valid}`)
          .toEqual(expected.valid);
      });
    });
  });
}
