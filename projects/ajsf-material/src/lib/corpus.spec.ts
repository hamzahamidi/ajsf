import { MaterialDesignFrameworkModule } from './material-design-framework.module';
import { Component } from '@angular/core';
import { CorpusHost, runCorpus } from '../../../../testing/corpus/harness';

// The framework module re-exports JsonSchemaFormModule from '@ajsf/core'.
@Component({
  standalone: true,
  imports: [MaterialDesignFrameworkModule],
  template: `
    <json-schema-form
      [form]="form"
      [framework]="framework"
      (isValid)="valid = $event"
    ></json-schema-form>`,
})
class MaterialCorpusHost implements CorpusHost {
  form: any;
  framework: string;
  valid: boolean | null = null;
}

runCorpus('material-design', MaterialCorpusHost);
