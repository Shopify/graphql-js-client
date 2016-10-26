import SelectionSet from './selection-set';
import join from './join';
import Variable from './variable';

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

class VariableDefinitions {
  constructor() {
    this.variables = [];
  }

  addVariable(name, type) {
    const variable = new Variable(name, type);

    this.variables.push(variable);

    return variable;
  }

  toString() {
    if (this.variables.length === 0) {
      return '';
    }

    return ` (${join(...this.variables)}) `;
  }
}

export default class Query {
  constructor(typeBundle, ...nameAndCallback) {
    const {name, selectionSetCallback} = parseArgs(nameAndCallback);

    this.typeBundle = typeBundle;
    this.selectionSet = new SelectionSet(typeBundle, 'QueryRoot');
    this.name = name;
    this.variableDefinitions = new VariableDefinitions();
    selectionSetCallback(this.selectionSet);
  }

  get isAnonymous() {
    return !this.name;
  }

  addVariable(name, type) {
    return this.variableDefinitions.addVariable(name, type);
  }

  toString() {
    const nameString = (this.name) ? ` ${this.name}` : '';

    return `query${nameString}${this.variableDefinitions.toString()}${this.selectionSet.toString()}`;
  }
}
