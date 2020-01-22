/*
 * Public API Surface of json-schema-form
 */

export { JsonSchemaFormModule } from './lib/json-schema-form.module';
export { TitleMapItem, ErrorMessages, JsonSchemaFormService } from './lib/json-schema-form.service';
export { JsonSchemaFormComponent } from './lib/json-schema-form.component';
export { Framework } from './lib/framework-library/framework';
export { FrameworkLibraryService } from './lib/framework-library/framework-library.service';
export {
    enValidationMessages,
    frValidationMessages,
    zhValidationMessages,
    itValidationMessages,
  } from './lib/locale';
export * from './lib/widget-library';
export * from './lib/widget-library/widget-library.module';
export * from './lib/shared';
