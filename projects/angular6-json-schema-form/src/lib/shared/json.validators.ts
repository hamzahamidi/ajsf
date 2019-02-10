import isEqual from 'lodash-es/isEqual';
import {
  _executeAsyncValidators,
  _executeValidators,
  _mergeErrors,
  _mergeObjects,
  AsyncIValidatorFn,
  getType,
  hasValue,
  isArray,
  isBoolean,
  isDefined,
  isEmpty,
  isNumber,
  isString,
  isType,
  IValidatorFn,
  SchemaPrimitiveType,
  toJavaScriptType,
  toObservable,
  xor
  } from './validator.functions';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { forEachCopy } from './utility.functions';
import { forkJoin } from 'rxjs';
import { JsonSchemaFormatNames, jsonSchemaFormatTests } from './format-regex.constants';
import { map } from 'rxjs/operators';



/**
 * 'JsonValidators' class
 *
 * Provides an extended set of validators to be used by form controls,
 * compatible with standard JSON Schema validation options.
 * http://json-schema.org/latest/json-schema-validation.html
 *
 * Note: This library is designed as a drop-in replacement for the Angular
 * Validators library, and except for one small breaking change to the 'pattern'
 * validator (described below) it can even be imported as a substitute, like so:
 *
 *   import { JsonValidators as Validators } from 'json-validators';
 *
 * and it should work with existing code as a complete replacement.
 *
 * The one exception is the 'pattern' validator, which has been changed to
 * matche partial values by default (the standard 'pattern' validator wrapped
 * all patterns in '^' and '$', forcing them to always match an entire value).
 * However, the old behavior can be restored by simply adding '^' and '$'
 * around your patterns, or by passing an optional second parameter of TRUE.
 * This change is to make the 'pattern' validator match the behavior of a
 * JSON Schema pattern, which allows partial matches, rather than the behavior
 * of an HTML input control pattern, which does not.
 *
 * This library replaces Angular's validators and combination functions
 * with the following validators and transformation functions:
 *
 * Validators:
 *   For all formControls:     required (*), type, enum, const
 *   For text formControls:    minLength (*), maxLength (*), pattern (*), format
 *   For numeric formControls: maximum, exclusiveMaximum,
 *                             minimum, exclusiveMinimum, multipleOf
 *   For formGroup objects:    minProperties, maxProperties, dependencies
 *   For formArray arrays:     minItems, maxItems, uniqueItems, contains
 *   Not used by JSON Schema:  min (*), max (*), requiredTrue (*), email (*)
 * (Validators originally included with Angular are maked with (*).)
 *
 * NOTE / TODO: The dependencies validator is not complete.
 * NOTE / TODO: The contains validator is not complete.
 *
 * Validators not used by JSON Schema (but included for compatibility)
 * and their JSON Schema equivalents:
 *
 *   Angular validator | JSON Schema equivalent
 *   ------------------|-----------------------
 *     min(number)     |   minimum(number)
 *     max(number)     |   maximum(number)
 *     requiredTrue()  |   const(true)
 *     email()         |   format('email')
 *
 * Validator transformation functions:
 *   composeAnyOf, composeOneOf, composeAllOf, composeNot
 * (Angular's original combination funciton, 'compose', is also included for
 * backward compatibility, though it is functionally equivalent to composeAllOf,
 * asside from its more generic error message.)
 *
 * All validators have also been extended to accept an optional second argument
 * which, if passed a TRUE value, causes the validator to perform the opposite
 * of its original finction. (This is used internally to enable 'not' and
 * 'composeOneOf' to function and return useful error messages.)
 *
 * The 'required' validator has also been overloaded so that if called with
 * a boolean parameter (or no parameters) it returns the original validator
 * function (rather than executing it). However, if it is called with an
 * AbstractControl parameter (as was previously required), it behaves
 * exactly as before.
 *
 * This enables all validators (including 'required') to be constructed in
 * exactly the same way, so they can be automatically applied using the
 * equivalent key names and values taken directly from a JSON Schema.
 *
 * This source code is partially derived from Angular,
 * which is Copyright (c) 2014-2017 Google, Inc.
 * Use of this source code is therefore governed by the same MIT-style license
 * that can be found in the LICENSE file at https://angular.io/license
 *
 * Original Angular Validators:
 * https://github.com/angular/angular/blob/master/packages/forms/src/validators.ts
 */
