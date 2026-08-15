import { JsonSchemaFormModule } from './json-schema-form.module';
import { NoFrameworkModule } from './framework-library/no-framework.module';
import { runCorpus } from '../../../../testing/corpus/harness';

// Source copies, because this project is @ajsf/core itself.
runCorpus('no-framework', [JsonSchemaFormModule, NoFrameworkModule]);
