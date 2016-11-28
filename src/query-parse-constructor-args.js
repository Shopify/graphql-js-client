import noop from './noop';

export default function parseConstructorArgs(args) {
  let name;
  let variables;
  let selectionSetCallback;

  if (args.length === 3) {
    [name, variables, selectionSetCallback] = args;
  } else if (args.length === 2) {
    if (Object.prototype.toString.call(args[0]) === '[object String]') {
      name = args[0];
      variables = null;
    } else if (Array.isArray(args[0])) {
      variables = args[0];
      name = null;
    }

    selectionSetCallback = args[1];
  } else {
    selectionSetCallback = args[0];
    name = null;
  }

  selectionSetCallback = selectionSetCallback || noop;

  return {name, variables, selectionSetCallback};
}
