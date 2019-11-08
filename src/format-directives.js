import formatObject from './format-object';
import join from './join';

export default function formatDirectives(directives) {
  if (!Object.keys(directives).length) {
    return '';
  }

  const directiveStrings = Object.keys(directives).map((key) => {
    const arg = directives[key] ? `(${formatObject(directives[key])})` : '';

    return `@${key}${arg}`;
  });

  return ` ${join(...directiveStrings)}`;
}
