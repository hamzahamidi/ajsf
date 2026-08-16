import { Bootstrap5FrameworkModule } from './bootstrap5-framework.module';
import { runCorpus } from '../../../../testing/corpus/harness';

// The framework module re-exports JsonSchemaFormModule from '@ajsf/core'.
runCorpus('bootstrap-5', [Bootstrap5FrameworkModule]);
