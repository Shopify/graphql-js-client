import SelectionSet from './selection-set';

function parseArgs(nameAndCallback) {
  let name;
  let selectionSetCallback;

  if (nameAndCallback.length === 2) {
    [name, selectionSetCallback] = nameAndCallback;
  } else {
    selectionSetCallback = nameAndCallback[0];
    name = null;
  }

  return {name, selectionSetCallback};
}

export default class Query {
  constructor(typeBundle, ...nameAndCallback) {
    const {name, selectionSetCallback} = parseArgs(nameAndCallback);

    this.typeBundle = typeBundle;
    this.selectionSet = new SelectionSet(typeBundle, 'QueryRoot');
    this.name = name;
    selectionSetCallback(this.selectionSet);
  }

  get isAnonymous() {
    return !this.name;
  }

  toString() {
    const nameString = (this.name) ? ` ${this.name}` : '';

    return `query${nameString}${this.selectionSet.toString()}`;
  }
}
