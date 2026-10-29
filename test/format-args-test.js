import assert from 'assert';
import formatArgs from '../src/format-args';
import _enum from '../src/enum';
import Scalar from '../src/scalar';

suite('format-args-test', () => {
  test('it formats args with only scalars', () => {
    const result = formatArgs({int: 1, float: 0.1, string: 'two', boolean: true});

    assert.equal(result, ' (int: 1 float: 0.1 string: "two" boolean: true)');
  });

  test('it formats args with input objects', () => {
    const result = formatArgs({object: {int: 1, float: 0.1, string: 'two', boolean: true}, secondInt: 1});

    assert.equal(result, ' (object: {int: 1 float: 0.1 string: "two" boolean: true} secondInt: 1)');
  });

  test('it formats args with lists', () => {
    const result = formatArgs({array: [1, 'something', {one: 1, two: 2}], secondInt: 1});

    assert.equal(result, ' (array: [1 "something" {one: 1 two: 2}] secondInt: 1)');
  });

  test('it formats args with enums', () => {
    const result = formatArgs({enumOne: _enum('ONE'), enumTwo: _enum('TWO')});

    assert.equal(result, ' (enumOne: ONE enumTwo: TWO)');
  });

  test('it formats args with lists of enums', () => {
    const result = formatArgs({list: [_enum('ONE'), _enum('TWO')]});

    assert.equal(result, ' (list: [ONE TWO])');
  });

  test('it rejects enum keys that are not valid GraphQL names', () => {
    const payload = 'SAFE) { id } deleteAllWidgets { count } } #';

    assert.throws(() => formatArgs({mode: _enum(payload)}), /Invalid enum key/);
    assert.throws(() => _enum(''), /Invalid enum key/);
    assert.throws(() => _enum('ONE TWO'), /Invalid enum key/);
    assert.throws(() => _enum('1ONE'), /Invalid enum key/);
    assert.throws(() => _enum('ONE\n'), /Invalid enum key/);
    assert.throws(() => _enum('ONE)'), /Invalid enum key/);
  });

  test('it still formats enums with valid GraphQL names unquoted', () => {
    const result = formatArgs({mode: _enum('SAFE'), other: _enum('_private_1')});

    assert.equal(result, ' (mode: SAFE other: _private_1)');
  });

  test('it formats args with wrapped scalars', () => {
    const result = formatArgs({int: new Scalar(1), float: new Scalar(0.1), string: new Scalar('two'), boolean: new Scalar(true)});

    assert.equal(result, ' (int: 1 float: 0.1 string: "two" boolean: true)');
  });
});
