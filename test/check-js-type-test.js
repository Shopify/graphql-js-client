import assert from 'assert';
import checkJSType from '../src/check-js-type';

suite('Unit | Check JS type', () => {
  test('it checks strings', () => {
    assert.ok(checkJSType.isString('something'));
    assert.ok(!checkJSType.isString(true));
  });

  test('it checks booleans', () => {
    assert.ok(checkJSType.isBoolean(true));
    assert.ok(checkJSType.isBoolean(false));
    assert.ok(!checkJSType.isBoolean('true'));
    assert.ok(!checkJSType.isBoolean('false'));
  });

  test('it checks numbers', () => {
    assert.ok(checkJSType.isNumber(0));
    assert.ok(checkJSType.isNumber(10));
    assert.ok(checkJSType.isNumber(0.333));
    assert.ok(checkJSType.isNumber(0.33e3));
    assert.ok(!checkJSType.isNumber('10'));
  });

  test('it checks arrays', () => {
    assert.ok(checkJSType.isArray([]));
    assert.ok(checkJSType.isArray(['something']));
    assert.ok(!checkJSType.isArray('something'));
  });

  test('it checks objects', () => {
    assert.ok(checkJSType.isObject({}));
    assert.ok(checkJSType.isObject({something: true}));
    assert.ok(!checkJSType.isObject(null));
    assert.ok(!checkJSType.isObject([1, 2, 3]));
    // eslint-disable-next-line no-undefined
    assert.ok(!checkJSType.isObject(undefined));
  });

  test('it checks null', () => {
    assert.ok(checkJSType.isNull(null));
    // eslint-disable-next-line no-undefined
    assert.ok(!checkJSType.isNull(undefined));
  });

  test('it checks undefined', () => {
    // eslint-disable-next-line no-undefined
    assert.ok(checkJSType.isUndefined(undefined));
    assert.ok(!checkJSType.isUndefined(null));
  });
});
