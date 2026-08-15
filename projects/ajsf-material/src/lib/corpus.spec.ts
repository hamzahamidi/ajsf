import { MaterialDesignFrameworkModule } from './material-design-framework.module';
import { runCorpus } from '../../../../testing/corpus/harness';

// The framework module re-exports JsonSchemaFormModule from '@ajsf/core'.
runCorpus('material-design', [MaterialDesignFrameworkModule]);