export class JsonValidators {

  /**
   * Validator functions:
   *
   * For all formControls:     required, type, enum, const
   * For text formControls:    minLength, maxLength, pattern, format
   * For numeric formControls: maximum, exclusiveMaximum,
   *                           minimum, exclusiveMinimum, multipleOf
   * For formGroup objects:    minProperties, maxProperties, dependencies
   * For formArray arrays:     minItems, maxItems, uniqueItems, contains
   *
   * TODO: finish dependencies validator
   */

  /**
   * 'required' validator
   *
   * This validator is overloaded, compared to the default required validator.
   * If called with no parameters, or TRUE, this validator returns the
   * 'required' validator function (rather than executing it). This matches
   * the behavior of all other validators in this library.
   *
   * If this validator is called with an AbstractControl parameter
   * (as was previously required) it behaves the same as Angular's default
   * required validator, and returns an error if the control is empty.
   *
   * Old behavior: (if input type = AbstractControl)
   * // {AbstractControl} control - required control
   * // {{[key: string]: boolean}} - returns error message if no input
   *
   * New behavior: (if no input, or input type = boolean)
   * // {boolean = true} required? - true to validate, false to disable
   * // {IValidatorFn} - returns the 'required' validator function itself
   */
  static required(input: AbstractControl): ValidationErrors|null;
  static required(input?: boolean): IValidatorFn;

  static required(input?: AbstractControl|boolean): ValidationErrors|null|IValidatorFn {
    if (input === undefined) { input = true; }
    switch (input) {
      case true: // Return required function (do not execute it yet)
        return (control: AbstractControl, invert = false): ValidationErrors|null => {
          if (invert) { return null; } // if not required, always return valid
          return hasValue(control.value) ? null : { 'required': true };
        };
      case false: // Do nothing (if field is not required, it is always valid)
        return JsonValidators.nullValidator;
      default: // Execute required function
        return hasValue((<AbstractControl>input).value) ? null : { 'required': true };
    }
  }

  /**
   * 'type' validator
   *
   * Requires a control to only accept values of a specified type,
   * or one of an array of types.
   *
   * Note: SchemaPrimitiveType = 'string'|'number'|'integer'|'boolean'|'null'
   *
   * // {SchemaPrimitiveType|SchemaPrimitiveType[]} type - type(s) to accept
   * // {IValidatorFn}
   */
  static type(requiredType: SchemaPrimitiveType|SchemaPrimitiveType[]): IValidatorFn {
    if (!hasValue(requiredType)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentValue: any = control.value;
      const isValid = isArray(requiredType) ?
        (<SchemaPrimitiveType[]>requiredType).some(type => isType(currentValue, type)) :
        isType(currentValue, <SchemaPrimitiveType>requiredType);
      return xor(isValid, invert) ?
        null : { 'type': { requiredType, currentValue } };
    };
  }

  /**
   * 'enum' validator
   *
   * Requires a control to have a value from an enumerated list of values.
   *
   * Converts types as needed to allow string inputs to still correctly
   * match number, boolean, and null enum values.
   *
   * // {any[]} allowedValues - array of acceptable values
   * // {IValidatorFn}
   */
  static enum(allowedValues: any[]): IValidatorFn {
    if (!isArray(allowedValues)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentValue: any = control.value;
      const isEqualVal = (enumValue, inputValue) =>
        enumValue === inputValue ||
        (isNumber(enumValue) && +inputValue === +enumValue) ||
        (isBoolean(enumValue, 'strict') &&
          toJavaScriptType(inputValue, 'boolean') === enumValue) ||
        (enumValue === null && !hasValue(inputValue)) ||
        isEqual(enumValue, inputValue);
      const isValid = isArray(currentValue) ?
        currentValue.every(inputValue => allowedValues.some(enumValue =>
          isEqualVal(enumValue, inputValue)
        )) :
        allowedValues.some(enumValue => isEqualVal(enumValue, currentValue));
      return xor(isValid, invert) ?
        null : { 'enum': { allowedValues, currentValue } };
    };
  }

