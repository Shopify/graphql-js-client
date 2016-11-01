import {formatValue} from './format-variables';
import validateType from './validate-type';

const graphTypeToJSType = {
  String,
  Boolean,
  Object,
  Int: Number,
  Float: Number,
  List: Array
};

function throwTypeMismatch(expectedType) {
  throw new Error(`The default value is not of type ${expectedType}`);
}

function isFloat(defaultValue) {
  const defaultValueString = defaultValue.toString().toLowerCase();

  return defaultValueString.indexOf('.') > -1 || defaultValueString.indexOf('e') > -1;
}

function validateDefaultValue(type, defaultValue) {
  if (type[type.length - 1] === '!') {
    throw new Error('You cannot use a default value when using a non-null type');
  }

  const typeWithoutNull = type.split('!').join('');

  if (graphTypeToJSType[typeWithoutNull]) {
    if (!validateType(defaultValue, graphTypeToJSType[typeWithoutNull])) {
      throwTypeMismatch(type);
    } else if (typeWithoutNull === 'Int' && isFloat(defaultValue)) {
      throwTypeMismatch(type);
    }
  }
}


export class VariableDefinition {
  constructor(name, type, defaultValue) {
    this.name = name;
    this.type = type.trim();
    this.defaultValue = defaultValue;

    // eslint-disable-next-line no-undefined
    if (this.defaultValue !== undefined) {
      validateDefaultValue(this.type, this.defaultValue);
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
