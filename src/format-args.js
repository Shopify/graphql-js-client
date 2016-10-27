import join from './join';
import {Enum} from './enum';
import {VariableDefinition} from './variable';

function formatValue(value) {
  let valueFormatted;

  if (VariableDefinition.prototype.isPrototypeOf(value)) {
    valueFormatted = value.toInputValueString();
  } else if (Enum.prototype.isPrototypeOf(value)) {
    valueFormatted = String(value);
  } else if (Array.isArray(value)) {
    valueFormatted = `[${join(...value.map(formatValue))}]`;
  } else if (Object.prototype.toString.call(value) === '[object Object]') {
    valueFormatted = `{${formatObject(value)}}`;
  } else {
    valueFormatted = JSON.stringify(value);
  }

  return valueFormatted;
}

function formatArgPair(key, value) {
  return `${key}: ${formatValue(value)}`;
}

function formatObject(value) {
  const arrayKeysValues = Object.keys(value).map((key) => {
    return formatArgPair(key, value[key]);
  });

  return join(...arrayKeysValues);
}

export default function formatArgs(args) {
  const keys = Object.keys(args);

  if (!keys.length) {
    return '';
  }

  return ` (${formatObject(args)})`;
}
