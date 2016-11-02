import formatInputValue from './format-input-value';
import validateInputValue from './validate-input-value';
import check from './check-js-type';

export class VariableDefinition {
  constructor(name, type, defaultValue) {
    this.name = name;
    this.type = type.trim();
    this.defaultValue = defaultValue;

    // eslint-disable-next-line no-undefined
    if (this.defaultValue !== undefined) {
      validateInputValue(this.type, this.defaultValue);
    }
  }

  toInputValueString() {
    return `$${this.name}`;
  }

  toVariableDefinitionString() {
    const defaultValueString = check.isUndefined(this.defaultValue) ? '' : `=${formatInputValue(this.defaultValue)}`;

    return `$${this.name}:${this.type}${defaultValueString}`;
  }
}

export default function variable(name, type, defaultValue) {
  return new VariableDefinition(name, type, defaultValue);
}
