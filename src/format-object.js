import formatInputValue from './format-input-value';
import join from './join';

function formatKeyAndValue(key, value) {
  return `${key}: ${value}`;
}

export default function formatObject(value, openChar = '', closeChar = '') {
  const argPairs = Object.keys(value).map((key) => {
    return formatKeyAndValue(key, formatInputValue(value[key]));
  });

  return `${openChar}${join(...argPairs)}${closeChar}`;
}
