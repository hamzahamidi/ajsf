import { Bootstrap4FrameworkModule } from './bootstrap4-framework.module';
import { runCorpus } from '../../../../testing/corpus/harness';

// The framework module re-exports JsonSchemaFormModule from '@ajsf/core'.
runCorpus('bootstrap-4', [Bootstrap4FrameworkModule]);
