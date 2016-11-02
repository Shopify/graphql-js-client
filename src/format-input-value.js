import join from './join';
import {VariableDefinition} from './variable';
import {Enum} from './enum';
import formatObject from './format-object';

export default function formatInputValue(value) {
  let formattedValue;

  if (VariableDefinition.prototype.isPrototypeOf(value)) {
    formattedValue = value.toInputValueString();
  } else if (Enum.prototype.isPrototypeOf(value)) {
    formattedValue = String(value);
  } else if (Array.isArray(value)) {
    formattedValue = `[${join(...value.map(formatInputValue))}]`;
  } else if (Object.prototype.toString.call(value) === '[object Object]') {
    formattedValue = formatObject(value, '{', '}');
  } else {
    formattedValue = JSON.stringify(value);
  }

  return formattedValue;
}