  /**
   * 'const' validator
   *
   * Requires a control to have a specific value.
   *
   * Converts types as needed to allow string inputs to still correctly
   * match number, boolean, and null values.
   *
   * TODO: modify to work with objects
   *
   * // {any[]} requiredValue - required value
   * // {IValidatorFn}
   */
  static const(requiredValue: any): IValidatorFn {
    if (!hasValue(requiredValue)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentValue: any = control.value;
      const isEqualVal = (constValue, inputValue) =>
        constValue === inputValue ||
        isNumber(constValue) && +inputValue === +constValue ||
        isBoolean(constValue, 'strict') &&
          toJavaScriptType(inputValue, 'boolean') === constValue ||
        constValue === null && !hasValue(inputValue);
      const isValid = isEqualVal(requiredValue, currentValue);
      return xor(isValid, invert) ?
        null : { 'const': { requiredValue, currentValue } };
    };
  }

  /**
   * 'minLength' validator
   *
   * Requires a control's text value to be greater than a specified length.
   *
   * // {number} minimumLength - minimum allowed string length
   * // {boolean = false} invert - instead return error object only if valid
   * // {IValidatorFn}
   */
  static minLength(minimumLength: number): IValidatorFn {
    if (!hasValue(minimumLength)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentLength = isString(control.value) ? control.value.length : 0;
      const isValid = currentLength >= minimumLength;
      return xor(isValid, invert) ?
        null : { 'minLength': { minimumLength, currentLength } };
    };
  }

  /**
   * 'maxLength' validator
   *
   * Requires a control's text value to be less than a specified length.
   *
   * // {number} maximumLength - maximum allowed string length
   * // {boolean = false} invert - instead return error object only if valid
   * // {IValidatorFn}
   */
  static maxLength(maximumLength: number): IValidatorFn {
    if (!hasValue(maximumLength)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      const currentLength = isString(control.value) ? control.value.length : 0;
      const isValid = currentLength <= maximumLength;
      return xor(isValid, invert) ?
        null : { 'maxLength': { maximumLength, currentLength } };
    };
  }

  /**
   * 'pattern' validator
   *
   * Note: NOT the same as Angular's default pattern validator.
   *
   * Requires a control's value to match a specified regular expression pattern.
   *
   * This validator changes the behavior of default pattern validator
   * by replacing RegExp(`^${pattern}$`) with RegExp(`${pattern}`),
   * which allows for partial matches.
   *
   * To return to the default funcitonality, and match the entire string,
   * pass TRUE as the optional second parameter.
   *
   * // {string} pattern - regular expression pattern
   * // {boolean = false} wholeString - match whole value string?
   * // {IValidatorFn}
   */
  static pattern(pattern: string|RegExp, wholeString = false): IValidatorFn {
    if (!hasValue(pattern)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      let regex: RegExp;
      let requiredPattern: string;
      if (typeof pattern === 'string') {
        requiredPattern = (wholeString) ? `^${pattern}$` : pattern;
        regex = new RegExp(requiredPattern);
      } else {
        requiredPattern = pattern.toString();
        regex = pattern;
      }
      const currentValue: string = control.value;
      const isValid = isString(currentValue) ? regex.test(currentValue) : false;
      return xor(isValid, invert) ?
        null : { 'pattern': { requiredPattern, currentValue } };
    };
  }

  /**
   * 'format' validator
   *
   * Requires a control to have a value of a certain format.
   *
   * This validator currently checks the following formsts:
   *   date, time, date-time, email, hostname, ipv4, ipv6,
   *   uri, uri-reference, uri-template, url, uuid, color,
   *   json-pointer, relative-json-pointer, regex
   *
   * Fast format regular expressions copied from AJV:
   * https://github.com/epoberezkin/ajv/blob/master/lib/compile/formats.js
   *
   * // {JsonSchemaFormatNames} requiredFormat - format to check
   * // {IValidatorFn}
   */
  static format(requiredFormat: JsonSchemaFormatNames): IValidatorFn {
    if (!hasValue(requiredFormat)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      let isValid: boolean;
      const currentValue: string|Date = control.value;
      if (isString(currentValue)) {
        const formatTest: Function|RegExp = jsonSchemaFormatTests[requiredFormat];
        if (typeof formatTest === 'object') {
          isValid = (<RegExp>formatTest).test(<string>currentValue);
        } else if (typeof formatTest === 'function') {
          isValid = (<Function>formatTest)(<string>currentValue);
        } else {
          console.error(`format validator error: "${requiredFormat}" is not a recognized format.`);
          isValid = true;
        }
      } else {
        // Allow JavaScript Date objects
        isValid = ['date', 'time', 'date-time'].includes(requiredFormat) &&
          Object.prototype.toString.call(currentValue) === '[object Date]';
      }
      return xor(isValid, invert) ?
        null : { 'format': { requiredFormat, currentValue } };
    };
  }

