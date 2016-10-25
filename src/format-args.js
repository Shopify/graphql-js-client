import join from './join';
import {Enum} from './enum';

function formatValue(value) {
  let valueFormatted;

  if (value instanceof Enum) {
    valueFormatted = String(value);
  } else if (Array.isArray(value)) {
    valueFormatted = `[${join(value.map(formatValue))}]`;
  } else if (typeof value === 'object') {
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

  return join(arrayKeysValues);
}

export default function formatArgs(args) {
  const keys = Object.keys(args);

  if (!keys.length) {
    return '';
  }

  return ` (${formatObject(args)})`;
}
