import { JsonSchemaFormModule } from './json-schema-form.module';
import { NoFrameworkModule } from './framework-library/no-framework.module';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CorpusHost, runCorpus } from '../../../../testing/corpus/harness';

// Source copies, because this project is @ajsf/core itself.
@Component({
  standalone: true,
  imports: [JsonSchemaFormModule, NoFrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <json-schema-form
      [form]="form"
      [framework]="framework"
      (isValid)="valid = $event"
    ></json-schema-form>`,
})
class CoreCorpusHost implements CorpusHost {
  form: any;
  framework: string;
  valid: boolean | null = null;
}

runCorpus('no-framework', CoreCorpusHost);
