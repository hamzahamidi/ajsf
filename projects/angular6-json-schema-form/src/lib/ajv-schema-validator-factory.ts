import jsonDraft6 from 'ajv/lib/refs/json-schema-draft-06.json';

import { Injectable } from '@angular/core';

import { SchemaValidatorFactory } from './schema-validator-factory';
import * as ajv from 'ajv';

@Injectable()
export class AjvSchemaValidatorFactory implements SchemaValidatorFactory {
  private ajv: ajv.Ajv = new ajv({
    allErrors: true,
    jsonPointers: true,
    unknownFormats: 'ignore',
    extendRefs: true
  });

  constructor() {
    this.registerSchema(jsonDraft6);
  }

  compile(schema: any): ajv.ValidateFunction {
    return this.ajv.compile(schema);
  }

  registerSchema(schema: any): any {
    if (schema) {
      try {
        this.ajv.removeSchema(schema.$id);
        this.ajv.addSchema(schema, schema.$id);
      } catch (err) {
        // tslint:disable-next-line:no-console
        console.log('registerSchema', schema.$id, err);
      }
    }
    return schema;
  }

  getSchema(schema: any, ref: string): any {
    const isValid = this.ajv.validateSchema(schema);
    if (isValid) {
      return this.getReference(schema, ref);
    } else {
      throw this.ajv.errors;
    }
  }

  private getReference(schema: any, ref: string): any {
    let foundSchema = schema;
    ref
      .split('/')
      .slice(1)
      .forEach(ptr => {
        if (ptr) {
          foundSchema = foundSchema[ptr];
        }
      });
    return foundSchema;
  }
}
