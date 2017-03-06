import assert from 'assert';
import isObject from '../src/is-object';
import Scalar from '../src/scalar';
import _enum from '../src/enum';

suite('is-object-test', () => {
  test('it returns true for POJOs', () => {
    assert.equal(isObject({}), true);
  });

  test('it returns true for object class instances', () => {
    class Thing {}
    assert.equal(isObject(new Thing()), true);
  });

  test('it returns false for arrays', () => {
    assert.equal(isObject([]), false);
  });

  test('it returns false for functions', () => {
    assert.equal(isObject((x) => x), false);
  });

  test('it returns false for scalars', () => {
    assert.equal(isObject(0), false);
    assert.equal(isObject('foo'), false);
  });

  test('it returns false for boxed scalars', () => {
    // eslint-disable-next-line no-new-wrappers
    assert.equal(isObject(new String('foo')), false);
  });

  test('it returns false for Scalar wrapped primitives', () => {
    assert.equal(isObject(new Scalar('foo')), false);
  });

  test('it handles null values', () => {
    assert.equal(isObject(null), false);
  });

  test('it handles undefined values', () => {
    assert.equal(isObject(), false);
  });

  test('it returns false for enums', () => {
    assert.equal(isObject(_enum('enum')), false);
  });

  test('it returns false for Scalar wrapped null values', () => {
    assert.equal(isObject(new Scalar(null)), false);
  });

  test('it returns false for Enum wrapped null values', () => {
    assert.equal(isObject(_enum(null)), false);
  });
});
