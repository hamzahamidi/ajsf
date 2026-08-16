import { Component, Type } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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

@Component({
  template: `
    <json-schema-form
      [form]="form"
      [framework]="framework"
      (isValid)="valid = $event"
    ></json-schema-form>`,
})
class CorpusHostComponent {
  form: any;
  framework: string;
  valid: boolean | null = null;
}

/**
 * Counts the form controls the framework actually rendered. Deliberately
 * counts native elements rather than AJSF internals: it is meant to notice
 * "this schema stopped rendering" across an Angular upgrade, not to assert
 * any particular widget implementation.
 */
function countControls(fixture: ComponentFixture<CorpusHostComponent>): number {
  return fixture.nativeElement.querySelectorAll(
    'input, select, textarea, mat-select, mat-slider'
  ).length;
}

/**
 * `modules` must supply both json-schema-form and the framework under test.
 *
 * Do not import JsonSchemaFormModule here. The framework packages import it
 * from '@ajsf/core', which tsconfig maps to dist/, while ajsf-core's own specs
 * use the source. Importing it in this file puts both copies in the same
 * TestBed and Angular fails with NG0300, "Multiple components match node with
 * tagname json-schema-form". Each spec passes whichever copy is right for it.
 */
export function runCorpus(frameworkName: string, modules: Type<any>[]) {
  describe(`corpus: ${frameworkName}`, () => {
    const corpus: CorpusSchema[] = loadCorpus();
    const recorded: Record<string, CorpusResult> = {};

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        // Whatever declares json-schema-form must be in here. Without it the
        // element matches nothing and every schema renders zero controls while
        // the suite still reports success.
        imports: [...modules, NoopAnimationsModule],
        declarations: [CorpusHostComponent],
        // Turn an unmatched element or binding into a failure rather than a
        // console warning, so this cannot silently regress again.
        schemas: [],
      }).compileComponents();
    }));

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
        const fixture = TestBed.createComponent(CorpusHostComponent);
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
        expect(expected)
          .withContext(`no baseline for ${key}. Re-record with RECORD = true.`)
          .toBeDefined();
        if (!expected) { return; }

        expect(error)
          .withContext(`${key} threw where the baseline did not`)
          .toEqual(expected.error);
        expect(controls)
          .withContext(`${key} rendered ${controls} controls, baseline has ${expected.controls}`)
          .toEqual(expected.controls);
        expect(valid)
          .withContext(`${key} validates as ${valid}, baseline has ${expected.valid}`)
          .toEqual(expected.valid);
      });
    });
  });
}
