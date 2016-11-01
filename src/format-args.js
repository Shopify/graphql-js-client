import {formatObject} from './format-input-value';

export default function formatArgs(args) {
  if (!Object.keys(args).length) {
    return '';
  }

  return ` (${formatObject(args)})`;
}
