import formatInputValue from './format-input-value';
import join from './join';

export default function formatObject(value, openChar = '', closeChar = '') {
  const argPairs = Object.keys(value).map((key) => {
    return `${key}: ${formatInputValue(value[key])}`;
  });

  return `${openChar}${join(...argPairs)}${closeChar}`;
}
