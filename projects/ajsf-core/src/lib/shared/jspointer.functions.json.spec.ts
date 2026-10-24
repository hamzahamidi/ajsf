import {JsonPointer} from './jsonpointer.functions';

const subObjectWithEvaluatedProperty = {name: 'abc', other_property: false};

describe('JsonPointer.evaluateExpression', () => {

  it('should return true when subObject and corresponding key is given', () => {
    const result = JsonPointer.evaluateExpression({name: 'abc', other_property: false}, 'name==\'abc\'');

    expect(result.passed).toEqual(true);
  });

  it('should not fail when subObject is null', () => {
    const result = JsonPointer.evaluateExpression(null, 'name==\'abc\'');

    expect(result).toBeDefined();
  });

  it('should not fail when subObject is undefined', () => {
    const result = JsonPointer.evaluateExpression(undefined, 'name==\'abc\'');

    expect(result).toBeDefined();
  });

  it('should return false when key is undefined', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, undefined);

    expect(result.passed).toBeFalsy();
  });

  it('should return false when key is null', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, null);

    expect(result.passed).toBeFalsy();
  });

  it.each([
    ['malformed expression', 'name=\'abc\''],
    ['missing property with equality', 'somethingElse==\'abc\''],
    ['missing property with a typo', 'eman==\'abc\''],
    ['different property value', 'name==\'cba\''],
  ])('should return false for a %s', (_case, expression) => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, expression);

    expect(result.passed).toBeFalsy();
  });

  it('should return the same key when key corrupted', () => {
    const key = 'name=\'abc\'';
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, key);

    expect(result.key).toEqual(key);
  });

  it('should not return the first part of key when key contains not equals', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'name!=\'abc\'');

    expect(result.key).not.toEqual('name');
  });

  it('should return true when key not equals does not correspond to the subObject property', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'somethingElse!=\'abc\'');

    expect(result.passed).toBeTruthy();
  });

  it.each([
    'name==\'abc\'',
    'name!=\'cba\'',
  ])('should return the property key for comparison %s', expression => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, expression);

    expect(result.key).toEqual('name');
  });

  it('should return true when key is without quotes', () => {
    const result = JsonPointer.evaluateExpression({name: 'abc', other_property: false}, 'name==abc');

    expect(result.passed).toEqual(true);
  });

});
