import { Bootstrap3FrameworkModule } from './bootstrap3-framework.module';
import { runCorpus } from '../../../../testing/corpus/harness';

// The framework module re-exports JsonSchemaFormModule from '@ajsf/core'.
runCorpus('bootstrap-3', [Bootstrap3FrameworkModule]);
