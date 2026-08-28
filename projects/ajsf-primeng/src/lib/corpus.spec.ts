import { PrimengFrameworkModule } from './primeng-framework.module';
import { runCorpus } from '../../../../testing/corpus/harness';

// The framework module re-exports JsonSchemaFormModule from '@ajsf/core'.
runCorpus('primeng', [PrimengFrameworkModule]);
