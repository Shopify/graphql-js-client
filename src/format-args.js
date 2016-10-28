import join from './join';
import {Enum} from './enum';
import {VariableDefinition} from './variable';

function formatValue(value) {
  let formattedValue;

  if (VariableDefinition.prototype.isPrototypeOf(value)) {
    formattedValue = value.toInputValueString();
  } else if (Enum.prototype.isPrototypeOf(value)) {
    formattedValue = String(value);
  } else if (Array.isArray(value)) {
    formattedValue = `[${join(...value.map(formatValue))}]`;
  } else if (Object.prototype.toString.call(value) === '[object Object]') {
    formattedValue = `{${formatObject(value)}}`;
  } else {
    formattedValue = JSON.stringify(value);
  }

  return formattedValue;
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
