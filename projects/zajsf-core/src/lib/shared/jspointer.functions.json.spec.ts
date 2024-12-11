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

  it('should return false when key corrupted', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'name=\'abc\'');

    expect(result.passed).toBeFalsy();
  });

  it('should return the same key when key corrupted', () => {
    const key = 'name=\'abc\'';
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, key);

    expect(result.key).toEqual(key);
  });

  it('should return the first part of key when key contains equals', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'name==\'abc\'');

    expect(result.key).toEqual('name');
  });

  it('should not return the first part of key when key contains not equals', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'name!=\'abc\'');

    expect(result.key).not.toEqual('name');
  });

  it('should return false when key equals does not correspond to the subObject property', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'somethingElse==\'abc\'');

    expect(result.passed).toBeFalsy();
  });

  it('should return true when key not equals does not correspond to the subObject property', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'somethingElse!=\'abc\'');

    expect(result.passed).toBeTruthy();
  });

  it('should return the first part of key when key does not equal to the property value', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'name!=\'cba\'');

    expect(result.key).toEqual('name');
  });

  it('should return the first part of key when key does equal to the property value', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'name==\'abc\'');

    expect(result.key).toEqual('name');
  });

  it('should return false when key is different', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'eman==\'abc\'');

    expect(result.passed).toBeFalsy();
  });

  it('should return true when key is without quotes', () => {
    const result = JsonPointer.evaluateExpression({name: 'abc', other_property: false}, 'name==abc');

    expect(result.passed).toEqual(true);
  });

  it('should return false when key has different value', () => {
    const result = JsonPointer.evaluateExpression(subObjectWithEvaluatedProperty, 'name==\'cba\'');

    expect(result.passed).toBeFalsy();
  });
});
