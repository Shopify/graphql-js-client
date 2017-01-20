import formatInputValue from './format-input-value';

export class VariableDefinition {
  constructor(name, type, defaultValue) {
    this.name = name;
    this.type = type;
    this.defaultValue = defaultValue;
    Object.freeze(this);
  }

  toInputValueString() {
    return `$${this.name}`;
  }

  toVariableDefinitionString() {
    const defaultValueString = this.defaultValue ? ` = ${formatInputValue(this.defaultValue)}` : '';

    return `$${this.name}:${this.type}${defaultValueString}`;
  }
}

export function isVariable(value) {
  return value instanceof VariableDefinition;
}

export default function variable(name, type, defaultValue) {
  return new VariableDefinition(name, type, defaultValue);
}
