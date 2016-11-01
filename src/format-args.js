import {formatObject} from './format-variables';

export default function formatArgs(args) {
  if (!Object.keys(args).length) {
    return '';
  }

  return ` (${formatObject(args)})`;
}
