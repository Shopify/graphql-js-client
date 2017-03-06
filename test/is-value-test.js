import assert from 'assert';
import isValue from '../src/is-value';
import Scalar from '../src/scalar';
import _enum from '../src/enum';

suite('is-value-test', () => {
  test('it returns false for null', () => {
    assert.equal(isValue(null), false);
  });

  test('it returns false for undefined', () => {
    assert.equal(isValue(undefined), false); // eslint-disable-line no-undefined
  });

  test('it returns true for POJOs', () => {
    assert.equal(isValue({}), true);
  });

  test('it returns true for scalars', () => {
    assert.equal(isValue(0), true);
    assert.equal(isValue('foo'), true);
  });

  test('it returns true for object class instances', () => {
    class Thing {}
    assert.equal(isValue(new Thing()), true);
  });

  test('it returns true for arrays', () => {
    assert.equal(isValue([]), true);
  });

  test('it returns true for functions', () => {
    assert.equal(isValue((x) => x), true);
  });

  test('it returns true for boxed scalars', () => {
    // eslint-disable-next-line no-new-wrappers
    assert.equal(isValue(new String('foo')), true);
  });

  test('it returns true for Scalar wrapped primitives', () => {
    assert.equal(isValue(new Scalar('foo')), true);
  });

  test('it returns true for enums', () => {
    assert.equal(isValue(_enum('enum')), true);
  });
});
