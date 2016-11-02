import assert from 'assert';
import formatFieldArgs from '../src/format-field-args';
import _enum from '../src/enum';

suite('Unit | format arguments', () => {
  test('it formats args with only scalars', () => {
    const result = formatFieldArgs({int: 1, float: 0.1, string: 'two', boolean: true});

    assert.equal(result, ' (int: 1 float: 0.1 string: "two" boolean: true)');
  });

  test('it formats args with input objects', () => {
    const result = formatFieldArgs({object: {int: 1, float: 0.1, string: 'two', boolean: true}, secondInt: 1});

    assert.equal(result, ' (object: {int: 1 float: 0.1 string: "two" boolean: true} secondInt: 1)');
  });

  test('it formats args with lists', () => {
    const result = formatFieldArgs({array: [1, 'something', {one: 1, two: 2}], secondInt: 1});

    assert.equal(result, ' (array: [1 "something" {one: 1 two: 2}] secondInt: 1)');
  });

  test('it formats args with enums', () => {
    const result = formatFieldArgs({enumOne: _enum('ONE'), enumTwo: _enum('TWO')});

    assert.equal(result, ' (enumOne: ONE enumTwo: TWO)');
  });

  test('it formats args with lists of enums', () => {
    const result = formatFieldArgs({list: [_enum('ONE'), _enum('TWO')]});

    assert.equal(result, ' (list: [ONE TWO])');
  });
});
