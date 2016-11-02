import formatArgPair from './format-arg-pair';
import formatInputValue from './format-input-value';
import join from './join';

export default function formatObject(value, openChar = '', closeChar = '') {
  const argPairs = Object.keys(value).map((key) => {
    return formatArgPair(key, formatInputValue(value[key]));
  });

  return `${openChar}${join(...argPairs)}${closeChar}`;
}
