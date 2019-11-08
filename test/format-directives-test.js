import assert from 'assert';
import formatDirectives from '../src/format-directives';
import variable from '../src/variable';
import _enum from '../src/enum';
import Scalar from '../src/scalar';

suite('format-directives-test', () => {
  test('it formats directives with scalars', () => {
    const result = formatDirectives({include: {int: 1, float: 0.1, string: 'two', boolean: true}});

    assert.equal(result, ' @include(int: 1 float: 0.1 string: "two" boolean: true)');
  });

  test('it formats directives with input objects', () => {
    const result = formatDirectives({skip: {object: {int: 1, float: 0.1, string: 'two', boolean: true}, secondInt: 1}});

    assert.equal(result, ' @skip(object: {int: 1 float: 0.1 string: "two" boolean: true} secondInt: 1)');
  });

  test('it formats directives with lists', () => {
    const result = formatDirectives({directive: {list: ['item1', 'item2']}});

    assert.equal(result, ' @directive(list: ["item1" "item2"])');
  });

  test('it formats directives with enums', () => {
    const result = formatDirectives({directive: {enumOne: _enum('ONE'), enumTwo: _enum('TWO')}});

    assert.equal(result, ' @directive(enumOne: ONE enumTwo: TWO)');
  });

  test('it formats directives with lists of enums', () => {
    const result = formatDirectives({directive: {list: [_enum('ONE'), _enum('TWO')]}});

    assert.equal(result, ' @directive(list: [ONE TWO])');
  });

  test('it formats directives with wrapped scalars', () => {
    const result = formatDirectives({include: {int: new Scalar(1), float: new Scalar(0.1), string: new Scalar('two'), boolean: new Scalar(true)}});

    assert.equal(result, ' @include(int: 1 float: 0.1 string: "two" boolean: true)');
  });

  test('it formats directives with variables', () => {
    const result = formatDirectives({include: {if: variable('includeBool', 'Boolean')}});

    assert.equal(result, ' @include(if: $includeBool)');
  });

  test('it formats directives with null values', () => {
    const result = formatDirectives({upper: null});

    assert.equal(result, ' @upper');
  });

  test('it formats multiple directives', () => {
    const result = formatDirectives({include: {if: variable('includeBool', 'Boolean')}, upper: null, format: {as: 'YYYY'}});

    assert.equal(result, ' @include(if: $includeBool) @upper @format(as: "YYYY")');
  });
});
