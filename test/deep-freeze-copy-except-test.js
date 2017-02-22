import assert from 'assert';
import deepFreezeCopyExcept from '../src/deep-freeze-copy-except';
import {Enum} from '../src/enum';

suite('deep-freeze-copy-except-test', () => {
  test('it makes a deep copy of nested objects and arrays, without copying values that satisfy the given predicate', () => {
    const original = {
      a1: [
        {
          b1: Object.freeze({}),
          b2: 'b2',
          b3: new Enum('b3')
        }
      ],
      a2: 'a2'
    };
    const copy = deepFreezeCopyExcept(Object.isFrozen, original);

    assert.deepEqual(copy, original);
    assert.notEqual(copy, original);
    assert.notEqual(copy.a1, original.a1);
    assert.notEqual(copy.a1[0], original.a1[0]);
    assert.equal(copy.a1[0].b1, original.a1[0].b1);
    assert.equal(copy.a1[0].b3, original.a1[0].b3);
    assert.ok(!Object.isFrozen(original.a1));
    assert.ok(!Object.isFrozen(original));
    assert.ok(!Object.isFrozen(original.a1[0]));
    assert.ok(Object.isFrozen(copy));
    assert.ok(Object.isFrozen(copy.a1));
    assert.ok(Object.isFrozen(copy.a1[0]));
    assert.ok(Enum.prototype.isPrototypeOf(copy.a1[0].b3), 'enums remain as Enum types');
  });
});
