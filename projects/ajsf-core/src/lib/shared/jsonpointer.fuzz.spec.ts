import * as fc from 'fast-check';
import { JsonPointer } from './jsonpointer.functions';

describe('JsonPointer generated input checks', () => {
  it('round-trips arrays of non-empty pointer segments', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 40 }), { maxLength: 10 }),
        segments => expect(JsonPointer.parse(JsonPointer.compile(segments))).toEqual(segments),
      ),
      { numRuns: 200 },
    );
  });
});
