import formatInputValue from './format-input-value';

export class VariableDefinition {

  /**
   * This constructor should not be invoked directly.
   * Use the factory function {@link Client#variable} to create a VariableDefinition.
   *
   * @param {String} name The name of the variable.
   * @param {String} type The GraphQL type of the variable.
   * @param {*} [defaultValue] The default value of the variable.
   */
  constructor(name, type, defaultValue) {
    this.name = name;
    this.type = type;
    this.defaultValue = defaultValue;
    Object.freeze(this);
  }

  /**
   * Returns the GraphQL query string for the variable as an input value (e.g. `$variableName`).
   *
   * @return {String} The GraphQL query string for the variable as an input value.
   */
  toInputValueString() {
    return `$${this.name}`;
  }

  /**
   * Returns the GraphQL query string for the variable (e.g. `$variableName:VariableType = defaultValue`).
   *
   * @return {String} The GraphQL query string for the variable.
   */
  toString() {
    const defaultValueString = this.defaultValue ? ` = ${formatInputValue(this.defaultValue)}` : '';

    return `$${this.name}:${this.type}${defaultValueString}`;
  }
}

export function isVariable(value) {
  return VariableDefinition.prototype.isPrototypeOf(value);
}

export default function variable(name, type, defaultValue) {
  return new VariableDefinition(name, type, defaultValue);
}