  /**
   * 'minimum' validator
   *
   * Requires a control's numeric value to be greater than or equal to
   * a minimum amount.
   *
   * Any non-numeric value is also valid (according to the HTML forms spec,
   * a non-numeric value doesn't have a minimum).
   * https://www.w3.org/TR/html5/forms.html#attr-input-max
   *
   * // {number} minimum - minimum allowed value
   * // {IValidatorFn}
   */
  static minimum(minimumValue: number): IValidatorFn {
    if (!hasValue(minimumValue)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentValue = control.value;
      const isValid = !isNumber(currentValue) || currentValue >= minimumValue;
      return xor(isValid, invert) ?
        null : { 'minimum': { minimumValue, currentValue } };
    };
  }

  /**
   * 'exclusiveMinimum' validator
   *
   * Requires a control's numeric value to be less than a maximum amount.
   *
   * Any non-numeric value is also valid (according to the HTML forms spec,
   * a non-numeric value doesn't have a maximum).
   * https://www.w3.org/TR/html5/forms.html#attr-input-max
   *
   * // {number} exclusiveMinimumValue - maximum allowed value
   * // {IValidatorFn}
   */
  static exclusiveMinimum(exclusiveMinimumValue: number): IValidatorFn {
    if (!hasValue(exclusiveMinimumValue)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentValue = control.value;
      const isValid = !isNumber(currentValue) || +currentValue < exclusiveMinimumValue;
      return xor(isValid, invert) ?
        null : { 'exclusiveMinimum': { exclusiveMinimumValue, currentValue } };
    };
  }

  /**
   * 'maximum' validator
   *
   * Requires a control's numeric value to be less than or equal to
   * a maximum amount.
   *
   * Any non-numeric value is also valid (according to the HTML forms spec,
   * a non-numeric value doesn't have a maximum).
   * https://www.w3.org/TR/html5/forms.html#attr-input-max
   *
   * // {number} maximumValue - maximum allowed value
   * // {IValidatorFn}
   */
  static maximum(maximumValue: number): IValidatorFn {
    if (!hasValue(maximumValue)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentValue = control.value;
      const isValid = !isNumber(currentValue) || +currentValue <= maximumValue;
      return xor(isValid, invert) ?
        null : { 'maximum': { maximumValue, currentValue } };
    };
  }

  /**
   * 'exclusiveMaximum' validator
   *
   * Requires a control's numeric value to be less than a maximum amount.
   *
   * Any non-numeric value is also valid (according to the HTML forms spec,
   * a non-numeric value doesn't have a maximum).
   * https://www.w3.org/TR/html5/forms.html#attr-input-max
   *
   * // {number} exclusiveMaximumValue - maximum allowed value
   * // {IValidatorFn}
   */
  static exclusiveMaximum(exclusiveMaximumValue: number): IValidatorFn {
    if (!hasValue(exclusiveMaximumValue)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentValue = control.value;
      const isValid = !isNumber(currentValue) || +currentValue < exclusiveMaximumValue;
      return xor(isValid, invert) ?
        null : { 'exclusiveMaximum': { exclusiveMaximumValue, currentValue } };
    };
  }

  /**
   * 'multipleOf' validator
   *
   * Requires a control to have a numeric value that is a multiple
   * of a specified number.
   *
   * // {number} multipleOfValue - number value must be a multiple of
   * // {IValidatorFn}
   */
  static multipleOf(multipleOfValue: number): IValidatorFn {
    if (!hasValue(multipleOfValue)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentValue = control.value;
      const isValid = isNumber(currentValue) &&
        currentValue % multipleOfValue === 0;
      return xor(isValid, invert) ?
        null : { 'multipleOf': { multipleOfValue, currentValue } };
    };
  }

