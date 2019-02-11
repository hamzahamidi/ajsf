/**
 * An abstract AJV validator to allow sharing of the AJV instance outside of angular6-json-schema-form.
 *
 * This can be used to replace the AJV instance by providing an alternative factory in the module.
 * In this way teh AJV instance and registered schemas can be shared across the application.
 *
 * @example
 *
 * ```
 *   @NgModule({
 *     imports: [JsonSchemaFormModule],
 *     providers: [
 *       { provide: SchemaValidatorFactory, useClass: AnotherSchemaValidatorFactory }
 *     ]
 *   })
 * ```
 */
export abstract class SchemaValidatorFactory {
  /**
   * Register a schema. This should remove an already schema first.
   */
  abstract registerSchema(schema): any;

  /**
   * Compile a schema to create a schema validation function
   */
  abstract compile(schema): any;

  /**
   * Get a registered schema
   */
  abstract getSchema(schema, ref): any;
}
