import {formatValue} from './format-variables';
import validateInputValue from './validate-input-value';

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
    // eslint-disable-next-line no-undefined
    const defaultValueString = (this.defaultValue === undefined) ? '' : `=${formatValue(this.defaultValue)}`;

    return `$${this.name}:${this.type}${defaultValueString}`;
  }
}

export default function variable(name, type, defaultValue) {
  return new VariableDefinition(name, type, defaultValue);
}