  /**
   * 'minProperties' validator
   *
   * Requires a form group to have a minimum number of properties (i.e. have
   * values entered in a minimum number of controls within the group).
   *
   * // {number} minimumProperties - minimum number of properties allowed
   * // {IValidatorFn}
   */
  static minProperties(minimumProperties: number): IValidatorFn {
    if (!hasValue(minimumProperties)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentProperties = Object.keys(control.value).length || 0;
      const isValid = currentProperties >= minimumProperties;
      return xor(isValid, invert) ?
        null : { 'minProperties': { minimumProperties, currentProperties } };
    };
  }

  /**
   * 'maxProperties' validator
   *
   * Requires a form group to have a maximum number of properties (i.e. have
   * values entered in a maximum number of controls within the group).
   *
   * Note: Has no effect if the form group does not contain more than the
   * maximum number of controls.
   *
   * // {number} maximumProperties - maximum number of properties allowed
   * // {IValidatorFn}
   */
  static maxProperties(maximumProperties: number): IValidatorFn {
    if (!hasValue(maximumProperties)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      const currentProperties = Object.keys(control.value).length || 0;
      const isValid = currentProperties <= maximumProperties;
      return xor(isValid, invert) ?
        null : { 'maxProperties': { maximumProperties, currentProperties } };
    };
  }

