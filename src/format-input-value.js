import formatObject from './format-object';
import isObject from './is-object';
import join from './join';
import {VariableDefinition} from './variable';
import {Enum} from './enum';
import Scalar from './scalar';

export default function formatInputValue(value) {
  if (VariableDefinition.prototype.isPrototypeOf(value)) {
    return value.toInputValueString();
  } else if (Enum.prototype.isPrototypeOf(value)) {
    return String(value);
  } else if (Scalar.prototype.isPrototypeOf(value)) {
    return JSON.stringify(value.valueOf());
  } else if (Array.isArray(value)) {
    return `[${join(...value.map(formatInputValue))}]`;
  } else if (isObject(value)) {
    return formatObject(value, '{', '}');
  } else {
    return JSON.stringify(value);
  }
}
