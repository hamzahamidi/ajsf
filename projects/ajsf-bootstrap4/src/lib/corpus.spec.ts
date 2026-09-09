import { Bootstrap4FrameworkModule } from './bootstrap4-framework.module';
import { Component } from '@angular/core';
import { CorpusHost, runCorpus } from '../../../../testing/corpus/harness';

// The framework module re-exports JsonSchemaFormModule from '@ajsf/core'.
@Component({
  standalone: true,
  imports: [Bootstrap4FrameworkModule],
  template: `
    <json-schema-form
      [form]="form"
      [framework]="framework"
      (isValid)="valid = $event"
    ></json-schema-form>`,
})
class Bootstrap4CorpusHost implements CorpusHost {
  form: any;
  framework: string;
  valid: boolean | null = null;
}

runCorpus('bootstrap-4', Bootstrap4CorpusHost);
