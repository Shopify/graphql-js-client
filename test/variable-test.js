import assert from 'assert';
import variable, {isVariable, VariableDefinition} from '../src/variable';

suite('variable-test', () => {
  test('it can create variables', () => {
    const variableId = variable('id', 'ID!');

    assert.ok(VariableDefinition.prototype.isPrototypeOf(variableId));
  });

  test('isVariable returns true for variables', () => {
    const variableId = variable('id', 'ID!');

    assert.equal(isVariable(variableId), true);
    assert.equal(isVariable(Object.assign({}, variableId)), false);
  });

  test('variables are always frozen', () => {
    assert.ok(Object.isFrozen(variable('foo', 'String')));
  });

  test('toInputValueString returns a formatted string with its name', () => {
    const variableId = variable('id', 'ID!');

    assert.equal(variableId.toInputValueString(), '$id');
  });

  test('toVariableDefinitionString returns a formatted string with its name and type', () => {
    const variableId = variable('id', 'ID!');

    assert.equal(variableId.toVariableDefinitionString(), '$id:ID!');
  });

  test('toVariableDefinitionString returns a formatted string with its name, type, and defaultValue', () => {
    const variableId = variable('id', 'ID!', '123');

    assert.equal(variableId.toVariableDefinitionString(), '$id:ID! = "123"');
  });
});
