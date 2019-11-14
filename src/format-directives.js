import formatObject from './format-object';
import join from './join';

export default function formatDirectives(directives) {
  if (!Object.keys(directives).length) {
    return '';
  }

  const directiveStrings = Object.keys(directives).map((key) => {
    const directiveArgs = directives[key];
    const arg = (directiveArgs && Object.keys(directiveArgs).length) ? `(${formatObject(directiveArgs)})` : '';

    return `@${key}${arg}`;
  });

  return ` ${join(...directiveStrings)}`;
}