  /**
   * 'dependencies' validator
   *
   * Requires the controls in a form group to meet additional validation
   * criteria, depending on the values of other controls in the group.
   *
   * Examples:
   * https://spacetelescope.github.io/understanding-json-schema/reference/object.html#dependencies
   *
   * // {any} dependencies - required dependencies
   * // {IValidatorFn}
   */
  static dependencies(dependencies: any): IValidatorFn {
    if (getType(dependencies) !== 'object' || isEmpty(dependencies)) {
      return JsonValidators.nullValidator;
    }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const allErrors = _mergeObjects(
        forEachCopy(dependencies, (value, requiringField) => {
          if (!hasValue(control.value[requiringField])) { return null; }
          let requiringFieldErrors: ValidationErrors = { };
          let requiredFields: string[];
          let properties: ValidationErrors = { };
          if (getType(dependencies[requiringField]) === 'array') {
            requiredFields = dependencies[requiringField];
          } else if (getType(dependencies[requiringField]) === 'object') {
            requiredFields = dependencies[requiringField]['required'] || [];
            properties = dependencies[requiringField]['properties'] || { };
          }

          // Validate property dependencies
          for (const requiredField of requiredFields) {
            if (xor(!hasValue(control.value[requiredField]), invert)) {
              requiringFieldErrors[requiredField] = { 'required': true };
            }
          }

          // Validate schema dependencies
          requiringFieldErrors = _mergeObjects(requiringFieldErrors,
            forEachCopy(properties, (requirements, requiredField) => {
              const requiredFieldErrors = _mergeObjects(
                forEachCopy(requirements, (requirement, parameter) => {
                  let validator: IValidatorFn = null;
                  if (requirement === 'maximum' || requirement === 'minimum') {
                    const exclusive = !!requirements['exclusiveM' + requirement.slice(1)];
                    validator = JsonValidators[requirement](parameter, exclusive);
                  } else if (typeof JsonValidators[requirement] === 'function') {
                    validator = JsonValidators[requirement](parameter);
                  }
                  return !isDefined(validator) ?
                    null : validator(control.value[requiredField]);
                })
              );
              return isEmpty(requiredFieldErrors) ?
                null : { [requiredField]: requiredFieldErrors };
            })
          );
          return isEmpty(requiringFieldErrors) ?
            null : { [requiringField]: requiringFieldErrors };
        })
      );
      return isEmpty(allErrors) ? null : allErrors;
    };
  }

  /**
   * 'minItems' validator
   *
   * Requires a form array to have a minimum number of values.
   *
   * // {number} minimumItems - minimum number of items allowed
   * // {IValidatorFn}
   */
  static minItems(minimumItems: number): IValidatorFn {
    if (!hasValue(minimumItems)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const currentItems = isArray(control.value) ? control.value.length : 0;
      const isValid = currentItems >= minimumItems;
      return xor(isValid, invert) ?
        null : { 'minItems': { minimumItems, currentItems } };
    };
  }

  /**
   * 'maxItems' validator
   *
   * Requires a form array to have a maximum number of values.
   *
   * // {number} maximumItems - maximum number of items allowed
   * // {IValidatorFn}
   */
  static maxItems(maximumItems: number): IValidatorFn {
    if (!hasValue(maximumItems)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      const currentItems = isArray(control.value) ? control.value.length : 0;
      const isValid = currentItems <= maximumItems;
      return xor(isValid, invert) ?
        null : { 'maxItems': { maximumItems, currentItems } };
    };
  }

  /**
   * 'uniqueItems' validator
   *
   * Requires values in a form array to be unique.
   *
   * // {boolean = true} unique? - true to validate, false to disable
   * // {IValidatorFn}
   */
  static uniqueItems(unique = true): IValidatorFn {
    if (!unique) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const sorted: any[] = control.value.slice().sort();
      const duplicateItems = [];
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i - 1] === sorted[i] && duplicateItems.includes(sorted[i])) {
          duplicateItems.push(sorted[i]);
        }
      }
      const isValid = !duplicateItems.length;
      return xor(isValid, invert) ?
        null : { 'uniqueItems': { duplicateItems } };
    };
  }

  /**
   * 'contains' validator
   *
   * TODO: Complete this validator
   *
   * Requires values in a form array to be unique.
   *
   * // {boolean = true} unique? - true to validate, false to disable
   * // {IValidatorFn}
   */
  static contains(requiredItem = true): IValidatorFn {
    if (!requiredItem) { return JsonValidators.nullValidator; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value) || !isArray(control.value)) { return null; }
      const currentItems = control.value;
      // const isValid = currentItems.some(item =>
      //
      // );
      const isValid = true;
      return xor(isValid, invert) ?
        null : { 'contains': { requiredItem, currentItems } };
    };
  }

  /**
   * No-op validator. Included for backward compatibility.
   */
  static nullValidator(control: AbstractControl): ValidationErrors|null {
    return null;
  }

  /**
   * Validator transformation functions:
   * composeAnyOf, composeOneOf, composeAllOf, composeNot,
   * compose, composeAsync
   *
   * TODO: Add composeAnyOfAsync, composeOneOfAsync,
   *           composeAllOfAsync, composeNotAsync
   */

  /**
   * 'composeAnyOf' validator combination function
   *
   * Accepts an array of validators and returns a single validator that
   * evaluates to valid if any one or more of the submitted validators are
   * valid. If every validator is invalid, it returns combined errors from
   * all validators.
   *
   * // {IValidatorFn[]} validators - array of validators to combine
   * // {IValidatorFn} - single combined validator function
   */
  static composeAnyOf(validators: IValidatorFn[]): IValidatorFn {
    if (!validators) { return null; }
    const presentValidators = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      const arrayOfErrors =
        _executeValidators(control, presentValidators, invert).filter(isDefined);
      const isValid = validators.length > arrayOfErrors.length;
      return xor(isValid, invert) ?
        null : _mergeObjects(...arrayOfErrors, { 'anyOf': !invert });
    };
  }

  /**
   * 'composeOneOf' validator combination function
   *
   * Accepts an array of validators and returns a single validator that
   * evaluates to valid only if exactly one of the submitted validators
   * is valid. Otherwise returns combined information from all validators,
   * both valid and invalid.
   *
   * // {IValidatorFn[]} validators - array of validators to combine
   * // {IValidatorFn} - single combined validator function
   */
  static composeOneOf(validators: IValidatorFn[]): IValidatorFn {
    if (!validators) { return null; }
    const presentValidators = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      const arrayOfErrors =
        _executeValidators(control, presentValidators);
      const validControls =
        validators.length - arrayOfErrors.filter(isDefined).length;
      const isValid = validControls === 1;
      if (xor(isValid, invert)) { return null; }
      const arrayOfValids =
        _executeValidators(control, presentValidators, invert);
      return _mergeObjects(...arrayOfErrors, ...arrayOfValids, { 'oneOf': !invert });
    };
  }

  /**
   * 'composeAllOf' validator combination function
   *
   * Accepts an array of validators and returns a single validator that
   * evaluates to valid only if all the submitted validators are individually
   * valid. Otherwise it returns combined errors from all invalid validators.
   *
   * // {IValidatorFn[]} validators - array of validators to combine
   * // {IValidatorFn} - single combined validator function
   */
  static composeAllOf(validators: IValidatorFn[]): IValidatorFn {
    if (!validators) { return null; }
    const presentValidators = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      const combinedErrors = _mergeErrors(
        _executeValidators(control, presentValidators, invert)
      );
      const isValid = combinedErrors === null;
      return (xor(isValid, invert)) ?
        null : _mergeObjects(combinedErrors, { 'allOf': !invert });
    };
  }

  /**
   * 'composeNot' validator inversion function
   *
   * Accepts a single validator function and inverts its result.
   * Returns valid if the submitted validator is invalid, and
   * returns invalid if the submitted validator is valid.
   * (Note: this function can itself be inverted
   *   - e.g. composeNot(composeNot(validator)) -
   *   but this can be confusing and is therefore not recommended.)
   *
   * // {IValidatorFn[]} validators - validator(s) to invert
   * // {IValidatorFn} - new validator function that returns opposite result
   */
  static composeNot(validator: IValidatorFn): IValidatorFn {
    if (!validator) { return null; }
    return (control: AbstractControl, invert = false): ValidationErrors|null => {
      if (isEmpty(control.value)) { return null; }
      const error = validator(control, !invert);
      const isValid = error === null;
      return (xor(isValid, invert)) ?
        null : _mergeObjects(error, { 'not': !invert });
    };
  }

  /**
   * 'compose' validator combination function
   *
   * // {IValidatorFn[]} validators - array of validators to combine
   * // {IValidatorFn} - single combined validator function
   */
  static compose(validators: IValidatorFn[]): IValidatorFn {
    if (!validators) { return null; }
    const presentValidators = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
    return (control: AbstractControl, invert = false): ValidationErrors|null =>
      _mergeErrors(_executeValidators(control, presentValidators, invert));
  }

  /**
   * 'composeAsync' async validator combination function
   *
   * // {AsyncIValidatorFn[]} async validators - array of async validators
   * // {AsyncIValidatorFn} - single combined async validator function
   */
  static composeAsync(validators: AsyncIValidatorFn[]): AsyncIValidatorFn {
    if (!validators) { return null; }
    const presentValidators = validators.filter(isDefined);
    if (presentValidators.length === 0) { return null; }
    return (control: AbstractControl) => {
      const observables =
        _executeAsyncValidators(control, presentValidators).map(toObservable);
      return map.call(forkJoin(observables), _mergeErrors);
    };
  }

  // Additional angular validators (not used by Angualr JSON Schema Form)
  // From https://github.com/angular/angular/blob/master/packages/forms/src/validators.ts

  /**
   * Validator that requires controls to have a value greater than a number.
   */
  static min(min: number): ValidatorFn {
    if (!hasValue(min)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl): ValidationErrors|null => {
      // don't validate empty values to allow optional controls
      if (isEmpty(control.value) || isEmpty(min)) { return null; }
      const value = parseFloat(control.value);
      const actual = control.value;
      // Controls with NaN values after parsing should be treated as not having a
      // minimum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-min
      return isNaN(value) || value >= min ? null : { 'min': { min, actual } };
    };
  }

  /**
   * Validator that requires controls to have a value less than a number.
   */
  static max(max: number): ValidatorFn {
    if (!hasValue(max)) { return JsonValidators.nullValidator; }
    return (control: AbstractControl): ValidationErrors|null => {
      // don't validate empty values to allow optional controls
      if (isEmpty(control.value) || isEmpty(max)) { return null; }
      const value = parseFloat(control.value);
      const actual = control.value;
      // Controls with NaN values after parsing should be treated as not having a
      // maximum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-max
      return isNaN(value) || value <= max ? null : { 'max': { max, actual } };
    };
  }

  /**
   * Validator that requires control value to be true.
   */
  static requiredTrue(control: AbstractControl): ValidationErrors|null {
    if (!control) { return JsonValidators.nullValidator; }
    return control.value === true ? null : { 'required': true };
  }

  /**
   * Validator that performs email validation.
   */
  static email(control: AbstractControl): ValidationErrors|null {
    if (!control) { return JsonValidators.nullValidator; }
    const EMAIL_REGEXP =
      // tslint:disable-next-line:max-line-length
      /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
    return EMAIL_REGEXP.test(control.value) ? null : { 'email': true };
  }
}
