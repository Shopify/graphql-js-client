import formatObject from './format-object';

export default function formatArgs(args) {
  if (!Object.keys(args).length) {
    return '';
  }

  return ` (${formatObject(args)})`;
}
