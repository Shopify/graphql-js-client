import assert from 'assert';
import checkGraphType from '../src/check-graph-type';

suite('Unit | Check Graph type', () => {
  test('it checks String', () => {
    assert.ok(checkGraphType.isString('something'));
    assert.ok(!checkGraphType.isString(true));
  });

  test('it checks Boolean', () => {
    assert.ok(checkGraphType.isBoolean(true));
    assert.ok(checkGraphType.isBoolean(false));
    assert.ok(!checkGraphType.isBoolean('true'));
    assert.ok(!checkGraphType.isBoolean('false'));
  });

  test('it checks Int', () => {
    assert.ok(checkGraphType.isInt(0));
    assert.ok(checkGraphType.isInt(-10));
    assert.ok(checkGraphType.isInt(10));
    assert.ok(!checkGraphType.isInt(0.333));
    assert.ok(!checkGraphType.isInt('0.333'));
    assert.ok(!checkGraphType.isInt(true));
  });

  test('it checks Float', () => {
    assert.ok(checkGraphType.isFloat(0.333));
    assert.ok(checkGraphType.isFloat(100));
    assert.ok(!checkGraphType.isFloat('0.333'));
    assert.ok(!checkGraphType.isFloat(true));
  });
});
