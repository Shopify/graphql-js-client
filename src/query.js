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

class Name {
  constructor(value) {
    this.value = value;
  }

  toString() {
    if (this.value) {
      return ` ${this.value}`;
    }

    return '';
  }
}

export default class Query {
  constructor(typeBundle, ...nameAndCallback) {
    const {name, selectionSetCallback} = parseArgs(nameAndCallback);

    this.typeBundle = typeBundle;
    this.selectionSet = new SelectionSet(typeBundle, 'QueryRoot');
    this.name = new Name(name);
    selectionSetCallback(this.selectionSet);
  }

  toString() {
    return `query${this.name.toString()}${this.selectionSet.toString()}`;
  }
}
